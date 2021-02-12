import _ from 'lodash'
import configs from '../configs/toolbar'
import './toolbar.scss'

/**
 * @description 工具栏中需要更新状态的图标，用户选中一个带样式的带元格后，需要更新工具栏中的样式状态
 */
const stylesOfUpdateState = [
  'bold',
  'italic',
  'underline',
  'fontSize',
  'fontFamily',
  'verticalAlign',
  'horizontalAlign',
]
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
    this.itemEls = {}
    configs.forEach((item) => {
      const li = document.createElement('li')
      if (item.key !== 'divider') {
        li.classList.add('qt-spreadsheet-toolbar-item')
        li.setAttribute('data-item-key', item.key)
        li.setAttribute('alt', item.name)
        li.style.backgroundImage = `url('${item.icon}')`
        this.itemEls[item.key] = li
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

    this.sheet.on('select', this.updateStyleState.bind(this))
    this.sheet.on('loadData', this.updateStyleState.bind(this))
    this.sheet.on('cellStyleChange', this.updateStyleState.bind(this))
  }

  /**
   * @description 选中单元格后，更新工具栏中样式按钮的状态
   */
  updateStyleState() {
    const cell = this.viewModel.getSelectedActiveCell()

    stylesOfUpdateState.forEach((key) => {
      const itemEl = this.itemEls[key]
      if (!itemEl) return
      if (cell.style[key]) {
        itemEl.classList.add('active')
      } else {
        itemEl.classList.remove('active')
      }
    })
  }

  onClick(e) {
    const { target } = e
    const itemKey = target.getAttribute('data-item-key')
    if (itemKey) {
      const action = 'set' + _.upperFirst(_.camelCase(itemKey))
      if (this[action]) this[action](itemKey)
    }
  }

  setBold(key) {
    const { sheet, itemEls } = this
    if (!itemEls[key].classList.contains('active')) {
      sheet.setCellsStyle({ bold: 'bold' })
    } else {
      sheet.setCellsStyle({ bold: '' })
    }
  }

  setItalic(key) {
    const { sheet, itemEls } = this
    if (!itemEls[key].classList.contains('active')) {
      sheet.setCellsStyle({ italic: 'italic' })
    } else {
      sheet.setCellsStyle({ italic: '' })
    }
  }

  setFontColor() {
    const { sheet } = this
    sheet.setCellsStyle({ color: '#d81e06' })
  }

  setBackgroundColor() {
    const { sheet } = this
    sheet.setCellsStyle({ backgroundColor: '#c1f5fe' })
  }

  setBorderAll() {
    const { sheet } = this
    sheet.setCellsStyle({ border: { type: 'all', color: 'rgba(100,100,100,1)' } })
  }
}

export default Toolbar
