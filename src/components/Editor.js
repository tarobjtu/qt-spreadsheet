import throttle from 'lodash/throttle'
import './editor.scss'

const stylesOfUpdateState = {
  color: 'color',
  bold: 'fontWeight',
  italic: 'fontStyle',
  underline: 'textDecoration',
  fontSize: 'fontSize',
  fontFamily: 'fontFamily',
  backgroundColor: 'backgroundColor',
}

class Editor {
  constructor({ container, viewModel, sheet }) {
    this.container = container
    this.viewModel = viewModel
    this.sheet = sheet
    this.painter = sheet.painter

    this.initElements()
    this.bindEvent()
  }

  initElements() {
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
    const input = throttle(this.onInput.bind(this), 300)
    const keydown = this.onKeydown.bind(this)
    const change = this.onChange.bind(this)
    this.events.push([this.textareaEl, 'input', input])
    this.events.push([this.textareaEl, 'keydown', keydown])

    this.textareaEl.addEventListener('input', input)
    this.textareaEl.addEventListener('keydown', keydown, false)
    this.textareaEl.addEventListener('change', change, false)
    this.sheet.on('scroll', this.position.bind(this))
  }

  position() {
    const { activeCol, activeRow } = this.viewModel.getSelector()
    const { top, left, width, height } = this.painter.getTextBBox(activeCol, activeRow)
    this.setOffset({ top, left, width, height })
    return this
  }

  onChange() {
    const { col, row } = this.curEditingCell
    this.sheet.setCellText(this.textareaEl.value, col, row, 'finished')
  }

  onInput() {
    if (!this.visible) return
    this.curEditingCell = this.viewModel.getSelector()
    this.sheet.setCellText(this.textareaEl.value)
    this.position()
  }

  onKeydown(e) {
    const { target, altKey } = e
    const keyCode = e.keyCode || e.which
    // 禁止enter、tab以外的keydown冒泡到全局keydown事件中（Events.js中）
    if (keyCode !== 13 && keyCode !== 9) e.stopPropagation()
    // Alt + 回车键
    if (keyCode === 13 && altKey) {
      e.stopPropagation()
      this.insertText(target, '\n')
    }
    if (keyCode === 13 && !e.altKey) e.preventDefault()
  }

  insertText(target, inputText) {
    const { selectionEnd, value } = target
    const text = value.slice(0, selectionEnd) + inputText + value.slice(selectionEnd)
    // eslint-disable-next-line no-param-reassign
    target.value = text
    // 光标后移一位
    target.setSelectionRange(selectionEnd + 1, selectionEnd + 1)
    const { col, row } = this.viewModel.getSelector()
    this.sheet.setCellText(text, col, row, 'finished')
  }

  setOffset({ left, top, width, height }) {
    this.editorEl.style.left = left + 'px'
    this.editorEl.style.top = top + 'px'
    this.editorEl.style.width = width + 'px'
    this.editorEl.style.height = height + 'px'
    return this
  }

  setStyle() {
    const cell = this.viewModel.getSelectedActiveCell()

    Object.keys(stylesOfUpdateState).forEach((key) => {
      const cssStyleName = stylesOfUpdateState[key]
      if (cell.style[key]) {
        this.textareaEl.style[cssStyleName] = cell.style[key]
      } else {
        this.textareaEl.style[cssStyleName] = ''
      }
    })
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
