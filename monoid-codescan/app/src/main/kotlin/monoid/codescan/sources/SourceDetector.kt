package monoid.codescan.sources

import de.fraunhofer.aisec.cpg.TranslationResult
import de.fraunhofer.aisec.cpg.graph.*
import de.fraunhofer.aisec.cpg.graph.declarations.FieldDeclaration
import de.fraunhofer.aisec.cpg.graph.declarations.ValueDeclaration
import de.fraunhofer.aisec.cpg.graph.declarations.VariableDeclaration
import de.fraunhofer.aisec.cpg.graph.declarations.ParamVariableDeclaration
import de.fraunhofer.aisec.cpg.graph.statements.expressions.DeclaredReferenceExpression
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper
import de.fraunhofer.aisec.cpg.graph.TypeManager
import java.io.File

data class SourceConfigFile(val ruleGroup: String, val rules: List<SourceConfigRule>)

class SourceConfigRule(id: String, name: String, regex: String) {
    val id = id
    val name = name
    val regex = Regex(regex)
}

data class Source(
    val node: Node,
    val rule: SourceConfigRule
)

class SourceDetector(sourceConfigPath: File) {
    val rules = mutableListOf<SourceConfigRule>()

    init {
        if (!sourceConfigPath.exists() || !sourceConfigPath.isDirectory()) {
            throw Exception("Path isn't a directory: " + sourceConfigPath)
        }

        val mapper = YAMLMapper().registerKotlinModule()

        sourceConfigPath.walk().filter { it.isFile() && it.extension == "yaml" }.forEach {
            val cfg = mapper.readValue<SourceConfigFile>(it)
            for (rule in cfg.rules) {
                rules.add(rule)
            }
        }
    }

    private fun collectSensitiveFields(cpgResult: TranslationResult): List<Source> {
        val filtFields = cpgResult.components[0].fields.mapNotNull { n: FieldDeclaration ->
            val r = rules.firstOrNull { it.regex.matches(n.name) }
            if (r != null) {
                Source(n, r)
            } else {
                null
            }
        }

        // Collect instances where the field is used directly, or the entire type containing
        // the field is used.
        return filtFields.flatMap {
            s: Source ->
                (s.node as FieldDeclaration).getUsages().map { Source(it, s.rule) }
        }.filter {
            (it.node as DeclaredReferenceExpression).access == AccessValues.READ
        } + (
            filtFields.flatMap {
                s ->
                    cpgResult.filterChildren({ v ->
                        val superType = (s.node as FieldDeclaration).record.toType()

                        val res = (v is VariableDeclaration || v is ParamVariableDeclaration) &&
                            (TypeManager.getInstance().isSupertypeOf(
                                superType,
                                (v as ValueDeclaration).type,
                                v
                            ))

                        res
                    }).map { Source(it, s.rule)}
            }
        )
    }

    private fun collectVars(cpgResult: TranslationResult): List<Source> {
        return cpgResult.components[0].variables.mapNotNull { n: VariableDeclaration ->
            val r = rules.firstOrNull { it.regex.matches(n.name) }
            if (r != null) {
                Source(n, r)
            } else {
                null
            }
        }
    }

    fun detectSources(cpgResult: TranslationResult): List<Source> {
        return collectSensitiveFields(cpgResult).plus(
            collectVars(cpgResult)
        ).toSet().toList()
    }
}