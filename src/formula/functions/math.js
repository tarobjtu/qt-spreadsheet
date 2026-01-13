/**
 * @description 数学函数
 */

import { FormulaError } from '../errors'

/**
 * @description 将参数展平为数字数组
 * @param {Array} args
 * @returns {Array<number>}
 */
function flattenNumbers(args) {
  const result = []

  const flatten = (item) => {
    if (Array.isArray(item)) {
      item.forEach(flatten)
    } else if (typeof item === 'number' && !Number.isNaN(item)) {
      result.push(item)
    } else if (typeof item === 'string' && item !== '' && !Number.isNaN(Number(item))) {
      result.push(Number(item))
    }
    // 忽略空字符串、布尔值和其他非数字类型
  }

  args.forEach(flatten)
  return result
}

/**
 * @description 将参数展平为所有值数组（用于 COUNT 等）
 * @param {Array} args
 * @returns {Array}
 */
function flattenAll(args) {
  const result = []

  const flatten = (item) => {
    if (Array.isArray(item)) {
      item.forEach(flatten)
    } else {
      result.push(item)
    }
  }

  args.forEach(flatten)
  return result
}

/**
 * @description 注册所有数学函数
 * @param {Function} registerFunction - 注册函数的方法
 */
export default function registerMathFunctions(registerFunction) {
  // SUM - 求和
  registerFunction(
    'SUM',
    (args) => {
      const numbers = flattenNumbers(args)
      return numbers.reduce((sum, val) => sum + val, 0)
    },
    1,
    255
  )

  // AVERAGE - 平均值
  registerFunction(
    'AVERAGE',
    (args) => {
      const numbers = flattenNumbers(args)
      if (numbers.length === 0) {
        return FormulaError.DIV0
      }
      return numbers.reduce((sum, val) => sum + val, 0) / numbers.length
    },
    1,
    255
  )

  // MAX - 最大值
  registerFunction(
    'MAX',
    (args) => {
      const numbers = flattenNumbers(args)
      if (numbers.length === 0) {
        return 0
      }
      return Math.max(...numbers)
    },
    1,
    255
  )

  // MIN - 最小值
  registerFunction(
    'MIN',
    (args) => {
      const numbers = flattenNumbers(args)
      if (numbers.length === 0) {
        return 0
      }
      return Math.min(...numbers)
    },
    1,
    255
  )

  // COUNT - 计数（数字）
  registerFunction(
    'COUNT',
    (args) => {
      const numbers = flattenNumbers(args)
      return numbers.length
    },
    1,
    255
  )

  // COUNTA - 计数（非空）
  registerFunction(
    'COUNTA',
    (args) => {
      const all = flattenAll(args)
      return all.filter((v) => v !== '' && v !== null && v !== undefined).length
    },
    1,
    255
  )

  // ABS - 绝对值
  registerFunction(
    'ABS',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') {
        return FormulaError.VALUE
      }
      return Math.abs(value)
    },
    1,
    1
  )

  // ROUND - 四舍五入
  registerFunction(
    'ROUND',
    (args) => {
      const [value, decimals = 0] = args
      if (typeof value !== 'number') {
        return FormulaError.VALUE
      }
      const factor = 10 ** decimals
      return Math.round(value * factor) / factor
    },
    1,
    2
  )

  // ROUNDUP - 向上舍入
  registerFunction(
    'ROUNDUP',
    (args) => {
      const [value, decimals = 0] = args
      if (typeof value !== 'number') {
        return FormulaError.VALUE
      }
      const factor = 10 ** decimals
      return Math.ceil(value * factor) / factor
    },
    1,
    2
  )

  // ROUNDDOWN - 向下舍入
  registerFunction(
    'ROUNDDOWN',
    (args) => {
      const [value, decimals = 0] = args
      if (typeof value !== 'number') {
        return FormulaError.VALUE
      }
      const factor = 10 ** decimals
      return Math.floor(value * factor) / factor
    },
    1,
    2
  )

  // INT - 取整
  registerFunction(
    'INT',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') {
        return FormulaError.VALUE
      }
      return Math.floor(value)
    },
    1,
    1
  )

  // MOD - 取余
  registerFunction(
    'MOD',
    (args) => {
      const [dividend, divisor] = args
      if (typeof dividend !== 'number' || typeof divisor !== 'number') {
        return FormulaError.VALUE
      }
      if (divisor === 0) {
        return FormulaError.DIV0
      }
      return dividend % divisor
    },
    2,
    2
  )

  // POWER - 幂运算
  registerFunction(
    'POWER',
    (args) => {
      const [base, exponent] = args
      if (typeof base !== 'number' || typeof exponent !== 'number') {
        return FormulaError.VALUE
      }
      return base ** exponent
    },
    2,
    2
  )

  // SQRT - 平方根
  registerFunction(
    'SQRT',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') {
        return FormulaError.VALUE
      }
      if (value < 0) {
        return FormulaError.NUM
      }
      return Math.sqrt(value)
    },
    1,
    1
  )

  // PI - 圆周率
  registerFunction('PI', () => Math.PI, 0, 0)

  // RAND - 随机数 (0-1)
  registerFunction('RAND', () => Math.random(), 0, 0)

  // RANDBETWEEN - 范围随机整数
  registerFunction(
    'RANDBETWEEN',
    (args) => {
      const [min, max] = args
      if (typeof min !== 'number' || typeof max !== 'number') {
        return FormulaError.VALUE
      }
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    2,
    2
  )
}
