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
 * @description 两个区域是否有重叠
 * @param {*} r1
 * @param {*} r2
 */
export function overlap(r1, r2) {
  if (
    r1.col + r1.colCount < r2.col ||
    r1.col > r2.col + r2.colCount ||
    r1.row + r1.rowCount < r2.row ||
    r1.row > r2.row + r2.rowCount
  ) {
    return false
  }
  return true
}

export default {
  font,
}
