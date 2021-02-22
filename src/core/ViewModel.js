import update from '../utils/immutability-helper-y'
import { deepClone, perf } from '../utils/common'
import { EMPTY_CELL, emptyData, insertMeta, deleteMeta, changeMetaSize } from '../utils/model'

/**
 * @description 电子表格视图相关数据的计算函数
 */
class ViewModel {
  constructor({ sheetData, container, theme, history }) {
    this.sheetData = sheetData
    this.container = container
    this.theme = theme
    this.history = history

    if (process.env.NODE_ENV === 'development') {
      window.update = update
    }
  }

  /**
   * @description 更新电子表格数据
   * @param {*} data
   */
  updateData(data) {
    this.setSheetData(data)
    this.history.save(deepClone(this.sheetData))
  }

  /**
   * @description 设置电子表格数据
   * @param {*} data
   */
  setSheetData(sheetData) {
    this.sheetData = sheetData
  }

  /**
   * @description 获取电子表格数据
   */
  getSheetData() {
    return this.sheetData
  }

  saveToHistory() {
    this.history.save(this.sheetData)
  }

  getLastHistory() {
    return this.history.last()
  }

  /**
   * @description 更新选中区域或单元格信息
   */
  setSelector({ col, row, colCount, rowCount, type, activeCol, activeRow }) {
    const { colsMeta, rowsMeta, selector } = this.sheetData

    const newSelector = {
      col: Math.max(Math.min(col, colsMeta.length - 1), 0),
      row: Math.max(Math.min(row, rowsMeta.length - 1), 0),
      colCount: colCount === undefined ? 1 : colCount,
      rowCount: rowCount === undefined ? 1 : rowCount,
      type: type === undefined ? 'cell' : type,
      activeCol:
        activeCol === undefined
          ? selector.activeCol
          : Math.max(Math.min(activeCol, colsMeta.length - 1), 0),
      activeRow:
        activeRow === undefined
          ? selector.activeRow
          : Math.max(Math.min(activeRow, rowsMeta.length - 1), 0),
    }

    this.sheetData = update.$set(this.sheetData, ['selector'], newSelector)
  }

  /**
   * @description 取得电子表格的选中区域属性
   */
  getSelector() {
    return this.sheetData.selector
  }

  /**
   * @description 获取选中的激活的单元格（数据）
   */
  getSelectedActiveCell() {
    const { data, selector } = this.sheetData
    const { activeCol, activeRow } = selector
    return data[activeRow][activeCol]
  }

  /**
   * @description 获取选中的单元格（数据）
   */
  getSelectedCellsData() {
    const result = []
    const { data, selector } = this.sheetData
    const { col, row, colCount, rowCount } = selector
    for (let ri = row; ri < row + rowCount; ri += 1) {
      const rowData = []
      for (let ci = col; ci < col + colCount; ci += 1) {
        rowData.push(data[ri][ci])
      }
      result.push(rowData)
    }
    return result
  }

  /**
   * @description 获取选中的单元格（坐标）
   */
  getSelectedCells() {
    const cells = []
    const { selector } = this.sheetData
    const { col, row, colCount, rowCount } = selector
    for (let ri = row; ri < row + rowCount; ri += 1) {
      for (let ci = col; ci < col + colCount; ci += 1) {
        cells.push({ col: ci, row: ri })
      }
    }
    return cells
  }

  /**
   * @description 获取电子表格最后一个单元格
   */
  getLastCell() {
    const { colsMeta, rowsMeta } = this.sheetData
    return {
      col: colsMeta.length - 1,
      row: rowsMeta.length - 1,
    }
  }

  /**
   * @description 获取电子表格所有单元格
   */
  getAllCells() {
    const { colsMeta, rowsMeta } = this.sheetData
    return {
      col: 0,
      row: 0,
      colCount: colsMeta.length,
      rowCount: rowsMeta.length,
    }
  }

