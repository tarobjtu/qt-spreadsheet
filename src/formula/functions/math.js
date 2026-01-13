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

  // CEILING - 向上取整到指定倍数
  registerFunction(
    'CEILING',
    (args) => {
      const [value, significance = 1] = args
      if (typeof value !== 'number' || typeof significance !== 'number') {
        return FormulaError.VALUE
      }
      if (significance === 0) return 0
      return Math.ceil(value / significance) * significance
    },
    1,
    2
  )

  // FLOOR - 向下取整到指定倍数
  registerFunction(
    'FLOOR',
    (args) => {
      const [value, significance = 1] = args
      if (typeof value !== 'number' || typeof significance !== 'number') {
        return FormulaError.VALUE
      }
      if (significance === 0) return 0
      return Math.floor(value / significance) * significance
    },
    1,
    2
  )

  // SIGN - 符号函数
  registerFunction(
    'SIGN',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') return FormulaError.VALUE
      if (value > 0) return 1
      if (value < 0) return -1
      return 0
    },
    1,
    1
  )

  // LOG - 对数
  registerFunction(
    'LOG',
    (args) => {
      const [value, base = 10] = args
      if (typeof value !== 'number' || typeof base !== 'number') {
        return FormulaError.VALUE
      }
      if (value <= 0 || base <= 0 || base === 1) {
        return FormulaError.NUM
      }
      return Math.log(value) / Math.log(base)
    },
    1,
    2
  )

  // LOG10 - 以10为底的对数
  registerFunction(
    'LOG10',
    (args) => {
      const [value] = args
      if (typeof value !== 'number' || value <= 0) {
        return FormulaError.NUM
      }
      return Math.log10(value)
    },
    1,
    1
  )

  // LN - 自然对数
  registerFunction(
    'LN',
    (args) => {
      const [value] = args
      if (typeof value !== 'number' || value <= 0) {
        return FormulaError.NUM
      }
      return Math.log(value)
    },
    1,
    1
  )

  // EXP - e的幂
  registerFunction(
    'EXP',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') return FormulaError.VALUE
      return Math.exp(value)
    },
    1,
    1
  )

  // FACT - 阶乘
  registerFunction(
    'FACT',
    (args) => {
      const [value] = args
      if (typeof value !== 'number' || value < 0) return FormulaError.NUM
      const n = Math.floor(value)
      if (n === 0 || n === 1) return 1
      let result = 1
      for (let i = 2; i <= n; i += 1) {
        result *= i
      }
      return result
    },
    1,
    1
  )

  // PRODUCT - 乘积
  registerFunction(
    'PRODUCT',
    (args) => {
      const numbers = flattenNumbers(args)
      if (numbers.length === 0) return 0
      return numbers.reduce((prod, val) => prod * val, 1)
    },
    1,
    255
  )

  // QUOTIENT - 整除
  registerFunction(
    'QUOTIENT',
    (args) => {
      const [numerator, denominator] = args
      if (typeof numerator !== 'number' || typeof denominator !== 'number') {
        return FormulaError.VALUE
      }
      if (denominator === 0) return FormulaError.DIV0
      return Math.trunc(numerator / denominator)
    },
    2,
    2
  )

  // GCD - 最大公约数
  registerFunction(
    'GCD',
    (args) => {
      const numbers = flattenNumbers(args).map((n) => Math.abs(Math.floor(n)))
      if (numbers.length === 0) return 0

      const gcdTwo = (a, b) => {
        let x = a
        let y = b
        while (y !== 0) {
          const t = y
          y = x % y
          x = t
        }
        return x
      }

      return numbers.reduce((acc, n) => gcdTwo(acc, n))
    },
    1,
    255
  )

  // LCM - 最小公倍数
  registerFunction(
    'LCM',
    (args) => {
      const numbers = flattenNumbers(args).map((n) => Math.abs(Math.floor(n)))
      if (numbers.length === 0) return 0

      const gcdTwo = (a, b) => {
        let x = a
        let y = b
        while (y !== 0) {
          const t = y
          y = x % y
          x = t
        }
        return x
      }

      const lcmTwo = (a, b) => (a * b) / gcdTwo(a, b)

      return numbers.reduce((acc, n) => lcmTwo(acc, n))
    },
    1,
    255
  )

  // TRUNC - 截断小数
  registerFunction(
    'TRUNC',
    (args) => {
      const [value, numDigits = 0] = args
      if (typeof value !== 'number') return FormulaError.VALUE
      const factor = 10 ** numDigits
      return Math.trunc(value * factor) / factor
    },
    1,
    2
  )

  // EVEN - 向上取偶数
  registerFunction(
    'EVEN',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') return FormulaError.VALUE
      const ceil = Math.ceil(Math.abs(value))
      const result = ceil % 2 === 0 ? ceil : ceil + 1
      return value >= 0 ? result : -result
    },
    1,
    1
  )

  // ODD - 向上取奇数
  registerFunction(
    'ODD',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') return FormulaError.VALUE
      const ceil = Math.ceil(Math.abs(value))
      const result = ceil % 2 === 1 ? ceil : ceil + 1
      return value >= 0 ? result : -result
    },
    1,
    1
  )

  // RADIANS - 角度转弧度
  registerFunction(
    'RADIANS',
    (args) => {
      const [degrees] = args
      if (typeof degrees !== 'number') return FormulaError.VALUE
      return (degrees * Math.PI) / 180
    },
    1,
    1
  )

  // DEGREES - 弧度转角度
  registerFunction(
    'DEGREES',
    (args) => {
      const [radians] = args
      if (typeof radians !== 'number') return FormulaError.VALUE
      return (radians * 180) / Math.PI
    },
    1,
    1
  )

  // SIN, COS, TAN
  registerFunction(
    'SIN',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') return FormulaError.VALUE
      return Math.sin(value)
    },
    1,
    1
  )

  registerFunction(
    'COS',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') return FormulaError.VALUE
      return Math.cos(value)
    },
    1,
    1
  )

  registerFunction(
    'TAN',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') return FormulaError.VALUE
      return Math.tan(value)
    },
    1,
    1
  )

  // ASIN, ACOS, ATAN
  registerFunction(
    'ASIN',
    (args) => {
      const [value] = args
      if (typeof value !== 'number' || value < -1 || value > 1) return FormulaError.NUM
      return Math.asin(value)
    },
    1,
    1
  )

  registerFunction(
    'ACOS',
    (args) => {
      const [value] = args
      if (typeof value !== 'number' || value < -1 || value > 1) return FormulaError.NUM
      return Math.acos(value)
    },
    1,
    1
  )

  registerFunction(
    'ATAN',
    (args) => {
      const [value] = args
      if (typeof value !== 'number') return FormulaError.VALUE
      return Math.atan(value)
    },
    1,
    1
  )

  // ATAN2
  registerFunction(
    'ATAN2',
    (args) => {
      const [x, y] = args
      if (typeof x !== 'number' || typeof y !== 'number') return FormulaError.VALUE
      return Math.atan2(y, x)
    },
    2,
    2
  )
}
