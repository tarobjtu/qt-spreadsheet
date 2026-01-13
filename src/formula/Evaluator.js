/**
 * @description AST 求值器
 * 遍历 AST 并计算结果
 */

import { FormulaError, isError } from './errors'
import { callFunction } from './functions/index'

/**
 * @description 将值转换为数字
 */
function toNumber(value) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }

  if (typeof value === 'string') {
    if (value === '') {
      return 0
    }
    const num = Number(value)
    return Number.isNaN(num) ? 0 : num
  }

  return 0
}

/**
 * @description 比较两个值是否相等
 */
function compareEqual(left, right) {
  // 字符串比较不区分大小写
  if (typeof left === 'string' && typeof right === 'string') {
    return left.toLowerCase() === right.toLowerCase()
  }

  return left === right
}

/**
 * @description 比较两个值
 * @returns {number} -1, 0, 1
 */
function compare(left, right) {
  // 数字比较
  if (typeof left === 'number' && typeof right === 'number') {
    if (left < right) return -1
    if (left > right) return 1
    return 0
  }

  // 字符串比较（不区分大小写）
  if (typeof left === 'string' && typeof right === 'string') {
    const l = left.toLowerCase()
    const r = right.toLowerCase()
    if (l < r) return -1
    if (l > r) return 1
    return 0
  }

  // 混合类型：数字 < 字符串 < 布尔值
  const typeOrder = { number: 0, string: 1, boolean: 2 }
  const leftType = typeOrder[typeof left] ?? 3
  const rightType = typeOrder[typeof right] ?? 3

  return leftType - rightType
}

class Evaluator {
  /**
   * @param {Function} getCellValue - (col, row) => value
   * @param {Function} getRangeValues - (startCol, startRow, endCol, endRow) => 2D array
   */
  constructor(getCellValue, getRangeValues) {
    this.getCellValue = getCellValue
    this.getRangeValues = getRangeValues
  }

  /**
   * @description 求值 AST
   * @param {object} ast
   * @returns {*}
   */
  evaluate(ast) {
    if (!ast) {
      return FormulaError.VALUE
    }

    switch (ast.type) {
      case 'Literal':
        return ast.value

      case 'CellRef':
        return this.evaluateCellRef(ast)

      case 'RangeRef':
        return this.evaluateRangeRef(ast)

      case 'BinaryOp':
        return this.evaluateBinaryOp(ast)

      case 'UnaryOp':
        return this.evaluateUnaryOp(ast)

      case 'FunctionCall':
        return this.evaluateFunction(ast)

      default:
        return FormulaError.VALUE
    }
  }

  /**
   * @description 求值单元格引用
   */
  evaluateCellRef(ast) {
    const { col, row } = ast.ref
    return this.getCellValue(col, row)
  }

  /**
   * @description 求值范围引用
   */
  evaluateRangeRef(ast) {
    const { col, row, endCol, endRow } = ast.ref
    return this.getRangeValues(col, row, endCol, endRow)
  }

  /**
   * @description 求值二元运算
   */
  evaluateBinaryOp(ast) {
    const left = this.evaluate(ast.left)
    const right = this.evaluate(ast.right)

    // 错误传播
    if (isError(left)) return left
    if (isError(right)) return right

    switch (ast.operator) {
      // 算术运算
      case '+':
        return toNumber(left) + toNumber(right)

      case '-':
        return toNumber(left) - toNumber(right)

      case '*':
        return toNumber(left) * toNumber(right)

      case '/': {
        const divisor = toNumber(right)
        if (divisor === 0) {
          return FormulaError.DIV0
        }
        return toNumber(left) / divisor
      }

      case '^':
        return toNumber(left) ** toNumber(right)

      // 字符串连接
      case '&':
        return String(left ?? '') + String(right ?? '')

      // 比较运算
      case '=':
        return compareEqual(left, right)

      case '<>':
        return !compareEqual(left, right)

      case '<':
        return compare(left, right) < 0

      case '>':
        return compare(left, right) > 0

      case '<=':
        return compare(left, right) <= 0

      case '>=':
        return compare(left, right) >= 0

      default:
        return FormulaError.VALUE
    }
  }

  /**
   * @description 求值一元运算
   */
  evaluateUnaryOp(ast) {
    const operand = this.evaluate(ast.operand)

    if (isError(operand)) return operand

    switch (ast.operator) {
      case '-':
        return -toNumber(operand)

      default:
        return FormulaError.VALUE
    }
  }

  /**
   * @description 求值函数调用
   */
  evaluateFunction(ast) {
    const { name, args } = ast

    // 先求值所有参数
    const evaluatedArgs = args.map((arg) => this.evaluate(arg))

    // 检查参数中是否有错误（某些函数如 IFERROR 需要特殊处理）
    // 对于大多数函数，错误会自动传播

    // 调用函数
    return callFunction(name, evaluatedArgs)
  }
}

export default Evaluator
