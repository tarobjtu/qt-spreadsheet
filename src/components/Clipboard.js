import './clipboard.scss'

class Clipboard {
  constructor({ sheet, container, viewModel }) {
    this.sheet = sheet
    this.container = container
    this.viewModel = viewModel
    this.clips = {}
    this.state = ''

    this.initElements()
    this.bindEvents()
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

  bindEvents() {
    // 自定义事件
    this.sheet.on('scroll', this.position.bind(this))
  }

  copy(clips) {
    this.clips = clips
    this.state = 'copy'
    return this
  }

  cut(clips) {
    this.clips = clips
    this.state = 'cut'
    return this
  }

  canPaste() {
    return this.state === 'copy' || this.state === 'cut'
  }

  stopPaste() {
    this.state = ''
  }

  getState() {
    return this.state
  }

  getClipboardData() {
    return this.clips
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
    // 剪切框越大，动画越快，需要动态调整动画时间
    clipboardEl.style.animationDuration = Math.min(250, Math.round(0.06 * (width + height))) + 's'
    clipboardEl.style.left = left + 'px'
    clipboardEl.style.top = top + 'px'
    clipboardEl.style.width = width + 'px'
    clipboardEl.style.height = height + 'px'
  }
}

export default Clipboard
