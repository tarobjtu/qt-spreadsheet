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
    this.textareaEl.addEventListener('keydown', keydown, false)
  }

  onInput() {
    if (!this.visible) return
    this.sheet.setCellText(this.textareaEl.value)
  }

  onKeydown(e) {
    const keyCode = e.keyCode || e.which
    // 禁止enter、tab以外的keydown冒泡到全局keydown事件中（Events.js中）
    if (keyCode !== 13 && keyCode !== 9) e.stopPropagation()
    // Alt + 回车键
    if (keyCode === 13 && e.altKey) {
      e.stopPropagation()
      this.sheet.appendCellText('\n')
    }
    if (keyCode === 13 && !e.altKey) e.preventDefault()
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
