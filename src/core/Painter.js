import { assignStyle, perf, numberToAlpha } from '../utils/common'
import { font, overlap } from '../utils/canvas'
import { getRangeMeta } from '../utils/model'
import { isError } from '../formula/errors'

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
    const { ctx, viewModel } = this
    const { freezeX, freezeY } = viewModel.sheetData

    // 如果没有冻结，使用原有简单渲染
    if (!freezeX && !freezeY) {
      this.drawBodySimple()
      return
    }

    // 获取四个区域
    const regions = viewModel.getViewportCellRangeWithFreeze()

    // 绘制区域D：普通可滚动区域（双向滚动）
    if (regions.normal && regions.normal.colCount > 0 && regions.normal.rowCount > 0) {
      this.setClipRegion('normal')
      this.drawBodyRegion(regions.normal, { scrollX: true, scrollY: true })
    }

    // 绘制区域B：冻结行（仅水平滚动）
    if (regions.frozenRows && regions.frozenRows.colCount > 0) {
      this.setClipRegion('frozenRows')
      this.drawBodyRegion(regions.frozenRows, { scrollX: true, scrollY: false })
    }

    // 绘制区域C：冻结列（仅垂直滚动）
    if (regions.frozenCols && regions.frozenCols.rowCount > 0) {
      this.setClipRegion('frozenCols')
      this.drawBodyRegion(regions.frozenCols, { scrollX: false, scrollY: true })
    }

    // 绘制区域A：冻结角落（不滚动）
    if (regions.frozenCorner) {
      this.setClipRegion('frozenCorner')
      this.drawBodyRegion(regions.frozenCorner, { scrollX: false, scrollY: false })
    }

    // 清除裁剪
    ctx.restore()

    // 绘制冻结分隔线
    this.drawFreezeLines()
  }

  /**
   * @description 简单渲染（无冻结时使用）
   */
  drawBodySimple() {
    const { ctx, viewModel, theme } = this
    const { colsMeta, rowsMeta, mergedCells } = viewModel.sheetData
    const vpCellRange = viewModel.getViewportCellRange()
    const { col, row, colCount, rowCount } = vpCellRange

    assignStyle(ctx, theme.default)

    // normal cell
    for (let ri = row; ri < row + rowCount; ri += 1) {
      for (let ci = col; ci < col + colCount; ci += 1) {
        const cMeta = colsMeta[ci]
        const rMeta = rowsMeta[ri]
        const data = viewModel.getCellData(ci, ri)
        this.drawCell(cMeta, rMeta, data)
      }
    }

    // merged cell
    mergedCells.forEach((mCellRange) => {
      if (overlap(mCellRange, vpCellRange)) {
        const cMeta = getRangeMeta(colsMeta, mCellRange.col, mCellRange.colCount)
        const rMeta = getRangeMeta(rowsMeta, mCellRange.row, mCellRange.rowCount)
        const data = viewModel.getCellData(mCellRange.col, mCellRange.row)
        this.drawCell(cMeta, rMeta, data)
      }
    })
  }

  /**
   * @description 设置Canvas裁剪区域
   * @param {string} region - 区域名称: 'frozenCorner', 'frozenRows', 'frozenCols', 'normal'
   */
  setClipRegion(region) {
    const { ctx, viewModel, theme } = this
    const { rowHeaderWidth, colHeaderHeight } = theme
    const frozenColsWidth = viewModel.getFrozenColsWidth()
    const frozenRowsHeight = viewModel.getFrozenRowsHeight()
    const { width, height } = viewModel.container.getBoundingClientRect()

    ctx.restore()
    ctx.save()
    ctx.beginPath()

    switch (region) {
      case 'frozenCorner':
        ctx.rect(
          rowHeaderWidth,
          colHeaderHeight,
          frozenColsWidth - rowHeaderWidth,
          frozenRowsHeight - colHeaderHeight
        )
        break
      case 'frozenRows':
        ctx.rect(
          frozenColsWidth,
          colHeaderHeight,
          width - frozenColsWidth,
          frozenRowsHeight - colHeaderHeight
        )
        break
      case 'frozenCols':
        ctx.rect(
          rowHeaderWidth,
          frozenRowsHeight,
          frozenColsWidth - rowHeaderWidth,
          height - frozenRowsHeight
        )
        break
      case 'normal':
        ctx.rect(
          frozenColsWidth,
          frozenRowsHeight,
          width - frozenColsWidth,
          height - frozenRowsHeight
        )
        break
      default:
        break
    }

    ctx.clip()
  }

  /**
   * @description 渲染指定区域的单元格
   * @param {Object} cellRange - 单元格范围
   * @param {Object} scrollOptions - 滚动选项 { scrollX: boolean, scrollY: boolean }
   */
  drawBodyRegion(cellRange, scrollOptions = { scrollX: true, scrollY: true }) {
    const { ctx, viewModel, theme } = this
    const { colsMeta, rowsMeta, scrollX, scrollY, mergedCells } = viewModel.sheetData
    const { col, row, colCount, rowCount } = cellRange

    const effectiveScrollX = scrollOptions.scrollX ? scrollX : 0
    const effectiveScrollY = scrollOptions.scrollY ? scrollY : 0

    assignStyle(ctx, theme.default)

    // 渲染普通单元格
    for (let ri = row; ri < row + rowCount; ri += 1) {
      for (let ci = col; ci < col + colCount; ci += 1) {
        if (ci < colsMeta.length && ri < rowsMeta.length) {
          const cMeta = colsMeta[ci]
          const rMeta = rowsMeta[ri]
          const data = viewModel.getCellData(ci, ri)
          this.drawCellWithScroll(cMeta, rMeta, data, effectiveScrollX, effectiveScrollY)
        }
      }
    }

    // 渲染合并单元格
    mergedCells.forEach((mCellRange) => {
      if (overlap(mCellRange, cellRange)) {
        const cMeta = getRangeMeta(colsMeta, mCellRange.col, mCellRange.colCount)
        const rMeta = getRangeMeta(rowsMeta, mCellRange.row, mCellRange.rowCount)
        const data = viewModel.getCellData(mCellRange.col, mCellRange.row)
        this.drawCellWithScroll(cMeta, rMeta, data, effectiveScrollX, effectiveScrollY)
      }
    })
  }

  /**
   * @description 使用指定滚动偏移绘制单元格
   */
  drawCellWithScroll(cMeta, rMeta, data, scrollX, scrollY) {
    this.drawBackgroundWithScroll(cMeta, rMeta, data, scrollX, scrollY)
    this.drawBorderWithScroll(cMeta, rMeta, data.style, scrollX, scrollY)
    this.drawTextWithScroll(cMeta, rMeta, data, scrollX, scrollY)
    this.drawErrorIndicatorWithScroll(cMeta, rMeta, data, scrollX, scrollY)
  }

  /**
   * @description 使用指定滚动偏移绘制背景
   */
  drawBackgroundWithScroll(cMeta, rMeta, data, scrollX, scrollY) {
    const { ctx, theme } = this
    const { fillStyle } = theme.default
    ctx.save()
    ctx.fillStyle = data.style?.backgroundColor || fillStyle
    ctx.fillRect(cMeta.offset - scrollX, rMeta.offset - scrollY, cMeta.size, rMeta.size)
    ctx.restore()
  }

  /**
   * @description 使用指定滚动偏移绘制边框
   */
  drawBorderWithScroll(cMeta, rMeta, style, scrollX, scrollY) {
    const { ctx, theme } = this
    const { strokeStyle, lineWidth } = theme.default
    const { border } = style

    ctx.save()
    ctx.lineWidth = lineWidth

    // top
    ctx.beginPath()
    ctx.strokeStyle = border?.top?.color || strokeStyle
    ctx.moveTo(cMeta.offset - scrollX, rMeta.offset - scrollY)
    ctx.lineTo(cMeta.offset + cMeta.size - scrollX, rMeta.offset - scrollY)
    ctx.closePath()
    ctx.stroke()

    // right
    ctx.beginPath()
    ctx.strokeStyle = border?.right?.color || strokeStyle
    ctx.moveTo(cMeta.offset + cMeta.size - scrollX, rMeta.offset - scrollY)
    ctx.lineTo(cMeta.offset + cMeta.size - scrollX, rMeta.offset + rMeta.size - scrollY)
    ctx.closePath()
    ctx.stroke()

    // bottom
    ctx.beginPath()
    ctx.strokeStyle = border?.bottom?.color || strokeStyle
    ctx.moveTo(cMeta.offset + cMeta.size - scrollX, rMeta.offset + rMeta.size - scrollY)
    ctx.lineTo(cMeta.offset - scrollX, rMeta.offset + rMeta.size - scrollY)
    ctx.closePath()
    ctx.stroke()

    // left
    ctx.beginPath()
    ctx.strokeStyle = border?.left?.color || strokeStyle
    ctx.moveTo(cMeta.offset - scrollX, rMeta.offset + rMeta.size - scrollY)
    ctx.lineTo(cMeta.offset - scrollX, rMeta.offset - scrollY)
    ctx.closePath()
    ctx.stroke()

    ctx.restore()
  }

  /**
   * @description 使用指定滚动偏移绘制文本
   */
  drawTextWithScroll(cMeta, rMeta, data, scrollX, scrollY) {
    const { ctx, theme } = this
    const { style } = data
    const value = data.formula ? data.calculated : data.value
    const offsetX = cMeta.offset
    const offsetY = rMeta.offset
    const cellWidth = cMeta.size
    const cellHeight = rMeta.size
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
    let lines = []
    const texts = (value + '').split('\n')
    const cellInnerWidth = cellWidth - paddingLeft - paddingRight

    if (wordWrap) {
      texts.forEach((t) => {
        const words = t.split('')
        const lineEnds = []
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

  /**
   * @description 使用指定滚动偏移绘制错误指示器
   */
  drawErrorIndicatorWithScroll(cMeta, rMeta, data, scrollX, scrollY) {
    const value = data.formula ? data.calculated : data.value
    if (!isError(value)) return

    const { ctx } = this
    const triangleSize = 6

    const x = cMeta.offset + cMeta.size - scrollX
    const y = rMeta.offset - scrollY

    ctx.save()
    ctx.fillStyle = '#ea4335'
    ctx.beginPath()
    ctx.moveTo(x - triangleSize, y)
    ctx.lineTo(x, y)
    ctx.lineTo(x, y + triangleSize)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  /**
   * @description 绘制冻结分隔线
   */
  drawFreezeLines() {
    const { ctx, viewModel, theme } = this
    const { freezeX, freezeY } = viewModel.sheetData
    const { width, height } = viewModel.container.getBoundingClientRect()

    if (!freezeX && !freezeY) return

    const frozenColsWidth = viewModel.getFrozenColsWidth()
    const frozenRowsHeight = viewModel.getFrozenRowsHeight()
    const freezeLineStyle = theme.freezeLine || { strokeStyle: '#4285f4', lineWidth: 2 }

    ctx.save()
    ctx.strokeStyle = freezeLineStyle.strokeStyle
    ctx.lineWidth = freezeLineStyle.lineWidth

    // 绘制垂直冻结线（列冻结）
    if (freezeX > 0) {
      ctx.beginPath()
      ctx.moveTo(frozenColsWidth, 0)
      ctx.lineTo(frozenColsWidth, height)
      ctx.stroke()
    }

    // 绘制水平冻结线（行冻结）
    if (freezeY > 0) {
      ctx.beginPath()
      ctx.moveTo(0, frozenRowsHeight)
      ctx.lineTo(width, frozenRowsHeight)
      ctx.stroke()
    }

    ctx.restore()
  }

  drawCell(cMeta, rMeta, data) {
    this.drawBackground(cMeta, rMeta, data)
    this.drawBorder(cMeta, rMeta, data.style)
    this.drawText(cMeta, rMeta, data)
    this.drawErrorIndicator(cMeta, rMeta, data)
  }

  /**
   * @description 填充单元格背景色
   * @param {*} cMeta
   * @param {*} rMeta
   * @param {*} data
   */
  drawBackground(cMeta, rMeta, data) {
    const { ctx, viewModel, theme } = this
    const { scrollX, scrollY } = viewModel.sheetData
    const { fillStyle } = theme.default
    ctx.save()
    ctx.fillStyle = data.style?.backgroundColor || fillStyle
    ctx.fillRect(cMeta.offset - scrollX, rMeta.offset - scrollY, cMeta.size, rMeta.size)
    ctx.restore()
  }

  /**
   * @description 绘制单元格边框
   * @param {*} cMeta
   * @param {*} rMeta
   * @param {*} style
   */
  drawBorder(cMeta, rMeta, style) {
    const { ctx, theme, viewModel } = this
    const { scrollX, scrollY } = viewModel.sheetData
    const { strokeStyle, lineWidth } = theme.default
    const { border } = style

    ctx.save()
    ctx.lineWidth = lineWidth

    // top
    ctx.beginPath()
    ctx.strokeStyle = border?.top?.color || strokeStyle
    ctx.moveTo(cMeta.offset - scrollX, rMeta.offset - scrollY)
    ctx.lineTo(cMeta.offset + cMeta.size - scrollX, rMeta.offset - scrollY)
    ctx.closePath()
    ctx.stroke()

    // right
    ctx.beginPath()
    ctx.strokeStyle = border?.right?.color || strokeStyle
    ctx.moveTo(cMeta.offset + cMeta.size - scrollX, rMeta.offset - scrollY)
    ctx.lineTo(cMeta.offset + cMeta.size - scrollX, rMeta.offset + rMeta.size - scrollY)
    ctx.closePath()
    ctx.stroke()

    // bottom
    ctx.beginPath()
    ctx.strokeStyle = border?.bottom?.color || strokeStyle
    ctx.moveTo(cMeta.offset + cMeta.size - scrollX, rMeta.offset + rMeta.size - scrollY)
    ctx.lineTo(cMeta.offset - scrollX, rMeta.offset + rMeta.size - scrollY)
    ctx.closePath()
    ctx.stroke()

    // left
    ctx.beginPath()
    ctx.strokeStyle = border?.left?.color || strokeStyle
    ctx.moveTo(cMeta.offset - scrollX, rMeta.offset + rMeta.size - scrollY)
    ctx.lineTo(cMeta.offset - scrollX, rMeta.offset - scrollY)
    ctx.closePath()
    ctx.stroke()

    ctx.restore()
  }

  /**
   * @description 绘制错误指示器（右上角红色三角形）
   * @param {*} cMeta
   * @param {*} rMeta
   * @param {*} data
   */
  drawErrorIndicator(cMeta, rMeta, data) {
    // 检查是否有公式错误
    const value = data.formula ? data.calculated : data.value
    if (!isError(value)) return

    const { ctx, viewModel } = this
    const { scrollX, scrollY } = viewModel.sheetData
    const triangleSize = 6

    const x = cMeta.offset + cMeta.size - scrollX
    const y = rMeta.offset - scrollY

    ctx.save()
    ctx.fillStyle = '#ea4335' // 红色
    ctx.beginPath()
    ctx.moveTo(x - triangleSize, y)
    ctx.lineTo(x, y)
    ctx.lineTo(x, y + triangleSize)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  /**
   * @description 绘制文本
   * @param {*} cMeta
   * @param {*} rMeta
   * @param {*} data
   */
  drawText(cMeta, rMeta, data) {
    const { ctx, theme, viewModel } = this
    const { scrollX, scrollY } = viewModel.sheetData
    const { style } = data
    // 如果有公式，显示计算结果；否则显示原始值
    const value = data.formula ? data.calculated : data.value
    const offsetX = cMeta.offset
    const offsetY = rMeta.offset
    const cellWidth = cMeta.size
    const cellHeight = rMeta.size
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

  getTextBBox(col, row) {
    const { ctx, theme, viewModel } = this
    const { scrollX, scrollY } = viewModel.sheetData
    const data = viewModel.getCellData(col, row)
    const cellBBox = viewModel.getCellBBox({ col, row })

    const { style } = data
    // 如果有公式，显示计算结果；否则显示原始值
    const value = data.formula ? data.calculated : data.value

    const offsetX = cellBBox.left
    const offsetY = cellBBox.top
    const cellWidth = cellBBox.width
    const cellHeight = cellBBox.height
    const { paddingLeft, paddingRight } = theme.cellPadding
    const borderWidth = 2
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

    let maxWidth = 0

    lines.forEach((line) => {
      const { width } = ctx.measureText(line)
      maxWidth = Math.max(maxWidth, width)
    })

    if (textAlign === 'left') {
      x = offsetX
    } else if (textAlign === 'center') {
      x = offsetX + cellWidth / 2 - maxWidth / 2
    } else if (textAlign === 'right') {
      x = offsetX + cellWidth - maxWidth
    }

    ctx.restore()

    const magicNumber = 10 // 避免用户在Editor输入时频繁换行
    const editorWidth = Math.max(
      maxWidth + paddingLeft + paddingRight + borderWidth * 2 + magicNumber,
      cellWidth
    )

    return {
      left: Math.min(x, offsetX) - scrollX,
      top: offsetY - scrollY,
      width: wordWrap ? cellWidth : editorWidth,
      height: Math.max(lines.length * fontSize * lineHeight, cellHeight),
    }
  }

  drawHeader() {
    const { ctx, viewModel, theme } = this
    const { colsMeta, rowsMeta, scrollX, scrollY, freezeX, freezeY } = viewModel.sheetData
    const selector = viewModel.getSelector()
    const { col, row, colCount, rowCount } = viewModel.getViewportCellRange()

    assignStyle(ctx, theme.header)

    // 绘制冻结的列头（不滚动）
    for (let ci = 0; ci < freezeX && ci < colsMeta.length; ci += 1) {
      const cMeta = colsMeta[ci]
      const selected = ci >= selector.col && ci <= selector.col + selector.colCount - 1
      this.drawHeaderCell({
        col: cMeta,
        row: { offset: 0, size: theme.colHeaderHeight },
        text: numberToAlpha(ci),
        scrollX: 0, // 冻结的列头不应用水平滚动
        scrollY: 0,
        selected,
      })
    }

    // 绘制可滚动的列头
    for (let ci = col; ci < col + colCount; ci += 1) {
      if (ci >= freezeX) {
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
    }

    // 绘制冻结的行头（不滚动）
    for (let ri = 0; ri < freezeY && ri < rowsMeta.length; ri += 1) {
      const rMeta = rowsMeta[ri]
      const selected = ri >= selector.row && ri <= selector.row + selector.rowCount - 1
      this.drawHeaderCell({
        col: { offset: 0, size: theme.rowHeaderWidth },
        row: rMeta,
        text: ri + 1,
        scrollX: 0,
        scrollY: 0, // 冻结的行头不应用垂直滚动
        selected,
      })
    }

    // 绘制可滚动的行头
    for (let ri = row; ri < row + rowCount; ri += 1) {
      if (ri >= freezeY) {
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
