import throttle from 'lodash/throttle'
import './resizer.scss'

const MIN_SIZE = 20

class Resizer {
  constructor({ container, viewModel, sheet, theme, canvas }) {
    this.container = container
    this.canvas = canvas
    this.viewModel = viewModel
    this.sheet = sheet
    this.theme = theme

    this.initElements()
    this.bindEvent()
  }

  initElements() {
    const { container, theme } = this

    // resizer container
    this.resizerEl = document.createElement('div')
    this.resizerEl.classList.add('qt-spreadsheet-resizer')
    container.appendChild(this.resizerEl)

    // row resizer
    this.rowResizerEl = document.createElement('div')
    this.rowResizerEl.classList.add('qt-spreadsheet-row-resizer')
    this.rowResizerEl.setAttribute('data-direction', 'row')
    this.rowResizerEl.style.width = theme.rowHeaderWidth + 'px'
    this.resizerEl.appendChild(this.rowResizerEl)

    // row resizer handler
    this.rowHandlerEl = document.createElement('div')
    this.rowHandlerEl.classList.add('qt-spreadsheet-row-resizer-handler')
    this.rowResizerEl.appendChild(this.rowHandlerEl)

    // row resizer mark line
    this.rowMarkLineEl = document.createElement('div')
    this.rowMarkLineEl.classList.add('qt-spreadsheet-row-resizer-mark-line')
    this.rowResizerEl.appendChild(this.rowMarkLineEl)

    // col resizer
    this.colResizerEl = document.createElement('div')
    this.colResizerEl.classList.add('qt-spreadsheet-col-resizer')
    this.colResizerEl.setAttribute('data-direction', 'col')
    this.colResizerEl.style.height = theme.colHeaderHeight + 'px'
    this.resizerEl.appendChild(this.colResizerEl)

    // col resizer handler
    this.colHandlerEl = document.createElement('div')
    this.colHandlerEl.classList.add('qt-spreadsheet-col-resizer-handler')
    this.colResizerEl.appendChild(this.colHandlerEl)

    // col resizer mark line
    this.colMarkLineEl = document.createElement('div')
    this.colMarkLineEl.classList.add('qt-spreadsheet-col-resizer-mark-line')
    this.colResizerEl.appendChild(this.colMarkLineEl)
  }

  destroy() {
    this.events.forEach((ea) => {
      ea[0].removeEventListener(ea[1], ea[2])
    })
  }

  bindEvent() {
    this.events = []
    const resizerPosition = this.resizerPosition.bind(this)
    const startResize = this.startResize.bind(this)
    const moveResize = throttle(this.moveResize.bind(this), 50)
    const endResize = this.endResize.bind(this)

    this.events.push([window, 'mousemove', resizerPosition])
    this.events.push([this.rowResizerEl, 'mousedown', startResize])
    this.events.push([this.colResizerEl, 'mousedown', startResize])
    this.events.push([window, 'mousemove', moveResize])
    this.events.push([window, 'mouseup', endResize])

    window.addEventListener('mousemove', resizerPosition, false)
    this.rowResizerEl.addEventListener('mousedown', startResize, false)
    this.colResizerEl.addEventListener('mousedown', startResize, false)
    window.addEventListener('mousemove', moveResize, false)
    window.addEventListener('mouseup', endResize, false)
  }

  resizerPosition(e) {
    // 如果已经在Resize拖拽中，停止定位
    if (this.resizing) return
    const { target, offsetX, offsetY } = e

    if (this.canvas.contains(target)) {
      const { colHeaderHeight, rowHeaderWidth } = this.theme

      // 只考虑行头、列头的情况
      if (offsetX < rowHeaderWidth || offsetY < colHeaderHeight) {
        const { scrollX, scrollY } = this.viewModel.getSheetData()
        const { col, row, type } = this.viewModel.getCellByOffset(
          offsetX + scrollX,
          offsetY + scrollY
        )
        const { left, top } = this.viewModel.getCellsBBox({
          col,
          row,
          colCount: 1,
          rowCount: 1,
        })
        this.currentCRCell = { col, row, left, top, type }
        this.position({ type, col, row, scrollX, scrollY })
      }
    }
  }

