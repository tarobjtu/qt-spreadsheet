import Toolbar from '../components/Toolbar'
import Sheet from './Sheet'
import defaultConfig from '../configs/defaultConfig'
import defaultTheme from '../configs/defaultTheme'
import { getSheetData } from '../utils/sheet'
import './spreadsheet.scss'

class Spreadsheet {
  constructor({ root, options }) {
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
  }

  loadData(data) {
    this.sheetData = getSheetData({
      colCount: data[0].length,
      rowCount: data.length,
      theme: this.theme,
      data,
    })
    this.sheet.loadData(this.sheetData)
    this.sheet.draw()
  }
}

export default Spreadsheet
