import { assignStyle, perf, numberToAlpha } from '../utils/common'
import { font } from '../utils/canvas'

class Painter {
  constructor({ sheet, viewModel, theme, container, options }) {
    this.sheet = sheet
    this.viewModel = viewModel
    this.theme = theme
    this.container = container
    this.options = options

    this.initElements()
    this.setCanvasSize()
  }

  initElements() {
    const { container } = this
    this.canvas = document.createElement('canvas')
    this.canvas.classList.add('qt-spreadsheet-canvas')
    this.ctx = this.canvas.getContext('2d')
    container.appendChild(this.canvas)
  }

  getCanvas() {
    return this.canvas
  }

  setCanvasSize() {
    const { container, canvas, options, ctx } = this
    const width = container.offsetWidth
    const height = container.offsetHeight
    canvas.width = width * options.ratio
    canvas.height = height * options.ratio
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(options.ratio, options.ratio)
    ctx.translate(-0.5, 0.5)
  }

  draw() {
    this.drawBody()
    this.drawHeader()

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
    const { ctx, viewModel, theme } = this
    const { colsMeta, rowsMeta } = viewModel.sheetData
    const { col, row, colCount, rowCount } = viewModel.getViewportCRs()

    assignStyle(ctx, theme.default)

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

export default Painter