  position({ type, col, row, scrollX, scrollY }) {
    const { left, top, width, height } = this.viewModel.getCellsBBox({
      col,
      row,
      colCount: 1,
      rowCount: 1,
    })
    if (type === 'rowHeader') {
      this.rowResizerEl.style.top = top - scrollY + height - 4 + 'px'
    } else if (type === 'colHeader') {
      this.colResizerEl.style.left = left - scrollX + width - 4 + 'px'
    }
  }

  startResize(e) {
    this.resizing = true
    this.moveCount = 0
    // 避免触发DOM元素的拖拽
    document.body.style.userSelect = 'none'
    this.direction = e.currentTarget.getAttribute('data-direction')
    if (this.direction === 'col') {
      this.colMarkLineEl.style.display = 'block'
      this.colHandlerEl.classList.add('active')
      document.body.style.cursor = 'col-resize'
    } else if (this.direction === 'row') {
      this.rowMarkLineEl.style.display = 'block'
      this.rowHandlerEl.classList.add('active')
      document.body.style.cursor = 'row-resize'
    }
  }

  moveResize(e) {
    if (!this.resizing) return
    this.moveCount += 1
    const { offsetLeft, offsetTop } = this.container
    this.resize({
      x: e.clientX - offsetLeft,
      y: e.clientY - offsetTop,
      start: this.moveCount === 1,
      finished: false,
    })
  }

  endResize(e) {
    if (!this.resizing) return
    this.resizing = false
    this.moveCount = 0
    const { offsetLeft, offsetTop } = this.container
    this.resize({
      x: e.clientX - offsetLeft,
      y: e.clientY - offsetTop,
      start: false,
      finished: true,
    })

    if (this.direction === 'col') {
      this.colMarkLineEl.style.display = 'none'
      this.colHandlerEl.classList.remove('active')
    } else if (this.direction === 'row') {
      this.rowMarkLineEl.style.display = 'none'
      this.rowHandlerEl.classList.remove('active')
    }
    document.body.style.cursor = 'auto'
    document.body.style.userSelect = 'auto'
  }

  resize({ x, y, start, finished }) {
    const { col, row, left, top, type } = this.currentCRCell
    const { scrollX, scrollY } = this.viewModel.getSheetData()

    // cell resize
    if (this.direction === 'col') {
      const newSize = Math.max(MIN_SIZE, x - (left - scrollX))
      const wholeCols = this.viewModel.getSelectedWholeCols()
      // 多列圈选的场景
      if (
        finished &&
        wholeCols &&
        col >= wholeCols.col &&
        col < wholeCols.col + wholeCols.colCount
      ) {
        this.sheet.colResize(
          { col: wholeCols.col, count: wholeCols.colCount, newSize },
          start,
          finished
        )
      } else {
        this.sheet.colResize({ col, count: 1, newSize }, start, finished)
      }
    } else if (this.direction === 'row') {
      const newSize = Math.max(MIN_SIZE, y - (top - scrollY))
      const wholeRows = this.viewModel.getSelectedWholeRows()
      // 多行圈选的场景
      if (
        finished &&
        wholeRows &&
        row >= wholeRows.row &&
        row < wholeRows.row + wholeRows.rowCount
      ) {
        this.sheet.rowResize(
          { row: wholeRows.row, count: wholeRows.rowCount, newSize },
          start,
          finished
        )
      } else {
        this.sheet.rowResize({ row, count: 1, newSize }, start, finished)
      }
    }

    // resizer reposition
    this.position({ type, col, row, scrollX, scrollY })
  }
}

export default Resizer
