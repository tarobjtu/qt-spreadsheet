import _ from 'lodash'
import configs from '../configs/toolbar'
import './toolbar.scss'

/**
 * @description 工具栏中需要更新状态的图标，用户选中一个带样式的带元格后，需要更新工具栏中的样式状态
 */
const stylesOfUpdateState = ['bold', 'italic', 'underline', 'wordWrap']
class Toolbar {
  constructor({ container, sheet }) {
    this.sheet = sheet
    this.viewModel = sheet.viewModel
    this.history = sheet.history
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
        const itemKey = _.camelCase(item.key)
        li.classList.add('qt-spreadsheet-toolbar-item')
        if (item.disable) {
          li.classList.add('disable')
        }
        li.setAttribute('data-item-key', itemKey)
        li.setAttribute('title', item.name)
        li.style.backgroundImage = `url('${item.icon}')`
        this.itemEls[itemKey] = li
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
    this.history.on('change', this.updateStyleState.bind(this))
    this.history.on('change', this.updateHistoryState.bind(this))
  }

  /**
   * @description 更新工具栏 Redo、Undo按钮的状态
   */
  updateHistoryState() {
    const { redo, undo } = this.itemEls

    redo.classList.toggle('disable', !this.history.canRedo())
    undo.classList.toggle('disable', !this.history.canUndo())
  }

  /**
   * @description 选中单元格后，更新工具栏中样式按钮的状态
   */
  updateStyleState() {
    const cell = this.viewModel.getSelectedActiveCell()

    stylesOfUpdateState.forEach((key) => {
      const itemEl = this.itemEls[key]
      if (!itemEl) return
      if (cell && cell.style[key]) {
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
      const action = 'set' + _.upperFirst(itemKey)
      if (this[action]) this[action](itemKey)
    }
  }

  setSave() {
    this.sheet.save()
  }

  setDelete() {
    this.sheet.delete()
  }

  setUndo() {
    this.sheet.undo()
  }

  setRedo() {
    this.sheet.redo()
  }

  setBold() {
    const { sheet } = this
    sheet.toggleCellsStyle('bold')
  }

  setItalic() {
    const { sheet } = this
    sheet.toggleCellsStyle('italic')
  }

  setWordWrap() {
    const { sheet } = this
    sheet.toggleCellsStyle('wordWrap')
  }

  setAlignCenter() {
    const { sheet } = this
    sheet.setCellsStyle({ textAlign: 'center' })
  }

  setAlignLeft() {
    const { sheet } = this
    sheet.setCellsStyle({ textAlign: 'left' })
  }

  setAlignRight() {
    const { sheet } = this
    sheet.setCellsStyle({ textAlign: 'right' })
  }

  setAlignVerticalBottom() {
    const { sheet } = this
    sheet.setCellsStyle({ textBaseline: 'bottom' })
  }

  setAlignVerticalMiddle() {
    const { sheet } = this
    sheet.setCellsStyle({ textBaseline: 'middle' })
  }

  setAlignVerticalTop() {
    const { sheet } = this
    sheet.setCellsStyle({ textBaseline: 'top' })
  }

  setFontColor() {
    const { sheet } = this
    sheet.setCellsStyle({ color: '#ffffff' })
  }

  setBackgroundColor() {
    const { sheet } = this
    sheet.setCellsStyle({ backgroundColor: '#0cb1a3' })
  }

  setBorderAll() {
    const { sheet } = this
    sheet.setCellsStyle({ border: { type: 'all', color: 'rgba(100,100,100,1)' } })
  }
}

export default Toolbar
