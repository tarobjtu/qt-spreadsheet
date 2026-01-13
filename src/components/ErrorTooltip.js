/**
 * @description 公式错误提示组件
 * 当鼠标悬停在包含错误的单元格上时显示错误详情
 */

import { isError, getErrorMessage } from '../formula/errors'
import './errorTooltip.scss'

class ErrorTooltip {
  constructor({ container, viewModel }) {
    this.container = container
    this.viewModel = viewModel
    this.visible = false
    this.currentCell = null

    this.initElements()
  }

  initElements() {
    this.tooltipEl = document.createElement('div')
    this.tooltipEl.classList.add('qt-error-tooltip')
    this.tooltipEl.style.display = 'none'
    this.container.appendChild(this.tooltipEl)
  }

  /**
   * @description 显示错误提示
   * @param {number} col - 列索引
   * @param {number} row - 行索引
   * @param {object} position - 鼠标位置 {x, y}
   */
  show(col, row, position) {
    const data = this.viewModel.getCellData(col, row)
    const value = data.formula ? data.calculated : data.value

    if (!isError(value)) {
      this.hide()
      return
    }

    // 检查是否是同一个单元格
    if (this.currentCell && this.currentCell.col === col && this.currentCell.row === row) {
      // 只更新位置
      this.updatePosition(position)
      return
    }

    this.currentCell = { col, row }
    const errorMessage = getErrorMessage(value)

    this.tooltipEl.innerHTML = `
      <div class="qt-error-tooltip-header">
        <span class="qt-error-tooltip-icon">⚠</span>
        <span class="qt-error-tooltip-code">${value}</span>
      </div>
      <div class="qt-error-tooltip-message">${errorMessage}</div>
    `

    this.updatePosition(position)
    this.tooltipEl.style.display = 'block'
    this.visible = true
  }

  /**
   * @description 更新提示位置
   */
  updatePosition(position) {
    const tooltipWidth = this.tooltipEl.offsetWidth || 200
    const tooltipHeight = this.tooltipEl.offsetHeight || 60
    const containerRect = this.container.getBoundingClientRect()

    let left = position.x + 10
    let top = position.y + 15

    // 防止超出右边界
    if (left + tooltipWidth > containerRect.width) {
      left = position.x - tooltipWidth - 10
    }

    // 防止超出下边界
    if (top + tooltipHeight > containerRect.height) {
      top = position.y - tooltipHeight - 10
    }

    this.tooltipEl.style.left = `${left}px`
    this.tooltipEl.style.top = `${top}px`
  }

  /**
   * @description 隐藏错误提示
   */
  hide() {
    this.tooltipEl.style.display = 'none'
    this.visible = false
    this.currentCell = null
  }

  /**
   * @description 检查指定单元格是否有错误
   */
  hasError(col, row) {
    const data = this.viewModel.getCellData(col, row)
    const value = data.formula ? data.calculated : data.value
    return isError(value)
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this.tooltipEl && this.tooltipEl.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl)
    }
  }
}

export default ErrorTooltip
