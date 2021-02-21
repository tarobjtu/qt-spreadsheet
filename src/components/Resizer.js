import throttle from 'lodash/throttle'
import './resizer.scss'

class Resizer {
  constructor({ container, viewModel, sheet, theme }) {
    this.container = container
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
    const startResize = this.startResize.bind(this)
    const moveResize = throttle(this.moveResize.bind(this), 50)
    const endResize = this.endResize.bind(this)
    this.events.push([this.rowResizerEl, 'mousedown', startResize])
    this.events.push([this.colResizerEl, 'mousedown', startResize])
    this.events.push([document, 'mousemove', moveResize])
    this.events.push([document, 'mouseup', endResize])
    this.rowResizerEl.addEventListener('mousedown', startResize, false)
    this.colResizerEl.addEventListener('mousedown', startResize, false)
    document.addEventListener('mousemove', moveResize, false)
    document.addEventListener('mouseup', endResize, false)
  }

  startResize(e) {
    this.resizing = true
    // 避免触发DOM元素的拖拽
    document.body.style.userSelect = 'none'
    console.warn(e.target.getAttribute('data-direction'))
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

  position() {
    const { activeCol, activeRow } = this.viewModel.getSelector()
    const { top, left, width, height } = this.painter.getTextBBox(activeCol, activeRow)
    this.setOffset({ top, left, width, height })
    return this
  }

  setOffset({ left, top, width, height }) {
    this.editorEl.style.left = left + 'px'
    this.editorEl.style.top = top + 'px'
    this.editorEl.style.width = width + 'px'
    this.editorEl.style.height = height + 'px'
    return this
  }

  show() {
    this.setStyle()
    this.editorEl.style.display = 'block'
    this.visible = true
    return this
  }

  hide() {
    this.editorEl.style.display = 'none'
    this.visible = false
    return this
  }
}

export default Resizer
