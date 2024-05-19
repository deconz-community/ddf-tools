/**
 * Based on https://github.com/alexgorbatchev/file-paths-to-tree/
 */

const sep = '/'

interface Node<Data> {
  name: string
  path: string
  children: Node<Data>[]
  parent: Node<Data> | null
  data?: Data
}

/**
 * Takes a list of file paths and turns it into a tree. For each node you can attach own data using a callback.
 */
export function filePathsToTree<Data>(paths: string[], getData?: (node: Node<Data>) => Data) {
  const results: Node<Data>[] = []

  return paths.reduce((currentResults, currentPath) => {
    const pathParts = currentPath.split(sep)
    const byPath: Record<string, Node<Data>> = {}

    pathParts.reduce((nodes, name, index, arr) => {
      let node: Node<Data> | undefined = nodes.find(node => node.name === name)
      const path = arr.slice(0, index + 1).join(sep)
      const parentPath = arr.slice(0, index).join(sep)

      if (!node) {
        node = {
          name,
          path,
          parent: byPath[parentPath],
          children: [],
        }

        node.data = getData?.(node)
        // TODO: Optimize this by inserting the node in the right place
        nodes.push(node)
        nodes.sort((a, b) => a.name.localeCompare(b.name))
      }

      byPath[path] = node

      return node.children
    }, currentResults)

    return currentResults
  }, results)
}

export function filePathsToUniqueTree<Data>(paths: string[], getData?: (node: Node<Data>) => Data) {
  const results = filePathsToTree(paths, getData)

  const root: Node<Data> = {
    name: '',
    path: '',
    parent: null,
    children: [],
  }

  root.children = results.map((node) => {
    node.parent = root
    return node
  })

  root.data = getData?.(root)

  return root
}

/**
 * Converts a list of `Node` to a flat list of printable strings.
 */
export function treeToString<Data>(nodes: Node<Data>[], level = 0, prefix = '') {
  const nodesCount = nodes.length - 1
  let results = ''

  nodes.forEach((node, nodeIndex) => {
    const line = node.name
    let pointer = ''

    if (level > 0) {
      if (nodesCount > 0)
        pointer = nodeIndex === nodesCount ? '└── ' : '├── '

      else
        pointer = '└── '
    }

    results += `${prefix + pointer + line}\n`

    if (node.children && node.children.length) {
      let newPrefix = prefix

      if (level > 0)
        newPrefix += `${nodeIndex === nodesCount ? ' ' : '│'}   `

      results += treeToString(node.children, level + 1, newPrefix)
    }
  })

  return results
}
