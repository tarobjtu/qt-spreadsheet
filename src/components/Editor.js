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
  textAlign: 'textAlign',
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

    const compositionstart = this.onCompositionstart.bind(this)
    const compositionupdate = this.onCompositionupdate.bind(this)
    const compositionend = this.onCompositionend.bind(this)
    this.events.push([this.textareaEl, 'compositionstart', compositionstart])
    this.events.push([this.textareaEl, 'compositionend', compositionend])
    this.textareaEl.addEventListener('compositionstart', compositionstart, false)
    this.textareaEl.addEventListener('compositionupdate', compositionupdate, false)
    this.textareaEl.addEventListener('compositionend', compositionend, false)

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

  onCompositionstart(e) {
    console.warn(`${e.type}: ${e.data}`, this.textareaEl.value)
  }

  onCompositionupdate(e) {
    console.warn(`${e.type}: ${e.data}`, this.textareaEl.value)
  }

  onCompositionend(e) {
    console.warn(`${e.type}: ${e.data}`, this.textareaEl.value)
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

  onInput(e) {
    if (!this.visible) return
    console.warn('onInput', e, this.textareaEl.value)
    this.curEditingCell = this.viewModel.getSelector()
    this.sheet.setCellText(this.textareaEl.value)
    this.position()

    // 更新引用高亮
    if (this.sheet.referenceHighlight) {
      this.sheet.referenceHighlight.update(this.textareaEl.value)
    }
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
    if (keyCode === 13 && !altKey) e.preventDefault()
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

    // 显示引用高亮
    if (this.sheet.referenceHighlight) {
      this.sheet.referenceHighlight.update(this.textareaEl.value)
    }
    return this
  }

  hide() {
    this.editorEl.style.display = 'none'
    this.visible = false

    // 隐藏引用高亮
    if (this.sheet.referenceHighlight) {
      this.sheet.referenceHighlight.hide()
    }
    return this
  }

  focus() {
    // const { selectionStart, selectionEnd } = this.textareaEl
    // console.warn({ selectionStart, selectionEnd })
    // this.textareaEl.setSelectionRange(selectionStart + 1, selectionEnd + 1)
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
