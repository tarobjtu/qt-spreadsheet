import camelCase from 'lodash/camelCase'
import upperFirst from 'lodash/upperFirst'
import configs from '../configs/contextmenu'
import { numberToAlpha } from '../utils/common'
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
    document.addEventListener('mousedown', clickOther, false)
  }

  onContextmenu(e) {
    e.preventDefault()
    const { offsetX, offsetY } = e
    const { scrollX, scrollY } = this.viewModel.sheetData
    const targetCell = this.viewModel.getCellByOffset(offsetX + scrollX, offsetY + scrollY)
    this.targetCell = targetCell
    this.setTargetRange(targetCell)
    this.filterItems(targetCell.type)
    this.show().position({ offsetX, offsetY })
  }

  onItemClick(e) {
    let targetEl = e.target
    let itemKey = targetEl.getAttribute('data-item-key')
    while (itemKey === null && targetEl !== this.contextmenuEl) {
      targetEl = targetEl.parentNode
      itemKey = targetEl.getAttribute('data-item-key')
    }
    if (itemKey) {
      const action = 'on' + upperFirst(itemKey)
      console.warn(action)
      if (this[action]) this[action](itemKey)
      // 点击动画
      targetEl.classList.add('clicked')
      setTimeout(() => {
        targetEl.classList.remove('clicked')
        this.hide()
      }, 150)
    }
  }

  clickOther(e) {
    if (!this.contextmenuEl.contains(e.target)) {
      this.hide()
    }
  }

  onCut() {
    this.sheet.cut()
  }

  onCopy() {
    this.sheet.copy()
  }

  onPaste() {
    this.sheet.paste()
  }

  /**
   * @description 向上插入n行
   */
  onInsertUp() {
    const { row, rowCount } = this.viewModel.getSelector()
    // const rowsData = deepClone(this.viewModel.getSelectedCellsData())
    this.sheet.insertRows(row, rowCount)
  }

  /**
   * @description 向下插入n行
   */
  onInsertDown() {
    const { row, rowCount } = this.viewModel.getSelector()
    // const rowsData = deepClone(this.viewModel.getSelectedCellsData())
    this.sheet.insertRows(row + rowCount, rowCount)
  }

  onInsertLeft() {
    const { col, colCount } = this.viewModel.getSelector()
    // const colsData = deepClone(this.viewModel.getSelectedCellsData())
    this.sheet.insertCols(col, colCount)
  }

  onInsertRight() {
    const { col, colCount } = this.viewModel.getSelector()
    // const colsData = deepClone(this.viewModel.getSelectedCellsData())
    this.sheet.insertCols(col + colCount, colCount)
  }

  onDeleteRow() {
    const { row, rowCount } = this.viewModel.getSelector()
    this.sheet.deleteRows(row, rowCount)
  }

  onDeleteColumn() {
    const { col, colCount } = this.viewModel.getSelector()
    this.sheet.deleteCols(col, colCount)
  }

  onClearStyle() {
    const { col, colCount, row, rowCount } = this.viewModel.getSelector()
    this.sheet.clearStyle({ col, colCount, row, rowCount })
  }

  onClearAll() {
    const { col, colCount, row, rowCount } = this.viewModel.getSelector()
    this.sheet.clearCellsData({ col, colCount, row, rowCount })
  }

  onHideColumn() {
    const { col, colCount } = this.viewModel.getSelector()
    this.sheet.hideCols(col, colCount)
  }

  onHideRow() {
    const { row, rowCount } = this.viewModel.getSelector()
    this.sheet.hideRows(row, rowCount)
  }

  onCancelHidden() {
    const { type } = this.targetCell
    if (type === 'corner' || type === 'colHeader') {
      const wholeCols = this.viewModel.getSelectedWholeCols()
      if (wholeCols) {
        this.sheet.cancelHideCols(wholeCols.col, wholeCols.colCount)
      }
    }
    if (type === 'corner' || type === 'rowHeader') {
      const wholeRows = this.viewModel.getSelectedWholeRows()
      if (wholeRows) {
        this.sheet.cancelHideRows(wholeRows.row, wholeRows.rowCount)
      }
    }
  }

  position({ offsetX, offsetY }) {
    let left = offsetX
    let top = offsetY

    const canvasWidth = this.container.offsetWidth
    const canvasHeight = this.container.offsetHeight
    const menuWidth = this.contextmenuEl.offsetWidth
    const menuHeight = this.contextmenuEl.offsetHeight
    // console.warn({ offsetX, offsetY }, { canvasWidth, canvasHeight }, { menuWidth, menuHeight })
    if (left + menuWidth > canvasWidth) {
      left = offsetX - menuWidth
    }
    if (top + menuHeight > canvasHeight) {
      top = offsetY - menuHeight - 20
    }
    this.contextmenuEl.style.left = left + 'px'
    this.contextmenuEl.style.top = top + 'px'
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

  filterItems(type) {
    const { col, row, colCount, rowCount } = this.viewModel.getSelector()
    Object.keys(this.itemEls).forEach((key) => {
      const itemConfig = configs.find((c) => camelCase(c.key) === key)
      const { symbolType, scope, name } = itemConfig
      const itemEl = this.itemEls[key]
      if (scope.find((s) => s === type)) {
        itemEl.style.display = 'flex'
        if (symbolType === 'colHeader') {
          itemEl.innerHTML = name
            .replace(
              '$m',
              colCount === 1
                ? numberToAlpha(col)
                : `${numberToAlpha(col)} ~ ${numberToAlpha(col + colCount - 1)}`
            )
            .replace('$n', colCount)
        } else if (symbolType === 'rowHeader') {
          itemEl.innerHTML = name
            .replace('$m', rowCount === 1 ? row + 1 : `${row + 1} ~ ${row + rowCount}`)
            .replace('$n', rowCount)
        }
      } else {
        itemEl.style.display = 'none'
      }
    })
  }

  /**
   * @description 如果鼠标右键菜单所在位置的单元格不在之前圈选或点选的单元格区域内，需要更新选中单元格
   * @param {*} cell 数据右键菜单位置对应的单元格
   */
  setTargetRange(cell) {
    const { col, row, colCount, rowCount } = this.viewModel.getSelector()
    if (cell.type === 'cell') {
      // 不在区域中
      if (
        cell.col < col ||
        cell.col > col + colCount - 1 ||
        cell.row < row ||
        cell.row > row + rowCount - 1
      ) {
        this.sheet.selectCell(cell.col, cell.row)
      }
    } else if (cell.type === 'colHeader') {
      // 不在区域中
      if (
        cell.col < col ||
        cell.col > col + colCount - 1 ||
        rowCount !== this.viewModel.getRowsNumber()
      ) {
        this.sheet.selectCols(cell.col)
      }
    } else if (cell.type === 'rowHeader') {
      // 不在区域中
      if (
        cell.row < row ||
        cell.row > row + rowCount - 1 ||
        colCount !== this.viewModel.getColsNumber()
      ) {
        this.sheet.selectRows(cell.row)
      }
    } else if (cell.type === 'corner') {
      this.sheet.selectAllCells()
    }
  }
}

export default Contextmenu
