import defaultConfig from '../configs/defaultConfig'
import defaultSheetData from '../configs/defaultSheetData'
import defaultTheme from '../configs/defaultTheme'
import { assignStyle, perf } from '../utils/utils'
import '../style/core.scss'

class Spreadsheet {
  constructor({ root, options }) {
    const opts = { ...defaultConfig, ...options }
    const canvas = document.createElement('canvas')
    canvas.classList.add('qt-spreadsheet-canvas')
    root.appendChild(canvas)

    const width = opts.width || canvas.offsetWidth
    const height = opts.height || canvas.offsetHeight
    canvas.width = width * opts.ratio
    canvas.height = height * opts.ratio
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(opts.ratio, opts.ratio)
    ctx.translate(10, 10)

    this.canvas = canvas
    this.ctx = ctx
    this.sheetData = defaultSheetData(defaultConfig)

    perf(() => {
      this.drawBody()
    }, 'drawBody')
  }

  drawBody() {
    const { ctx, sheetData } = this
    const { colMeta, rowMeta } = sheetData

    ctx.beginPath()
    assignStyle(ctx, defaultTheme.default)

    for (let i = 0; i < colMeta.length; i += 1) {
      for (let j = 0; j < rowMeta.length; j += 1) {
        const col = colMeta[i]
        const row = rowMeta[j]
        this.drawCell(col, row)
      }
    }
    ctx.stroke()
  }

  drawCell(col, row) {
    const { ctx } = this
    ctx.moveTo(col.offset, row.offset)
    ctx.lineTo(col.offset + col.size, row.offset)
    ctx.moveTo(col.offset, row.offset)
    ctx.lineTo(col.offset, row.offset + row.size)
    // ctx.rect(col.offset, row.offset, col.size, row.size)
  }
}

export default Spreadsheet
