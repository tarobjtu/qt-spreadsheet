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
    this.clear()
    this.drawBody()
    this.drawHeader()

    perf()
    // // 测试渲染性能
    // perf(() => {
    //   this.drawBody()
    // }, 'drawBody')

    // perf(() => {
    //   this.drawHeader()
    // }, 'drawHeader')
  }

  clear() {
    const { canvas, ctx } = this
    ctx.clearRect(0, 0, canvas.width, canvas.height)
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
    const { strokeStyle, fillStyle } = theme.default

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

    this.drawText(col, row, data)
  }

  drawText(col, row, data) {
    const { ctx, theme, viewModel } = this
    const { scrollX, scrollY } = viewModel.sheetData
    const { value, style } = data
    const offsetX = col.offset
    const offsetY = row.offset
    const cellWidth = col.size
    const cellHeight = row.size
    const { paddingLeft, paddingRight, paddingTop, paddingBottom } = theme.cellPadding
    const fontSize = style.fontSize || theme.default.fontSize
    const textAlign = style.textAlign || theme.default.textAlign
    const textBaseline = style.textBaseline || theme.default.textBaseline
    const wordWrap = style.wordWrap || theme.default.wordWrap
    const color = style.color || theme.default.color
    const { lineHeight } = theme.default

    ctx.save()
    ctx.fillStyle = color
    ctx.font = font(theme.default, style)
    ctx.textAlign = textAlign
    ctx.textBaseline = textBaseline

    let x
    let y
    let lines = [] // 保存每行字符串
    const texts = (value + '').split('\n')
    const cellInnerWidth = cellWidth - paddingLeft - paddingRight

    if (wordWrap) {
      texts.forEach((t) => {
        const words = t.split('')
        const lineEnds = [] // 保存每行结束的位置
        let lineBegin = 0
        let wordsLengh = 0

        words.forEach((word, index) => {
          const { width } = ctx.measureText(word)
          wordsLengh += width
          if (wordsLengh > cellInnerWidth) {
            lineEnds.push(index - 1)
            wordsLengh = width
          }
        })
        // 最后一行宽度不够cellInnerWidth
        if (lineEnds[lineEnds.length - 1] !== words.length - 1) {
          lineEnds.push(words.length - 1)
        }
        lineEnds.forEach((lineEnd) => {
          lines.push(t.slice(lineBegin, lineEnd + 1))
          lineBegin = lineEnd + 1
        })
      })
    } else {
      lines = texts
    }

    if (textAlign === 'left') {
      x = offsetX + paddingLeft
    } else if (textAlign === 'center') {
      x = offsetX + cellWidth / 2
    } else if (textAlign === 'right') {
      x = offsetX + cellWidth - paddingRight
    }
    if (textBaseline === 'top') {
      y = offsetY + paddingTop
    } else if (textBaseline === 'middle') {
      y = offsetY + cellHeight / 2 - ((lines.length - 1) * fontSize * lineHeight) / 2
    } else if (textBaseline === 'bottom') {
      y = offsetY + cellHeight - paddingBottom - (lines.length - 1) * fontSize * lineHeight
    }

    lines.forEach((line) => {
      ctx.fillText(line, x - scrollX, y - scrollY)
      y += fontSize * lineHeight
    })
    ctx.restore()
  }

  drawHeader() {
    const { ctx, viewModel, theme } = this
    const { colsMeta, rowsMeta, scrollX, scrollY } = viewModel.sheetData
    const selector = viewModel.getSelector()
    const { col, row, colCount, rowCount } = viewModel.getViewportCRs()

    assignStyle(ctx, theme.header)

    // 绘制列头
    for (let ci = col; ci < col + colCount; ci += 1) {
      const cMeta = colsMeta[ci]
      const selected = ci >= selector.col && ci <= selector.col + selector.colCount - 1
      this.drawHeaderCell({
        col: cMeta,
        row: { offset: 0, size: theme.colHeaderHeight },
        text: numberToAlpha(ci),
        scrollX,
        scrollY: 0,
        selected,
      })
    }

    // 绘制行头
    for (let ri = row; ri < row + rowCount; ri += 1) {
      const rMeta = rowsMeta[ri]
      const selected = ri >= selector.row && ri <= selector.row + selector.rowCount - 1
      this.drawHeaderCell({
        col: { offset: 0, size: theme.rowHeaderWidth },
        row: rMeta,
        text: ri + 1,
        scrollX: 0,
        scrollY,
        selected,
      })
    }

    // 绘制 Corner
    this.drawHeaderCell({
      col: { offset: 0, size: theme.rowHeaderWidth },
      row: { offset: 0, size: theme.colHeaderHeight },
      text: '',
      scrollX: 0,
      scrollY: 0,
      selected: false,
    })

    ctx.save()
  }

  drawHeaderCell({ col, row, text, scrollX, scrollY, selected }) {
    const { ctx, theme } = this
    const { fillStyle, strokeStyle, color } = theme.header

    // 填充颜色
    ctx.fillStyle = selected ? theme.activeHeader.fillStyle : fillStyle
    ctx.fillRect(col.offset - scrollX, row.offset - scrollY, col.size, row.size)

    // 画边框
    ctx.strokeStyle = strokeStyle
    ctx.strokeRect(col.offset - scrollX, row.offset - scrollY, col.size, row.size)

    // 文字
    ctx.fillStyle = selected ? theme.activeHeader.color : color
    ctx.fillText(text, col.offset - scrollX + col.size / 2, row.offset - scrollY + row.size / 2)
  }
}

export default Painter
