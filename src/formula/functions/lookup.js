/**
 * @description 查找和引用函数
 * VLOOKUP, HLOOKUP, INDEX, MATCH, CHOOSE, ROW, COLUMN, ROWS, COLUMNS
 */

import { FormulaError } from '../errors'

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
 * @description 比较两个值是否匹配
 */
function valuesMatch(a, b, exactMatch = true) {
  if (exactMatch) {
    if (typeof a === 'string' && typeof b === 'string') {
      return a.toLowerCase() === b.toLowerCase()
    }
    return a === b
  }

  // 近似匹配 - 找到小于等于目标值的最大值
  if (typeof a === 'number' && typeof b === 'number') {
    return a <= b
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLowerCase() <= b.toLowerCase()
  }
  return false
}

/**
 * @description 注册所有查找函数
 * @param {Function} registerFunction - 注册函数的方法
 */
export default function registerLookupFunctions(registerFunction) {
  // VLOOKUP - 垂直查找
  registerFunction(
    'VLOOKUP',
    (args) => {
      const [lookupValue, tableArray, colIndex, rangeLookup = true] = args

      if (!Array.isArray(tableArray) || tableArray.length === 0) {
        return FormulaError.REF
      }

      const exactMatch = rangeLookup === false || rangeLookup === 0

      // 在第一列中查找
      let foundRowIndex = -1

      if (exactMatch) {
        // 精确匹配
        for (let i = 0; i < tableArray.length; i += 1) {
          const row = tableArray[i]
          const firstCol = Array.isArray(row) ? row[0] : row
          if (valuesMatch(firstCol, lookupValue, true)) {
            foundRowIndex = i
            break
          }
        }
      } else {
        // 近似匹配 - 假设数据已排序，找到最接近的值
        for (let i = 0; i < tableArray.length; i += 1) {
          const row = tableArray[i]
          const firstCol = Array.isArray(row) ? row[0] : row
          if (valuesMatch(firstCol, lookupValue, false)) {
            foundRowIndex = i
          } else if (foundRowIndex !== -1) {
            break
          }
        }
      }

      if (foundRowIndex === -1) {
        return FormulaError.NA
      }

      const foundRow = tableArray[foundRowIndex]
      if (!Array.isArray(foundRow) || colIndex > foundRow.length || colIndex < 1) {
        return FormulaError.REF
      }

      return foundRow[colIndex - 1]
    },
    3,
    4
  )

  // HLOOKUP - 水平查找
  registerFunction(
    'HLOOKUP',
    (args) => {
      const [lookupValue, tableArray, rowIndex, rangeLookup = true] = args

      if (!Array.isArray(tableArray) || tableArray.length === 0) {
        return FormulaError.REF
      }

      const exactMatch = rangeLookup === false || rangeLookup === 0
      const firstRow = tableArray[0]

      if (!Array.isArray(firstRow)) {
        return FormulaError.REF
      }

      // 在第一行中查找
      let foundColIndex = -1

      if (exactMatch) {
        for (let i = 0; i < firstRow.length; i += 1) {
          if (valuesMatch(firstRow[i], lookupValue, true)) {
            foundColIndex = i
            break
          }
        }
      } else {
        for (let i = 0; i < firstRow.length; i += 1) {
          if (valuesMatch(firstRow[i], lookupValue, false)) {
            foundColIndex = i
          } else if (foundColIndex !== -1) {
            break
          }
        }
      }

      if (foundColIndex === -1) {
        return FormulaError.NA
      }

      if (rowIndex > tableArray.length || rowIndex < 1) {
        return FormulaError.REF
      }

      const targetRow = tableArray[rowIndex - 1]
      if (!Array.isArray(targetRow) || foundColIndex >= targetRow.length) {
        return FormulaError.REF
      }

      return targetRow[foundColIndex]
    },
    3,
    4
  )

  // INDEX - 返回指定位置的值
  registerFunction(
    'INDEX',
    (args) => {
      const [array, rowNum, colNum = 1] = args

      if (!Array.isArray(array)) {
        return array
      }

      // 一维数组
      if (!Array.isArray(array[0])) {
        if (rowNum < 1 || rowNum > array.length) {
          return FormulaError.REF
        }
        return array[rowNum - 1]
      }

      // 二维数组
      if (rowNum < 1 || rowNum > array.length) {
        return FormulaError.REF
      }

      const row = array[rowNum - 1]
      if (colNum < 1 || colNum > row.length) {
        return FormulaError.REF
      }

      return row[colNum - 1]
    },
    2,
    3
  )

  // MATCH - 查找匹配位置
  registerFunction(
    'MATCH',
    (args) => {
      const [lookupValue, lookupArray, matchType = 1] = args

      const values = flatten2D(lookupArray)

      if (matchType === 0) {
        // 精确匹配
        for (let i = 0; i < values.length; i += 1) {
          if (valuesMatch(values[i], lookupValue, true)) {
            return i + 1
          }
        }
        return FormulaError.NA
      }

      if (matchType === 1) {
        // 查找小于等于 lookupValue 的最大值（假设升序排列）
        let lastMatch = -1
        for (let i = 0; i < values.length; i += 1) {
          if (valuesMatch(values[i], lookupValue, false)) {
            lastMatch = i
          }
        }
        if (lastMatch === -1) return FormulaError.NA
        return lastMatch + 1
      }

      if (matchType === -1) {
        // 查找大于等于 lookupValue 的最小值（假设降序排列）
        for (let i = 0; i < values.length; i += 1) {
          const val = values[i]
          if (typeof val === 'number' && val >= lookupValue) {
            return i + 1
          }
        }
        return FormulaError.NA
      }

      return FormulaError.NA
    },
    2,
    3
  )

  // CHOOSE - 根据索引选择值
  registerFunction(
    'CHOOSE',
    (args) => {
      const [indexNum, ...values] = args

      if (typeof indexNum !== 'number' || indexNum < 1 || indexNum > values.length) {
        return FormulaError.VALUE
      }

      return values[indexNum - 1]
    },
    2,
    255
  )

  // ROW - 返回行号
  registerFunction(
    'ROW',
    (args) => {
      if (args.length === 0) {
        // 当前单元格的行号 - 需要上下文支持，暂返回 1
        return 1
      }
      // 如果传入了范围，返回范围起始行
      // 这里简化处理
      return 1
    },
    0,
    1
  )

  // COLUMN - 返回列号
  registerFunction(
    'COLUMN',
    (args) => {
      if (args.length === 0) {
        return 1
      }
      return 1
    },
    0,
    1
  )

  // ROWS - 返回数组的行数
  registerFunction(
    'ROWS',
    (args) => {
      const [array] = args
      if (!Array.isArray(array)) {
        return 1
      }
      return array.length
    },
    1,
    1
  )

  // COLUMNS - 返回数组的列数
  registerFunction(
    'COLUMNS',
    (args) => {
      const [array] = args
      if (!Array.isArray(array)) {
        return 1
      }
      if (array.length === 0) {
        return 0
      }
      const firstRow = array[0]
      if (!Array.isArray(firstRow)) {
        return 1
      }
      return firstRow.length
    },
    1,
    1
  )

  // INDIRECT - 返回引用（简化实现）
  registerFunction(
    'INDIRECT',
    () => {
      // 完整实现需要解析器支持，这里返回错误
      return FormulaError.REF
    },
    1,
    2
  )

  // OFFSET - 偏移引用（简化实现）
  registerFunction(
    'OFFSET',
    () => {
      // 完整实现需要解析器支持，这里返回错误
      return FormulaError.REF
    },
    3,
    5
  )
}
