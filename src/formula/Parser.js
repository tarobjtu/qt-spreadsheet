/**
 * @description 公式解析器
 * 将公式字符串解析为 AST (抽象语法树)
 *
 * 支持的语法:
 * - 数字: 123, 3.14, -5
 * - 字符串: "hello"
 * - 单元格引用: A1, $A$1
 * - 范围引用: A1:B5, $A$1:$B$5
 * - 函数调用: SUM(A1:A10), IF(A1>0, B1, C1)
 * - 运算符: +, -, *, /, ^, &, =, <>, <, >, <=, >=
 * - 括号: (1+2)*3
 */

import { parseRef, parseRange } from './CellReference'

// Token 类型
const TokenType = {
  NUMBER: 'NUMBER',
  STRING: 'STRING',
  CELL_REF: 'CELL_REF',
  RANGE_REF: 'RANGE_REF',
  FUNCTION: 'FUNCTION',
  OPERATOR: 'OPERATOR',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  COMMA: 'COMMA',
  EOF: 'EOF',
}

// 单字符运算符和标点映射
const SINGLE_CHAR_MAP = {
  '+': TokenType.OPERATOR,
  '-': TokenType.OPERATOR,
  '*': TokenType.OPERATOR,
  '/': TokenType.OPERATOR,
  '^': TokenType.OPERATOR,
  '&': TokenType.OPERATOR,
  '=': TokenType.OPERATOR,
  '<': TokenType.OPERATOR,
  '>': TokenType.OPERATOR,
  '(': TokenType.LPAREN,
  ')': TokenType.RPAREN,
  ',': TokenType.COMMA,
}

/**
 * @description 词法分析 - 将字符串拆分为 token
 * @param {string} formula
 * @returns {Array<object>}
 */
function tokenize(formula) {
  const tokens = []
  let pos = 0

  while (pos < formula.length) {
    const char = formula[pos]

    // 跳过空白
    if (/\s/.test(char)) {
      pos += 1
    } else if (/\d/.test(char) || (char === '.' && /\d/.test(formula[pos + 1]))) {
      // 数字
      let num = ''
      while (pos < formula.length && /[\d.]/.test(formula[pos])) {
        num += formula[pos]
        pos += 1
      }
      tokens.push({ type: TokenType.NUMBER, value: parseFloat(num) })
    } else if (char === '"') {
      // 字符串
      let str = ''
      pos += 1 // 跳过开引号
      while (pos < formula.length && formula[pos] !== '"') {
        // 处理转义
        if (formula[pos] === '\\' && pos + 1 < formula.length) {
          pos += 1
          str += formula[pos]
        } else {
          str += formula[pos]
        }
        pos += 1
      }
      pos += 1 // 跳过闭引号
      tokens.push({ type: TokenType.STRING, value: str })
    } else if (/[A-Z$]/i.test(char)) {
      // 单元格引用、范围引用或函数名
      let ref = ''
      while (pos < formula.length && /[A-Z$\d:]/i.test(formula[pos])) {
        ref += formula[pos]
        pos += 1
      }

      // 检查是否为函数（后面跟着括号）
      if (formula[pos] === '(') {
        tokens.push({ type: TokenType.FUNCTION, value: ref.toUpperCase() })
      } else if (ref.includes(':')) {
        // 范围引用
        tokens.push({ type: TokenType.RANGE_REF, value: ref.toUpperCase() })
      } else {
        // 单元格引用
        tokens.push({ type: TokenType.CELL_REF, value: ref.toUpperCase() })
      }
    } else {
      // 双字符运算符
      const twoChar = formula.substr(pos, 2)
      if (['<=', '>=', '<>'].includes(twoChar)) {
        tokens.push({ type: TokenType.OPERATOR, value: twoChar })
        pos += 2
      } else if (SINGLE_CHAR_MAP[char]) {
        // 单字符运算符和标点
        tokens.push({ type: SINGLE_CHAR_MAP[char], value: char })
        pos += 1
      } else {
        // 未知字符
        throw new Error(`词法错误: 未知字符 "${char}"`)
      }
    }
  }

  tokens.push({ type: TokenType.EOF, value: null })
  return tokens
}

class Parser {
  constructor() {
    this.tokens = []
    this.pos = 0
  }

  /**
   * @description 解析公式字符串
   * @param {string} formula - 公式字符串，以 '=' 开头
   * @returns {object} AST
   */
  parse(formula) {
    if (!formula.startsWith('=')) {
      throw new Error('公式必须以 = 开头')
    }

    // 去掉 '=' 前缀
    const expr = formula.substring(1).trim()

    if (expr === '') {
      return { type: 'Literal', value: '' }
    }

    this.tokens = tokenize(expr)
    this.pos = 0

    const ast = this.parseExpression()

    // 确保所有 token 都被消费
    if (!this.isAtEnd()) {
      throw new Error(`解析错误: 意外的 token "${this.peek().value}"`)
    }

    return ast
  }

  // ========== 递归下降解析器 ==========

  /**
   * @description 查看当前 token
   */
  peek() {
    return this.tokens[this.pos]
  }

