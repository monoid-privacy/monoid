package monoid.codescan.config

import monoid.codescan.generated.enums.CodescanRepoType
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.dataformat.yaml.YAMLMapper
import java.io.File

data class CodescanConfig(
    val repoId: String,
    val repoType: CodescanRepoType
)

fun readConfig(filepath: File): CodescanConfig {
    val mapper = YAMLMapper().registerKotlinModule()
    return mapper.readValue<CodescanConfig>(filepath)
}

fun CodescanConfig.persist(filepath: File) {
    val mapper = YAMLMapper().registerKotlinModule()
    mapper.writeValue(filepath, this)
}