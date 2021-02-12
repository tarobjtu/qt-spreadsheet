import configs from '../configs/toolbar'
import './toolbar.scss'

class Toolbar {
  constructor({ container }) {
    this.container = container

    this.initElements()
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
}

export default Toolbar
