import EventEmitter from 'eventemitter3'
import _ from 'lodash'
import ViewModel from './ViewModel'
import Events from './Events'
import Scrollbar from '../components/Scrollbar'
import Selector from '../components/Selector'
import Editor from '../components/Editor'
import defaultTheme from '../configs/defaultTheme'
import { assignStyle, perf, numberToAlpha } from '../utils/common'
import { font } from '../utils/canvas'

class Sheet extends EventEmitter {
  constructor({ data, container, options }) {
    super()
    this.data = data
    this.opts = options
    this.container = container
    this.theme = this.opts.theme || defaultTheme
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.canvas.classList.add('qt-spreadsheet-canvas')
    container.appendChild(this.canvas)

    this.initComponents()
    this.setCanvasSize()
    this.draw()
    this.bindEvent()

    if (process.env.NODE_ENV === 'development') {
      window.sheet = this
      window.viewModel = this.viewModel
      window.sheetData = this.viewModel.sheetData
    }
  }

  initComponents() {
    const { data, container, canvas, theme } = this
    this.viewModel = new ViewModel({
      canvas,
      sheetData: data,
      theme,
    })
    this.events = new Events({
      sheet: this,
      container,
      canvas,
      viewModel: this.viewModel,
    })
    // 初始化滚动条
    this.scrollbar = new Scrollbar({
      sheet: this,
      container,
      canvas,
      theme,
      viewModel: this.viewModel,
    })
    // 初始化选择器
    this.selector = new Selector({
      container,
      viewModel: this.viewModel,
    })
    // 初始化编辑器
    this.editor = new Editor({
      sheet: this,
      container,
      viewModel: this.viewModel,
    })
  }

  destroy() {
    const { resize } = this.events
    window.removeEventListener('resize', resize)

    this.scrollbar.destroy()
  }

  bindEvent() {
    // 缓存事件列表，对象销毁时使用
    this.events = {}
    const resize = _.throttle(this.resize.bind(this), 300)
    this.events.resize = resize

    window.addEventListener('resize', resize)
  }

  /**
   * @description 通过鼠标位置开启编辑器
   * @param {*} offsetX
   * @param {*} offsetY
   */
  showEditorByOffset(offsetX, offsetY) {
    const { scrollX, scrollY } = this.viewModel.sheetData
    const { row, col, type } = this.viewModel.getCellByOffset(offsetX + scrollX, offsetY + scrollY)

    this.showEditor({ colIndex: col, rowIndex: row, cellType: type })
  }

  /**
   * @description 开启编辑器
   * @param {*} colIndex
   * @param {*} rowIndex
   * @param {*} cellType
   * @param {*} clearText 清空单元格现有数据
   */
  showEditor({ colIndex, rowIndex, cellType, clearText } = {}) {
    const { scrollX, scrollY } = this.viewModel.sheetData
    const selector = this.viewModel.getSelector()
    const col = colIndex === undefined ? selector.col : colIndex
    const row = rowIndex === undefined ? selector.row : rowIndex
    const type = cellType === undefined ? selector.type : cellType

    if (type === 'cell') {
      const { left, top, width, height } = this.viewModel.getCellBBox(col, row)
      const cellData = clearText === true ? '' : this.viewModel.getCellText(col, row)
      this.editor.setOffset({ left: left - scrollX, top: top - scrollY, width, height })
      this.editor.setValue(cellData, col, row).show().focus()
      this.selector.hide()
    }
  }

  /**
   * @description 设置单元格的值
   * @param {*} colIndex
   * @param {*} rowIndex
   * @param {*} value
   */
  setCellText(value, colIndex, rowIndex) {
    const selector = this.viewModel.getSelector()
    const col = colIndex === undefined ? selector.col : colIndex
    const row = rowIndex === undefined ? selector.row : rowIndex
    this.viewModel.setCellText(col, row, value)
    this.draw()
  }

  /**
   * @description 在单元格值后面追加内容
   * @param {*} value
   * @param {*} colIndex
   * @param {*} rowIndex
   */
  appendCellText(value, colIndex, rowIndex) {
    const selector = this.viewModel.getSelector()
    const col = colIndex === undefined ? selector.col : colIndex
    const row = rowIndex === undefined ? selector.row : rowIndex
    this.viewModel.appendCellText(col, row, value)
    this.draw()
  }

  /**
   * @description 清除单元格的值
   * @param {*} colIndex
   * @param {*} rowIndex
   */
  clearCellText(colIndex, rowIndex) {
    const selector = this.viewModel.getSelector()
    const col = colIndex === undefined ? selector.col : colIndex
    const row = rowIndex === undefined ? selector.row : rowIndex
    this.viewModel.setCellText(col, row, '')
    this.draw()
  }

