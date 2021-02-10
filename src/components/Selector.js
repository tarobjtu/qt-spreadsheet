import './selector.scss'

class Selector {
  constructor({ container, viewModel }) {
    this.container = container
    this.viewModel = viewModel

    this.initElement()
  }

  initElement() {
    const { container } = this
    this.selectorEl = document.createElement('div')
    this.selectorEl.classList.add('qt-spreadsheet-selector')
    container.appendChild(this.selectorEl)
    this.cornerEl = document.createElement('div')
    this.cornerEl.classList.add('qt-spreadsheet-selector-corner')
    this.selectorEl.appendChild(this.cornerEl)
  }

  setOffset({ left, top, width, height }) {
    this.selectorEl.style.left = left + 'px'
    this.selectorEl.style.top = top + 'px'
    this.selectorEl.style.width = width + 'px'
    this.selectorEl.style.height = height + 'px'
    return this
  }

  show() {
    this.selectorEl.style.display = 'block'
    return this
  }
}

export default Selector
