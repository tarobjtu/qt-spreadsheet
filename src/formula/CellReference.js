/**
 * @description 单元格引用解析工具
 * 支持格式: A1, $A1, A$1, $A$1, A1:B5, $A$1:$B$5
 */

/**
 * @description 列字母转列索引 (0-based)
 * @param {string} alpha - 列字母，如 'A', 'AA', 'AZ'
 * @returns {number} 列索引
 * @example alphaToCol('A') => 0, alphaToCol('Z') => 25, alphaToCol('AA') => 26
 */
export function alphaToCol(alpha) {
  let result = 0
  const upper = alpha.toUpperCase()
  for (let i = 0; i < upper.length; i += 1) {
    result = result * 26 + (upper.charCodeAt(i) - 64)
  }
  return result - 1
}

/**
 * @description 列索引转列字母 (0-based)
 * @param {number} col - 列索引
 * @returns {string} 列字母
 * @example colToAlpha(0) => 'A', colToAlpha(25) => 'Z', colToAlpha(26) => 'AA'
 */
export function colToAlpha(col) {
  let result = ''
  let n = col + 1
  while (n > 0) {
    n -= 1
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26)
  }
  return result
}

/**
 * @description 解析单元格引用字符串
 * @param {string} refString - 单元格引用，如 'A1', '$A$1'
 * @returns {object} { col, row, colAbsolute, rowAbsolute }
 */
export function parseRef(refString) {
  const pattern = /^(\$?)([A-Z]+)(\$?)(\d+)$/i
  const match = refString.match(pattern)

  if (!match) {
    return null
  }

  const [, colAbs, colAlpha, rowAbs, rowNum] = match

  return {
    type: 'cell',
    col: alphaToCol(colAlpha),
    row: parseInt(rowNum, 10) - 1, // 转为 0-based
    colAbsolute: colAbs === '$',
    rowAbsolute: rowAbs === '$',
  }
}

/**
 * @description 解析范围引用字符串
 * @param {string} rangeString - 范围引用，如 'A1:B5', '$A$1:$B$5'
 * @returns {object} { col, row, endCol, endRow, ... }
 */
export function parseRange(rangeString) {
  const parts = rangeString.split(':')

  if (parts.length !== 2) {
    return null
  }

  const start = parseRef(parts[0])
  const end = parseRef(parts[1])

  if (!start || !end) {
    return null
  }

  return {
    type: 'range',
    col: Math.min(start.col, end.col),
    row: Math.min(start.row, end.row),
    endCol: Math.max(start.col, end.col),
    endRow: Math.max(start.row, end.row),
    colAbsolute: start.colAbsolute,
    rowAbsolute: start.rowAbsolute,
    endColAbsolute: end.colAbsolute,
    endRowAbsolute: end.rowAbsolute,
  }
}

/**
 * @description 解析单元格或范围引用
 * @param {string} refString - 引用字符串
 * @returns {object|null}
 */
export function parseCellOrRange(refString) {
  if (refString.includes(':')) {
    return parseRange(refString)
  }
  return parseRef(refString)
}

/**
 * @description 将引用对象转为字符串
 * @param {object} ref - 引用对象
 * @returns {string}
 */
export function refToString(ref) {
  const colAbs = ref.colAbsolute ? '$' : ''
  const rowAbs = ref.rowAbsolute ? '$' : ''
  const colAlpha = colToAlpha(ref.col)
  const rowNum = ref.row + 1

  if (ref.type === 'range') {
    const endColAbs = ref.endColAbsolute ? '$' : ''
    const endRowAbs = ref.endRowAbsolute ? '$' : ''
    const endColAlpha = colToAlpha(ref.endCol)
    const endRowNum = ref.endRow + 1
    return `${colAbs}${colAlpha}${rowAbs}${rowNum}:${endColAbs}${endColAlpha}${endRowAbs}${endRowNum}`
  }

  return `${colAbs}${colAlpha}${rowAbs}${rowNum}`
}

/**
 * @description 调整引用位置（用于插入/删除行列时更新公式）
 * @param {object} ref - 引用对象
 * @param {string} type - 'row' 或 'col'
 * @param {number} position - 插入/删除位置
 * @param {number} delta - 正数为插入，负数为删除
 * @returns {object|null} 返回调整后的引用，如果引用被删除则返回 null
 */
