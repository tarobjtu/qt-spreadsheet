import EventEmitter from 'eventemitter3'
import throttle from 'lodash/throttle'
import History from './History'
import ViewModel from './ViewModel'
import Painter from './Painter'
import Events from './Events'
import Scrollbar from '../components/Scrollbar'
import Selector from '../components/Selector'
import Editor from '../components/Editor'
import defaultTheme from '../configs/defaultTheme'
import { perf } from '../utils/common'

class Sheet extends EventEmitter {
  constructor({ data, container, options }) {
    super()
    this.data = data
    this.opts = options
    this.container = container
    this.theme = this.opts.theme || defaultTheme

    this.initComponents()
    this.draw()
    this.bindEvent()

    // 在开发环境快速查看电子表格核心数据，调试便利
    if (process.env.NODE_ENV === 'development') {
      window.qtSheet = this
      window.qtViewModel = this.viewModel
      window.qtSheetData = () => this.viewModel.getSheetData()
      window.qtHistory = this.viewModel.history
    }
  }

  destroy() {
    const { resize } = this.events
    window.removeEventListener('resize', resize)
    this.scrollbar.destroy()
    this.editor.destroy()
    this.events.destroy()
  }

  initComponents() {
    const { data, container, theme, ctx, opts } = this

    this.history = new History(data)
    this.viewModel = new ViewModel({
      container,
      theme,
      sheetData: data,
      history: this.history,
    })
    this.painter = new Painter({
      container,
      options: opts,
      theme,
      viewModel: this.viewModel,
      ctx,
    })
    this.events = new Events({
      sheet: this,
      container,
      canvas: this.painter.getCanvas(),
      viewModel: this.viewModel,
    })
    // 初始化滚动条
    this.scrollbar = new Scrollbar({
      sheet: this,
      container,
      theme,
      viewModel: this.viewModel,
    })
    // 初始化选择器
    this.selector = new Selector({
      sheet: this,
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

  draw() {
    this.painter.draw()
    this.selector.position()
    this.scrollbar.draw()
  }

  bindEvent() {
    // 缓存事件列表，对象销毁时使用
    this.events = {}
    const resize = throttle(this.resize.bind(this), 300)
    this.events.resize = resize

    window.addEventListener('resize', resize)
  }

  save() {
    this.emit('save')
  }

  delete() {
    this.emit('delete')
  }

  getData() {
    return this.viewModel.getSheetData()
  }

  loadData(data) {
    this.viewModel.updateData(data)
    this.draw()
    this.emit('loadData')
  }

  resize() {
    this.painter.setCanvasSize()
    this.draw()
  }

  scroll(scrollX, scrollY) {
    const changed = this.viewModel.updateScroll(scrollX, scrollY)
    if (changed) {
      this.draw()
      this.emit('scroll')
    }
  }

  undo() {
    if (!this.history.canUndo()) return
    this.history.undo((sheetData) => {
      this.viewModel.setSheetData(sheetData)
      this.draw()
      this.emit('undo')
    })
  }

  redo() {
    if (!this.history.canRedo()) return
    this.history.redo((sheetData) => {
      this.viewModel.setSheetData(sheetData)
      this.draw()
      this.emit('redo')
    })
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
    const selector = this.viewModel.getSelector()
    const col = colIndex === undefined ? selector.col : colIndex
    const row = rowIndex === undefined ? selector.row : rowIndex
    const type = cellType === undefined ? selector.type : cellType

    if (type === 'cell') {
      const cellData = clearText === true ? '' : this.viewModel.getCellText(col, row)
      this.editor.setValue(cellData, col, row)
      this.editor.position().show().focus()
      this.selector.hide()
    }
  }

  /**
   * @description 设置单元格的值
   * @param {*} value
   * @param {*} colIndex
   * @param {*} rowIndex
   * @param {*} state 状态包括：input、finished（历史版本只保存最后的一次输入）
   */
  setCellText(value, colIndex, rowIndex, state = 'input') {
    const selector = this.viewModel.getSelector()
    const col = colIndex === undefined ? selector.col : colIndex
    const row = rowIndex === undefined ? selector.row : rowIndex
    this.viewModel.setCellText(col, row, value, state)
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
   * @param {*} col
   * @param {*} row
   */
  clearCellText(col, row) {
    this.viewModel.setCellText(col, row, '')
    this.draw()
  }

  /**
   * @description 清除选中单元格的值
   */
  clearSelectedCellsText() {
    const cells = this.viewModel.getSelectedCells()
    cells.forEach(({ col, row }) => {
      this.viewModel.setCellText(col, row, '')
    })
    this.draw()
  }

  /**
   * @description 设置选中单元格的样式，出于性能考量，批量更新样式时，在第一个调用deepClone方法
   * @param {*} colIndex
   * @param {*} rowIndex
   * @param {*} style
   */
  setCellsStyle(style) {
    const { col, row, colCount, rowCount } = this.viewModel.getSelector()
    if (colCount === 1 && rowCount === 1) {
      this.viewModel.setCellStyle(col, row, style)
    } else {
      perf(() => {
        this.setCellsStyleBatched(style)
      }, 'setCellsStyleBatched')
    }
    this.draw()
  }

  setCellsStyleBatched(style) {
    const { col, row, colCount, rowCount } = this.viewModel.getSelector()
    for (let i = col; i < col + colCount; i += 1) {
      for (let j = row; j < row + rowCount; j += 1) {
        const start = i === col && j === row
        const finished = i === col + colCount - 1 && j === row + rowCount - 1
        this.viewModel.setCellStyleBatched(i, j, style, start, finished)
      }
    }
    this.draw()
  }

  toggleCellsStyle(key) {
    const { col, row } = this.viewModel.getSelector()
    const style = this.viewModel.getCellStyle(col, row)
    if (style[key] === undefined || style[key] === '') {
      this.setCellsStyle({ [key]: key })
    } else {
      this.setCellsStyle({ [key]: '' })
    }

    this.draw()
  }

  /**
   * @description 选中某个单元格，通过快捷键
   * @param {*} direction 选择方向
   * @param {*} multiple 多选
   */
  selectorMove(direction, multiple) {
    const { col, row, colCount, rowCount, activeCol, activeRow } = this.viewModel.getSelector()
    const maxCol = this.viewModel.getMaxColIndex()
    const maxRow = this.viewModel.getMaxRowIndex()

    // single selection
    if (multiple !== true) {
      if (direction === 'left') {
        this.selectCell(col - 1, row)
      } else if (direction === 'right') {
        this.selectCell(col + 1, row)
      } else if (direction === 'up') {
        this.selectCell(col, row - 1)
      } else if (direction === 'down') {
        this.selectCell(col, row + 1)
      }
    }

    // multiply selection
    if (multiple === true) {
      if (direction === 'left') {
        if (col <= 0) return
        // back operation
        if (col === activeCol && colCount > 1) {
          this.selectCells({ col, row, colCount: colCount - 1, rowCount })
        } else {
          this.selectCells({ col: col - 1, row, colCount: colCount + 1, rowCount })
        }
      } else if (direction === 'right') {
        if (col + colCount - 1 >= maxCol) return
        // back operation
        if (col < activeCol) {
          this.selectCells({ col: col + 1, row, colCount: colCount - 1, rowCount })
        } else {
          this.selectCells({ col, row, colCount: colCount + 1, rowCount })
        }
      } else if (direction === 'up') {
        if (row <= 0) return
        // back operation
        if (row === activeRow && rowCount > 1) {
          this.selectCells({ col, row, colCount, rowCount: rowCount - 1 })
        } else {
          this.selectCells({ col, row: row - 1, colCount, rowCount: rowCount + 1 })
        }
      } else if (direction === 'down') {
        if (row + rowCount - 1 >= maxRow) return
        // back operation
        if (row < activeRow) {
          this.selectCells({ col, row: row + 1, colCount, rowCount: rowCount - 1 })
        } else {
          this.selectCells({ col, row, colCount, rowCount: rowCount + 1 })
        }
      }
    }
  }

  /**
   * @description 选中某个单元格,通过行列位置
   * @param {*} col 选中的单元格列位置
   * @param {*} row 选中的单元格行位置
   */
  selectCell(col = 0, row = 0) {
    this.selectCells({ col, row, colCount: 1, rowCount: 1, activeCol: col, activeRow: row })
  }

  /**
   * @description 选中一些单元格,通过行列位置
   * @param {*} col 选中的起始单元格列位置
   * @param {*} row 选中的起始单元格行位置
   * @param {*} colCount 选中的列个数
   * @param {*} rowCount 选中的行个数
   * @param {*} activeCol 激活的单元格列位置
   * @param {*} activeRow 激活的单元格行位置
   */
  selectCells({ col, row, colCount, rowCount, activeCol, activeRow }) {
    this.viewModel.setSelector({ col, row, colCount, rowCount, activeCol, activeRow })
    this.painter.drawHeader() // 行、列头样式变化为选中状态
    this.selector.position().show()
    this.editor.hide()
    this.emit('select')
  }

  /**
   * @description 选中全部单元格
   */
  selectAllCells() {
    const { col, row, colCount, rowCount } = this.viewModel.getAllCells()
    this.selectCells({ col, row, colCount, rowCount, activeCol: col, activeRow: row })
  }

  selectRow(row) {
    const maxCol = this.viewModel.getMaxColIndex()
    this.selectCells({ col: 0, row, colCount: maxCol, rowCount: 1, activeCol: 0, activeRow: row })
  }

  selectCol(col) {
    const maxRow = this.viewModel.getMaxRowIndex()
    this.selectCells({ col, row: 0, colCount: 1, rowCount: maxRow, activeCol: col, activeRow: 0 })
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
      // switch+case缩进的eslint判断有些问题
      /* eslint-disable */
      switch (type) {
        case 'corner':
          this.selectAllCells()
          break
        case 'colHeader':
          this.selectCol(col)
          break
        case 'rowHeader':
          this.selectRow(row)
          break
        case 'cell':
          this.selectCell(col, row)
          break
        default:
          break
      }
      /* eslint-enable */
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
}

export default Sheet
