package monoid.codescan
import de.fraunhofer.aisec.cpg.TranslationConfiguration
import de.fraunhofer.aisec.cpg.passes.*

fun TranslationConfiguration.Builder.monoidPasses(): TranslationConfiguration.Builder {
    this.registerPass(TypeHierarchyResolver())
    this.registerPass(JavaExternalTypeHierarchyResolver())
    this.registerPass(ImportResolver())
    this.registerPass(VariableUsageResolver())
    this.registerPass(CallResolver()) // creates CG
    this.registerPass(DFGPass())
    this.registerPass(FunctionPointerCallResolver())
    // this.registerPass(EvaluationOrderGraphPass()) // creates EOG
    this.registerPass(TypeResolver())
    this.registerPass(FilenameMapper())
    return this
}