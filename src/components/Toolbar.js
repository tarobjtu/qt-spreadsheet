import _ from 'lodash'
import configs from '../configs/toolbar'
import './toolbar.scss'

class Toolbar {
  constructor({ container, sheet }) {
    this.sheet = sheet
    this.viewModel = sheet.viewModel
    this.container = container

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
    const ul = document.createElement('ul')
    container.appendChild(ul)
    configs.forEach((item) => {
      const li = document.createElement('li')
      if (item.key !== 'divider') {
        li.classList.add('qt-spreadsheet-toolbar-item')
        li.setAttribute('data-item-key', item.key)
        li.setAttribute('alt', item.name)
        li.style.backgroundImage = `url('${item.icon}')`
      } else {
        li.classList.add('qt-spreadsheet-toolbar-divider')
      }
      ul.appendChild(li)
    })
  }

  bindEvents() {
    const { container } = this
    this.events = []
    const click = this.onClick.bind(this)
    this.events.push([container, 'click', click])
    container.addEventListener('click', click, false)
  }

  onClick(e) {
    const { target } = e
    const itemKey = target.getAttribute('data-item-key')
    if (itemKey) {
      const action = 'set' + _.upperFirst(_.camelCase(itemKey))
      if (this[action]) this[action]()
    }
  }

  setBold() {
    const { sheet } = this
    sheet.setCellsStyle({ bold: 'bold' })
  }
}

export default Toolbar
