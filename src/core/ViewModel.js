import isEqual from 'lodash/isEqual'
import without from 'lodash/without'
import update from '../utils/immutability-helper-y'
import { deepClone, perf } from '../utils/common'
import { overlap, mergeCellRanges, overlapRange } from '../utils/canvas'
import {
  EMPTY_CELL,
  DEFAULT_CELL_RANGE,
  emptyData,
  insertMeta,
  deleteMeta,
  changeMetaSize,
  hideMeta,
  cancelHideMeta,
  clearCellsData,
} from '../utils/model'
import { adjustFormulaRefs } from '../formula/CellReference'

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

  /**
   * @description 本次操作保存到历史版本中
   * @param {*} func
   */
  saveToHistory() {
    this.history.save(this.sheetData)
  }

  getLastHistory() {
    return this.history.last()
  }

  /**
   * @description 保存上一次selector的位置
   */
  saveLastSelectorStatus() {
    const lastSheetData = this.getLastHistory()
    const lastSelector = lastSheetData.selector
    const curSelector = this.getSelector()
    // selector不同时保存
    if (!isEqual(lastSelector, curSelector)) {
      this.saveToHistory()
    }
  }

  getMergedCells() {
    return this.sheetData.mergedCells
  }

  setMergedCells(mergedCells) {
    this.sheetData.mergedCells = mergedCells
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
   * @description 返回有多少完整的行被选中
   */
  getSelectedWholeRows() {
    const { row, rowCount, col, colCount } = this.getSelector()
    if (col === 0 && colCount === this.getColsNumber()) {
      return { row, rowCount }
    }
    return null
  }

  /**
   * @description 返回有多少完整的列被选中
   */
  getSelectedWholeCols() {
    const { row, rowCount, col, colCount } = this.getSelector()
    if (row === 0 && rowCount === this.getRowsNumber()) {
      return { col, colCount }
    }
    return null
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
  getViewportCellRange() {
    const { container, sheetData } = this
    const { scrollX, scrollY } = sheetData
    const { width, height } = container.getBoundingClientRect()

    return this.getRectCellRange({ left: scrollX, top: scrollY, width, height })
  }

  /**
   * @description 获取一个矩形区域内的所有单元格
   * @param {*} cellRange
   * @param {boolean} includeMergedCell 是否包含合并单元格
   */
  getRectCellRange({ left, top, width, height }, includeMergedCell) {
    const start = this.getCellByOffset(left, top)
    const end = this.getCellByOffset(left + width, top + height)

    let cellRange = {
      row: start.row,
      col: start.col,
      rowCount: end.row - start.row + 1,
      colCount: end.col - start.col + 1,
    }

    if (includeMergedCell) {
      const mergedCells = this.getOverlapMergedCells(cellRange)
      if (mergedCells.length > 0) {
        cellRange = mergeCellRanges([].concat(mergedCells, cellRange))
      }
    }

    return cellRange
  }

  /**
   * @description 获取一组单元格的区域尺寸信息
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
   * @description 获取一个单元格的区域尺寸信息
   * @param {*} param0
   */
  getCellBBox({ col, row }) {
    const mergedCells = this.getOverlapMergedCells({ col, row })
    // merged cell
    if (mergedCells.length > 0) {
      const mc = mergedCells[0]
      return this.getCellsBBox({
        col: mc.col,
        row: mc.row,
        colCount: mc.colCount,
        rowCount: mc.rowCount,
      })
    }
    // normal cell
    return this.getCellsBBox({ col, row, colCount: 1, rowCount: 1 })
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
    return this.getCellBBox({ col: activeCol, row: activeRow })
  }

  /**
   * @description 找到坐标left、top命中的表格单元格
   * @param {*} left (相对canvas左上角的位置，+crollX)
   * @param {*} top (相对canvas左上角的位置，+crollY)
   */
  getCellByOffset(left, top) {
    const { theme, sheetData } = this
    const { rowHeaderWidth, colHeaderHeight } = theme
    const { scrollX, scrollY } = sheetData

    // 左上角的角头
    if (left - scrollX < rowHeaderWidth && top - scrollY < colHeaderHeight) {
      return { col: 0, row: 0, type: 'corner' }
    }

    // 左边的行头
    if (left - scrollX < rowHeaderWidth && top - scrollY >= colHeaderHeight) {
      return {
        row: this.getRowByOffset(top),
        col: 0,
        type: 'rowHeader',
      }
    }

    // 顶部的列头
    if (left - scrollX >= rowHeaderWidth && top - scrollY < colHeaderHeight) {
      return {
        row: 0,
        col: this.getColByOffset(left),
        type: 'colHeader',
      }
    }

    const col = this.getColByOffset(left)
    const row = this.getRowByOffset(top)
    const mergedCells = this.getOverlapMergedCells({ col, row })

    // 合并单元格的情况
    if (mergedCells.length > 0) {
      const mc = mergedCells[0] // row、col只能命中一个合并单元格
      return {
        col: mc.col,
        row: mc.row,
        colCount: mc.colCount,
        rowCount: mc.rowCount,
        type: 'cell',
        mergedCell: true,
      }
    }

    return {
      col,
      row,
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
    this.saveLastSelectorStatus()
    this.sheetData = deepClone(this.sheetData)

    const { data } = this.sheetData
    clearCellsData(data, { col, colCount, row, rowCount })

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
   * @description 获取单元格显示文本（公式返回计算结果）
   * @param {*} col
   * @param {*} row
   */
  getCellText(col, row) {
    // 如果有公式引擎，使用公式引擎获取显示值
    if (this.formulaEngine) {
      return this.formulaEngine.getValue(col, row)
    }
    const cell = this.getCellData(col, row)
    return cell?.value
  }

  /**
   * @description 获取单元格原始值/公式文本（用于编辑）
   * @param {*} col
   * @param {*} row
   */
  getFormulaText(col, row) {
    if (this.formulaEngine) {
      return this.formulaEngine.getFormula(col, row)
    }
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
    // 使用公式引擎处理值
    if (this.formulaEngine) {
      this.formulaEngine.setCell(col, row, value)
      // 获取公式引擎处理后的单元格数据，保留 formula、calculated、error 属性
      const cell = this.getCellData(col, row)
      this.sheetData = update.$set(this.sheetData, ['data', row, col], {
        ...cell,
        value,
      })
    } else {
      this.sheetData = update.$set(this.sheetData, ['data', row, col, 'value'], value)
    }

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

  setCellsBorder({ left, right, top, bottom }) {
    this.sheetData = deepClone(this.sheetData)

    const { row, col, rowCount, colCount } = this.getSelector()
    const { data } = this.sheetData

    for (let ri = row; ri < row + rowCount; ri += 1) {
      for (let ci = col; ci < col + colCount; ci += 1) {
        const { style } = data[ri][ci]
        style.border = { ...style.border, ...{ left, right, top, bottom } }
        // 右侧单元格的左边框
        const rightNeighbor = data[ri][ci + 1]
        if (rightNeighbor) {
          rightNeighbor.style.border = { ...rightNeighbor.style.border, ...{ left: right } }
        }
        // 下面单元格的上边框
        if (data[ri + 1]) {
          const bottomNeighbor = data[ri + 1][ci]
          bottomNeighbor.style.border = { ...bottomNeighbor.style.border, ...{ top: bottom } }
        }
      }
    }

    this.history.save(this.sheetData)
  }

  paste(clipRange, state) {
    this.pasteDeepClone(clipRange, state)
    // perf(() => {
    //   this.pasteDeepClone(clipRange, state)
    // }, 'paste')
  }

  pasteDeepClone(clipRange, state) {
    const { activeCol, activeRow } = this.getSelector()
    const { col, row, colCount, rowCount } = clipRange

    // 计算粘贴位置与复制位置的偏移量
    const colDelta = activeCol - col
    const rowDelta = activeRow - row

    this.setSelector({ col: activeCol, row: activeRow, activeCol, activeRow, colCount, rowCount })
    this.saveLastSelectorStatus()

    this.sheetData = deepClone(this.sheetData)

    const { data } = this.sheetData

    for (let ri = row; ri < row + rowCount; ri += 1) {
      for (let ci = col; ci < col + colCount; ci += 1) {
        const colPointer = ci - col // 相对起始列的偏移量
        const rowPointer = ri - row // 相对起始行的偏移量
        const tempData = deepClone(data[ri][ci])

        // 如果是公式单元格，调整引用（仅复制时调整，剪切时保持原引用）
        if (
          state === 'copy' &&
          tempData.value &&
          typeof tempData.value === 'string' &&
          tempData.value.startsWith('=')
        ) {
          tempData.value = adjustFormulaRefs(tempData.value, colDelta, rowDelta)
          // 清除缓存的计算结果，让公式引擎重新计算
          tempData.formula = null
          tempData.calculated = null
        }

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

    // merged cells case
    const overlapMergedCells = this.getOverlapMergedCells(clipRange)
    if (overlapMergedCells.length > 0) {
      let mergedCells = this.getMergedCells()
      overlapMergedCells.forEach((omc) => {
        const colPointer = omc.col - col // 相对起始列的偏移量
        const rowPointer = omc.row - row // 相对起始行的偏移量
        mergedCells.push({
          col: activeCol + colPointer,
          row: activeRow + rowPointer,
          colCount: omc.colCount,
          rowCount: omc.rowCount,
        })
      })

      if (state === 'cut') {
        mergedCells = without(mergedCells, ...overlapMergedCells)
        this.setMergedCells(mergedCells)
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

    // refresh merged cells when row number changed
    this.refreshMergedCellsWhenInsert(position, rowCount, 'row')

    // 更新公式引用
    if (this.formulaEngine) {
      this.formulaEngine.updateReferences('row', position, rowCount)
    }

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

    // refresh merged cells when col number changed
    this.refreshMergedCellsWhenInsert(position, colCount, 'col')

    // 更新公式引用
    if (this.formulaEngine) {
      this.formulaEngine.updateReferences('col', position, colCount)
    }

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

    // refresh merged cells when row number changed
    this.refreshMergedCellsWhenDelete(startRow, rowCount, 'row')

    // 更新公式引用
    if (this.formulaEngine) {
      this.formulaEngine.updateReferences('row', startRow, -rowCount)
    }

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

    // refresh merged cells when col number changed
    this.refreshMergedCellsWhenDelete(startCol, colCount, 'col')

    // 更新公式引用
    if (this.formulaEngine) {
      this.formulaEngine.updateReferences('col', startCol, -colCount)
    }

    this.history.save(this.sheetData)
  }

  /**
   * @description 隐藏行
   * @param {*} startRow 隐藏的起始行
   * @param {*} rowCount 行数
   */
  hideRows(startRow, rowCount) {
    this.sheetData = deepClone(this.sheetData)

    const { rowsMeta } = this.sheetData
    // hide rowsMeta
    hideMeta(rowsMeta, startRow, rowCount)

    this.history.save(this.sheetData)
  }

  /**
   * @description 隐藏列
   * @param {*} startCol 隐藏的起始列
   * @param {*} colCount 列数
   */
  hideCols(startCol, colCount) {
    this.sheetData = deepClone(this.sheetData)

    const { colsMeta } = this.sheetData
    // hide colsMeta
    hideMeta(colsMeta, startCol, colCount)

    this.history.save(this.sheetData)
  }

  /**
   * @description 取消隐藏行
   * @param {*} startRow
   * @param {*} rowCount
   */
  cancelHideRows(startRow, rowCount) {
    this.sheetData = deepClone(this.sheetData)

    const { rowsMeta } = this.sheetData
    // cancel hide rowsMeta
    cancelHideMeta(rowsMeta, startRow, rowCount)

    this.history.save(this.sheetData)
  }

  /**
   * @description 取消隐藏列
   * @param {*} startCol
   * @param {*} colCount
   */
  cancelHideCols(startCol, colCount) {
    this.sheetData = deepClone(this.sheetData)

    const { colsMeta } = this.sheetData
    // cancel hide colsMeta
    cancelHideMeta(colsMeta, startCol, colCount)

    this.history.save(this.sheetData)
  }

  rowResize({ row, count, newSize }, start = false, finished = false) {
    if (start) {
      this.sheetData = deepClone(this.sheetData)
    }

    const { rowsMeta } = this.sheetData
    changeMetaSize(rowsMeta, row, count, newSize)

    if (finished) {
      this.history.save(this.sheetData)
    }
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

  mergeCell({ row, col, rowCount, colCount }) {
    this.saveLastSelectorStatus()

    this.sheetData = deepClone(this.sheetData)

    const overlapMergedCells = this.getOverlapMergedCells({ row, col, rowCount, colCount })
    // 嵌套单元格合并：待合并的单元格里包含了mergedCell的场景
    if (overlapMergedCells.length > 0) {
      let newMergedCells = without(this.getMergedCells(), ...overlapMergedCells)
      newMergedCells = deepClone(newMergedCells)
      newMergedCells.push({ row, col, rowCount, colCount })
      this.sheetData.mergedCells = newMergedCells
    } else {
      this.sheetData.mergedCells.push({ row, col, rowCount, colCount })
    }

    // 删除单元格信息（除第一个）
    const { data } = this.sheetData
    clearCellsData(data, { col, colCount, row, rowCount }, { col, row })

    this.history.save(this.sheetData)
  }

  cancelMergeCell({ row, col, rowCount, colCount }) {
    this.saveLastSelectorStatus()

    const overlapMergedCells = this.getOverlapMergedCells({ row, col, rowCount, colCount })
    // 嵌套单元格合并：待合并的单元格里包含了mergedCell的场景
    if (overlapMergedCells.length > 0) {
      let newMergedCells = without(this.getMergedCells(), ...overlapMergedCells)
      newMergedCells = deepClone(newMergedCells)
      this.sheetData = update.$set(this.sheetData, 'mergedCells', newMergedCells)
    }

    this.history.save(this.sheetData)
  }

  /**
   * @description 获得一个范围内覆盖到的合并单元格
   * @param {CellRange} cellRange {row, col, rowCount, colCount}
   * @returns {Array} mergedCells 覆盖到的合并单元格数组
   */
  getOverlapMergedCells(cellRange) {
    const allMergedCells = this.getMergedCells()
    const overlapingMC = []
    const cr = { ...DEFAULT_CELL_RANGE, ...cellRange }
    allMergedCells.forEach((mc) => {
      if (overlap(mc, cr)) {
        overlapingMC.push(mc)
      }
    })

    return overlapingMC
  }

  /**
   * @description refresh merged cells when row or column number changed
   * @param {*} start start row | col number
   * @param {*} count row | col count
   * @param {*} direction row or col
   */
  refreshMergedCellsWhenInsert(start, count, direction) {
    const allMergedCells = this.getMergedCells()
    allMergedCells.forEach(({ col, row, colCount, rowCount }, index) => {
      const mc = allMergedCells[index]
      if (direction === 'row') {
        // through merged cell
        if (start > row && start <= row + rowCount - 1) {
          mc.rowCount += count
        } else if (start <= row) {
          // start row above merged cell
          mc.row += count
        }
      } else if (direction === 'col') {
        // through merged cell
        if (start > col && start <= col + colCount - 1) {
          mc.colCount += count
        } else if (start <= col) {
          // to the left of merged cell
          mc.col += count
        }
      }
    })
  }

  // ==================== 冻结行/列相关方法 ====================

  /**
   * @description 设置冻结配置
   * @param {number} freezeX - 冻结的列数 (0 = 不冻结)
   * @param {number} freezeY - 冻结的行数 (0 = 不冻结)
   */
  setFreeze(freezeX, freezeY) {
    this.sheetData = update.$set(this.sheetData, ['freezeX'], freezeX)
    this.sheetData = update.$set(this.sheetData, ['freezeY'], freezeY)
    this.history.save(this.sheetData)
  }

  /**
   * @description 获取冻结配置
   * @returns {{freezeX: number, freezeY: number}}
   */
  getFreeze() {
    return {
      freezeX: this.sheetData.freezeX || 0,
      freezeY: this.sheetData.freezeY || 0,
    }
  }

  /**
   * @description 获取冻结列的总像素宽度（包含行头）
   * @returns {number}
   */
  getFrozenColsWidth() {
    const { colsMeta, freezeX } = this.sheetData
    const { rowHeaderWidth } = this.theme
    if (!freezeX || freezeX <= 0) return rowHeaderWidth

    let width = rowHeaderWidth
    for (let i = 0; i < freezeX && i < colsMeta.length; i += 1) {
      width += colsMeta[i].size
    }
    return width
  }

  /**
   * @description 获取冻结行的总像素高度（包含列头）
   * @returns {number}
   */
  getFrozenRowsHeight() {
    const { rowsMeta, freezeY } = this.sheetData
    const { colHeaderHeight } = this.theme
    if (!freezeY || freezeY <= 0) return colHeaderHeight

    let height = colHeaderHeight
    for (let i = 0; i < freezeY && i < rowsMeta.length; i += 1) {
      height += rowsMeta[i].size
    }
    return height
  }

  /**
   * @description 获取四个区域的单元格范围（用于冻结渲染）
   * @returns {Object} 包含 frozenCorner, frozenRows, frozenCols, normal 四个区域
   */
  getViewportCellRangeWithFreeze() {
    const { container, sheetData } = this
    const { scrollX, scrollY, freezeX, freezeY } = sheetData
    const { width, height } = container.getBoundingClientRect()

    const frozenColsWidth = this.getFrozenColsWidth()
    const frozenRowsHeight = this.getFrozenRowsHeight()

    // 计算可视区域的右边界和下边界对应的列/行索引
    const rightEdgeCol = this.getColByOffset(frozenColsWidth + scrollX + (width - frozenColsWidth))
    const bottomEdgeRow = this.getRowByOffset(
      frozenRowsHeight + scrollY + (height - frozenRowsHeight)
    )

    // 计算普通区域的起始列/行
    const normalStartCol = Math.max(freezeX, this.getColByOffset(frozenColsWidth + scrollX))
    const normalStartRow = Math.max(freezeY, this.getRowByOffset(frozenRowsHeight + scrollY))

    // 区域A: 冻结角落 (不滚动)
    let frozenCorner = null
    if (freezeX > 0 && freezeY > 0) {
      frozenCorner = { col: 0, row: 0, colCount: freezeX, rowCount: freezeY }
    }

    // 区域B: 仅冻结行 (水平滚动)
    let frozenRows = null
    if (freezeY > 0) {
      frozenRows = {
        col: freezeX,
        row: 0,
        colCount: Math.max(rightEdgeCol - freezeX + 1, 0),
        rowCount: freezeY,
      }
    }

    // 区域C: 仅冻结列 (垂直滚动)
    let frozenCols = null
    if (freezeX > 0) {
      frozenCols = {
        col: 0,
        row: freezeY,
        colCount: freezeX,
        rowCount: Math.max(bottomEdgeRow - freezeY + 1, 0),
      }
    }

    // 区域D: 普通可滚动区域 (双向滚动)
    const normal = {
      col: normalStartCol,
      row: normalStartRow,
      colCount: Math.max(rightEdgeCol - normalStartCol + 1, 0),
      rowCount: Math.max(bottomEdgeRow - normalStartRow + 1, 0),
    }

    return { frozenCorner, frozenRows, frozenCols, normal }
  }

  /**
   * @description 根据屏幕坐标获取单元格（支持冻结区域）
   * @param {number} screenX - 屏幕X坐标（相对于canvas）
   * @param {number} screenY - 屏幕Y坐标（相对于canvas）
   * @returns {Object} 单元格信息
   */
  getCellByScreenOffset(screenX, screenY) {
    const { sheetData } = this
    const { scrollX, scrollY } = sheetData

    const frozenColsWidth = this.getFrozenColsWidth()
    const frozenRowsHeight = this.getFrozenRowsHeight()

    // 判断点击位置所在区域
    const inFrozenColsArea = screenX < frozenColsWidth
    const inFrozenRowsArea = screenY < frozenRowsHeight

    // 计算文档坐标
    let docX = screenX
    let docY = screenY

    // 如果不在冻结列区域，需要加上水平滚动偏移
    if (!inFrozenColsArea) {
      docX = screenX + scrollX
    }
    // 如果不在冻结行区域，需要加上垂直滚动偏移
    if (!inFrozenRowsArea) {
      docY = screenY + scrollY
    }

    return this.getCellByOffset(docX, docY)
  }

  /**
   * @description 获取前N列的总宽度
   * @param {number} colCount
   * @returns {number}
   */
  getColsWidthUpTo(colCount) {
    const { colsMeta } = this.sheetData
    let width = 0
    for (let i = 0; i < colCount && i < colsMeta.length; i += 1) {
      width += colsMeta[i].size
    }
    return width
  }

  /**
   * @description 获取前N行的总高度
   * @param {number} rowCount
   * @returns {number}
   */
  getRowsHeightUpTo(rowCount) {
    const { rowsMeta } = this.sheetData
    let height = 0
    for (let i = 0; i < rowCount && i < rowsMeta.length; i += 1) {
      height += rowsMeta[i].size
    }
    return height
  }

  /**
   * @description refresh merged cells when row or column number changed
   * @param {*} start start row | col number
   * @param {*} count row | col count
   * @param {*} direction row or col
   */
  refreshMergedCellsWhenDelete(start, count, direction) {
    let allMergedCells = this.getMergedCells()
    const waitingToDelete = []
    allMergedCells.forEach((mergedCell) => {
      const mc = mergedCell
      if (direction === 'row') {
        // end row above merged cell
        if (start + count - 1 < mc.row) {
          mc.row -= count
        } else {
          const olRange = overlapRange({ start: mc.row, count: mc.rowCount }, { start, count })
          if (olRange) {
            // if merged cell delete
            if (olRange.count === mc.rowCount) {
              waitingToDelete.push(mc)
            }
            // 如果合并单元格删的只剩一行，并且合并单元格只有一列，等同于合并单元格被删除
            else if (olRange.count === mc.rowCount - 1 && mc.colCount === 1) {
              waitingToDelete.push(mc)
            }
            // 合并单元格上半部分被删除
            else if (olRange.start === mc.row) {
              mc.row = start
              mc.rowCount -= olRange.count
            } else {
              mc.rowCount -= olRange.count
            }
          }
        }
      } else if (direction === 'col') {
        // end col to the left of merged cell
        if (start + count - 1 < mc.col) {
          mc.col -= count
        } else {
          const olRange = overlapRange({ start: mc.col, count: mc.colCount }, { start, count })
          if (olRange) {
            // if merged cell delete
            if (olRange.count === mc.colCount) {
              waitingToDelete.push(mc)
            }
            // 如果合并单元格删的只剩一列，并且合并单元格只有一行，等同于合并单元格被删除
            else if (olRange.count === mc.colCount - 1 && mc.rowCount === 1) {
              waitingToDelete.push(mc)
            }
            // 合并单元格的左半部分被删除
            else if (olRange.start === mc.col) {
              mc.col = start
              mc.colCount -= olRange.count
            } else {
              mc.colCount -= olRange.count
            }
          }
        }
      }
    })
    allMergedCells = without(allMergedCells, ...waitingToDelete)
    this.setMergedCells(allMergedCells)
  }
}

export default ViewModel
