import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import configs from '../configs/contextmenu'
import './contextmenu.scss'

class Contextmenu {
  constructor({ sheet, container, viewModel }) {
    this.sheet = sheet
    this.container = container
    this.viewModel = viewModel
    this.initElements()
    this.bindEvent()
  }

  initElements() {
    const { container } = this
    this.contextmenuEl = document.createElement('ul')
    this.contextmenuEl.classList.add('qt-spreadsheet-contextmenu')
    container.appendChild(this.contextmenuEl)
    this.itemEls = {}
    configs.forEach((item) => {
      const { key, name, hotkey, disable } = item
      const itemKey = camelCase(item.key)
      const li = document.createElement('li')
      if (key !== 'divider') {
        li.classList.add('qt-spreadsheet-contextmenu-item')
        if (disable) {
          li.classList.add('disable')
        }
        li.setAttribute('data-item-key', itemKey)
        li.setAttribute('title', name)
        const nameEl = document.createElement('span')
        nameEl.classList.add('qt-spreadsheet-contextmenu-name')
        nameEl.innerText = name
        li.appendChild(nameEl)
        const hotkeyEl = document.createElement('span')
        hotkeyEl.classList.add('qt-spreadsheet-contextmenu-hotkey')
        if (hotkey) {
          hotkeyEl.innerText = hotkey
        }
        li.appendChild(hotkeyEl)
        // const iconEl = document.createElement('span')
        // iconEl.classList.add('qt-spreadsheet-contextmenu-icon')
        // if (icon) {
        //   iconEl.style.backgroundImage = `url('${icon}')`
        // }
        // li.appendChild(iconEl)
        this.itemEls[itemKey] = li
      } else {
        li.classList.add('qt-spreadsheet-contextmenu-divider')
      }
      this.contextmenuEl.appendChild(li)
    })
  }

  destroy() {
    this.events.forEach((ea) => {
      ea[0].removeEventListener(ea[1], ea[2])
    })
  }

  bindEvent() {
    this.events = []
    const contextmenu = this.onContextmenu.bind(this)
    const itemClick = this.onItemClick.bind(this)
    const clickOther = this.clickOther.bind(this)
    this.events.push([this.container, 'contextmenu', contextmenu])
    this.events.push([this.contextmenuEl, 'click', itemClick])
    this.events.push([document, 'click', clickOther])
    this.container.addEventListener('contextmenu', contextmenu, false)
    this.contextmenuEl.addEventListener('click', itemClick, false)
    document.addEventListener('click', clickOther, false)
  }

  clickOther(e) {
    if (!this.contextmenuEl.contains(e.target)) {
      this.hide()
    }
  }

  onContextmenu(e) {
    e.preventDefault()
    const { offsetX, offsetY } = e
    console.warn({ offsetX, offsetY })
    const { scrollX, scrollY } = this.viewModel.sheetData
    const { row, col, type } = this.viewModel.getCellByOffset(offsetX + scrollX, offsetY + scrollY)
    console.warn({ row, col, type })
    this.position({ offsetX, offsetY }).show()
  }

  onItemClick(e) {
    let targetEl = e.target
    let itemKey = targetEl.getAttribute('data-item-key')
    while (itemKey === null && targetEl !== this.contextmenuEl) {
      targetEl = targetEl.parentNode
      itemKey = targetEl.getAttribute('data-item-key')
    }
    if (itemKey) {
      const action = 'set' + upperFirst(itemKey)
      console.warn(action)
      if (this[action]) this[action](itemKey)
      this.hide()
    }
  }

  position({ offsetX, offsetY }) {
    this.contextmenuEl.style.left = offsetX + 'px'
    this.contextmenuEl.style.top = offsetY + 'px'
    return this
  }

  show() {
    this.contextmenuEl.style.display = 'block'
    return this
  }

  hide() {
    this.contextmenuEl.style.display = 'none'
    return this
  }
}

export default Contextmenu
