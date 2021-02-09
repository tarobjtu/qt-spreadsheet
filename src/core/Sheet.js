import _ from 'lodash'
import defaultTheme from '../configs/defaultTheme'
import { assignStyle, perf, numberToAlpha } from '../utils/common'
import '../style/core.scss'

class Sheet {
  constructor({ data, root, options }) {
    this.sheetData = data
    this.opts = options
    this.theme = this.opts.theme || defaultTheme
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.canvas.classList.add('qt-spreadsheet-canvas')
    root.appendChild(this.canvas)
    this.setCanvasSize()
    this.draw()
  }

  setCanvasSize() {
    const { canvas, opts } = this
    const width = this.canvas.offsetWidth
    const height = this.canvas.offsetHeight
    canvas.width = width * opts.ratio
    canvas.height = height * opts.ratio
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    this.ctx.scale(this.opts.ratio, this.opts.ratio)
    this.ctx.translate(10, 10)
  }

  loadData(data) {
    this.sheetData = data
  }

  draw() {
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
    const { colMeta, rowMeta, data } = sheetData

    ctx.beginPath()
    assignStyle(ctx, defaultTheme.default)

    for (let i = 0; i < colMeta.length; i += 1) {
      for (let j = 0; j < rowMeta.length; j += 1) {
        const col = colMeta[i]
        const row = rowMeta[j]
        const text = _.get(data, [j, i], '')
        this.drawCell(col, row, text)
      }
    }

    ctx.save()
  }

  drawCell(col, row, text) {
    const { ctx, theme } = this
    const { cellPadding } = theme
    const { strokeStyle, color, fillStyle } = theme.default

    // 绘制边框
    ctx.beginPath()
    ctx.strokeStyle = strokeStyle
    ctx.moveTo(col.offset, row.offset)
    ctx.lineTo(col.offset + col.size, row.offset)
    ctx.moveTo(col.offset, row.offset)
    ctx.lineTo(col.offset, row.offset + row.size)
    ctx.stroke()

    // 填充背景色
    ctx.fillStyle = fillStyle
    ctx.fillRect(col.offset, row.offset, col.size, row.size)

    // 绘制文字
    ctx.fillStyle = color
    ctx.textAlign = ctx.fillText(
      text,
      col.offset + cellPadding.left,
      row.offset + row.size / 2
    )
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

export default Sheet
