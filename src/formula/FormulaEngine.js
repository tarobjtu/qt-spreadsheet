/**
 * @description 公式引擎
 * 整合解析器、求值器、依赖图，提供完整的公式计算功能
 */

import Parser from './Parser'
import Evaluator from './Evaluator'
import DependencyGraph from './DependencyGraph'
import { FormulaError, isError } from './errors'
import { cellKey, parseKey, colToAlpha, alphaToCol } from './CellReference'

/**
 * @description 检查值是否为公式
 * @param {*} value
 * @returns {boolean}
 */
function isFormula(value) {
  return typeof value === 'string' && value.startsWith('=')
}

/**
 * @description 更新公式文本中的引用
 * @param {string} formula - 公式字符串
 * @param {string} type - 'row' 或 'col'
 * @param {number} position - 插入/删除位置
 * @param {number} delta - 正数为插入，负数为删除
 * @returns {string} 更新后的公式
 */
function updateFormulaText(formula, type, position, delta) {
  // 使用正则表达式匹配并更新单元格引用
  const cellRefPattern = /(\$?)([A-Z]+)(\$?)(\d+)/gi

  return formula.replace(cellRefPattern, (match, colAbs, colAlpha, rowAbs, rowNum) => {
    const colIndex = alphaToCol(colAlpha)
    const rowIndex = parseInt(rowNum, 10) - 1

    let newColIndex = colIndex
    let newRowIndex = rowIndex

    if (type === 'row' && rowAbs !== '$') {
      if (delta > 0) {
        // 插入行
        if (rowIndex >= position) {
          newRowIndex = rowIndex + delta
        }
      } else {
        // 删除行
        if (rowIndex >= position && rowIndex < position - delta) {
          return FormulaError.REF // 被删除的行
        }
        if (rowIndex >= position - delta) {
          newRowIndex = rowIndex + delta
        }
      }
    }

    if (type === 'col' && colAbs !== '$') {
      if (delta > 0) {
        // 插入列
        if (colIndex >= position) {
          newColIndex = colIndex + delta
        }
      } else {
        // 删除列
        if (colIndex >= position && colIndex < position - delta) {
          return FormulaError.REF // 被删除的列
        }
        if (colIndex >= position - delta) {
          newColIndex = colIndex + delta
        }
      }
    }

    return `${colAbs}${colToAlpha(newColIndex)}${rowAbs}${newRowIndex + 1}`
  })
}

/**
 * @description 从 AST 中提取所有单元格引用
 * @param {object} ast - AST 节点
 * @param {Array} refs - 引用数组
 * @returns {Array} 引用数组
 */
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
      ast.args.forEach((arg) => {
        extractReferences(arg, refs)
      })
      break

    default:
      break
  }

  return refs
}

class FormulaEngine {
  /**
   * @param {object} viewModel - ViewModel 实例
   */
  constructor(viewModel) {
    this.viewModel = viewModel
    this.parser = new Parser()
    this.graph = new DependencyGraph()
    this.evaluator = new Evaluator(this.getCellValue.bind(this), this.getRangeValues.bind(this))
  }

  /**
   * @description 设置单元格值（由 ViewModel 调用）
   * @param {number} col
   * @param {number} row
   * @param {string} value
   * @returns {object} { displayValue, error }
   */
  setCell(col, row, value) {
    const cell = this.viewModel.getCellData(col, row)

    if (isFormula(value)) {
      return this.setFormulaCell(col, row, value, cell)
    }

    return this.setValueCell(col, row, value, cell)
  }

