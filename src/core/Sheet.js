import _ from 'lodash'
import ViewModel from './ViewModel'
import Scrollbar from '../components/Scrollbar'
import defaultTheme from '../configs/defaultTheme'
import { assignStyle, perf, numberToAlpha } from '../utils/common'
import '../style/core.scss'

class Sheet {
  constructor({ data, container, options }) {
    this.sheetData = data
    this.opts = options
    this.container = container
    this.theme = this.opts.theme || defaultTheme
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.canvas.classList.add('qt-spreadsheet-canvas')
    container.appendChild(this.canvas)
    this.viewModel = new ViewModel({
      canvas: this.canvas,
      sheetData: this.sheetData,
      theme: this.theme,
    })
    this.scrollbar = new Scrollbar({
      container,
      theme: this.theme,
      viewModel: this.viewModel,
    })
    this.setCanvasSize()
    this.draw()
    this.bindEvent()
  }

  destroy() {
    const { resize } = this.events
    window.removeEventListener('resize', resize)
  }

  bindEvent() {
    // 缓存事件列表，对象销毁时使用
    this.events = {}
    const resize = _.throttle(this.resize.bind(this), 300)
    this.events.resize = resize

    window.addEventListener('resize', resize)
  }

  resize() {
    this.setCanvasSize()
    this.draw()
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
    this.sheetData = data
    this.viewModel.updateData(data)
  }

  draw() {
    // perf(() => {
    //   this.drawHeader()
    // }, 'drawHeader')

    perf(() => {
      this.drawBody()
    }, 'drawBody')

    perf(() => {
      this.drawHeaderPerf()
    }, 'drawHeaderPerf')

    perf(() => {
      this.scrollbar.draw()
    }, 'drawScrollbar')
  }

  drawBody() {
    const { ctx, sheetData, viewModel } = this
    const { colsMeta, rowsMeta, data } = sheetData
    const { col, row, colCount, rowCount } = viewModel.getViewportCRs()

    assignStyle(ctx, defaultTheme.default)

    for (let i = col; i < col + colCount; i += 1) {
      for (let j = row; j < row + rowCount; j += 1) {
        const cMeta = colsMeta[i]
        const rMeta = rowsMeta[j]
        const text = _.get(data, [j, i], '')
        this.drawCell(cMeta, rMeta, text)
      }
    }
  }

  drawCell(col, row, text) {
    const { ctx, sheetData, theme } = this
    const { scrollX, scrollY } = sheetData
    const { cellPadding } = theme
    const { strokeStyle, color, fillStyle, fontFamily } = theme.default

    // 绘制边框
    ctx.beginPath()
    ctx.strokeStyle = strokeStyle
    ctx.moveTo(col.offset - scrollX, row.offset - scrollY)
    ctx.lineTo(col.offset + col.size - scrollX, row.offset - scrollY)
    ctx.moveTo(col.offset - scrollX, row.offset - scrollY)
    ctx.lineTo(col.offset - scrollX, row.offset + row.size - scrollY)
    ctx.closePath()
    ctx.stroke()

    // 填充背景色
    ctx.fillStyle = fillStyle
    ctx.fillRect(col.offset - scrollX, row.offset - scrollY, col.size, row.size)

    // 绘制文字
    ctx.fillStyle = color
    ctx.font = fontFamily
    ctx.textAlign = ctx.fillText(
      text,
      col.offset - scrollX + cellPadding.left,
      row.offset - scrollY + row.size / 2
    )
  }

  drawHeaderPerf() {
    const { ctx, theme } = this

    assignStyle(ctx, theme.header)

    ctx.beginPath()
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
    const { colsMeta, rowsMeta } = sheetData
    const { fillStyle } = theme.header

    ctx.fillStyle = fillStyle

    for (let i = 0; i < colsMeta.length; i += 1) {
      const col = colsMeta[i]
      const row = { offset: 0, size: theme.colHeaderHeight }
      ctx.rect(col.offset, row.offset, col.size, row.size)
    }

    for (let j = 0; j < rowsMeta.length; j += 1) {
      const row = rowsMeta[j]
      const col = { offset: 0, size: theme.rowHeaderWidth }
      ctx.rect(col.offset, row.offset, col.size, row.size)
    }

    ctx.fill()
  }

  drawHeaderStroke() {
    const { ctx, sheetData, theme } = this
    const { colsMeta, rowsMeta } = sheetData
    const { strokeStyle } = theme.header

    ctx.beginPath()
    ctx.strokeStyle = strokeStyle

    for (let i = 0; i < colsMeta.length; i += 1) {
      const col = colsMeta[i]
      const row = { offset: 0, size: theme.colHeaderHeight }
      ctx.moveTo(col.offset, row.offset)
      ctx.lineTo(col.offset + col.size, row.offset)
      ctx.moveTo(col.offset, row.offset)
      ctx.lineTo(col.offset, row.offset + row.size)
    }

    for (let j = 0; j < rowsMeta.length; j += 1) {
      const row = rowsMeta[j]
      const col = { offset: 0, size: theme.rowHeaderWidth }
      ctx.moveTo(col.offset, row.offset)
      ctx.lineTo(col.offset + col.size, row.offset)
      ctx.moveTo(col.offset, row.offset)
      ctx.lineTo(col.offset, row.offset + row.size)
    }
    ctx.closePath()

    ctx.stroke()
  }

  drawHeaderFillText() {
    const { ctx, sheetData, theme } = this
    const { colsMeta, rowsMeta } = sheetData
    const { color } = theme.header

    ctx.fillStyle = color
    // 列头
    for (let i = 0; i < colsMeta.length; i += 1) {
      const col = colsMeta[i]
      const row = { offset: 0, size: theme.colHeaderHeight }
      ctx.fillText(
        numberToAlpha(i),
        col.offset + col.size / 2,
        row.offset + row.size / 2
      )
    }
    // 行头
    for (let j = 0; j < rowsMeta.length; j += 1) {
      const row = rowsMeta[j]
      const col = { offset: 0, size: theme.rowHeaderWidth }
      ctx.fillText(j + 1, col.offset + col.size / 2, row.offset + row.size / 2)
    }
  }

  drawHeader() {
    const { ctx, sheetData, theme } = this
    const { colsMeta, rowsMeta } = sheetData

    ctx.beginPath()
    assignStyle(ctx, theme.header)

    for (let i = 0; i < colsMeta.length; i += 1) {
      const col = colsMeta[i]
      this.drawHeaderCell(
        col,
        { offset: 0, size: theme.colHeaderHeight },
        numberToAlpha(i)
      )
    }

    for (let j = 0; j < rowsMeta.length; j += 1) {
      const row = rowsMeta[j]
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
    ctx.beginPath()
    ctx.strokeStyle = strokeStyle
    ctx.moveTo(col.offset, row.offset)
    ctx.lineTo(col.offset + col.size, row.offset)
    ctx.moveTo(col.offset, row.offset)
    ctx.lineTo(col.offset, row.offset + row.size)
    ctx.closePath()
    ctx.stroke()

    // 文字
    ctx.fillStyle = color
    ctx.fillText(text, col.offset + col.size / 2, row.offset + row.size / 2)
  }
}

export default Sheet
