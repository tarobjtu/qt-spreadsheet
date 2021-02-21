import throttle from 'lodash/throttle'
import './resizer.scss'

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

    this.colResizerEl = document.createElement('div')
    this.colResizerEl.classList.add('qt-spreadsheet-col-resizer')
    this.colResizerEl.setAttribute('data-direction', 'col')
    this.colResizerEl.style.height = theme.colHeaderHeight + 'px'
    this.resizerEl.appendChild(this.colResizerEl)
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
    const { target, offsetX, offsetY } = e
    if (this.canvas.contains(target)) {
      const { col, row, type } = this.viewModel.getCellByOffset(offsetX, offsetY)
      const { left, top, width, height } = this.viewModel.getCellsBBox({
        col,
        row,
        colCount: 1,
        rowCount: 1,
      })
      if (type === 'rowHeader') {
        this.rowResizerEl.style.top = top + height - 4 + 'px'
      } else if (type === 'colHeader') {
        this.colResizerEl.style.left = left + width - 4 + 'px'
      }
      console.warn({ col, row, type }, { left, top, width, height })
    }
  }

  startResize(e) {
    this.resizing = true
    // 避免触发DOM元素的拖拽
    document.body.style.userSelect = 'none'
    this.direction = e.target.getAttribute('data-direction')
    console.warn(e)
  }

  moveResize(e) {
    if (!this.resizing) return
    console.warn(e)
  }

  endResize(e) {
    if (!this.resizing) return
    this.resizing = false
    document.body.style.userSelect = 'auto'
    console.warn(e)
  }
}

export default Resizer
