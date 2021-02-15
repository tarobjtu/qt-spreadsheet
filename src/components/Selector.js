import './selector.scss'

class Selector {
  constructor({ container, viewModel }) {
    this.container = container
    this.viewModel = viewModel

    this.initElements()
  }

  initElements() {
    const { container } = this
    this.selectorEl = document.createElement('div')
    this.selectorEl.classList.add('qt-spreadsheet-selector')
    container.appendChild(this.selectorEl)
    this.activeCellEl = document.createElement('div')
    this.activeCellEl.classList.add('qt-spreadsheet-selector-active')
    this.selectorEl.appendChild(this.activeCellEl)
    this.sectionEl = document.createElement('div')
    this.sectionEl.classList.add('qt-spreadsheet-selector-section')
    this.selectorEl.appendChild(this.sectionEl)
    this.cornerEl = document.createElement('div')
    this.cornerEl.classList.add('qt-spreadsheet-selector-corner')
    this.sectionEl.appendChild(this.cornerEl)
  }

  setOffset(element, { left, top, width, height }) {
    const ele = element
    ele.style.left = left + 'px'
    ele.style.top = top + 'px'
    ele.style.width = width + 'px'
    ele.style.height = height + 'px'
    return this
  }

  position() {
    const { scrollX, scrollY, selector } = this.viewModel.sheetData
    const { col, row, colCount, rowCount, activeCol, activeRow } = selector

    // 设置选中区域位置信息
    const sectionBBox = this.viewModel.getCellsBBox({
      col,
      row,
      colCount,
      rowCount,
    })
    this.setOffset(this.sectionEl, {
      left: sectionBBox.left - scrollX,
      top: sectionBBox.top - scrollY,
      width: sectionBBox.width,
      height: sectionBBox.height,
    })

    // 设置选中区域的活跃单元格位置信息
    const activeCellBBox = this.viewModel.getCellsBBox({
      col: activeCol,
      row: activeRow,
      colCount: 1,
      rowCount: 1,
    })

    this.setOffset(this.activeCellEl, {
      left: activeCellBBox.left - scrollX,
      top: activeCellBBox.top - scrollY,
      width: activeCellBBox.width,
      height: activeCellBBox.height,
    })
    return this
  }

  show() {
    this.selectorEl.style.display = 'block'
    return this
  }

  hide() {
    this.selectorEl.style.display = 'none'
    return this
  }
}

export default Selector