  /**
   * @description 设置公式单元格
   */
  setFormulaCell(col, row, formulaText, cellData) {
    const cell = cellData
    try {
      // 解析公式
      const ast = this.parser.parse(formulaText)

      // 提取引用
      const refs = extractReferences(ast)

      // 更新依赖图
      this.graph.setDependencies(col, row, refs)

      // 检测循环引用
      if (this.graph.hasCircularReference(col, row)) {
        cell.formula = formulaText
        cell.calculated = FormulaError.CIRC
        cell.error = FormulaError.CIRC

        return { displayValue: FormulaError.CIRC, error: true }
      }

      // 求值
      const result = this.evaluator.evaluate(ast)

      // 更新单元格
      cell.formula = formulaText
      cell.calculated = result
      cell.error = isError(result) ? result : null

      // 重新计算依赖此单元格的其他单元格
      this.recalculateDependents(col, row)

      return { displayValue: result, error: isError(result) }
    } catch (e) {
      // 解析错误
      cell.formula = formulaText
      cell.calculated = FormulaError.VALUE
      cell.error = FormulaError.VALUE

      return { displayValue: FormulaError.VALUE, error: true }
    }
  }

  /**
   * @description 设置普通值单元格
   */
  setValueCell(col, row, value, cellData) {
    const cell = cellData
    // 清除公式相关数据
    cell.formula = null
    cell.calculated = null
    cell.error = null

    // 从依赖图中移除
    this.graph.removeDependencies(col, row)

    // 重新计算依赖此单元格的其他单元格
    this.recalculateDependents(col, row)

    return { displayValue: value, error: false }
  }

  /**
   * @description 获取单元格显示值
   * @param {number} col
   * @param {number} row
   * @returns {*}
   */
  getValue(col, row) {
    const cell = this.viewModel.getCellData(col, row)

    if (!cell) {
      return ''
    }

    // 如果有公式，返回计算结果
    if (cell.formula) {
      return cell.calculated
    }

    return cell.value
  }

  /**
   * @description 获取单元格公式文本（用于编辑）
   * @param {number} col
   * @param {number} row
   * @returns {string}
   */
  getFormula(col, row) {
    const cell = this.viewModel.getCellData(col, row)

    if (!cell) {
      return ''
    }

    // 如果有公式，返回公式文本
    if (cell.formula) {
      return cell.formula
    }

    return cell.value ?? ''
  }

  /**
   * @description 获取单元格值（供 Evaluator 使用）
   */
  getCellValue(col, row) {
    const cell = this.viewModel.getCellData(col, row)

    if (!cell) {
      return FormulaError.REF
    }

    // 如果有公式，返回计算结果
    if (cell.formula) {
      return cell.calculated
    }

    // 尝试转换为数字
    const val = cell.value

    if (val === '' || val === null || val === undefined) {
      return 0
    }

    if (typeof val === 'number') {
      return val
    }

    if (typeof val === 'string') {
      const num = Number(val)
      if (!Number.isNaN(num)) {
        return num
      }
    }

    return val
  }

  /**
   * @description 获取范围值（供 Evaluator 使用）
   */
  getRangeValues(startCol, startRow, endCol, endRow) {
    const result = []

    for (let r = startRow; r <= endRow; r += 1) {
      const rowData = []
      for (let c = startCol; c <= endCol; c += 1) {
        rowData.push(this.getCellValue(c, r))
      }
      result.push(rowData)
    }

    return result
  }

  /**
   * @description 重新计算依赖于指定单元格的所有单元格
   */
  recalculateDependents(col, row) {
    const dependents = this.graph.getDependents(col, row)

    if (dependents.size === 0) {
      return
    }

    // 获取计算顺序
    const order = this.graph.getCalculationOrder(dependents)

    if (!order) {
      // 存在循环引用，标记所有相关单元格为循环错误
      Array.from(dependents).forEach((key) => {
        const { col: c, row: r } = parseKey(key)
        const cell = this.viewModel.getCellData(c, r)
        if (cell && cell.formula) {
          cell.calculated = FormulaError.CIRC
          cell.error = FormulaError.CIRC
        }
      })
      return
    }

    // 按顺序重新计算
    order.forEach((key) => {
      const { col: c, row: r } = parseKey(key)
      const cell = this.viewModel.getCellData(c, r)

      if (cell && cell.formula) {
        try {
          const ast = this.parser.parse(cell.formula)
          const result = this.evaluator.evaluate(ast)
          cell.calculated = result
          cell.error = isError(result) ? result : null
        } catch (e) {
          cell.calculated = FormulaError.VALUE
          cell.error = FormulaError.VALUE
        }
      }
    })
  }

