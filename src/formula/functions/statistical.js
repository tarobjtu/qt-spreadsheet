/**
 * @description 统计函数
 * COUNTIF, SUMIF, AVERAGEIF, COUNTBLANK, MEDIAN, STDEV, VAR
 */

import { FormulaError } from '../errors'

/**
 * @description 将参数展平为数字数组
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
  }

  args.forEach(flatten)
  return result
}

/**
 * @description 将二维数组展平为一维
 */
function flatten2D(arr) {
  if (!Array.isArray(arr)) return [arr]
  const result = []
  arr.forEach((row) => {
    if (Array.isArray(row)) {
      row.forEach((cell) => result.push(cell))
    } else {
      result.push(row)
    }
  })
  return result
}

/**
 * @description 检查值是否匹配条件
 * @param {*} value - 要检查的值
 * @param {*} criteria - 条件 (支持 ">5", "<10", "=abc", "<>0", "abc*" 等)
 */
function matchesCriteria(value, criteria) {
  if (criteria === null || criteria === undefined) return false

  const criteriaStr = String(criteria)

  // 比较运算符
  if (criteriaStr.startsWith('>=')) {
    const num = Number(criteriaStr.slice(2))
    return Number(value) >= num
  }
  if (criteriaStr.startsWith('<=')) {
    const num = Number(criteriaStr.slice(2))
    return Number(value) <= num
  }
  if (criteriaStr.startsWith('<>')) {
    const compare = criteriaStr.slice(2)
    if (!Number.isNaN(Number(compare))) {
      return Number(value) !== Number(compare)
    }
    return String(value).toLowerCase() !== compare.toLowerCase()
  }
  if (criteriaStr.startsWith('>')) {
    const num = Number(criteriaStr.slice(1))
    return Number(value) > num
  }
  if (criteriaStr.startsWith('<')) {
    const num = Number(criteriaStr.slice(1))
    return Number(value) < num
  }
  if (criteriaStr.startsWith('=')) {
    const compare = criteriaStr.slice(1)
    if (!Number.isNaN(Number(compare))) {
      return Number(value) === Number(compare)
    }
    return String(value).toLowerCase() === compare.toLowerCase()
  }

  // 通配符匹配
  if (criteriaStr.includes('*') || criteriaStr.includes('?')) {
    const regex = new RegExp(
      '^' +
        criteriaStr
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.')
          .replace(/[.+^${}()|[\]\\]/g, '\\$&') +
        '$',
      'i'
    )
    return regex.test(String(value))
  }

  // 直接比较
  if (!Number.isNaN(Number(criteria))) {
    return Number(value) === Number(criteria)
  }
  return String(value).toLowerCase() === criteriaStr.toLowerCase()
}

/**
 * @description 注册所有统计函数
 * @param {Function} registerFunction - 注册函数的方法
 */
export default function registerStatisticalFunctions(registerFunction) {
  // COUNTIF - 条件计数
  registerFunction(
    'COUNTIF',
    (args) => {
      const [range, criteria] = args
      const values = flatten2D(range)
      return values.filter((v) => matchesCriteria(v, criteria)).length
    },
    2,
    2
  )

  // SUMIF - 条件求和
  registerFunction(
    'SUMIF',
    (args) => {
      const [range, criteria, sumRange] = args
      const values = flatten2D(range)
      const sumValues = sumRange ? flatten2D(sumRange) : values

      let sum = 0
      values.forEach((v, i) => {
        if (matchesCriteria(v, criteria)) {
          const sumVal = sumValues[i]
          if (typeof sumVal === 'number') {
            sum += sumVal
          } else if (typeof sumVal === 'string' && !Number.isNaN(Number(sumVal))) {
            sum += Number(sumVal)
          }
        }
      })
      return sum
    },
    2,
    3
  )

  // AVERAGEIF - 条件平均值
  registerFunction(
    'AVERAGEIF',
    (args) => {
      const [range, criteria, avgRange] = args
      const values = flatten2D(range)
      const avgValues = avgRange ? flatten2D(avgRange) : values

      let sum = 0
      let count = 0
      values.forEach((v, i) => {
        if (matchesCriteria(v, criteria)) {
          const avgVal = avgValues[i]
          if (typeof avgVal === 'number') {
            sum += avgVal
            count += 1
          } else if (typeof avgVal === 'string' && !Number.isNaN(Number(avgVal))) {
            sum += Number(avgVal)
            count += 1
          }
        }
      })

      if (count === 0) return FormulaError.DIV0
      return sum / count
    },
    2,
    3
  )

  // COUNTBLANK - 计数空单元格
  registerFunction(
    'COUNTBLANK',
    (args) => {
      const [range] = args
      const values = flatten2D(range)
      return values.filter((v) => v === '' || v === null || v === undefined).length
    },
    1,
    1
  )

  // MEDIAN - 中位数
  registerFunction(
    'MEDIAN',
    (args) => {
      const numbers = flattenNumbers(args)
      if (numbers.length === 0) return FormulaError.NUM

      numbers.sort((a, b) => a - b)
      const mid = Math.floor(numbers.length / 2)

      if (numbers.length % 2 === 0) {
        return (numbers[mid - 1] + numbers[mid]) / 2
      }
      return numbers[mid]
    },
    1,
    255
  )

  // STDEV - 标准差 (样本)
  registerFunction(
    'STDEV',
    (args) => {
      const numbers = flattenNumbers(args)
      if (numbers.length < 2) return FormulaError.DIV0

      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
      const squaredDiffs = numbers.map((n) => (n - mean) ** 2)
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (numbers.length - 1)

      return Math.sqrt(variance)
    },
    1,
    255
  )

  // STDEVP - 标准差 (总体)
  registerFunction(
    'STDEVP',
    (args) => {
      const numbers = flattenNumbers(args)
      if (numbers.length === 0) return FormulaError.DIV0

      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
      const squaredDiffs = numbers.map((n) => (n - mean) ** 2)
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length

      return Math.sqrt(variance)
    },
    1,
    255
  )

  // VAR - 方差 (样本)
  registerFunction(
    'VAR',
    (args) => {
      const numbers = flattenNumbers(args)
      if (numbers.length < 2) return FormulaError.DIV0

      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
      const squaredDiffs = numbers.map((n) => (n - mean) ** 2)

      return squaredDiffs.reduce((a, b) => a + b, 0) / (numbers.length - 1)
    },
    1,
    255
  )

  // VARP - 方差 (总体)
  registerFunction(
    'VARP',
    (args) => {
      const numbers = flattenNumbers(args)
      if (numbers.length === 0) return FormulaError.DIV0

      const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
      const squaredDiffs = numbers.map((n) => (n - mean) ** 2)

      return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length
    },
    1,
    255
  )

  // LARGE - 第 k 个最大值
  registerFunction(
    'LARGE',
    (args) => {
      const [range, k] = args
      const numbers = flattenNumbers([range])
      if (numbers.length === 0 || k < 1 || k > numbers.length) {
        return FormulaError.NUM
      }
      numbers.sort((a, b) => b - a)
      return numbers[k - 1]
    },
    2,
    2
  )

  // SMALL - 第 k 个最小值
  registerFunction(
    'SMALL',
    (args) => {
      const [range, k] = args
      const numbers = flattenNumbers([range])
      if (numbers.length === 0 || k < 1 || k > numbers.length) {
        return FormulaError.NUM
      }
      numbers.sort((a, b) => a - b)
      return numbers[k - 1]
    },
    2,
    2
  )
}
