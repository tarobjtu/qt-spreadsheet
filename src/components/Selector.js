import throttle from 'lodash/throttle'
import isEqual from 'lodash/isEqual'
import { directionToRect, mergeSelector } from '../utils/canvas'
import { deepClone } from '../utils/common'
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
    // 容器
    this.selectorEl = document.createElement('div')
    this.selectorEl.classList.add('qt-spreadsheet-selector')
    container.appendChild(this.selectorEl)
    // 圈选激活的单元格
    this.activeCellEl = document.createElement('div')
    this.activeCellEl.classList.add('qt-spreadsheet-selector-active')
    this.selectorEl.appendChild(this.activeCellEl)
    // 圈选区域
    this.sectionEl = document.createElement('div')
    this.sectionEl.classList.add('qt-spreadsheet-selector-section')
    this.selectorEl.appendChild(this.sectionEl)
    // 批量编辑触发角头
    this.cornerEl = document.createElement('div')
    this.cornerEl.classList.add('qt-spreadsheet-selector-corner')
    this.sectionEl.appendChild(this.cornerEl)
    // 自动填充区域
    this.autofillEl = document.createElement('div')
    this.autofillEl.classList.add('qt-spreadsheet-selector-autofill-area')
    this.selectorEl.appendChild(this.autofillEl)
  }

  bindEvents() {
    this.events = []
    const mousedown = this.onMousedown.bind(this)
    const mousemove = throttle(this.onMousemove.bind(this), 100)
    const mouseup = this.onMouseup.bind(this)
    // 自动填充的拖拽事件
    this.events.push([this.cornerEl, 'mousedown', mousedown])
    this.events.push([window, 'mousemove', mousemove])
    this.events.push([window, 'mouseup', mouseup])
    this.cornerEl.addEventListener('mousedown', mousedown, false)
    window.addEventListener('mousemove', mousemove, false)
    window.addEventListener('mouseup', mouseup, false)

    // 自定义事件
    this.sheet.on('startSelectCell', this.onStartSelectCell.bind(this))
    this.sheet.on('endSelectCell', this.onEndSelectCell.bind(this))
    this.sheet.on('scroll', this.position.bind(this))
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
    this.autofill(offsetX, offsetY, target)
  }

  onMouseup(e) {
    if (!this.cornerActive) return
    this.cornerActive = false
    this.cornerEnable()

    // 鼠标移动才有效
    if (this.mousemoving) {
      this.mousemoving = false
      const { target, offsetX, offsetY } = e
      this.autofill(offsetX, offsetY, target, 'finished')
    }
  }

  cornerDisable() {
    this.cornerEl.style.pointerEvents = 'none'
  }

  cornerEnable() {
    this.cornerEl.style.pointerEvents = 'all'
  }

  /**
   * @description 保存上一次selector的位置
   */
  saveLastSelectorStatus() {
    const lastSheetData = this.viewModel.getLastHistory()
    const lastSelector = lastSheetData.selector
    const curSelector = this.viewModel.getSelector()
    // selector不同时保存
    if (!isEqual(lastSelector, curSelector)) {
      this.viewModel.saveToHistory()
    }
  }

  /**
   * @description 拖拽corner，自动填充单元格数据
   * @param {*} offsetX
   * @param {*} offsetY
   * @param {*} target
   * @param {*} state
   */
  autofill(offsetX, offsetY, target, state) {
    // 鼠标超出 canvas 区域
    if (!this.container.contains(target)) return
    const { scrollX, scrollY } = this.viewModel.getSheetData()
    const { rect, direction } = this.getAutofillRect(offsetX + scrollX, offsetY + scrollY)
    // 方向在选中区域内部的，不执行自动填充
    if (direction === 'inner') return

    const { left, top, width, height } = this.viewModel.getCellsBBox(rect)
    this.setOffset(this.autofillEl, { left: left - scrollX, top: top - scrollY, width, height })
    this.autofillEl.style.display = 'block'
    this.autofillEl.setAttribute('data-direction', direction)

    // mouseup
    if (state === 'finished') {
      // 保存 selector 状态
      this.saveLastSelectorStatus()
      this.autofillEl.style.display = 'none'
      const sourceRect = this.viewModel.getSelector()
      this.autofillData(sourceRect, rect, direction)

      // 更新选中区域
      const selections = this.viewModel.getSelector()
      const mergedSelector = mergeSelector(selections, rect)
      this.viewModel.setSelector(mergedSelector)
      this.viewModel.saveToHistory()
      this.sheet.draw()
    }
  }

  autofillData(sourceRect, targetRect, direction) {
    const { col, row, colCount, rowCount } = targetRect
    let sourceRowPointer // 遍历sourceRect的row指针
    let sourceColPointer // 遍历sourceRect的col指针

    if (direction === 'right' || direction === 'bottom') {
      for (let ri = row; ri < row + rowCount; ri += 1) {
        for (let ci = col; ci < col + colCount; ci += 1) {
          const start = ri === row && ci === col
          sourceRowPointer = sourceRect.row + ((ri - row) % sourceRect.rowCount)
          sourceColPointer = sourceRect.col + ((ci - col) % sourceRect.colCount)
          const sourceData = this.viewModel.getCellData(sourceColPointer, sourceRowPointer)
          this.viewModel.setCellDataBatched(ci, ri, deepClone(sourceData), start)
        }
      }
    } else if (direction === 'left' || direction === 'up') {
      for (let ri = row + rowCount - 1; ri >= row; ri -= 1) {
        for (let ci = col + colCount - 1; ci >= col; ci -= 1) {
          const start = ri === row + rowCount - 1 && ci === col + colCount - 1
          sourceRowPointer =
            sourceRect.row +
            sourceRect.rowCount -
            1 -
            ((row + rowCount - 1 - ri) % sourceRect.rowCount)
          sourceColPointer =
            sourceRect.col +
            sourceRect.colCount -
            1 -
            ((col + colCount - 1 - ci) % sourceRect.colCount)
          const sourceData = this.viewModel.getCellData(sourceColPointer, sourceRowPointer)
          this.viewModel.setCellDataBatched(ci, ri, deepClone(sourceData), start)
        }
      }
    }
  }

  getAutofillRect(offsetX, offsetY) {
    let rect
    const { left, top, width, height } = this.viewModel.getSelectedCellsBBox()
    const direction = directionToRect({ left, top, width, height }, { offsetX, offsetY })
    if (direction === 'right') {
      rect = this.viewModel.getRectCRs({
        left: left + width + 1,
        top: top + 1,
        width: offsetX - left - width,
        height: height - 2,
      })
    } else if (direction === 'bottom') {
      rect = this.viewModel.getRectCRs({
        left: left + 1,
        top: top + height + 1,
        width: width - 2,
        height: offsetY - top - height,
      })
    } else if (direction === 'left') {
      rect = this.viewModel.getRectCRs({
        left: offsetX,
        top: top + 1,
        width: left - offsetX - 1,
        height: height - 2,
      })
    } else if (direction === 'up') {
      rect = this.viewModel.getRectCRs({
        left: left + 1,
        top: offsetY,
        width: width - 2,
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
    const { scrollX, scrollY } = this.viewModel.sheetData
    // 设置选中区域位置信息
    const sectionBBox = this.viewModel.getSelectedCellsBBox()

    this.setOffset(this.sectionEl, {
      left: sectionBBox.left - scrollX,
      top: sectionBBox.top - scrollY,
      width: sectionBBox.width,
      height: sectionBBox.height,
    })

    const activeCellBBox = this.viewModel.getSelectedActiveCellBBox()
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