  /**
   * @description 更新公式中的引用（当行/列插入或删除时）
   * @param {string} type - 'row' 或 'col'
   * @param {number} position - 插入/删除位置
   * @param {number} delta - 正数为插入，负数为删除
   */
  updateReferences(type, position, delta) {
    // 更新依赖图
    this.graph.updateReferences(type, position, delta)

    // 更新所有公式单元格的公式文本
    const { data } = this.viewModel.sheetData

    for (let r = 0; r < data.length; r += 1) {
      for (let c = 0; c < data[r].length; c += 1) {
        const cell = data[r][c]

        if (cell && cell.formula) {
          const newFormula = updateFormulaText(cell.formula, type, position, delta)
          cell.formula = newFormula
          cell.value = newFormula

          // 重新解析和计算
          try {
            const ast = this.parser.parse(newFormula)
            const refs = extractReferences(ast)
            this.graph.setDependencies(c, r, refs)
            const result = this.evaluator.evaluate(ast)
            cell.calculated = result
            cell.error = isError(result) ? result : null
          } catch (e) {
            cell.calculated = FormulaError.REF
            cell.error = FormulaError.REF
          }
        }
      }
    }
  }

  /**
   * @description 重新计算所有公式单元格
   */
  recalculateAll() {
    const { data } = this.viewModel.sheetData
    const formulaCells = []

    // 收集所有公式单元格
    for (let r = 0; r < data.length; r += 1) {
      for (let c = 0; c < data[r].length; c += 1) {
        const cell = data[r][c]
        if (cell && cell.formula) {
          formulaCells.push(cellKey(c, r))
        }
      }
    }

    if (formulaCells.length === 0) {
      return
    }

    // 获取计算顺序
    const order = this.graph.getCalculationOrder(new Set(formulaCells))

    if (!order) {
      // 存在循环引用
      formulaCells.forEach((key) => {
        const { col: c, row: r } = parseKey(key)
        const cell = this.viewModel.getCellData(c, r)
        if (cell) {
          cell.calculated = FormulaError.CIRC
          cell.error = FormulaError.CIRC
        }
      })
      return
    }

    // 按顺序计算
    order.forEach((key) => {
      const { col: c, row: r } = parseKey(key)
      const cell = this.viewModel.getCellData(c, r)

      if (cell && cell.formula) {
        try {
          const ast = this.parser.parse(cell.formula)
          const result = this.evaluator.evaluate(ast)
          cell.calculated = result
          cell.error = isError(result) ? result : null
        } catch (e) {
          cell.calculated = FormulaError.VALUE
          cell.error = FormulaError.VALUE
        }
      }
    })
  }

  /**
   * @description 初始化已有数据的公式
   * 当加载包含公式的数据时调用
   */
  initializeFormulas() {
    const { data } = this.viewModel.sheetData

    // 第一遍：解析所有公式，建立依赖图
    for (let r = 0; r < data.length; r += 1) {
      for (let c = 0; c < data[r].length; c += 1) {
        const cell = data[r][c]

        if (cell && isFormula(cell.value)) {
          try {
            const ast = this.parser.parse(cell.value)
            const refs = extractReferences(ast)
            this.graph.setDependencies(c, r, refs)
            cell.formula = cell.value
          } catch (e) {
            cell.formula = cell.value
            cell.calculated = FormulaError.VALUE
            cell.error = FormulaError.VALUE
          }
        }
      }
    }

    // 第二遍：按顺序计算所有公式
    this.recalculateAll()
  }
}

export default FormulaEngine
