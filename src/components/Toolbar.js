import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import configs from '../configs/toolbar'
import './toolbar.scss'

/**
 * @description 工具栏中需要更新状态的图标，用户选中一个带样式的带元格后，需要更新工具栏中的样式状态
 */
const stylesOfUpdateState = ['bold', 'italic', 'underline', 'wordWrap']

/**
 * @description 需要更新冻结状态的按钮
 */
const freezeButtons = ['freezeAll', 'freezeRow', 'freezeColumn']
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
        const itemKey = camelCase(item.key)
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
    this.sheet.on('loadData', this.updateFreezeState.bind(this))
    this.sheet.on('freeze', this.updateFreezeState.bind(this))
    this.sheet.on('unfreeze', this.updateFreezeState.bind(this))
    this.history.on('change', this.updateStyleState.bind(this))
    this.history.on('change', this.updateHistoryState.bind(this))
    this.history.on('change', this.updateFreezeState.bind(this))
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
      const action = 'set' + upperFirst(itemKey)
      console.warn(action)
      if (this[action]) this[action](itemKey)
    }
  }

  // ==================== 导入导出相关方法 ====================

  setImport() {
    this.sheet.importFromFile()
  }

  setExportCsv() {
    this.sheet.exportToCSV()
  }

  setExportExcel() {
    this.sheet.exportToExcel()
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
    sheet.setCellsBorder({
      left: { type: 'solid', color: 'rgba(100,100,100,1)' },
      right: { type: 'solid', color: 'rgba(100,100,100,1)' },
      top: { type: 'solid', color: 'rgba(100,100,100,1)' },
      bottom: { type: 'solid', color: 'rgba(100,100,100,1)' },
    })
  }

  setMergeCell() {
    const selections = this.viewModel.getSelector()
    this.sheet.mergeCell(selections)
  }

  setCancelMergeCell() {
    const selections = this.viewModel.getSelector()
    this.sheet.cancelMergeCell(selections)
  }

  // ==================== 冻结行/列相关方法 ====================

  /**
   * @description 冻结当前单元格的行和列（或取消冻结）
   */
  setFreezeAll() {
    const { freezeX, freezeY } = this.viewModel.getFreeze()
    // 如果已经冻结，则取消冻结
    if (freezeX > 0 && freezeY > 0) {
      this.sheet.unfreeze()
    } else {
      this.sheet.freezeAll()
    }
  }

  /**
   * @description 冻结行（或取消冻结行）
   */
  setFreezeRow() {
    const { freezeY } = this.viewModel.getFreeze()
    // 如果已经冻结行，则取消冻结行
    if (freezeY > 0) {
      const { freezeX } = this.viewModel.getFreeze()
      this.viewModel.setFreeze(freezeX, 0)
      this.sheet.draw()
      this.sheet.emit('unfreeze')
    } else {
      this.sheet.freezeRow()
    }
  }

  /**
   * @description 冻结列（或取消冻结列）
   */
  setFreezeColumn() {
    const { freezeX } = this.viewModel.getFreeze()
    // 如果已经冻结列，则取消冻结列
    if (freezeX > 0) {
      const { freezeY } = this.viewModel.getFreeze()
      this.viewModel.setFreeze(0, freezeY)
      this.sheet.draw()
      this.sheet.emit('unfreeze')
    } else {
      this.sheet.freezeColumn()
    }
  }

  /**
   * @description 更新冻结按钮状态
   */
  updateFreezeState() {
    const { freezeX, freezeY } = this.viewModel.getFreeze()

    freezeButtons.forEach((key) => {
      const itemEl = this.itemEls[key]
      if (!itemEl) return

      let isActive = false
      if (key === 'freezeAll') {
        isActive = freezeX > 0 && freezeY > 0
      } else if (key === 'freezeRow') {
        isActive = freezeY > 0
      } else if (key === 'freezeColumn') {
        isActive = freezeX > 0
      }

      itemEl.classList.toggle('active', isActive)
    })
  }
}

export default Toolbar
