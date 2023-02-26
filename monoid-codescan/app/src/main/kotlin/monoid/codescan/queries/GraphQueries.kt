package monoid.codescan.queries

import java.util.Objects
import de.fraunhofer.aisec.cpg.graph.*
import de.fraunhofer.aisec.cpg.graph.followNextDFGEdgesUntilHit
import de.fraunhofer.aisec.cpg.graph.declarations.FunctionDeclaration
import de.fraunhofer.aisec.cpg.graph.declarations.FieldDeclaration
import de.fraunhofer.aisec.cpg.graph.statements.expressions.CallExpression

import monoid.codescan.sinks.Sink
import monoid.codescan.sources.Source

class NodePathCollection {
    var pathMap = mutableMapOf<Pair<Source, Sink>, MutableList<NodePath>>()

    fun add(path: NodePath) {
        if (Pair(path.start, path.end) !in pathMap) {
            pathMap[Pair(path.start, path.end)] = mutableListOf<NodePath>()
        }

        pathMap[Pair(path.start, path.end)]!!.add(path)
    }

    fun subpathOfAny(path: NodePath): Boolean {
        return false
    }

    fun pathList(): List<NodePath> {
        return pathMap.map { (_, v) -> v.first() }
    }
}

class NodePath(path: List<Node>, start: Source, end: Sink) {
    val nodes = path
    val nodeMap = nodes.mapIndexed { i, n -> n to i }.toMap()
    val start = start
    val end = end

    override fun equals(other: Any?): Boolean {
        if (other == this) {
            return true
        }

        if (other !is NodePath) {
            return false
        }

        return Objects.equals(other.nodes, this.nodes)
    }

    fun includesPathBetween(start: Node, end: Node): Boolean {
        return (
            start in nodeMap && end !in nodeMap &&
            nodeMap[start]!! <= nodeMap[end]!!
        )
    }

}

fun dataFlow(from: Source, to: Sink): List<NodePath> {
    val evalRes = from.node.followNextDFGEdgesUntilHit { it == to.node }
    val allPaths = evalRes.fulfilled.map { NodePath(it, from, to) }.toMutableList()

    return allPaths
}

fun Node.followNextDFGEdgesFulfilled(predicate: (Node) -> Boolean): List<List<Node>> {
    // Looks complicated but at least it's not recursive...
    // result: List of paths (between from and to)
    val fulfilledPaths = mutableListOf<List<Node>>()
    // The list of paths where we're not done yet.
    val worklist = mutableListOf<Triple<Node, DFGTag?, Int>>()

    val currentPathSet = mutableSetOf<Node>()
    var currentPath = mutableListOf<Pair<Node, DFGTag?>>()
    var currentTags = mutableSetOf<String>()

    worklist.add(Triple(this, null, 0)) // We start only with the "from" node (=this)

    while (worklist.isNotEmpty()) {
        val (curr, tag, level) = worklist.removeLast()

        val numRemovals = currentPath.size - level

        // Remove all siblings of this node from the path and any
        // DFG Tags that are associated with them
        for (i in 1..numRemovals) {
            val (n, t) = currentPath.removeLast()
            currentPathSet.remove(n)

            if (t != null && t.direction == DFGTagDirection.ENTER) {
                currentTags.remove(t.tag)
            }
        }

        // Add any tags to the list of current tags, and check that this node
        // can actually be added to the current path.
        if (tag != null) {
            if (tag.direction == DFGTagDirection.ENTER) {
                currentTags.add(tag.tag)
            } else if (tag.direction == DFGTagDirection.EXIT) {
                if (tag.tag in currentTags || currentTags.isEmpty()) {
                    currentTags.remove(tag.tag)
                } else {
                    continue
                }
            }
        }

        currentPath.add(Pair(curr, tag))
        currentPathSet.add(curr)

        // Add any children to the worklist
        for ((next, dfgTag) in curr.nextDFGMap) {
            if (next in currentPathSet) continue

            if (dfgTag != null) {
                worklist.add(Triple(next, dfgTag, level + 1))
            } else {
                worklist.add(Triple(next, null, level + 1))
            }
        }

        if (predicate(curr)) {
            fulfilledPaths.add(currentPath.map { (n, _) -> n })
        }
    }

    return fulfilledPaths
}

fun allDataPaths(sources: List<Source>, sinks: List<Sink>): List<NodePath> {
    val coll = NodePathCollection()
    val sinkMap = sinks.map { it.node to it }.toMap()

    for (source in sources) {
        val evalRes = source.node.followNextDFGEdgesFulfilled { it in sinkMap }
        val flow = evalRes.map {
            NodePath(it, source, sinkMap[it.last()]!!)
        }.toMutableList()

        for (np in flow) {
            coll.add(np)
        }
    }

    return coll.pathList()
}

fun callPath(from: FunctionDeclaration, to: FunctionDeclaration): Boolean {
    val worklist = mutableListOf<FunctionDeclaration>(from)
    val seen = mutableSetOf<FunctionDeclaration>()

    while (!worklist.isEmpty()) {
        val f = worklist.removeLast()

        if (f in seen) continue
        seen.add(f)

        if (f == to) {
            return true
        }

        for (c in f.callees) {
            worklist.add(c)
        }
    }

    return false
}

fun fullExecutionPath(from: Source, to: Sink): List<NodePath> {
    var pred: (Node) -> Boolean = { n -> n == to.node }

    if (
        from.node.containingFunction != to.node.containingFunction &&
            to.node.containingFunction != null &&
            from.node.containingFunction != null
    ) {
        pred = { n ->
            if (n is CallExpression) {
                n.invokes.any({ fn -> callPath(fn, to.node.containingFunction!!) })
            } else {
                n == to.node
            }
        }
    }

    val evalRes = from.node.followNextEOGEdgesUntilHit(pred)
    val allPaths = evalRes.fulfilled.map { NodePath(it, from, to) }.toMutableList()

    return allPaths
}