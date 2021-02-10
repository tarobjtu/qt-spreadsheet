import _ from 'lodash'
import ViewModel from './ViewModel'
import Events from './Events'
import Scrollbar from '../components/Scrollbar'
import Selector from '../components/Selector'
import Editor from '../components/Editor'
import defaultTheme from '../configs/defaultTheme'
import { assignStyle, perf, numberToAlpha } from '../utils/common'

class Sheet {
  constructor({ data, container, options }) {
    this.opts = options
    this.container = container
    this.theme = this.opts.theme || defaultTheme
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.canvas.classList.add('qt-spreadsheet-canvas')
    container.appendChild(this.canvas)

    this.viewModel = new ViewModel({
      canvas: this.canvas,
      sheetData: data,
      theme: this.theme,
    })
    this.events = new Events({
      sheet: this,
      canvas: this.canvas,
      viewModel: this.viewModel,
    })
    this.scrollbar = new Scrollbar({
      sheet: this,
      container,
      canvas: this.canvas,
      theme: this.theme,
      viewModel: this.viewModel,
    })
    this.selector = new Selector({
      container,
      viewModel: this.viewModel,
    })
    this.editor = new Editor({
      sheet: this,
      container,
      viewModel: this.viewModel,
    })

    this.setCanvasSize()
    this.draw()
    this.bindEvent()
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

  edit(offsetX, offsetY) {
    const { scrollX, scrollY } = this.viewModel.sheetData
    const { row, col, type } = this.viewModel.getCellByOffset(offsetX + scrollX, offsetY + scrollY)

    if (type === 'cell') {
      const { left, top, width, height } = this.viewModel.getCellBBox(col, row, type)
      const cellData = this.viewModel.getCellData(col, row)
      this.editor.setOffset({ left: left - scrollX, top: top - scrollY, width, height })
      this.editor.setValue(cellData, col, row).show().focus()
      this.selector.hide()
    }
  }

  select(startOffsetX, startOffsetY, endOffsetX, endOffsetY) {
    const { scrollX, scrollY } = this.viewModel.sheetData
    // 点击选择
    if (endOffsetX === undefined || endOffsetY === undefined) {
      const { row, col, type } = this.viewModel.getCellByOffset(
        startOffsetX + scrollX,
        startOffsetY + scrollY
      )
      const { left, top, width, height } = this.viewModel.getCellBBox(col, row, type)
      this.selector.setOffset({ left: left - scrollX, top: top - scrollY, width, height })
      this.selector.show()
      this.editor.hide()
    } else {
      // 圈选
      const { col, row, colCount, rowCount } = this.viewModel.getRectCRs({
        left: Math.min(startOffsetX, endOffsetX) + scrollX,
        top: Math.min(startOffsetY, endOffsetY) + scrollY,
        width: Math.abs(startOffsetX - endOffsetX),
        height: Math.abs(startOffsetY - endOffsetY),
      })
      const { left, top, width, height } = this.viewModel.getCellsBBox({
        col,
        row,
        colCount,
        rowCount,
      })
      this.selector.setOffset({ left: left - scrollX, top: top - scrollY, width, height })
      this.selector.show()
      this.editor.hide()
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
  }

  draw() {
    this.drawBody()
    this.drawHeader()
    this.scrollbar.draw()

    perf()
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
    const { colsMeta, rowsMeta, data } = viewModel.sheetData
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
    const { ctx, viewModel, theme } = this
    const { scrollX, scrollY } = viewModel.sheetData
    const { cellPadding } = theme
    const { strokeStyle, color, fillStyle } = theme.default

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
    ctx.textAlign = ctx.fillText(
      text,
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
