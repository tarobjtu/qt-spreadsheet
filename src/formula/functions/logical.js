/**
 * @description 逻辑函数
 */

import { FormulaError } from '../errors'

/**
 * @description 将参数展平
 * @param {Array} args
 * @returns {Array}
 */
function flatten(args) {
  const result = []

  const doFlatten = (item) => {
    if (Array.isArray(item)) {
      item.forEach(doFlatten)
    } else {
      result.push(item)
    }
  }

  args.forEach(doFlatten)
  return result
}

/**
 * @description 注册所有逻辑函数
 * @param {Function} registerFunction - 注册函数的方法
 */
export default function registerLogicalFunctions(registerFunction) {
  // IF - 条件判断
  registerFunction(
    'IF',
    (args) => {
      const [condition, trueValue, falseValue = false] = args
      return condition ? trueValue : falseValue
    },
    2,
    3
  )

  // AND - 逻辑与
  registerFunction(
    'AND',
    (args) => {
      const values = flatten(args)
      if (values.length === 0) {
        return FormulaError.VALUE
      }
      return values.every((v) => Boolean(v))
    },
    1,
    255
  )

  // OR - 逻辑或
  registerFunction(
    'OR',
    (args) => {
      const values = flatten(args)
      if (values.length === 0) {
        return FormulaError.VALUE
      }
      return values.some((v) => Boolean(v))
    },
    1,
    255
  )

  // NOT - 逻辑非
  registerFunction(
    'NOT',
    (args) => {
      const [value] = args
      return !value
    },
    1,
    1
  )

  // TRUE - 返回真
  registerFunction('TRUE', () => true, 0, 0)

  // FALSE - 返回假
  registerFunction('FALSE', () => false, 0, 0)

  // IFERROR - 错误处理
  registerFunction(
    'IFERROR',
    (args) => {
      const [value, valueIfError] = args

      // 检查是否为错误值
      if (typeof value === 'string' && value.startsWith('#') && value.endsWith('!')) {
        return valueIfError
      }

      return value
    },
    2,
    2
  )

  // IFNA - NA错误处理
  registerFunction(
    'IFNA',
    (args) => {
      const [value, valueIfNA] = args

      if (value === FormulaError.NA) {
        return valueIfNA
      }

      return value
    },
    2,
    2
  )

  // SWITCH - 多条件选择 (Excel 2016+)
  registerFunction(
    'SWITCH',
    (args) => {
      if (args.length < 3) {
        return FormulaError.VALUE
      }

      const [expression, ...rest] = args
      const hasDefault = rest.length % 2 === 1
      const pairs = hasDefault ? rest.slice(0, -1) : rest
      const defaultValue = hasDefault ? rest[rest.length - 1] : FormulaError.NA

      for (let i = 0; i < pairs.length; i += 2) {
        if (expression === pairs[i]) {
          return pairs[i + 1]
        }
      }

      return defaultValue
    },
    3,
    255
  )

  // CHOOSE - 索引选择
  registerFunction(
    'CHOOSE',
    (args) => {
      const [indexNum, ...values] = args

      if (typeof indexNum !== 'number') {
        return FormulaError.VALUE
      }

      const index = Math.floor(indexNum)

      if (index < 1 || index > values.length) {
        return FormulaError.VALUE
      }

      return values[index - 1]
    },
    2,
    255
  )

  // IFS - 多条件判断 (Excel 2016+)
  registerFunction(
    'IFS',
    (args) => {
      if (args.length < 2 || args.length % 2 !== 0) {
        return FormulaError.VALUE
      }

      for (let i = 0; i < args.length; i += 2) {
        const condition = args[i]
        const value = args[i + 1]

        if (condition) {
          return value
        }
      }

      return FormulaError.NA
    },
    2,
    255
  )

  // XOR - 异或
  registerFunction(
    'XOR',
    (args) => {
      const values = flatten(args)
      if (values.length === 0) {
        return FormulaError.VALUE
      }

      let trueCount = 0
      values.forEach((v) => {
        if (v) {
          trueCount += 1
        }
      })

      return trueCount % 2 === 1
    },
    1,
    255
  )
}
