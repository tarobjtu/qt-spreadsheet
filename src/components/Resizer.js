import throttle from 'lodash/throttle'
import './resizer.scss'

const MIN_SIZE = 10

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

    this.resizerEl = document.createElement('div')
    this.resizerEl.classList.add('qt-spreadsheet-resizer')
    container.appendChild(this.resizerEl)

    this.rowResizerEl = document.createElement('div')
    this.rowResizerEl.classList.add('qt-spreadsheet-row-resizer')
    this.rowResizerEl.setAttribute('data-direction', 'row')
    this.rowResizerEl.style.width = theme.rowHeaderWidth + 'px'
    this.resizerEl.appendChild(this.rowResizerEl)
    this.rowHandlerEl = document.createElement('div')
    this.rowHandlerEl.classList.add('qt-spreadsheet-row-resizer-handler')
    this.rowResizerEl.appendChild(this.rowHandlerEl)
    this.rowMarkLineEl = document.createElement('div')
    this.rowMarkLineEl.classList.add('qt-spreadsheet-row-resizer-mark-line')
    this.rowResizerEl.appendChild(this.rowMarkLineEl)

    this.colResizerEl = document.createElement('div')
    this.colResizerEl.classList.add('qt-spreadsheet-col-resizer')
    this.colResizerEl.setAttribute('data-direction', 'col')
    this.colResizerEl.style.height = theme.colHeaderHeight + 'px'
    this.resizerEl.appendChild(this.colResizerEl)
    this.colHandlerEl = document.createElement('div')
    this.colHandlerEl.classList.add('qt-spreadsheet-col-resizer-handler')
    this.colResizerEl.appendChild(this.colHandlerEl)
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
      const { col, row, type } = this.viewModel.getCellByOffset(offsetX, offsetY)
      const { left, top, width, height } = this.viewModel.getCellsBBox({
        col,
        row,
        colCount: 1,
        rowCount: 1,
      })
      this.currentCRCell = { col, row, left, top, type }
      if (type === 'rowHeader') {
        this.rowResizerEl.style.top = top + height - 4 + 'px'
      } else if (type === 'colHeader') {
        this.colResizerEl.style.left = left + width - 4 + 'px'
      }
    }
  }

  startResize(e) {
    this.resizing = true
    this.moveCount = 0
    // 避免触发DOM元素的拖拽
    document.body.style.userSelect = 'none'
    this.direction = e.currentTarget.getAttribute('data-direction')
    console.warn('startResize', this.direction, this.currentCRCell)
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
    this.resize({
      x: e.screenX,
      y: e.screenY,
      start: this.moveCount === 1,
      finished: false,
    })
  }

  endResize(e) {
    if (!this.resizing) return
    this.resizing = false
    this.moveCount = 0
    this.resize({ x: e.screenX, y: e.screenY, start: false, finished: true })

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
    const { col, row, left, top } = this.currentCRCell
    if (this.direction === 'col') {
      const newSize = Math.max(MIN_SIZE, x - left)
      this.sheet.colResize({ col, count: 1, newSize }, start, finished)
    } else if (this.direction === 'row') {
      const newSize = Math.max(MIN_SIZE, y - top)
      this.sheet.rowResize({ row, count: 1, newSize }, start, finished)
    }
  }
}

export default Resizer
