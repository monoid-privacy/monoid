package monoid.codescan.output

import monoid.codescan.queries.NodePath

fun NodePath.pathTrace(): String {
    val nodes = this.nodes

    return buildString {
        for (n in nodes) {
            append(n.code + " " + n::class + "(" + n.location + ")\n")
        }
    }
}