import './clipboard.scss'

class Clipboard {
  constructor({ sheet, container, viewModel }) {
    this.sheet = sheet
    this.container = container
    this.viewModel = viewModel
    this.selections = {}

    this.initElements()
  }

  destroy() {
    this.events.forEach((ea) => {
      ea[0].removeEventListener(ea[1], ea[2])
    })
  }

  initElements() {
    const { container } = this
    // 剪切板选择区域
    this.styleEl = document.createElement('style')
    this.styleEl.classList.add('qt-spreadsheet-clipboard-style')
    container.appendChild(this.styleEl)
    this.clipboardEl = document.createElement('div')
    this.clipboardEl.classList.add('qt-spreadsheet-clipboard')
    container.appendChild(this.clipboardEl)
  }

  copy(selections) {
    this.selections = selections
    return this
  }

  cut(selections) {
    this.selections = selections
    return this
  }

  position() {
    const { scrollX, scrollY } = this.viewModel.sheetData
    const { left, top, width, height } = this.viewModel.getSelectedCellsBBox()
    this.setOffset({
      left: left + 1 - scrollX,
      top: top + 1 - scrollY,
      width: width - 2,
      height: height - 2,
    })
    return this
  }

  show() {
    this.clipboardEl.style.display = 'block'
    return this
  }

  hide() {
    this.clipboardEl.style.display = 'none'
    return this
  }

  setOffset({ left, top, width, height }) {
    const { clipboardEl, styleEl } = this
    /* eslint-disable */
    const animationStyle = `@keyframes border-dance {
      0% {
        background-position: 0px 0px, ${width}px ${height - 2}px, 0px ${width - 2}px, ${
      width - 2
    }px 0px;
      }
      100% {
        background-position: ${width}px 0px, 0px ${height - 2}px, 0px 0px, ${width - 2}px ${
      width - 2
    }px;
      }
    }
    /* eslint-enable */
    `
    // 剪切板选择器border动画，demo见/playground/border-animation.html
    styleEl.innerHTML = animationStyle
    clipboardEl.style.left = left + 'px'
    clipboardEl.style.top = top + 'px'
    clipboardEl.style.width = width + 'px'
    clipboardEl.style.height = height + 'px'
  }
}

export default Clipboard
