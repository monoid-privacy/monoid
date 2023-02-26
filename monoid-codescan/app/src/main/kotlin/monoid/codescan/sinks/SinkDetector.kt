package monoid.codescan.sinks

import de.fraunhofer.aisec.cpg.TranslationResult
import de.fraunhofer.aisec.cpg.graph.*
import de.fraunhofer.aisec.cpg.graph.declarations.FieldDeclaration
import de.fraunhofer.aisec.cpg.graph.declarations.VariableDeclaration
import de.fraunhofer.aisec.cpg.graph.declarations.MethodDeclaration
import de.fraunhofer.aisec.cpg.graph.declarations.FunctionDeclaration
import de.fraunhofer.aisec.cpg.graph.declarations.ConstructorDeclaration

import de.fraunhofer.aisec.cpg.graph.statements.expressions.CallExpression
import de.fraunhofer.aisec.cpg.frontends.golang.GoLanguage
import de.fraunhofer.aisec.cpg.frontends.java.JavaLanguage

import de.fraunhofer.aisec.cpg.frontends.Language
import de.fraunhofer.aisec.cpg.frontends.LanguageFrontend
import java.io.File
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper
import de.fraunhofer.aisec.cpg.passes.scopes.NameScope

class SinkConfigRule(name: String, id: String, regex: String) {
    val name = name
    val id = id
    val regex = Regex(regex)

    var ignore = false
    var languages = setOf<String>()
}

data class SinkConfigFile(
    val ruleGroup: String,
    val rules: List<SinkConfigRule>,
    val action: String = "use",
    val languages: List<String>
)

fun languageNameString(language: Language<out LanguageFrontend>): String {
    if (language is GoLanguage) {
        return "go"
    }

    if (language is JavaLanguage) {
        return "java"
    }

    return ""
}

data class Sink(
    val node: Node,
    val rule: SinkConfigRule?,
    val fqn: String
)

class HashableSink(sink: Sink) {
    val rule = sink.rule
    val fqn = sink.fqn

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as HashableSink

        if (other.rule == null && this.rule == null) {
            return other.fqn == this.fqn
        }

        return other.rule == this.rule
    }

    override fun hashCode(): Int {
        if (this.rule == null) {
            return fqn.hashCode()
        }

        return rule.hashCode()
    }
}

class SinkDetector(sinkConfigPath: File) {
    val rules = mutableListOf<SinkConfigRule>()

    init {
        if (!sinkConfigPath.exists() || !sinkConfigPath.isDirectory()) {
            throw Exception("Path isn't a directory: " + sinkConfigPath)
        }

        val mapper = YAMLMapper().registerKotlinModule()

        sinkConfigPath.walk().filter { it.isFile() && it.extension == "yaml" }.forEach {
            val cfg = mapper.readValue<SinkConfigFile>(it)
            for (rule in cfg.rules) {
                rule.ignore = (cfg.action == "ignore")
                rule.languages = cfg.languages.toSet()
                rules.add(rule)
            }
        }
    }

    private fun getFqn(cpgResult: TranslationResult, decl: FunctionDeclaration): String? {
        val scope = cpgResult.getScopeManager().lookupScope(decl)

        if (decl is ConstructorDeclaration && decl.recordDeclaration != null && !decl.recordDeclaration!!.isInferred) {
            return null
        }

        val scopeName = if (decl is MethodDeclaration) {
            decl.recordDeclaration?.toType()?.typeName
        } else {
            cpgResult.getScopeManager().firstScopeOrNull(
                scope, {s -> s is NameScope}
            )?.scopedName
        }

        if (scopeName == null) {
            return null
        }

        return scopeName + "." + decl.name
    }

    fun detectSinks(cpgResult: TranslationResult): List<Sink> {
        val ignoreRules = rules.filter { it.ignore }
        val acceptRules = rules.filter { !it.ignore }

        var externCalls =
            cpgResult.components[0].calls.mapNotNull { c: CallExpression ->
                if (c.invokes.size == 0 && c.fqn != null) {
                    Pair(c.fqn, c)
                } else {
                    val fqn = c.invokes.firstNotNullOfOrNull {
                        val fqn = getFqn(cpgResult, it)

                        if (fqn == null) {
                            null
                        } else {
                            if (
                                it.isInferred
                            ) {
                                fqn
                            } else {
                                null
                            }
                        }
                    }

                    if (fqn == null) {
                        null
                    } else {
                        Pair(fqn, c)
                    }
                }
            }.map { (fqn, c) ->
                Sink(c, acceptRules.filter {
                    it.languages.isEmpty() ||
                    languageNameString(c.language!!) in it.languages
                }.firstOrNull {
                    fqn != null && it.regex.containsMatchIn(fqn)
                }, fqn!!)
            }.filter {
                s ->
                    s.rule != null || !ignoreRules.filter {
                        it.languages.isEmpty() ||
                        languageNameString(s.node.language!!) in it.languages
                    }.any {
                        it.regex.containsMatchIn(s.fqn)
                    }
            }


        return externCalls
    }
}