  /**
   * @description 设置选中单元格的样式
   * @param {*} colIndex
   * @param {*} rowIndex
   * @param {*} style
   */
  setCellsStyle(style) {
    const { col, row, colCount, rowCount } = this.viewModel.getSelector()
    for (let i = col; i < col + colCount; i += 1) {
      for (let j = row; j < row + rowCount; j += 1) {
        this.viewModel.setCellStyle(i, j, style)
      }
    }

    this.draw()
    this.emit('cellStyleChange')
  }

  /**
   * @description 选中某个单元格，通过快捷键
   * @param {*} direction 选择方向
   * @param {*} multiple 多选
   */
  selectorMove(direction, multiple) {
    const { col, row, colCount, rowCount } = this.viewModel.getSelector()
    const maxCol = this.viewModel.getMaxColIndex()
    const maxRow = this.viewModel.getMaxRowIndex()

    // 单选
    if (multiple !== true) {
      if (direction === 'left') {
        this.selectCell({ col: col - 1, row })
      } else if (direction === 'right') {
        this.selectCell({ col: col + 1, row })
      } else if (direction === 'up') {
        this.selectCell({ col, row: row - 1 })
      } else if (direction === 'down') {
        this.selectCell({ col, row: row + 1 })
      }
    }

    // 多选
    if (multiple === true) {
      if (direction === 'left') {
        if (col <= 0) return
        this.selectCells({ col: col - 1, row, colCount: colCount + 1, rowCount })
      } else if (direction === 'right') {
        if (col + colCount - 1 >= maxCol) return
        this.selectCells({ col, row, colCount: colCount + 1, rowCount })
      } else if (direction === 'up') {
        if (row <= 0) return
        this.selectCells({ col, row: row - 1, colCount, rowCount: rowCount + 1 })
      } else if (direction === 'down') {
        if (row + rowCount - 1 >= maxRow) return
        this.selectCells({ col, row, colCount, rowCount: rowCount + 1 })
      }
    }
  }

  /**
   * @description 选中某个单元格,通过行列位置
   * @param {*} col 选中的单元格列位置
   * @param {*} row 选中的单元格行位置
   */
  selectCell({ col, row, type } = { col: 0, row: 0, type: 'cell' }) {
    const { scrollX, scrollY } = this.viewModel.sheetData
    const { left, top, width, height } = this.viewModel.getCellBBox(col, row)
    this.viewModel.setSelector({ col, row, type, activeCol: col, activeRow: row })
    this.selector.setOffset({ left: left - scrollX, top: top - scrollY, width, height })
    this.selector.show()
    this.editor.hide()
    this.emit('select')
  }

  /**
   * @description 选中一些单元格,通过行列位置
   * @param {*} col 选中的起始单元格列位置
   * @param {*} row 选中的起始单元格行位置
   * @param {*} colCount 选中的列个数
   * @param {*} rowCount 选中的行个数
   */
  selectCells({ col, row, colCount, rowCount } = { col: 0, row: 0, colCount: 1, rowCount: 1 }) {
    const { scrollX, scrollY } = this.viewModel.sheetData
    const { left, top, width, height } = this.viewModel.getCellsBBox({
      col,
      row,
      colCount,
      rowCount,
    })
    this.viewModel.setSelector({ col, row, colCount, rowCount })
    this.selector.setOffset({ left: left - scrollX, top: top - scrollY, width, height })
    this.selector.show()
    this.editor.hide()
    this.emit('select')
  }

  /**
   * @description 通过鼠标位置选中单元格（点击、圈选）
   * @param {*} startOffsetX 点击或圈选的起始位置
   * @param {*} startOffsetY 点击或圈选的起始位置
   * @param {*} endOffsetX 圈选的终止位置
   * @param {*} endOffsetY 圈选的终止位置
   */
  selectCellsByOffset(startOffsetX, startOffsetY, endOffsetX, endOffsetY) {
    const { scrollX, scrollY } = this.viewModel.sheetData
    // 点击选择
    if (endOffsetX === undefined || endOffsetY === undefined) {
      const { col, row, type } = this.viewModel.getCellByOffset(
        startOffsetX + scrollX,
        startOffsetY + scrollY
      )
      this.selectCell({ col, row, type })
    } else {
      // 圈选
      const { col, row, colCount, rowCount } = this.viewModel.getRectCRs({
        left: Math.min(startOffsetX, endOffsetX) + scrollX,
        top: Math.min(startOffsetY, endOffsetY) + scrollY,
        width: Math.abs(startOffsetX - endOffsetX),
        height: Math.abs(startOffsetY - endOffsetY),
      })
      this.selectCells({ col, row, colCount, rowCount })
    }
  }

  resize() {
    this.setCanvasSize()
    this.draw()
  }

