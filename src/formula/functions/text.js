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

  // CHAR - ASCII 码转字符
  registerFunction(
    'CHAR',
    (args) => {
      const [num] = args
      if (typeof num !== 'number' || num < 1 || num > 255) {
        return FormulaError.VALUE
      }
      return String.fromCharCode(num)
    },
    1,
    1
  )

  // CODE - 字符转 ASCII 码
  registerFunction(
    'CODE',
    (args) => {
      const [text] = args
      const str = String(text ?? '')
      if (str.length === 0) return FormulaError.VALUE
      return str.charCodeAt(0)
    },
    1,
    1
  )

  // CLEAN - 删除不可打印字符
  registerFunction(
    'CLEAN',
    (args) => {
      const [text] = args
      // 删除 ASCII 0-31 的控制字符
      // eslint-disable-next-line no-control-regex
      return String(text ?? '').replace(/[\x00-\x1F]/g, '')
    },
    1,
    1
  )

  // T - 如果是文本则返回，否则返回空字符串
  registerFunction(
    'T',
    (args) => {
      const [value] = args
      if (typeof value === 'string') return value
      return ''
    },
    1,
    1
  )

  // N - 转换为数字
  registerFunction(
    'N',
    (args) => {
      const [value] = args
      if (typeof value === 'number') return value
      if (typeof value === 'boolean') return value ? 1 : 0
      if (typeof value === 'string') {
        const num = Number(value)
        return Number.isNaN(num) ? 0 : num
      }
      return 0
    },
    1,
    1
  )

  // TEXTJOIN - 用分隔符连接文本
  registerFunction(
    'TEXTJOIN',
    (args) => {
      const [delimiter, ignoreEmpty, ...texts] = args
      const delimiterStr = String(delimiter ?? '')

      const flatten = (arr) => {
        const result = []
        const process = (item) => {
          if (Array.isArray(item)) {
            item.forEach(process)
          } else {
            result.push(item)
          }
        }
        arr.forEach(process)
        return result
      }

      let values = flatten(texts)
      if (ignoreEmpty) {
        values = values.filter((v) => v !== '' && v !== null && v !== undefined)
      }

      return values.map((v) => String(v ?? '')).join(delimiterStr)
    },
    3,
    255
  )

  // NUMBERVALUE - 将文本转换为数字（支持区域设置）
  registerFunction(
    'NUMBERVALUE',
    (args) => {
      const [text, decimalSep = '.', groupSep = ','] = args
      let str = String(text ?? '').trim()

      // 处理百分号
      const isPercent = str.endsWith('%')
      if (isPercent) {
        str = str.slice(0, -1)
      }

      // 替换分隔符
      str = str.split(String(groupSep)).join('')
      str = str.replace(String(decimalSep), '.')

      const num = parseFloat(str)
      if (Number.isNaN(num)) return FormulaError.VALUE

      return isPercent ? num / 100 : num
    },
    1,
    3
  )

  // FIXED - 格式化数字为固定小数位的文本
  registerFunction(
    'FIXED',
    (args) => {
      const [number, decimals = 2, noCommas = false] = args
      if (typeof number !== 'number') return FormulaError.VALUE

      const fixed = number.toFixed(decimals < 0 ? 0 : decimals)

      if (noCommas) return fixed

      // 添加千位分隔符
      const parts = fixed.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return parts.join('.')
    },
    1,
    3
  )

  // DOLLAR - 格式化为货币文本
  registerFunction(
    'DOLLAR',
    (args) => {
      const [number, decimals = 2] = args
      if (typeof number !== 'number') return FormulaError.VALUE

      const fixed = Math.abs(number).toFixed(decimals < 0 ? 0 : decimals)
      const parts = fixed.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      const formatted = '$' + parts.join('.')

      return number < 0 ? '(' + formatted + ')' : formatted
    },
    1,
    2
  )

  // UNICHAR - Unicode 码点转字符
  registerFunction(
    'UNICHAR',
    (args) => {
      const [num] = args
      if (typeof num !== 'number' || num < 1) return FormulaError.VALUE
      try {
        return String.fromCodePoint(num)
      } catch (e) {
        return FormulaError.VALUE
      }
    },
    1,
    1
  )

  // UNICODE - 字符转 Unicode 码点
  registerFunction(
    'UNICODE',
    (args) => {
      const [text] = args
      const str = String(text ?? '')
      if (str.length === 0) return FormulaError.VALUE
      return str.codePointAt(0)
    },
    1,
    1
  )
}
