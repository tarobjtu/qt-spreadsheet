/**
 * DependencyGraph 集成测试
 * 测试复杂依赖关系场景
 */
import DependencyGraph from '../../src/formula/DependencyGraph'
import { cellKey, parseKey } from '../../src/formula/CellReference'

describe('DependencyGraph Integration', () => {
  let graph

  beforeEach(() => {
    graph = new DependencyGraph()
  })

  describe('复杂依赖网络', () => {
    test('应正确处理菱形依赖', () => {
      // 菱形依赖：
      //     A1
      //    /  \
      //   B1  C1
      //    \  /
      //     D1

      // B1 依赖 A1
      graph.setDependencies(1, 0, [{ type: 'cell', col: 0, row: 0 }])
      // C1 依赖 A1
      graph.setDependencies(2, 0, [{ type: 'cell', col: 0, row: 0 }])
      // D1 依赖 B1 和 C1
      graph.setDependencies(3, 0, [
        { type: 'cell', col: 1, row: 0 },
        { type: 'cell', col: 2, row: 0 },
      ])

      // A1 的所有依赖者
      const dependents = graph.getDependents(0, 0)
      expect(dependents.size).toBe(3) // B1, C1, D1

      // 计算顺序
      const order = graph.getCalculationOrder(dependents)
      expect(order).not.toBeNull()

      // D1 应该在 B1 和 C1 之后
      const b1Index = order.indexOf(cellKey(1, 0))
      const c1Index = order.indexOf(cellKey(2, 0))
      const d1Index = order.indexOf(cellKey(3, 0))
      expect(d1Index).toBeGreaterThan(b1Index)
      expect(d1Index).toBeGreaterThan(c1Index)
    })

    test('应正确处理长链依赖', () => {
      // A1 -> B1 -> C1 -> D1 -> E1
      for (let i = 1; i <= 4; i += 1) {
        graph.setDependencies(i, 0, [{ type: 'cell', col: i - 1, row: 0 }])
      }

      const dependents = graph.getDependents(0, 0)
      expect(dependents.size).toBe(4)

      const order = graph.getCalculationOrder(dependents)
      expect(order).toEqual([
        cellKey(1, 0),
        cellKey(2, 0),
        cellKey(3, 0),
        cellKey(4, 0),
      ])
    })

    test('应正确处理多源汇聚', () => {
      // A1, B1, C1 -> D1
      graph.setDependencies(3, 0, [
        { type: 'cell', col: 0, row: 0 },
        { type: 'cell', col: 1, row: 0 },
        { type: 'cell', col: 2, row: 0 },
      ])

      expect(graph.getDirectDependents(0, 0).has(cellKey(3, 0))).toBe(true)
      expect(graph.getDirectDependents(1, 0).has(cellKey(3, 0))).toBe(true)
      expect(graph.getDirectDependents(2, 0).has(cellKey(3, 0))).toBe(true)
    })
  })

  describe('循环引用检测', () => {
    test('应检测直接自引用', () => {
      graph.setDependencies(0, 0, [{ type: 'cell', col: 0, row: 0 }])
      expect(graph.hasCircularReference(0, 0)).toBe(true)
    })

    test('应检测两节点循环', () => {
      graph.setDependencies(0, 0, [{ type: 'cell', col: 1, row: 0 }])
      graph.setDependencies(1, 0, [{ type: 'cell', col: 0, row: 0 }])
      expect(graph.hasCircularReference(0, 0)).toBe(true)
      expect(graph.hasCircularReference(1, 0)).toBe(true)
    })

    test('应检测三节点循环', () => {
      // A1 -> B1 -> C1 -> A1
      graph.setDependencies(0, 0, [{ type: 'cell', col: 2, row: 0 }])
      graph.setDependencies(1, 0, [{ type: 'cell', col: 0, row: 0 }])
      graph.setDependencies(2, 0, [{ type: 'cell', col: 1, row: 0 }])

      expect(graph.hasCircularReference(0, 0)).toBe(true)
    })

    test('应正确区分非循环引用', () => {
      // A1 -> B1 -> C1 (无循环)
      graph.setDependencies(1, 0, [{ type: 'cell', col: 0, row: 0 }])
      graph.setDependencies(2, 0, [{ type: 'cell', col: 1, row: 0 }])

      expect(graph.hasCircularReference(0, 0)).toBe(false)
      expect(graph.hasCircularReference(1, 0)).toBe(false)
      expect(graph.hasCircularReference(2, 0)).toBe(false)
    })
  })

  describe('范围引用处理', () => {
    test('应正确展开范围依赖', () => {
      // D1 = SUM(A1:C1)
      graph.setDependencies(3, 0, [
        { type: 'range', col: 0, row: 0, endCol: 2, endRow: 0 },
      ])

      // D1 应该依赖于 A1, B1, C1
      const deps = graph.getCellDependencies(3, 0)
      expect(deps.has(cellKey(0, 0))).toBe(true)
      expect(deps.has(cellKey(1, 0))).toBe(true)
      expect(deps.has(cellKey(2, 0))).toBe(true)
    })

    test('应正确处理2D范围', () => {
      // E1 = SUM(A1:B2)
      graph.setDependencies(4, 0, [
        { type: 'range', col: 0, row: 0, endCol: 1, endRow: 1 },
      ])

      const deps = graph.getCellDependencies(4, 0)
      expect(deps.size).toBe(4) // A1, B1, A2, B2
    })
  })

  describe('依赖更新', () => {
    test('移除依赖应正确更新反向引用', () => {
      // B1 依赖 A1
      graph.setDependencies(1, 0, [{ type: 'cell', col: 0, row: 0 }])
      expect(graph.getDirectDependents(0, 0).has(cellKey(1, 0))).toBe(true)

      // 移除 B1 的依赖
      graph.removeDependencies(1, 0)
      expect(graph.getDirectDependents(0, 0).has(cellKey(1, 0))).toBe(false)
    })

    test('更改依赖应正确更新引用', () => {
      // B1 依赖 A1
      graph.setDependencies(1, 0, [{ type: 'cell', col: 0, row: 0 }])

      // B1 改为依赖 C1
      graph.setDependencies(1, 0, [{ type: 'cell', col: 2, row: 0 }])

      expect(graph.getDirectDependents(0, 0).has(cellKey(1, 0))).toBe(false)
      expect(graph.getDirectDependents(2, 0).has(cellKey(1, 0))).toBe(true)
    })
  })

  describe('行列插入/删除的引用更新', () => {
    test('插入行应更新引用', () => {
      // B2 依赖 A2
      graph.setDependencies(1, 1, [{ type: 'cell', col: 0, row: 1 }])

      // 在第1行插入1行
      graph.updateReferences('row', 1, 1)

      // 依赖关系应该变成 B3 依赖 A3
      expect(graph.getCellDependencies(1, 2).has(cellKey(0, 2))).toBe(true)
    })

    test('删除行应更新引用', () => {
      // B3 依赖 A3
      graph.setDependencies(1, 2, [{ type: 'cell', col: 0, row: 2 }])

      // 删除第1行
      graph.updateReferences('row', 1, -1)

      // 依赖关系应该变成 B2 依赖 A2
      expect(graph.getCellDependencies(1, 1).has(cellKey(0, 1))).toBe(true)
    })

    test('插入列应更新引用', () => {
      // C1 依赖 B1
      graph.setDependencies(2, 0, [{ type: 'cell', col: 1, row: 0 }])

      // 在第1列插入1列
      graph.updateReferences('col', 1, 1)

      // 依赖关系应该变成 D1 依赖 C1
      expect(graph.getCellDependencies(3, 0).has(cellKey(2, 0))).toBe(true)
    })
  })

  describe('计算顺序', () => {
    test('有循环时应返回null', () => {
      graph.setDependencies(0, 0, [{ type: 'cell', col: 1, row: 0 }])
      graph.setDependencies(1, 0, [{ type: 'cell', col: 0, row: 0 }])

      const order = graph.getCalculationOrder(
        new Set([cellKey(0, 0), cellKey(1, 0)])
      )
      expect(order).toBeNull()
    })

    test('空集合应返回空数组', () => {
      const order = graph.getCalculationOrder(new Set())
      expect(order).toEqual([])
    })

    test('独立单元格应以任意顺序返回', () => {
      // 两个独立公式，互不依赖
      const order = graph.getCalculationOrder(
        new Set([cellKey(0, 0), cellKey(1, 0)])
      )
      expect(order).toHaveLength(2)
    })
  })
})