export function adjustRef(ref, type, position, delta) {
  const newRef = { ...ref }

  if (type === 'row') {
    // 调整行
    if (!ref.rowAbsolute && ref.row >= position) {
      newRef.row = ref.row + delta
      if (newRef.row < 0) return null // 被删除
    }
    if (ref.type === 'range' && !ref.endRowAbsolute && ref.endRow >= position) {
      newRef.endRow = ref.endRow + delta
      if (newRef.endRow < 0) return null
    }
  } else if (type === 'col') {
    // 调整列
    if (!ref.colAbsolute && ref.col >= position) {
      newRef.col = ref.col + delta
      if (newRef.col < 0) return null // 被删除
    }
    if (ref.type === 'range' && !ref.endColAbsolute && ref.endCol >= position) {
      newRef.endCol = ref.endCol + delta
      if (newRef.endCol < 0) return null
    }
  }

  return newRef
}

/**
 * @description 生成单元格键（用于依赖图）
 * @param {number} col
 * @param {number} row
 * @returns {string}
 */
export function cellKey(col, row) {
  return `${col},${row}`
}

/**
 * @description 从键解析单元格位置
 * @param {string} key
 * @returns {object} { col, row }
 */
export function parseKey(key) {
  const [col, row] = key.split(',').map(Number)
  return { col, row }
}

/**
 * @description 展开范围引用为单元格数组
 * @param {object} range - 范围引用对象
 * @returns {Array<object>} 单元格位置数组
 */
export function expandRange(range) {
  const cells = []
  for (let r = range.row; r <= range.endRow; r += 1) {
    for (let c = range.col; c <= range.endCol; c += 1) {
      cells.push({ col: c, row: r })
    }
  }
  return cells
}

/**
 * @description 调整公式中的引用（用于拖拽填充、复制粘贴）
 * @param {string} formula - 原公式字符串
 * @param {number} colDelta - 列偏移量
 * @param {number} rowDelta - 行偏移量
 * @returns {string} 调整后的公式
 */
export function adjustFormulaRefs(formula, colDelta, rowDelta) {
  if (!formula || !formula.startsWith('=')) {
    return formula
  }

  // 匹配单元格引用和范围引用
  const pattern = /(\$?)([A-Z]+)(\$?)(\d+)(?::(\$?)([A-Z]+)(\$?)(\d+))?/gi

  return formula.replace(
    pattern,
    (match, colAbs1, col1, rowAbs1, row1, colAbs2, col2, rowAbs2, row2) => {
      // 调整起始单元格
      let newCol1 = alphaToCol(col1)
      let newRow1 = parseInt(row1, 10) - 1

      if (colAbs1 !== '$') {
        newCol1 += colDelta
      }
      if (rowAbs1 !== '$') {
        newRow1 += rowDelta
      }

      // 检查边界
      if (newCol1 < 0 || newRow1 < 0) {
        return '#REF!'
      }

      const newColStr1 = (colAbs1 || '') + colToAlpha(newCol1)
      const newRowStr1 = (rowAbs1 || '') + (newRow1 + 1)

      // 如果是范围引用
      if (col2) {
        let newCol2 = alphaToCol(col2)
        let newRow2 = parseInt(row2, 10) - 1

        if (colAbs2 !== '$') {
          newCol2 += colDelta
        }
        if (rowAbs2 !== '$') {
          newRow2 += rowDelta
        }

        // 检查边界
        if (newCol2 < 0 || newRow2 < 0) {
          return '#REF!'
        }

        const newColStr2 = (colAbs2 || '') + colToAlpha(newCol2)
        const newRowStr2 = (rowAbs2 || '') + (newRow2 + 1)

        return `${newColStr1}${newRowStr1}:${newColStr2}${newRowStr2}`
      }

      return `${newColStr1}${newRowStr1}`
    }
  )
}

/**
 * @description 切换引用的绝对/相对模式 (F4 键功能)
 * @param {string} refString - 引用字符串，如 'A1', '$A$1'
 * @returns {string} 切换后的引用字符串
 * 循环顺序: A1 -> $A$1 -> A$1 -> $A1 -> A1
 */
export function toggleRefAbsolute(refString) {
  const pattern = /^(\$?)([A-Z]+)(\$?)(\d+)$/i
  const match = refString.match(pattern)

  if (!match) {
    return refString
  }

  const [, colAbs, colAlpha, rowAbs, rowNum] = match

  // 确定当前模式并切换到下一个
  if (colAbs === '' && rowAbs === '') {
    // A1 -> $A$1
    return `$${colAlpha}$${rowNum}`
  }
  if (colAbs === '$' && rowAbs === '$') {
    // $A$1 -> A$1
    return `${colAlpha}$${rowNum}`
  }
  if (colAbs === '' && rowAbs === '$') {
    // A$1 -> $A1
    return `$${colAlpha}${rowNum}`
  }
  // $A1 -> A1
  return `${colAlpha}${rowNum}`
}
