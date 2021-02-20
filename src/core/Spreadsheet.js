import EventEmitter from 'eventemitter3'
import Toolbar from '../components/Toolbar'
import Sheet from './Sheet'
import defaultConfig from '../configs/defaultConfig'
import defaultTheme from '../configs/defaultTheme'
import { getSheetData } from '../utils/sheet'
import './spreadsheet.scss'

class Spreadsheet extends EventEmitter {
  constructor({ root, options }) {
    super()
    this.opts = { ...defaultConfig, ...options }
    this.theme = this.opts.theme || defaultTheme

    root.classList.add('qt-spreadsheet')
    const toolbar = document.createElement('div')
    toolbar.classList.add('qt-spreadsheet-toolbar')
    root.appendChild(toolbar)
    const formula = document.createElement('div')
    formula.classList.add('qt-spreadsheet-formula')
    root.appendChild(formula)
    const canvas = document.createElement('div')
    canvas.classList.add('qt-spreadsheet-canvas-container')
    root.appendChild(canvas)

    this.sheetData = getSheetData({
      colCount: this.opts.colsMeta.count,
      rowCount: this.opts.rowsMeta.count,
      theme: this.theme,
    })

    this.sheet = new Sheet({
      data: this.sheetData,
      container: canvas,
      options: this.opts,
    })

    this.toolbar = new Toolbar({
      container: toolbar,
      sheet: this.sheet,
    })

    // 选中上次打开时选中的单元格，默认第一个单元格
    this.sheet.selectCell()

    this.bindEvents()
  }

  destroy() {
    this.sheet.destroy()
    this.toolbar.destroy()
  }

  bindEvents() {
    this.sheet.on('save', this.onSave.bind(this))
    this.sheet.on('delete', this.onDelete.bind(this))
  }

  onSave(savedData) {
    this.emit('save', savedData)
  }

  onDelete() {
    this.emit('delete')
  }

  loadData(data) {
    // 加载电子表格格式数据
    if (data?.vender === 'qt-spreadsheet') {
      this.sheetData = data
    } else {
      // 加载二维数组格式数据
      this.sheetData = getSheetData({
        colCount: data[0].length,
        rowCount: data.length,
        theme: this.theme,
        data,
      })
    }
    this.sheet.loadData(this.sheetData)
  }
}

export default Spreadsheet