  /**
   * @description 更新滚动相关的数据
   * @param {*} scrollX
   * @param {*} scrollY
   * @param {boolean} changed 数据是否发生变化，变化返回true
   */
  updateScroll(scrollX, scrollY) {
    const { container } = this
    const { width, height } = container.getBoundingClientRect()
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
   * @description 获得最大列的位置
   */
  getMaxColIndex() {
    const { colsMeta } = this.sheetData
    return colsMeta.length - 1
  }

  /**
   * @description 获得最大行的位置
   */
  getMaxRowIndex() {
    const { rowsMeta } = this.sheetData
    return rowsMeta.length - 1
  }

  /**
   * @description 获得电子表格列数
   */
  getColsNumber() {
    const { colsMeta } = this.sheetData
    return colsMeta.length
  }

  /**
   * @description 获得电子表格行数
   */
  getRowsNumber() {
    const { rowsMeta } = this.sheetData
    return rowsMeta.length
  }

  /**
   * @description 找到视窗范围内可见的全部单元格
   */
  getViewportCRs() {
    const { container, sheetData } = this
    const { scrollX, scrollY } = sheetData
    const { width, height } = container.getBoundingClientRect()

    return this.getRectCRs({ left: scrollX, top: scrollY, width, height })
  }

  /**
   * @description 获取一个矩形区域内的所有单元格
   * @param {*} param0
   */
  getRectCRs({ left, top, width, height }) {
    const start = this.getCellByOffset(left, top)
    const end = this.getCellByOffset(left + width, top + height)

    return {
      row: start.row,
      col: start.col,
      rowCount: end.row - start.row + 1,
      colCount: end.col - start.col + 1,
    }
  }

  /**
   * @description 获取一组cells的区域信息
   * @param {*} param0
   */
  getCellsBBox({ col, row, colCount, rowCount }) {
    const { colsMeta, rowsMeta } = this.sheetData
    const endCol = col + colCount - 1
    const endRow = row + rowCount - 1

    return {
      left: colsMeta[col].offset,
      top: rowsMeta[row].offset,
      width: colsMeta[endCol].offset + colsMeta[endCol].size - colsMeta[col].offset,
      height: rowsMeta[endRow].offset + rowsMeta[endRow].size - rowsMeta[row].offset,
    }
  }

  /**
   * @description 获取选中区域的坐标信息
   */
  getSelectedCellsBBox() {
    const { col, row, colCount, rowCount } = this.getSelector()
    return this.getCellsBBox({ col, row, colCount, rowCount })
  }

  /**
   * @description 获取选中区域激活的单元格坐标信息
   */
  getSelectedActiveCellBBox() {
    const { activeCol, activeRow } = this.getSelector()
    return this.getCellsBBox({ col: activeCol, row: activeRow, colCount: 1, rowCount: 1 })
  }

  /**
   * @description 找到坐标left、top命中的表格单元格
   * @param {*} left
   * @param {*} top
   */
  getCellByOffset(left, top) {
    const { rowHeaderWidth, colHeaderHeight } = this.theme

    // 左上角的角头
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

  /**
   * @description 获取单元格信息
   * @param {*} col
   * @param {*} row
   */
  getCellData(col, row) {
    const { data } = this.sheetData
    return data[row][col]
  }

  /**
   * @description 设置单元格信息
   * @param {*} col
   * @param {*} row
   */
  setCellData(col, row, cellData) {
    this.sheetData = update.$set(this.sheetData, ['data', row, col], cellData)
    this.history.save(this.sheetData)
  }

  clearCellsData({ col, colCount, row, rowCount }) {
    this.sheetData = deepClone(this.sheetData)

    const { data } = this.sheetData
    for (let ri = row; ri < row + rowCount; ri += 1) {
      for (let ci = col; ci < col + colCount; ci += 1) {
        data[ri][ci] = EMPTY_CELL
      }
    }

    this.history.save(this.sheetData)
  }

  /**
   * @description 批量设置单元格信息（优化存储性能）
   * @param {*} col
   * @param {*} row
   * @param {*} cellData
   * @param {*} start
   * @param {*} finished
   */
  setCellDataBatched(col, row, cellData, start = false, finished = false) {
    // const { data } = this.sheetData
    // state: start 开始阶段备份，避免污染保存在history中的sheetData数据
    if (start) {
      this.sheetData = deepClone(this.sheetData)
    }

    const { data } = this.sheetData
    data[row][col] = cellData

    if (finished) {
      this.history.save(this.sheetData)
    }
  }

  /**
   * @description 获取单元格文本信息
   * @param {*} col
   * @param {*} row
   */
  getCellText(col, row) {
    const cell = this.getCellData(col, row)
    return cell?.value
  }

  /**
   * @description 设置单元格值
   * @param {*} col
   * @param {*} row
   * @param {*} value
   * @param {*} state 状态包括：input、finished（历史版本只保存最后的一次输入）
   */
  setCellText(col, row, value, state = 'input') {
    this.sheetData = update.$set(this.sheetData, ['data', row, col, 'value'], value)
    if (state === 'finished') {
      // 通过immutable函数创建一个新的sheetData对象，旧的对象存储到history中
      // 新对象的属性值发生变化，不会改变旧的值，immutable比深拷贝节省存储空间
      // 性能：super-market.json 数据量 10000行 * 21列，deepClone耗时125ms，_.cloneDeep耗时275ms，immutable拷贝耗时2.5ms
      this.history.save(this.sheetData)
    }
  }

  /**
   * @description 在单元格值后面追加内容
   * @param {*} col
   * @param {*} row
   * @param {*} value
   * @param {*} state 状态包括：input、finished（历史版本只保存最后的一次输入）
   */
  appendCellText(col, row, value, state = 'input') {
    const originValue = this.getCellText(col, row)
    this.setCellText(col, row, originValue + value, state)
  }

  /**
   * @description 获取单元格样式信息
   * @param {*} col
   * @param {*} row
   */
  getCellStyle(col, row) {
    const cell = this.getCellData(col, row)
    return cell?.style
  }

  /**
   * @description 设置单元格样式
   * @param {*} col
   * @param {*} row
   * @param {*} style
   * @param {*} state 批量更新单元格样式时，历史版本只保存最后的一次输入，比如圈选多个单元格后设置样式
   */
  setCellStyleBatched(col, row, style = {}, start = false, finished = false) {
    if (start) {
      perf()
      // perf(() => {
      //   this.sheetData = deepClone(this.sheetData)
      // }, 'deepClone')
      this.sheetData = deepClone(this.sheetData)
    }

    const { data } = this.sheetData
    if (data[row][col]) {
      data[row][col].style = {
        ...this.getCellStyle(col, row),
        ...style,
      }
    }

    if (finished) {
      this.history.save(this.sheetData)
    }
  }

  clearStyle({ col, colCount, row, rowCount }) {
    this.sheetData = deepClone(this.sheetData)

    const { data } = this.sheetData
    for (let ri = row; ri < row + rowCount; ri += 1) {
      for (let ci = col; ci < col + colCount; ci += 1) {
        data[ri][ci].style = {}
      }
    }

    this.history.save(this.sheetData)
  }

  /**
   * @description 设置单元格样式
   * @param {*} col
   * @param {*} row
   * @param {*} style
   * @param {*} state 批量更新单元格样式时，历史版本只保存最后的一次输入，比如圈选多个单元格后设置样式
   */
  setCellStyle(col, row, style = {}) {
    this.sheetData = update.$set(this.sheetData, ['data', row, col, 'style'], {
      ...this.getCellStyle(col, row),
      ...style,
    })
    this.history.save(this.sheetData)
  }

  paste(clips, state) {
    this.pasteDeepClone(clips, state)
    // perf(() => {
    //   this.pasteDeepClone(clips, state)
    // }, 'paste')
  }

  pasteDeepClone(clips, state) {
    const { activeCol, activeRow } = this.getSelector()
    const { col, row, colCount, rowCount } = clips

    this.setSelector({ col: activeCol, row: activeRow, activeCol, activeRow, colCount, rowCount })
    this.history.save(this.sheetData)

    this.sheetData = deepClone(this.sheetData)

    const { data } = this.sheetData

    for (let ri = row; ri < row + rowCount; ri += 1) {
      for (let ci = col; ci < col + colCount; ci += 1) {
        const colPointer = ci - col
        const rowPointer = ri - row
        const tempData = deepClone(data[ri][ci])

        if (state === 'cut') {
          // 不删除cut与paste重叠区域的单元格
          if (
            ci < activeCol ||
            ci > activeCol + colCount - 1 ||
            ri < activeRow ||
            ri > activeRow + rowCount - 1
          ) {
            data[ri][ci] = EMPTY_CELL
          }
        }
        data[activeRow + rowPointer][activeCol + colPointer] = tempData
      }
    }

    this.setSelector({ col: activeCol, row: activeRow, activeCol, activeRow, colCount, rowCount })

    this.history.save(this.sheetData)
  }

  /**
   * @description 插入行
   * @param {*} position 插入位置
   * @param {*} rowCount 插入行数
   * @param {*} insertData 插入的数据
   */
  insertRows(position, rowCount, insertData) {
    this.sheetData = deepClone(this.sheetData)

    const { rowsMeta, data } = this.sheetData
    const colCount = this.getColsNumber()

    // copy rowsMeta
    const copyMeta = rowsMeta.slice(position, position + rowCount)
    insertMeta(rowsMeta, copyMeta, position)
    // copy data
    if (insertData === undefined) {
      data.splice(position, 0, ...emptyData(rowCount, colCount))
    } else {
      data.splice(position, 0, ...deepClone(insertData))
    }

    this.setSelector({
      col: 0,
      row: position,
      activeCol: 0,
      activeRow: position,
      colCount,
      rowCount,
    })

    this.history.save(this.sheetData)
  }

  /**
   * @description 插入列
   * @param {*} position 插入位置
   * @param {*} colCount 插入列数
   * @param {*} insertData 插入的数据
   */
  insertCols(position, colCount, insertData) {
    this.sheetData = deepClone(this.sheetData)

    const { colsMeta, data } = this.sheetData
    const rowCount = this.getRowsNumber()

    // copy colsMeta
    const copyMeta = colsMeta.slice(position, position + colCount)
    insertMeta(colsMeta, copyMeta, position)
    // copy data
    if (insertData === undefined) {
      const emptyCols = emptyData(1, colCount)[0]
      for (let ri = 0; ri < rowCount; ri += 1) {
        data[ri].splice(position, 0, ...emptyCols)
      }
    } else {
      for (let ri = 0; ri < rowCount; ri += 1) {
        data[ri].splice(position, 0, ...insertData[ri])
      }
    }

    this.setSelector({
      col: position,
      row: 0,
      activeCol: position,
      activeRow: 0,
      colCount,
      rowCount,
    })

    this.history.save(this.sheetData)
  }

  /**
   * @description 删除行
   * @param {*} startRow 删除位置
   * @param {*} rowCount 删除行数
   */
  deleteRows(startRow, rowCount) {
    this.sheetData = deepClone(this.sheetData)

    const { rowsMeta, data } = this.sheetData
    // delete rowsMeta
    deleteMeta(rowsMeta, startRow, rowCount)
    // delete data
    data.splice(startRow, rowCount)

    this.history.save(this.sheetData)
  }

  /**
   * @description 删除列
   * @param {*} startCol 删除位置
   * @param {*} colCount 删除列数
   */
  deleteCols(startCol, colCount) {
    this.sheetData = deepClone(this.sheetData)

    const { colsMeta, data } = this.sheetData
    const rowCount = this.getRowsNumber()
    // delete colsMeta
    deleteMeta(colsMeta, startCol, colCount)
    // delete data
    for (let ri = 0; ri < rowCount; ri += 1) {
      data[ri].splice(startCol, colCount)
    }

    this.history.save(this.sheetData)
  }

  colResize({ col, count, newSize }, start = false, finished = false) {
    if (start) {
      this.sheetData = deepClone(this.sheetData)
    }

    const { colsMeta } = this.sheetData
    changeMetaSize(colsMeta, col, count, newSize)

    if (finished) {
      this.history.save(this.sheetData)
    }
  }

  rowResize({ row, count, newSize }, start = false, finished = false) {
    if (start) {
      this.sheetData = deepClone(this.sheetData)
    }

    const { colsMeta } = this.sheetData
    changeMetaSize(colsMeta, row, count, newSize)

    if (finished) {
      this.history.save(this.sheetData)
    }
  }
}

export default ViewModel