  /**
   * @description 消费当前 token 并前进
   */
  advance() {
    if (!this.isAtEnd()) {
      this.pos += 1
    }
    return this.tokens[this.pos - 1]
  }

  /**
   * @description 检查是否到达末尾
   */
  isAtEnd() {
    return this.peek().type === TokenType.EOF
  }

  /**
   * @description 检查当前 token 是否匹配指定类型
   */
  check(type) {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  /**
   * @description 检查当前 token 是否匹配指定运算符
   */
  checkOperator(...ops) {
    if (!this.check(TokenType.OPERATOR)) return false
    return ops.includes(this.peek().value)
  }

  /**
   * @description 如果匹配则消费 token
   */
  match(type) {
    if (this.check(type)) {
      this.advance()
      return true
    }
    return false
  }

  /**
   * @description 如果匹配运算符则消费
   */
  matchOperator(...ops) {
    if (this.checkOperator(...ops)) {
      return this.advance()
    }
    return null
  }

  /**
   * @description 期望指定类型的 token，否则抛出错误
   */
  expect(type, message) {
    if (this.check(type)) {
      return this.advance()
    }
    throw new Error(message || `期望 ${type}，但得到 ${this.peek().type}`)
  }

  // ========== 表达式解析（按优先级从低到高）==========

  /**
   * @description 解析表达式（入口）
   */
  parseExpression() {
    return this.parseComparison()
  }

  /**
   * @description 解析比较运算: =, <>, <, >, <=, >=
   */
  parseComparison() {
    let result = this.parseConcatenation()

    let op = this.matchOperator('=', '<>', '<', '>', '<=', '>=')
    while (op) {
      const right = this.parseConcatenation()
      result = { type: 'BinaryOp', operator: op.value, left: result, right }
      op = this.matchOperator('=', '<>', '<', '>', '<=', '>=')
    }

    return result
  }

  /**
   * @description 解析字符串连接: &
   */
  parseConcatenation() {
    let result = this.parseAdditive()

    let op = this.matchOperator('&')
    while (op) {
      const right = this.parseAdditive()
      result = { type: 'BinaryOp', operator: op.value, left: result, right }
      op = this.matchOperator('&')
    }

    return result
  }

  /**
   * @description 解析加减: +, -
   */
  parseAdditive() {
    let result = this.parseMultiplicative()

    let op = this.matchOperator('+', '-')
    while (op) {
      const right = this.parseMultiplicative()
      result = { type: 'BinaryOp', operator: op.value, left: result, right }
      op = this.matchOperator('+', '-')
    }

    return result
  }

  /**
   * @description 解析乘除: *, /
   */
  parseMultiplicative() {
    let result = this.parsePower()

    let op = this.matchOperator('*', '/')
    while (op) {
      const right = this.parsePower()
      result = { type: 'BinaryOp', operator: op.value, left: result, right }
      op = this.matchOperator('*', '/')
    }

    return result
  }

  /**
   * @description 解析幂运算: ^
   */
  parsePower() {
    const left = this.parseUnary()

    // 幂运算是右结合的
    if (this.matchOperator('^')) {
      const right = this.parsePower()
      return { type: 'BinaryOp', operator: '^', left, right }
    }

    return left
  }

  /**
   * @description 解析一元运算: -
   */
  parseUnary() {
    if (this.matchOperator('-')) {
      const operand = this.parseUnary()
      return { type: 'UnaryOp', operator: '-', operand }
    }

    if (this.matchOperator('+')) {
      return this.parseUnary()
    }

    return this.parsePrimary()
  }

  /**
   * @description 解析基础元素: 数字、字符串、单元格引用、函数调用、括号
   */
  parsePrimary() {
    const token = this.peek()

    // 数字
    if (this.match(TokenType.NUMBER)) {
      return { type: 'Literal', value: token.value }
    }

    // 字符串
    if (this.match(TokenType.STRING)) {
      return { type: 'Literal', value: token.value }
    }

    // 单元格引用
    if (this.match(TokenType.CELL_REF)) {
      const ref = parseRef(token.value)
      if (!ref) {
        throw new Error(`无效的单元格引用: ${token.value}`)
      }
      return { type: 'CellRef', ref }
    }

    // 范围引用
    if (this.match(TokenType.RANGE_REF)) {
      const ref = parseRange(token.value)
      if (!ref) {
        throw new Error(`无效的范围引用: ${token.value}`)
      }
      return { type: 'RangeRef', ref }
    }

    // 函数调用
    if (this.match(TokenType.FUNCTION)) {
      const name = token.value
      this.expect(TokenType.LPAREN, `函数 ${name} 后期望 '('`)

      const args = []

      // 解析参数
      if (!this.check(TokenType.RPAREN)) {
        do {
          args.push(this.parseExpression())
        } while (this.match(TokenType.COMMA))
      }

      this.expect(TokenType.RPAREN, `函数 ${name} 缺少 ')'`)

      return { type: 'FunctionCall', name, args }
    }

    // 括号表达式
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression()
      this.expect(TokenType.RPAREN, `缺少 ')'`)

      return expr
    }

    throw new Error(`解析错误: 意外的 token "${token.value || token.type}"`)
  }
}

export default Parser
