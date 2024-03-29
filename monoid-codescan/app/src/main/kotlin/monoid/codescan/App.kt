/*
 * This Kotlin source file was generated by the Gradle 'init' task.
 */
package monoid.codescan

import de.fraunhofer.aisec.cpg.frontends.golang.GoLanguage
import de.fraunhofer.aisec.cpg.frontends.java.JavaLanguage
import de.fraunhofer.aisec.cpg.TranslationConfiguration
import de.fraunhofer.aisec.cpg.TranslationManager
import monoid.codescan.sources.SourceDetector
import monoid.codescan.sinks.SinkDetector
import monoid.codescan.sinks.HashableSink
import monoid.codescan.queries.allDataPaths
import monoid.codescan.output.pathTrace
import monoid.codescan.queries.NodePath
import com.expediagroup.graphql.client.ktor.GraphQLKtorClient

import java.net.URL

import io.ktor.client.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*

import monoid.codescan.generated.CreateCodescanResult
import monoid.codescan.generated.CreateCodescanRepo
import java.util.concurrent.TimeUnit

import monoid.codescan.generated.inputs.*
import monoid.codescan.generated.enums.CodescanRepoType
import monoid.codescan.config.readConfig
import monoid.codescan.config.persist
import monoid.codescan.config.CodescanConfig

import picocli.CommandLine
import picocli.CommandLine.Command
import picocli.CommandLine.Option
import picocli.CommandLine.Parameters
import java.util.concurrent.Callable
import java.io.File
import java.nio.file.Paths
import kotlin.system.exitProcess
import de.fraunhofer.aisec.cpg.sarif.PhysicalLocation
import kotlinx.coroutines.runBlocking

fun PhysicalLocation.detailedString(): String {
    return (
        this.artifactLocation.uri.getPath() + "(" + this.region.toString() + ")"
    )
}

fun PhysicalLocation.toCodeLocationInput(): CodeLocationInput {
    return CodeLocationInput(
        this.artifactLocation.uri.toString(),
        this.region.startColumn,
        this.region.startLine,
        this.region.endColumn,
        this.region.endLine
    )
}

class App: Callable<Int> {
    @Parameters(
        index="0",
        description =
            [
                "The directory or file to analyze."
            ],
    )
    var analysisItem = ""

    @Option(
        names = ["-c", "--config"],
        description = ["A path to a configuration directory which includes a sinks/ and sources/ folder."],
        required = true
    )
    var configPath = ""

    @Option(
        names = ["-u", "--server-url"],
        description = [
            "The url to upload results to. This must be an enterprise/cloud instance of monoid, OSS deployments do not support the required endpoints."
        ]
    )
    var serverUrl = "https://app.monoid.co/query"


    @Option(
        names = ["-t", "--token"],
        description = ["The API token to use to connect to monoid. By default, the MONOID_TOKEN environment variable will be used."],
    )
    var token = System.getenv("MONOID_TOKEN") ?: ""

