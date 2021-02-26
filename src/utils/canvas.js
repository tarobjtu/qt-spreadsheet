export function font(style1 = {}, style2 = {}) {
  const style = { ...style1, ...style2 }
  const { bold, italic, fontSize, fontFamily } = style
  return `${italic ? 'italic' : ''} ${bold ? 'bold' : ''} ${fontSize}px ${fontFamily}`
}

/**
 * @description 鼠标相对一个区域的方向
 * @param {*} rect
 * @param {*} mousePosition
 * @returns inner | up | right | bottom | left
 */
export function directionToRect(rect, mousePosition) {
  const { left, top, width, height } = rect
  const { offsetX, offsetY } = mousePosition
  let dir
  const cornerX = left + width
  const cornerY = top + height

  // 内部
  if (offsetX >= left && offsetX <= cornerX && offsetY >= top && offsetY <= cornerY) {
    dir = 'inner'
  }
  // 右下角区域
  else if (offsetY - cornerY > 0 && offsetX - cornerX > 0) {
    dir = (offsetX - cornerX) / (offsetY - cornerY) > 1 ? 'right' : 'bottom'
  }
  // 正下方区域
  else if (offsetY - cornerY > 0 && offsetX >= left && offsetX - cornerX <= 0) {
    dir = 'bottom'
  }
  // 左下角区域
  else if (offsetY - cornerY > 0 && offsetX < left) {
    dir = (left - offsetX) / (offsetY - cornerY) > 1 ? 'left' : 'bottom'
  }
  // 正左方区域
  else if (offsetX < left && offsetY >= top && offsetY <= cornerY) {
    dir = 'left'
  }
  // 左上角区域
  else if (offsetY - top < 0 && offsetX < left) {
    dir = (left - offsetX) / (top - offsetY) > 1 ? 'left' : 'up'
  }
  // 正上方区域
  else if (offsetY - top < 0 && offsetX >= left && offsetX - cornerX <= 0) {
    dir = 'up'
  }
  // 右上角区域
  else if (offsetY - top < 0 && offsetX - cornerX > 0) {
    dir = (offsetX - cornerX) / (top - offsetY) > 1 ? 'right' : 'up'
  }
  // 正右方区域
  else if (offsetX >= cornerX && offsetY >= top && offsetY <= cornerY) {
    dir = 'right'
  }

  return dir
}

/**
 * @description 两个选择器范围合并
 * @param {*} s1
 * @param {*} s2
 */
export function mergeSelector(s1 = {}, s2 = {}) {
  return {
    col: Math.min(s1.col, s2.col),
    row: Math.min(s1.row, s2.row),
    colCount:
      Math.max(s1.col + s1.colCount - 1, s2.col + s2.colCount - 1) - Math.min(s1.col, s2.col) + 1,
    rowCount:
      Math.max(s1.row + s1.rowCount - 1, s2.row + s2.rowCount - 1) - Math.min(s1.row, s2.row) + 1,
    activeCol: s2.activeCol === undefined ? s1.activeCol : s2.activeCol,
    activeRow: s2.activeRow === undefined ? s1.activeRow : s2.activeRow,
  }
}

/**
 * @description 合并多个区域的范围，一般指多个合并单元格区域
 * @param {*} cellRanges
 * @returns {cellRange} 一个新的涵盖cellRanges列表所有区域的最小范围
 */
export function mergeCellRanges(cellRanges = []) {
  let minCol = Infinity
  let minRow = Infinity
  let maxCol = -Infinity
  let maxRow = -Infinity

  cellRanges.forEach(({ col, colCount, row, rowCount }) => {
    minCol = Math.min(minCol, col)
    minRow = Math.min(minRow, row)
    maxCol = Math.max(maxCol, col + colCount - 1)
    maxRow = Math.max(maxRow, row + rowCount - 1)
  })

  return {
    col: Math.max(minCol, 0),
    row: Math.max(minRow, 0),
    colCount: Math.max(maxCol - minCol + 1, 1),
    rowCount: Math.max(maxRow - minRow + 1, 1),
  }
}

/**
 * @description 两个区域是否有重叠
 * @param {*} r1
 * @param {*} r2
 */
export function overlap(r1, r2) {
  if (
    r1.col + r1.colCount - 1 < r2.col ||
    r1.col > r2.col + r2.colCount - 1 ||
    r1.row + r1.rowCount - 1 < r2.row ||
    r1.row > r2.row + r2.rowCount - 1
  ) {
    return false
  }
  return true
}

/**
 * @description 重叠的单元格范围
 * @param {*} source: source
 * @param {*} source.start: start cell position
 * @param {*} source.count: cell number
 * @param {*} target: target
 * @param {*} target.start: start cell position
 * @param {*} target.count: cell number
 */
export function overlapRange(source, target) {
  const range = []
  for (let i = source.start; i <= source.start + source.count - 1; i += 1) {
    if (i >= target.start && i <= target.start + target.count - 1) {
      range.push(i)
    }
  }

  return {
    start: range[0],
    count: range.length,
  }
}

export default {
  font,
}
