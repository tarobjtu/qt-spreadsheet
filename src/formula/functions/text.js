/**
 * @description 文本函数
 */

import { FormulaError } from '../errors'

/**
 * @description 注册所有文本函数
 * @param {Function} registerFunction - 注册函数的方法
 */
export default function registerTextFunctions(registerFunction) {
  // CONCATENATE - 字符串连接
  registerFunction(
    'CONCATENATE',
    (args) =>
      args
        .map((v) => {
          if (Array.isArray(v)) {
            return v.flat(Infinity).join('')
          }
          return String(v ?? '')
        })
        .join(''),
    1,
    255
  )

  // CONCAT - 字符串连接 (Excel 2016+)
  registerFunction(
    'CONCAT',
    (args) =>
      args
        .map((v) => {
          if (Array.isArray(v)) {
            return v.flat(Infinity).join('')
          }
          return String(v ?? '')
        })
        .join(''),
    1,
    255
  )

  // LEN - 字符串长度
  registerFunction(
    'LEN',
    (args) => {
      const [text] = args
      return String(text ?? '').length
    },
    1,
    1
  )

  // LEFT - 左侧截取
  registerFunction(
    'LEFT',
    (args) => {
      const [text, numChars = 1] = args
      if (typeof numChars !== 'number' || numChars < 0) {
        return FormulaError.VALUE
      }
      return String(text ?? '').substring(0, numChars)
    },
    1,
    2
  )

  // RIGHT - 右侧截取
  registerFunction(
    'RIGHT',
    (args) => {
      const [text, numChars = 1] = args
      if (typeof numChars !== 'number' || numChars < 0) {
        return FormulaError.VALUE
      }
      const str = String(text ?? '')
      return str.substring(str.length - numChars)
    },
    1,
    2
  )

  // MID - 中间截取
  registerFunction(
    'MID',
    (args) => {
      const [text, startNum, numChars] = args
      if (typeof startNum !== 'number' || typeof numChars !== 'number') {
        return FormulaError.VALUE
      }
      if (startNum < 1 || numChars < 0) {
        return FormulaError.VALUE
      }
      return String(text ?? '').substring(startNum - 1, startNum - 1 + numChars)
    },
    3,
    3
  )

  // TRIM - 去除首尾空白
  registerFunction(
    'TRIM',
    (args) => {
      const [text] = args
      return String(text ?? '').trim()
    },
    1,
    1
  )

  // UPPER - 转大写
  registerFunction(
    'UPPER',
    (args) => {
      const [text] = args
      return String(text ?? '').toUpperCase()
    },
    1,
    1
  )

  // LOWER - 转小写
  registerFunction(
    'LOWER',
    (args) => {
      const [text] = args
      return String(text ?? '').toLowerCase()
    },
    1,
    1
  )

  // PROPER - 首字母大写
  registerFunction(
    'PROPER',
    (args) => {
      const [text] = args
      return String(text ?? '').replace(/\b\w/g, (c) => c.toUpperCase())
    },
    1,
    1
  )

  // FIND - 查找子串位置（区分大小写）
  registerFunction(
    'FIND',
    (args) => {
      const [findText, withinText, startNum = 1] = args
      if (typeof startNum !== 'number' || startNum < 1) {
        return FormulaError.VALUE
      }
      const str = String(withinText ?? '')
      const find = String(findText ?? '')
      const index = str.indexOf(find, startNum - 1)
      if (index === -1) {
        return FormulaError.VALUE
      }
      return index + 1
    },
    2,
    3
  )

  // SEARCH - 查找子串位置（不区分大小写）
  registerFunction(
    'SEARCH',
    (args) => {
      const [findText, withinText, startNum = 1] = args
      if (typeof startNum !== 'number' || startNum < 1) {
        return FormulaError.VALUE
      }
      const str = String(withinText ?? '').toLowerCase()
      const find = String(findText ?? '').toLowerCase()
      const index = str.indexOf(find, startNum - 1)
      if (index === -1) {
        return FormulaError.VALUE
      }
      return index + 1
    },
    2,
    3
  )

  // REPLACE - 替换指定位置字符
  registerFunction(
    'REPLACE',
    (args) => {
      const [oldText, startNum, numChars, newText] = args
      if (typeof startNum !== 'number' || typeof numChars !== 'number') {
        return FormulaError.VALUE
      }
      const str = String(oldText ?? '')
      const before = str.substring(0, startNum - 1)
      const after = str.substring(startNum - 1 + numChars)
      return before + String(newText ?? '') + after
    },
    4,
    4
  )

  // SUBSTITUTE - 替换指定文本
  registerFunction(
    'SUBSTITUTE',
    (args) => {
      const [text, oldText, newText, instanceNum] = args
      const str = String(text ?? '')
      const old = String(oldText ?? '')
      const replacement = String(newText ?? '')

      if (old === '') {
        return str
      }

      if (instanceNum === undefined) {
        // 替换所有
        return str.split(old).join(replacement)
      }

      if (typeof instanceNum !== 'number' || instanceNum < 1) {
        return FormulaError.VALUE
      }

      // 替换指定位置
      let count = 0
      let result = ''
      let lastIndex = 0
      let index = str.indexOf(old)

      while (index !== -1) {
        count += 1
        if (count === instanceNum) {
          result += str.substring(lastIndex, index) + replacement
          lastIndex = index + old.length
          break
        }
        index = str.indexOf(old, index + 1)
      }

      result += str.substring(lastIndex)
      return result
    },
    3,
    4
  )

  // REPT - 重复文本
  registerFunction(
    'REPT',
    (args) => {
      const [text, times] = args
      if (typeof times !== 'number' || times < 0) {
        return FormulaError.VALUE
      }
      return String(text ?? '').repeat(Math.floor(times))
    },
    2,
    2
  )

  // TEXT - 格式化数字为文本
  registerFunction(
    'TEXT',
    (args) => {
      const [value, formatText] = args

      if (value === null || value === undefined) {
        return ''
      }

      // 简单实现，支持基本格式
      const format = String(formatText ?? '')

      if (typeof value === 'number') {
        // 数字格式
        if (format.includes('%')) {
          return `${(value * 100).toFixed(format.split('.')[1]?.length || 0)}%`
        }
        if (format.includes('.')) {
          const decimals = format.split('.')[1]?.replace(/[^0#]/g, '').length || 0
          return value.toFixed(decimals)
        }
        return String(value)
      }

      return String(value)
    },
    2,
    2
  )

  // VALUE - 文本转数字
  registerFunction(
    'VALUE',
    (args) => {
      const [text] = args
      const str = String(text ?? '').trim()

      // 处理百分比
      if (str.endsWith('%')) {
        const num = parseFloat(str.slice(0, -1))
        if (Number.isNaN(num)) {
          return FormulaError.VALUE
        }
        return num / 100
      }

      const num = parseFloat(str)
      if (Number.isNaN(num)) {
        return FormulaError.VALUE
      }
      return num
    },
    1,
    1
  )

  // EXACT - 精确比较
  registerFunction(
    'EXACT',
    (args) => {
      const [text1, text2] = args
      return String(text1 ?? '') === String(text2 ?? '')
    },
    2,
    2
  )
}
