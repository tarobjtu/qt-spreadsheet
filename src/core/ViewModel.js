/**
 * @description 电子表格视图相关数据的计算函数
 */
class ViewModel {
  constructor({ sheetData, canvas, theme }) {
    this.sheetData = sheetData
    this.canvas = canvas
    this.theme = theme
  }

  /**
   * @description 更新电子表格数据
   * @param {*} data
   */
  updateData(data) {
    this.sheetData = data
  }

  /**
   * @description 更新滚动相关的数据
   * @param {*} scrollX
   * @param {*} scrollY
   * @param {boolean} changed 数据是否发生变化，变化返回true
   */
  updateScroll(scrollX, scrollY) {
    const { canvas } = this
    const { width, height } = canvas.getBoundingClientRect()
    // 判断边界
    const minScrollX = 0
    const minScrollY = 0
    const maxScrollX = this.getSheetWidth() - width
    const maxScrollY = this.getSheetHeight() - height
    const x = Math.max(Math.min(scrollX, maxScrollX), minScrollX)
    const y = Math.max(Math.min(scrollY, maxScrollY), minScrollY)

    if (this.sheetData.scrollX !== x || this.sheetData.scrollY !== y) {
      this.sheetData.scrollX = x
      this.sheetData.scrollY = y
      return true
    }

    return false
  }

  /**
   * @description 获取电子表格的高度
   */
  getSheetHeight() {
    const { rowsMeta } = this.sheetData
    const maxRM = rowsMeta[rowsMeta.length - 1]
    return maxRM.offset + maxRM.size
  }

  /**
   * @description 获取电子表格的宽度
   */
  getSheetWidth() {
    const { colsMeta } = this.sheetData
    const maxCM = colsMeta[colsMeta.length - 1]
    return maxCM.offset + maxCM.size
  }

  /**
   * @description 找到视窗范围内可见的全部单元格
   */
  getViewportCRs() {
    const { canvas, sheetData } = this
    const { scrollX, scrollY } = sheetData
    const { width, height } = canvas.getBoundingClientRect()

    const start = this.getCellByOffset(scrollX, scrollY)
    const end = this.getCellByOffset(scrollX + width, scrollY + height)

    const result = {
      row: start.row,
      col: start.col,
      rowCount: end.row - start.row + 1,
      colCount: end.col - start.col + 1,
    }

    return result
  }

  /**
   * @description 获取单元格的BBox信息
   * @param {*} col
   * @param {*} row
   */
  getCellBBox(col, row, type) {
    const { colsMeta, rowsMeta } = this.sheetData
    const { rowHeaderWidth, colHeaderHeight } = this.theme

    if (type === 'corner') {
      return {
        left: 0,
        top: 0,
        width: rowHeaderWidth,
        height: colHeaderHeight,
      }
    }

    if (type === 'rowHeader') {
      return {
        left: 0,
        top: rowsMeta[row].offset,
        width: rowHeaderWidth,
        height: rowsMeta[row].size,
      }
    }

    if (type === 'colHeader') {
      return {
        left: colsMeta[col].offset,
        top: 0,
        width: colsMeta[col].size,
        height: colHeaderHeight,
      }
    }

    return {
      left: colsMeta[col].offset,
      top: rowsMeta[row].offset,
      width: colsMeta[col].size,
      height: rowsMeta[col].size,
    }
  }

  /**
   * @description 找到坐标left、top命中的表格单元格
   * @param {*} left
   * @param {*} top
   */
  getCellByOffset(left, top) {
    const { rowHeaderWidth, colHeaderHeight } = this.theme

    // 左上角的角标
    if (left < rowHeaderWidth && top < colHeaderHeight) {
      return { col: 0, row: 0, type: 'corner' }
    }

    // 左边的行头
    if (left < rowHeaderWidth && top >= colHeaderHeight) {
      return {
        row: this.getRowByOffset(top),
        col: 0,
        type: 'rowHeader',
      }
    }

    // 顶部的列头
    if (left >= rowHeaderWidth && top < colHeaderHeight) {
      return {
        row: 0,
        col: this.getColByOffset(left),
        type: 'colHeader',
      }
    }

    return {
      col: this.getColByOffset(left),
      row: this.getRowByOffset(top),
      type: 'cell',
    }
  }

  /**
   * @description 找到坐标left命中的表格列，二分法查找
   * @param {*} left
   */
  getColByOffset(left) {
    const { colsMeta } = this.sheetData
    let min = 0
    let max = colsMeta.length - 1
    let result

    if (left < colsMeta[min].offset) return min
    if (left > colsMeta[max].offset) return max

    while (min !== max) {
      const mid = Math.floor((max + min) / 2)
      if (left >= colsMeta[mid].offset && left <= colsMeta[mid].offset + colsMeta[mid].size) {
        result = mid
        break
      } else if (left < colsMeta[mid].offset) {
        max = mid
      } else {
        min = mid
      }
    }

    return result
  }

  /**
   * @description 找到坐标top命中的表格行，二分法查找
   * @param {*} top
   */
  getRowByOffset(top) {
    const { rowsMeta } = this.sheetData
    let min = 0
    let max = rowsMeta.length - 1
    let result

    if (top < rowsMeta[min].offset) return min
    if (top > rowsMeta[max].offset) return max

    while (min !== max) {
      const mid = Math.floor((max + min) / 2)
      if (top >= rowsMeta[mid].offset && top <= rowsMeta[mid].offset + rowsMeta[mid].size) {
        result = mid
        break
      } else if (top < rowsMeta[mid].offset) {
        max = mid
      } else {
        min = mid
      }
    }

    return result
  }
}

export default ViewModel
