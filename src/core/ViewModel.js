/**
 * @description 电子表格视图相关数据的计算函数
 */
class ViewModel {
  constructor({ sheetData, canvas, theme }) {
    this.sheetData = sheetData
    this.canvas = canvas
    this.theme = theme
  }

  updateData(data) {
    this.sheetData = data
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

    console.warn(result)
    return result
  }

  /**
   * @description 找到坐标left、top命中的表格单元格
   * @param {*} left
   * @param {*} top
   */
  getCellByOffset(left, top) {
    const col = this.getColByOffset(left)
    const row = this.getRowByOffset(top)
    return {
      col,
      row,
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
      if (
        left >= colsMeta[mid].offset &&
        left <= colsMeta[mid].offset + colsMeta[mid].size
      ) {
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
      if (
        top >= rowsMeta[mid].offset &&
        top <= rowsMeta[mid].offset + rowsMeta[mid].size
      ) {
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
