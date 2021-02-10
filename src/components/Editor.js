import _ from 'lodash'
import './editor.scss'

class Editor {
  constructor({ container, viewModel, sheet }) {
    this.container = container
    this.viewModel = viewModel
    this.sheet = sheet

    this.initElement()
    this.bindEvent()
  }

  initElement() {
    const { container } = this
    this.editorEl = document.createElement('div')
    this.editorEl.classList.add('qt-spreadsheet-editor')
    container.appendChild(this.editorEl)
    this.textareaEl = document.createElement('textarea')
    this.textareaEl.classList.add('qt-spreadsheet-editor-textarea')
    this.editorEl.appendChild(this.textareaEl)
  }

  destroy() {
    this.events.forEach((ea) => {
      ea[0].removeEventListener(ea[1], ea[2])
    })
  }

  bindEvent() {
    this.events = []
    const input = _.throttle(this.onInput.bind(this), 300)
    const keydown = this.onKeydown.bind(this)
    this.events.push([this.textareaEl, 'input', input])
    this.events.push([this.textareaEl, 'keydown', keydown])

    this.textareaEl.addEventListener('input', input)
    this.textareaEl.addEventListener('keydown', keydown)
  }

  onInput() {
    if (!this.visible) return
    const { row, col } = this
    console.warn('input', this.textareaEl.value)
    this.viewModel.setCellData(col, row, this.textareaEl.value)
    this.sheet.draw()
  }

  onKeydown(e) {
    const { keyCode } = e
    // 回车键
    if (keyCode === 13) {
      const { col, row } = this
      e.preventDefault()
      this.sheet.selectCell(col, row + 1)
    }
  }

  setOffset({ left, top, width, height }) {
    this.editorEl.style.left = left + 'px'
    this.editorEl.style.top = top + 'px'
    this.editorEl.style.width = width + 'px'
    this.editorEl.style.height = height + 'px'
    return this
  }

  show() {
    this.editorEl.style.display = 'block'
    this.visible = true
    return this
  }

  hide() {
    this.editorEl.style.display = 'none'
    this.visible = false
    return this
  }

  focus() {
    this.textareaEl.focus()
    return this
  }

  setValue(value, col, row) {
    this.col = col
    this.row = row
    this.textareaEl.value = value
    return this
  }
}

export default Editor
