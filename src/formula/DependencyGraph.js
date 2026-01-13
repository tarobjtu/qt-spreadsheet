/**
 * @description 依赖图
 * 追踪单元格之间的依赖关系，支持循环引用检测和拓扑排序
 */

import { cellKey, parseKey, expandRange } from './CellReference'

class DependencyGraph {
  constructor() {
    // 正向依赖: cell -> cells it depends on
    // key: "col,row", value: Set<"col,row">
    this.dependencies = new Map()

    // 反向依赖: cell -> cells that depend on it
    // key: "col,row", value: Set<"col,row">
    this.dependents = new Map()
  }

  /**
   * @description 设置单元格的依赖关系
   * @param {number} col
   * @param {number} row
   * @param {Array<object>} refs - 引用对象数组 [{type: 'cell', col, row}, {type: 'range', ...}]
   */
  setDependencies(col, row, refs) {
    const key = cellKey(col, row)

    // 清除旧的依赖关系
    this.removeDependencies(col, row)

    // 构建新的依赖集合
    const newDeps = new Set()

    refs.forEach((ref) => {
      if (ref.type === 'range') {
        // 展开范围引用
        const cells = expandRange(ref)
        cells.forEach((cell) => {
          newDeps.add(cellKey(cell.col, cell.row))
        })
      } else {
        newDeps.add(cellKey(ref.col, ref.row))
      }
    })

    // 保存正向依赖
    this.dependencies.set(key, newDeps)

    // 更新反向依赖
    newDeps.forEach((depKey) => {
      if (!this.dependents.has(depKey)) {
        this.dependents.set(depKey, new Set())
      }
      this.dependents.get(depKey).add(key)
    })
  }

  /**
   * @description 移除单元格的依赖关系
   * @param {number} col
   * @param {number} row
   */
  removeDependencies(col, row) {
    const key = cellKey(col, row)
    const oldDeps = this.dependencies.get(key)

    if (oldDeps) {
      // 从反向依赖中移除
      oldDeps.forEach((depKey) => {
        const depSet = this.dependents.get(depKey)
        if (depSet) {
          depSet.delete(key)
          if (depSet.size === 0) {
            this.dependents.delete(depKey)
          }
        }
      })
    }

    this.dependencies.delete(key)
  }

  /**
   * @description 获取依赖于指定单元格的所有单元格（递归）
   * @param {number} col
   * @param {number} row
   * @returns {Set<string>} 依赖于该单元格的所有单元格键
   */
  getDependents(col, row) {
    const key = cellKey(col, row)
    const result = new Set()
    const queue = [key]

    while (queue.length > 0) {
      const current = queue.shift()
      const deps = this.dependents.get(current)

      if (deps) {
        deps.forEach((dep) => {
          if (!result.has(dep)) {
            result.add(dep)
            queue.push(dep)
          }
        })
      }
    }

    return result
  }

  /**
   * @description 获取直接依赖于指定单元格的单元格（非递归）
   * @param {number} col
   * @param {number} row
   * @returns {Set<string>}
   */
  getDirectDependents(col, row) {
    const key = cellKey(col, row)
    return this.dependents.get(key) || new Set()
  }

  /**
   * @description 检测是否存在循环引用
   * @param {number} col
   * @param {number} row
   * @returns {boolean}
   */
  hasCircularReference(col, row) {
    const key = cellKey(col, row)
    const visited = new Set()
    const inStack = new Set()

    const dfs = (current) => {
      if (inStack.has(current)) {
        return true // 发现环
      }

      if (visited.has(current)) {
        return false // 已访问过，无环
      }

      visited.add(current)
      inStack.add(current)

      const deps = this.dependencies.get(current)
      if (deps) {
        const depsArray = Array.from(deps)
        for (let i = 0; i < depsArray.length; i += 1) {
          if (dfs(depsArray[i])) {
            return true
          }
        }
      }

      inStack.delete(current)
      return false
    }

    return dfs(key)
  }

  /**
   * @description 获取计算顺序（拓扑排序）
   * @param {Set<string>|Array<string>} cells - 需要计算的单元格
   * @returns {Array<string>|null} 按计算顺序排列的单元格键，如果有循环则返回 null
   */
  getCalculationOrder(cells) {
    const cellSet = cells instanceof Set ? cells : new Set(cells)
    const result = []
    const visited = new Set()
    const temp = new Set() // 用于检测循环

    const visit = (key) => {
      if (temp.has(key)) {
        return false // 发现循环
      }

      if (visited.has(key)) {
        return true // 已处理
      }

      temp.add(key)

      // 先访问所有依赖
      const deps = this.dependencies.get(key)
      if (deps) {
        const depsArray = Array.from(deps)
        for (let i = 0; i < depsArray.length; i += 1) {
          // 只处理在计算集合中的依赖，或者处理所有依赖
          if (!visit(depsArray[i])) {
            return false
          }
        }
      }

      temp.delete(key)
      visited.add(key)

      // 只将需要计算的单元格加入结果
      if (cellSet.has(key)) {
        result.push(key)
      }

      return true
    }

    const cellArray = Array.from(cellSet)
    for (let i = 0; i < cellArray.length; i += 1) {
      if (!visit(cellArray[i])) {
        return null // 存在循环
      }
    }

    return result
  }

  /**
   * @description 更新引用（当行/列插入或删除时）
   * @param {string} type - 'row' 或 'col'
   * @param {number} position - 插入/删除位置
   * @param {number} delta - 正数为插入，负数为删除
   */
  updateReferences(type, position, delta) {
    const newDependencies = new Map()
    const newDependents = new Map()

    /**
     * @description 调整单元格键
     */
    const adjustKey = (key) => {
      const { col, row } = parseKey(key)
      let newCol = col
      let newRow = row

      if (type === 'row') {
        if (delta > 0) {
          // 插入行
          if (row >= position) {
            newRow = row + delta
          }
        } else if (row >= position && row < position - delta) {
          // 删除行 - 被删除
          return null
        } else if (row >= position - delta) {
          newRow = row + delta
        }
      } else if (type === 'col') {
        if (delta > 0) {
          // 插入列
          if (col >= position) {
            newCol = col + delta
          }
        } else if (col >= position && col < position - delta) {
          // 删除列 - 被删除
          return null
        } else if (col >= position - delta) {
          newCol = col + delta
        }
      }

      return cellKey(newCol, newRow)
    }

    // 更新正向依赖
    this.dependencies.forEach((deps, key) => {
      const newKey = adjustKey(key)
      if (!newKey) return

      const newDeps = new Set()
      deps.forEach((dep) => {
        const newDep = adjustKey(dep)
        if (newDep) {
          newDeps.add(newDep)
        }
      })

      if (newDeps.size > 0) {
        newDependencies.set(newKey, newDeps)
      }
    })

    // 重建反向依赖
    newDependencies.forEach((deps, key) => {
      deps.forEach((dep) => {
        if (!newDependents.has(dep)) {
          newDependents.set(dep, new Set())
        }
        newDependents.get(dep).add(key)
      })
    })

    this.dependencies = newDependencies
    this.dependents = newDependents
  }

  /**
   * @description 清空所有依赖关系
   */
  clear() {
    this.dependencies.clear()
    this.dependents.clear()
  }

  /**
   * @description 获取单元格的依赖（它依赖哪些单元格）
   * @param {number} col
   * @param {number} row
   * @returns {Set<string>}
   */
  getCellDependencies(col, row) {
    const key = cellKey(col, row)
    return this.dependencies.get(key) || new Set()
  }
}

export default DependencyGraph
