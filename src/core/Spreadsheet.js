import defaultConfig from '../configs/defaultConfig'
import defaultSheetData from '../configs/defaultSheetData'
import defaultTheme from '../configs/defaultTheme'
import { assignStyle, perf, numberToAlpha } from '../utils/utils'
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
    this.opts = opts
    this.theme = opts.theme || defaultTheme
    this.ctx = ctx
    this.sheetData = defaultSheetData(this.opts, this.theme)

    perf(() => {
      this.drawHeaderPerf()
    }, 'drawHeaderPerf')

    // perf(() => {
    //   this.drawHeader()
    // }, 'drawHeader')

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
    ctx.save()
  }

  drawCell(col, row) {
    const { ctx } = this
    ctx.moveTo(col.offset, row.offset)
    ctx.lineTo(col.offset + col.size, row.offset)
    ctx.moveTo(col.offset, row.offset)
    ctx.lineTo(col.offset, row.offset + row.size)
  }

  drawHeaderPerf() {
    const { ctx, theme } = this

    ctx.beginPath()
    assignStyle(ctx, theme.header)

    this.drawHeaderFillStyle()
    this.drawHeaderFillText()
    this.drawHeaderStroke()

    this.drawHeaderCell(
      { offset: 0, size: theme.rowHeaderWidth },
      { offset: 0, size: theme.colHeaderHeight },
      ''
    )

    ctx.save()
  }

  drawHeaderFillStyle() {
    const { ctx, sheetData, theme } = this
    const { colMeta, rowMeta } = sheetData
    const { fillStyle } = theme.header

    ctx.fillStyle = fillStyle

    for (let i = 0; i < colMeta.length; i += 1) {
      const col = colMeta[i]
      const row = { offset: 0, size: theme.colHeaderHeight }
      ctx.rect(col.offset, row.offset, col.size, row.size)
    }

    for (let j = 0; j < rowMeta.length; j += 1) {
      const row = rowMeta[j]
      const col = { offset: 0, size: theme.rowHeaderWidth }
      ctx.rect(col.offset, row.offset, col.size, row.size)
    }

    ctx.fill()
  }

  drawHeaderStroke() {
    const { ctx, sheetData, theme } = this
    const { colMeta, rowMeta } = sheetData
    const { strokeStyle } = theme.header

    this.ctx.beginPath()
    ctx.strokeStyle = strokeStyle

    for (let i = 0; i < colMeta.length; i += 1) {
      const col = colMeta[i]
      const row = { offset: 0, size: theme.colHeaderHeight }
      ctx.moveTo(col.offset, row.offset)
      ctx.lineTo(col.offset + col.size, row.offset)
      ctx.moveTo(col.offset, row.offset)
      ctx.lineTo(col.offset, row.offset + row.size)
    }

    for (let j = 0; j < rowMeta.length; j += 1) {
      const row = rowMeta[j]
      const col = { offset: 0, size: theme.rowHeaderWidth }
      ctx.moveTo(col.offset, row.offset)
      ctx.lineTo(col.offset + col.size, row.offset)
      ctx.moveTo(col.offset, row.offset)
      ctx.lineTo(col.offset, row.offset + row.size)
    }

    ctx.stroke()
  }

  drawHeaderFillText() {
    const { ctx, sheetData, theme } = this
    const { colMeta, rowMeta } = sheetData
    const { color } = theme.header

    ctx.fillStyle = color
    // 列头
    for (let i = 0; i < colMeta.length; i += 1) {
      const col = colMeta[i]
      const row = { offset: 0, size: theme.colHeaderHeight }
      ctx.fillText(
        numberToAlpha(i),
        col.offset + col.size / 2,
        row.offset + row.size / 2
      )
    }
    // 行头
    for (let j = 0; j < rowMeta.length; j += 1) {
      const row = rowMeta[j]
      const col = { offset: 0, size: theme.rowHeaderWidth }
      ctx.fillText(j + 1, col.offset + col.size / 2, row.offset + row.size / 2)
    }
  }

  drawHeader() {
    const { ctx, sheetData, theme } = this
    const { colMeta, rowMeta } = sheetData

    ctx.beginPath()
    assignStyle(ctx, theme.header)

    for (let i = 0; i < colMeta.length; i += 1) {
      const col = colMeta[i]
      this.drawHeaderCell(
        col,
        { offset: 0, size: theme.colHeaderHeight },
        numberToAlpha(i)
      )
    }

    for (let j = 0; j < rowMeta.length; j += 1) {
      const row = rowMeta[j]
      this.drawHeaderCell({ offset: 0, size: theme.rowHeaderWidth }, row, j + 1)
    }

    this.drawHeaderCell(
      { offset: 0, size: theme.rowHeaderWidth },
      { offset: 0, size: theme.colHeaderHeight },
      ''
    )

    ctx.save()
  }

  drawHeaderCell(col, row, text) {
    const { ctx, theme } = this
    const { fillStyle, strokeStyle, color } = theme.header

    // 填充颜色
    ctx.fillStyle = fillStyle
    ctx.fillRect(col.offset, row.offset, col.size, row.size)

    // 画边框
    this.ctx.beginPath()
    ctx.strokeStyle = strokeStyle
    ctx.moveTo(col.offset, row.offset)
    ctx.lineTo(col.offset + col.size, row.offset)
    ctx.moveTo(col.offset, row.offset)
    ctx.lineTo(col.offset, row.offset + row.size)
    ctx.stroke()

    // 文字
    ctx.fillStyle = color
    ctx.fillText(text, col.offset + col.size / 2, row.offset + row.size / 2)
  }
}

export default Spreadsheet
