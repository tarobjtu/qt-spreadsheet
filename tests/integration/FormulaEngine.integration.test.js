/**
 * FormulaEngine 集成测试
 * 测试 Parser + Evaluator + DependencyGraph 协同工作
 */
import Parser from '../../src/formula/Parser'
import Evaluator from '../../src/formula/Evaluator'
import DependencyGraph from '../../src/formula/DependencyGraph'
import { cellKey } from '../../src/formula/CellReference'

describe('FormulaEngine Integration', () => {
  // 模拟单元格数据存储
  let cellData
  let parser
  let graph
  let evaluator

  // 辅助函数：获取单元格值
  const getCellValue = (col, row) => {
    const key = cellKey(col, row)
    const cell = cellData.get(key)
    if (!cell) return 0
    if (cell.formula) return cell.calculated
    const val = cell.value
    if (val === '' || val === null || val === undefined) return 0
    if (typeof val === 'number') return val
    const num = Number(val)
    return Number.isNaN(num) ? val : num
  }

  // 辅助函数：获取范围值
  const getRangeValues = (startCol, startRow, endCol, endRow) => {
    const result = []
    for (let r = startRow; r <= endRow; r += 1) {
      const rowData = []
      for (let c = startCol; c <= endCol; c += 1) {
        rowData.push(getCellValue(c, r))
      }
      result.push(rowData)
    }
    return result
  }

  // 辅助函数：设置单元格值
  const setCellValue = (col, row, value) => {
    const key = cellKey(col, row)
    cellData.set(key, { value })
  }

  // 辅助函数：设置公式
  const setFormula = (col, row, formula) => {
    const key = cellKey(col, row)
    try {
      const ast = parser.parse(formula)
      const refs = extractReferences(ast)
      graph.setDependencies(col, row, refs)

      if (graph.hasCircularReference(col, row)) {
        cellData.set(key, { formula, calculated: '#CIRC!', error: true })
        return
      }

      const result = evaluator.evaluate(ast)
      cellData.set(key, { formula, calculated: result, error: false })
    } catch (e) {
      cellData.set(key, { formula, calculated: '#VALUE!', error: true })
    }
  }

  // 提取引用
  function extractReferences(ast, refs = []) {
    if (!ast) return refs
    switch (ast.type) {
      case 'CellRef':
        refs.push({ type: 'cell', ...ast.ref })
        break
      case 'RangeRef':
        refs.push({ type: 'range', ...ast.ref })
        break
      case 'BinaryOp':
        extractReferences(ast.left, refs)
        extractReferences(ast.right, refs)
        break
      case 'UnaryOp':
        extractReferences(ast.operand, refs)
        break
      case 'FunctionCall':
        ast.args.forEach((arg) => extractReferences(arg, refs))
        break
      default:
        break
    }
    return refs
  }

  beforeEach(() => {
    cellData = new Map()
    parser = new Parser()
    graph = new DependencyGraph()
    evaluator = new Evaluator(getCellValue, getRangeValues)
  })

  describe('基础公式计算流程', () => {
    test('应正确解析并求值简单算术公式', () => {
      const ast = parser.parse('=1+2*3')
      const result = evaluator.evaluate(ast)
      expect(result).toBe(7) // 1 + (2*3) = 7
    })

    test('应正确处理单元格引用', () => {
      setCellValue(0, 0, 10) // A1 = 10
      setCellValue(1, 0, 20) // B1 = 20

      const ast = parser.parse('=A1+B1')
      const result = evaluator.evaluate(ast)
      expect(result).toBe(30)
    })

    test('应正确处理范围引用和SUM函数', () => {
      setCellValue(0, 0, 1) // A1
      setCellValue(0, 1, 2) // A2
      setCellValue(0, 2, 3) // A3

      const ast = parser.parse('=SUM(A1:A3)')
      const result = evaluator.evaluate(ast)
      expect(result).toBe(6)
    })
  })

  describe('复杂公式链', () => {
    test('应正确处理嵌套函数', () => {
      setCellValue(0, 0, 10) // A1
      setCellValue(0, 1, 20) // A2
      setCellValue(0, 2, 30) // A3

      // =AVERAGE(A1:A3) + MAX(A1:A3)
      const ast = parser.parse('=AVERAGE(A1:A3)+MAX(A1:A3)')
      const result = evaluator.evaluate(ast)
      expect(result).toBe(50) // 20 + 30
    })

    test('应正确处理IF条件函数', () => {
      setCellValue(0, 0, 100) // A1 = 100

      const ast = parser.parse('=IF(A1>50,"pass","fail")')
      const result = evaluator.evaluate(ast)
      expect(result).toBe('pass')
    })

    test('应正确处理复杂公式表达式', () => {
      setCellValue(0, 0, 100) // A1 = 100
      setCellValue(1, 0, 200) // B1 = 200

      // =(A1+B1)/2*1.1
      const ast = parser.parse('=(A1+B1)/2*1.1')
      const result = evaluator.evaluate(ast)
      expect(result).toBeCloseTo(165)
    })
  })

  describe('依赖图管理', () => {
    test('应正确建立单元格依赖关系', () => {
      // C1 依赖于 A1 和 B1
      const ast = parser.parse('=A1+B1')
      const refs = extractReferences(ast)
      graph.setDependencies(2, 0, refs) // C1

      expect(graph.getCellDependencies(2, 0).size).toBe(2)
      expect(graph.getDirectDependents(0, 0).has(cellKey(2, 0))).toBe(true)
      expect(graph.getDirectDependents(1, 0).has(cellKey(2, 0))).toBe(true)
    })

    test('应正确处理范围依赖', () => {
      // D1 = SUM(A1:C1)
      const ast = parser.parse('=SUM(A1:C1)')
      const refs = extractReferences(ast)
      graph.setDependencies(3, 0, refs) // D1

      // D1 应该依赖于 A1, B1, C1
      expect(graph.getCellDependencies(3, 0).size).toBe(3)
    })

    test('应检测循环引用', () => {
      // A1 = B1
      const ast1 = parser.parse('=B1')
      graph.setDependencies(0, 0, extractReferences(ast1))

      // B1 = A1 (循环!)
      const ast2 = parser.parse('=A1')
      graph.setDependencies(1, 0, extractReferences(ast2))

      expect(graph.hasCircularReference(1, 0)).toBe(true)
    })

    test('应正确获取计算顺序', () => {
      // B1 = A1 * 2
      const ast1 = parser.parse('=A1*2')
      graph.setDependencies(1, 0, extractReferences(ast1))

      // C1 = B1 + 10
      const ast2 = parser.parse('=B1+10')
      graph.setDependencies(2, 0, extractReferences(ast2))

      const order = graph.getCalculationOrder(new Set([cellKey(1, 0), cellKey(2, 0)]))
      expect(order).not.toBeNull()
      // B1 应该在 C1 之前计算
      expect(order.indexOf(cellKey(1, 0))).toBeLessThan(order.indexOf(cellKey(2, 0)))
    })
  })

  describe('公式计算链更新', () => {
    test('修改源单元格应触发依赖单元格重新计算', () => {
      // 设置初始值
      setCellValue(0, 0, 10) // A1 = 10
      setFormula(1, 0, '=A1*2') // B1 = A1 * 2

      expect(getCellValue(1, 0)).toBe(20)

      // 修改 A1
      setCellValue(0, 0, 20)

      // 重新计算 B1
      const dependents = graph.getDependents(0, 0)
      dependents.forEach((key) => {
        const cell = cellData.get(key)
        if (cell && cell.formula) {
          const ast = parser.parse(cell.formula)
          cell.calculated = evaluator.evaluate(ast)
        }
      })

      expect(getCellValue(1, 0)).toBe(40)
    })

    test('多级依赖链应正确传播更新', () => {
      // A1 = 5
      setCellValue(0, 0, 5)
      // B1 = A1 * 2 = 10
      setFormula(1, 0, '=A1*2')
      // C1 = B1 + 5 = 15
      setFormula(2, 0, '=B1+5')

      expect(getCellValue(2, 0)).toBe(15)

      // 修改 A1 = 10
      setCellValue(0, 0, 10)

      // 获取计算顺序并重新计算
      const dependents = graph.getDependents(0, 0)
      const order = graph.getCalculationOrder(dependents)

      order.forEach((key) => {
        const cell = cellData.get(key)
        if (cell && cell.formula) {
          const ast = parser.parse(cell.formula)
          cell.calculated = evaluator.evaluate(ast)
        }
      })

      expect(getCellValue(1, 0)).toBe(20) // B1 = 10 * 2
      expect(getCellValue(2, 0)).toBe(25) // C1 = 20 + 5
    })
  })

  describe('错误处理', () => {
    test('除以零应返回 #DIV/0! 错误', () => {
      setCellValue(0, 0, 0) // A1 = 0
      const ast = parser.parse('=10/A1')
      const result = evaluator.evaluate(ast)
      expect(result).toBe('#DIV/0!')
    })

    test('无效公式语法应返回错误', () => {
      expect(() => parser.parse('=SUM(A1:)')).toThrow()
    })

    test('循环引用应被检测', () => {
      // A1 = A1 (自引用)
      const ast = parser.parse('=A1')
      graph.setDependencies(0, 0, extractReferences(ast))
      expect(graph.hasCircularReference(0, 0)).toBe(true)
    })
  })

  describe('各类函数集成', () => {
    test('数学函数应正确工作', () => {
      setCellValue(0, 0, -5) // A1 = -5

      const ast = parser.parse('=ABS(A1)')
      expect(evaluator.evaluate(ast)).toBe(5)
    })

    test('文本函数应正确工作', () => {
      setCellValue(0, 0, 'hello') // A1 = "hello"

      const ast = parser.parse('=LEN(A1)')
      expect(evaluator.evaluate(ast)).toBe(5)
    })

    test('逻辑函数应正确工作', () => {
      setCellValue(0, 0, true) // A1 = true
      setCellValue(1, 0, false) // B1 = false

      const ast = parser.parse('=AND(A1,B1)')
      expect(evaluator.evaluate(ast)).toBe(false)
    })

    test('统计函数应正确工作', () => {
      setCellValue(0, 0, 1)
      setCellValue(0, 1, 2)
      setCellValue(0, 2, 3)
      setCellValue(0, 3, 4)
      setCellValue(0, 4, 5)

      const ast = parser.parse('=COUNT(A1:A5)')
      expect(evaluator.evaluate(ast)).toBe(5)
    })
  })
})