  scroll(scrollX, scrollY) {
    const changed = this.viewModel.updateScroll(scrollX, scrollY)
    if (changed) {
      this.draw()
    }
  }

  setCanvasSize() {
    const { container, canvas, opts, ctx } = this
    const width = container.offsetWidth
    const height = container.offsetHeight
    canvas.width = width * opts.ratio
    canvas.height = height * opts.ratio
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(opts.ratio, opts.ratio)
    ctx.translate(-0.5, 0.5)
  }

  loadData(data) {
    this.viewModel.updateData(data)
    this.draw()
    this.emit('loadData')
  }

  draw() {
    this.drawBody()
    this.drawHeader()
    this.scrollbar.draw()

    perf()
    // 测试渲染性能
    // perf(() => {
    //   this.drawBody()
    // }, 'drawBody')

    // perf(() => {
    //   this.drawHeader()
    // }, 'drawHeader')

    // perf(() => {
    //   this.scrollbar.draw()
    // }, 'drawScrollbar')
  }

  drawBody() {
    const { ctx, viewModel } = this
    const { colsMeta, rowsMeta } = viewModel.sheetData
    const { col, row, colCount, rowCount } = viewModel.getViewportCRs()

    assignStyle(ctx, defaultTheme.default)

    for (let i = col; i < col + colCount; i += 1) {
      for (let j = row; j < row + rowCount; j += 1) {
        const cMeta = colsMeta[i]
        const rMeta = rowsMeta[j]
        const data = viewModel.getCellData(i, j)
        this.drawCell(cMeta, rMeta, data)
      }
    }
  }

  drawCell(col, row, data) {
    const { ctx, viewModel, theme } = this
    const { scrollX, scrollY } = viewModel.sheetData
    const { cellPadding } = theme
    const { strokeStyle, color, fillStyle, textAlign } = theme.default

    // 绘制边框
    ctx.strokeStyle = data.style?.border?.color || strokeStyle
    ctx.beginPath()
    ctx.moveTo(col.offset - scrollX, row.offset - scrollY)
    ctx.lineTo(col.offset + col.size - scrollX, row.offset - scrollY)
    ctx.lineTo(col.offset + col.size - scrollX, row.offset + row.size - scrollY)
    ctx.lineTo(col.offset - scrollX, row.offset + row.size - scrollY)
    ctx.lineTo(col.offset - scrollX, row.offset - scrollY)
    ctx.closePath()
    ctx.stroke()

    // 填充背景色
    ctx.fillStyle = data.style?.backgroundColor || fillStyle
    ctx.fillRect(col.offset - scrollX, row.offset - scrollY, col.size, row.size)

    // 绘制文字
    ctx.fillStyle = data.style?.color || color
    ctx.textAlign = textAlign
    ctx.font = font(theme.default, data.style)
    ctx.fillText(
      data.value,
      col.offset - scrollX + cellPadding.left,
      row.offset - scrollY + row.size / 2
    )
  }

  drawHeader() {
    const { ctx, viewModel, theme } = this
    const { colsMeta, rowsMeta } = viewModel.sheetData
    const { scrollX, scrollY } = viewModel.sheetData
    const { col, row, colCount, rowCount } = viewModel.getViewportCRs()

    ctx.beginPath()
    assignStyle(ctx, theme.header)

    for (let i = col; i < col + colCount; i += 1) {
      const cMeta = colsMeta[i]
      this.drawHeaderCell(cMeta, { offset: 0, size: theme.colHeaderHeight }, numberToAlpha(i), {
        scrollX,
        scrollY: 0,
      })
    }

    for (let j = row; j < row + rowCount; j += 1) {
      const rMeta = rowsMeta[j]
      this.drawHeaderCell({ offset: 0, size: theme.rowHeaderWidth }, rMeta, j + 1, {
        scrollX: 0,
        scrollY,
      })
    }

    this.drawHeaderCell(
      { offset: 0, size: theme.rowHeaderWidth },
      { offset: 0, size: theme.colHeaderHeight },
      ''
    )

    ctx.save()
  }

  drawHeaderCell(col, row, text, { scrollX, scrollY } = { scrollX: 0, scrollY: 0 }) {
    const { ctx, theme } = this
    const { fillStyle, strokeStyle, color } = theme.header

    // 填充颜色
    ctx.fillStyle = fillStyle
    ctx.fillRect(col.offset - scrollX, row.offset - scrollY, col.size, row.size)

    // 画边框
    ctx.strokeStyle = strokeStyle
    ctx.strokeRect(col.offset - scrollX, row.offset - scrollY, col.size, row.size)

    // 文字
    ctx.fillStyle = color
    ctx.fillText(text, col.offset - scrollX + col.size / 2, row.offset - scrollY + row.size / 2)
  }
}

export default Sheet