    override fun call(): Int {
        val f = File(analysisItem)
        var topLevel = f

        if (!f.exists()) {
            print("File $analysisItem does not exist\n")
            return 1
        }

        if (!f.isDirectory()) {
            topLevel = f.getParentFile()
        }

        var configFilePath = File(topLevel, ".monoid.yaml")

        val httpClient: HttpClient = HttpClient(engineFactory = OkHttp) {
            engine {
                config {
                    connectTimeout(10, TimeUnit.SECONDS)
                    readTimeout(60, TimeUnit.SECONDS)
                    writeTimeout(60, TimeUnit.SECONDS)
                }
            }
            defaultRequest {
                header("Authorization", "Bearer $token")
            }
        }

        var client = GraphQLKtorClient(url = URL(serverUrl), httpClient = httpClient)
        var config: CodescanConfig? = null

        if (token != "") {
            if (!configFilePath.exists()) {
                val result = runBlocking {
                    val q = CreateCodescanRepo(
                        CreateCodescanRepo.Variables(
                            CreateCodescanRepoInput(
                                topLevel.getName(),
                                CodescanRepoType.BASIC,
                                null,
                                "5b76b91e-746c-4e63-a717-a3301e417b82",
                            )
                        )
                    )

                    client.execute(q)
                }

                config = CodescanConfig(result.data!!.createCodescanRepo.id, CodescanRepoType.BASIC)
                config.persist(configFilePath)
            } else {
                config = readConfig(configFilePath)
            }
        } else {
            println("Token not found, skipping web upload.")
        }

        val translationConfiguration =
            TranslationConfiguration.builder()
                .defaultLanguages()
                .registerLanguage(GoLanguage())
                .registerLanguage(JavaLanguage())
                .monoidPasses()
                .topLevel(topLevel)
                .sourceLocations(listOf(f))
                .build()

        val sourcesPath = Paths.get(configPath, "sources")
        val sourceFile = sourcesPath.toFile()
        if (!sourceFile.exists() || !sourceFile.isDirectory()) {
            print("Path $sourceFile is not a directory.\n")
            return 1
        }

        val sinkPath = Paths.get(configPath, "sinks")
        val sinkFile = sinkPath.toFile()
        if (!sinkFile.exists() || !sinkFile.isDirectory()) {
            print("Path $sinkFile is not a directory.\n")
            return 1
        }

        val sourceDetector = SourceDetector(sourceFile)
        val sinkDetector = SinkDetector(sinkFile)

        print("Analyzing Directory...\n")
        val translationResult =
            TranslationManager.builder().config(translationConfiguration).build().analyze().get()

        print("Detecting possible PII sources...\n")
        val sources = sourceDetector.detectSources(translationResult)

        print("Detecting possible 3rd party calls...\n")
        val sinks = sinkDetector.detectSinks(translationResult)
        val sinkIdentities = sinks.map { HashableSink(it) }.toSet().toList()
        val sinkIdentitiesMap = sinkIdentities.mapIndexed { i, s -> s to i }.toMap()

        val paths = allDataPaths(sources, sinks)
        val ruleMap = mutableMapOf<String, MutableList<NodePath>>()
        val flowInputs = mutableListOf<FlowInput>()

        val sourceInputs = mutableListOf<SourceTypeInput>()
        val sourceInputMap = mutableMapOf<String, Int>()

        for (p in paths) {
            if (p.start.rule.name !in ruleMap) {
                ruleMap[p.start.rule.name] = mutableListOf<NodePath>()
            }

            ruleMap[p.start.rule.name]!!.add(p)

            if (p.start.node.location == null) {
                continue
            }

            if (p.end.node.location == null) {
                continue
            }

            var serverSourceInx = 0

            if (p.start.rule.id in sourceInputMap) {
                serverSourceInx = sourceInputMap[p.start.rule.id]!!
            } else {
                sourceInputs.add(
                    SourceTypeInput(
                        null,
                        p.start.rule.id,
                        p.start.rule.name
                    )
                )
                sourceInputMap[p.start.rule.id] = sourceInputs.size - 1
                serverSourceInx = sourceInputs.size - 1
            }

            val destIndex = sinkIdentitiesMap[HashableSink(p.end)]
            if (destIndex == null) {
                continue
            }

            val backtrace = p.nodes.mapNotNull {
                if (it.location == null) {
                    null
                } else {
                    it.location!!.toCodeLocationInput()
                }
            }

            flowInputs.add(FlowInput(
                backtrace,
                destIndex,
                p.end.node.location!!.toCodeLocationInput(),
                serverSourceInx,
                p.start.node.location!!.toCodeLocationInput()
            ))
        }

        // Print the results in a human readable form
        for ((rule, paths) in ruleMap) {
            print("\u001b[1mData of type $rule found:\u001b[0m\n")

            for (p in paths) {
                val fqn = p.end.fqn
                val sinkName = p.end.rule?.name ?: "Unknown ($fqn)"
                val callLocation = p.end.node.location?.detailedString() ?: ""
                val varLocation = p.start.node.location?.detailedString() ?: ""

                print("\u001b[31m* At $varLocation to => $sinkName ($callLocation)\u001b[0m\n")

                for (n in p.nodes) {
                    val loc = n.location?.detailedString() ?: ""
                    val cls = n::class
                    print("         - $cls($loc)\n")
                }

                print("\n")
            }

            print("\n")
        }

        if (token != "" && config != null) {
            runBlocking {
                val q = CreateCodescanResult(
                    CreateCodescanResult.Variables(
                        CreateCodescanResultInput(
                            config.repoId,
                            sinkIdentities.map { it -> DestInput(
                                it.rule?.id,
                                it.rule?.name ?: it.fqn,
                            )},
                            flowInputs,
                            null,
                            sourceInputs
                        )
                    )
                )

                val result = client.execute(q)
            }
        }

        return 0
    }
}

fun main(args: Array<String>) : Unit = exitProcess(CommandLine(App()).execute(*args))


