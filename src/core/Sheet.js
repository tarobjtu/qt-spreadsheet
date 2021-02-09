import _ from 'lodash'
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
    this.setCanvasSize()
    this.draw()
    this.bindEvent()
  }

  bindEvent() {
    window.addEventListener('resize', _.throttle(this.resize.bind(this), 300))
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
    const { colsMeta, rowsMeta, data } = sheetData

    const { col, row, colCount, rowCount } = this.getViewportCRs()

    ctx.beginPath()
    assignStyle(ctx, defaultTheme.default)

    for (let i = col; i < col + colCount; i += 1) {
      for (let j = row; j < row + rowCount; j += 1) {
        const cMeta = colsMeta[i]
        const rMeta = rowsMeta[j]
        const text = _.get(data, [j, i], '')
        this.drawCell(cMeta, rMeta, text)
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

    this.ctx.beginPath()
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

  /**
   * @description 找到视窗范围内可见的全部单元格
   */
  getViewportCRs(top = 0, left = 0) {
    const { canvas } = this
    const { width, height } = canvas.getBoundingClientRect()

    const start = this.getCellByOffset(left, top)
    const end = this.getCellByOffset(left + width, top + height)

    return {
      row: start.row,
      col: start.col,
      rowCount: end.row - start.row + 1,
      colCount: end.col - start.row + 1,
    }
  }

  /**
   * @description 找到坐标left、top命中的表格单元格
   * @param {*} left
   * @param {*} top
   */
  getCellByOffset(left, top) {
    const col = this.getColByOffset(left)
    const row = this.getRowByOffset(top)
    return {
      col,
      row,
    }
  }

  /**
   * @description 找到坐标left命中的表格列，二分法查找
   * @param {*} left
   */
  getColByOffset(left) {
    const { colsMeta } = this.sheetData
    let min = 0
    let max = colsMeta.length - 1
    let result

    if (left < colsMeta[min].offset) return min
    if (left > colsMeta[max].offset) return max

    while (min !== max) {
      const mid = Math.floor((max + min) / 2)
      if (
        left >= colsMeta[mid].offset &&
        left <= colsMeta[mid].offset + colsMeta[mid].size
      ) {
        result = mid
        break
      } else if (left < colsMeta[mid].offset) {
        max = mid
      } else {
        min = mid
      }
    }

    return result
  }

  /**
   * @description 找到坐标top命中的表格行，二分法查找
   * @param {*} top
   */
  getRowByOffset(top) {
    const { rowsMeta } = this.sheetData
    let min = 0
    let max = rowsMeta.length - 1
    let result

    if (top < rowsMeta[min].offset) return min
    if (top > rowsMeta[max].offset) return max

    while (min !== max) {
      const mid = Math.floor((max + min) / 2)
      if (
        top >= rowsMeta[mid].offset &&
        top <= rowsMeta[mid].offset + rowsMeta[mid].size
      ) {
        result = mid
        break
      } else if (top < rowsMeta[mid].offset) {
        max = mid
      } else {
        min = mid
      }
    }

    return result
  }
}

export default Sheet
