import _ from 'lodash'
import { directionToRect } from '../utils/canvas'
import './selector.scss'

class Selector {
  constructor({ sheet, container, viewModel }) {
    this.sheet = sheet
    this.container = container
    this.viewModel = viewModel

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

  bindEvents() {
    this.events = []
    const mousedown = this.onMousedown.bind(this)
    const mousemove = _.throttle(this.onMousemove.bind(this), 100)
    const mouseup = this.onMouseup.bind(this)
    this.events.push([this.cornerEl, 'mousedown', mousedown])
    this.events.push([window, 'mousemove', mousemove])
    this.events.push([window, 'mouseup', mouseup])

    this.cornerEl.addEventListener('mousedown', mousedown, false)
    window.addEventListener('mousemove', mousemove, false)
    window.addEventListener('mouseup', mouseup, false)
    this.sheet.on('startSelectCell', this.onStartSelectCell.bind(this))
    this.sheet.on('endSelectCell', this.onEndSelectCell.bind(this))
  }

  onStartSelectCell() {
    this.cornerDisable()
  }

  onEndSelectCell() {
    this.cornerEnable()
  }

  onMousedown(e) {
    this.cornerActive = true
    e.stopPropagation() // 禁止冒泡到canvas上
    this.cornerDisable()
  }

  onMousemove(e) {
    if (!this.cornerActive) return
    this.mousemoving = true
    const { target, offsetX, offsetY } = e
    this.batchEditing(offsetX, offsetY, target)
  }

  onMouseup(e) {
    if (!this.cornerActive) return
    this.cornerActive = false
    this.cornerEnable()

    // 鼠标移动才有效
    if (this.mousemoving) {
      this.mousemoving = false
      const { target, offsetX, offsetY } = e
      this.batchEditing(offsetX, offsetY, target)
    }
  }

  cornerDisable() {
    this.cornerEl.style.pointerEvents = 'none'
  }

  cornerEnable() {
    this.cornerEl.style.pointerEvents = 'all'
  }

  /**
   * @description 拖拽corner，批量编辑单元格数据
   * @param {*} offsetX
   * @param {*} offsetY
   * @param {*} target
   */
  batchEditing(offsetX, offsetY, target) {
    // 鼠标超出 canvas 区域
    if (!this.container.contains(target)) return
    const { scrollX, scrollY } = this.viewModel.getSheetData()
    const area = this.getBatchEditingRect(offsetX + scrollX, offsetY + scrollY)
    console.warn(area)
  }

  getBatchEditingRect(offsetX, offsetY) {
    let rect
    const { left, top, width, height } = this.viewModel.getSelectedCellBBox()
    const direction = directionToRect({ left, top, width, height }, { offsetX, offsetY })
    if (direction === 'right') {
      rect = this.viewModel.getRectCRs({
        left: left + width + 1,
        top: top + 1,
        width: offsetX - left - width,
        height: 0,
      })
    } else if (direction === 'bottom') {
      rect = this.viewModel.getRectCRs({
        left: left + 1,
        top: top + height + 1,
        width: 0,
        height: offsetY - top - height,
      })
    } else if (direction === 'left') {
      rect = this.viewModel.getRectCRs({
        left: offsetX,
        top: top + 1,
        width: left - offsetX - 1,
        height: 0,
      })
    } else if (direction === 'up') {
      rect = this.viewModel.getRectCRs({
        left: left + 1,
        top: offsetY,
        width: 0,
        height: top - offsetY - 1,
      })
    }

    return {
      direction,
      rect,
    }
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
