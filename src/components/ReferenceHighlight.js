/**
 * @description 单元格引用高亮组件
 * 在编辑公式时高亮显示引用的单元格
 */

import { parseRef } from '../formula/CellReference'
import './referenceHighlight.scss'

// 高亮颜色列表
const HIGHLIGHT_COLORS = [
  { border: '#1a73e8', bg: 'rgba(26, 115, 232, 0.1)' }, // 蓝色
  { border: '#ea4335', bg: 'rgba(234, 67, 53, 0.1)' }, // 红色
  { border: '#34a853', bg: 'rgba(52, 168, 83, 0.1)' }, // 绿色
  { border: '#fbbc04', bg: 'rgba(251, 188, 4, 0.15)' }, // 黄色
  { border: '#9334e6', bg: 'rgba(147, 52, 230, 0.1)' }, // 紫色
  { border: '#ff6d01', bg: 'rgba(255, 109, 1, 0.1)' }, // 橙色
  { border: '#46bdc6', bg: 'rgba(70, 189, 198, 0.1)' }, // 青色
  { border: '#e91e63', bg: 'rgba(233, 30, 99, 0.1)' }, // 粉色
]

/**
 * @description 从公式文本中提取所有单元格引用
 * @param {string} formula - 公式字符串
 * @returns {Array} 引用数组 [{type: 'cell'|'range', ref: string, col, row, ...}]
 */
function extractReferences(formula) {
  if (!formula || !formula.startsWith('=')) {
    return []
  }

  const refs = []
  // 匹配单元格引用和范围引用: A1, $A$1, A1:B5, $A$1:$B$5
  const pattern = /(\$?[A-Z]+\$?\d+)(?::(\$?[A-Z]+\$?\d+))?/gi
  let match = pattern.exec(formula)

  while (match) {
    const fullMatch = match[0]
    const startRef = match[1]
    const endRef = match[2]

    if (endRef) {
      // 范围引用
      const startParsed = parseRef(startRef)
      const endParsed = parseRef(endRef)
      if (startParsed && endParsed) {
        refs.push({
          type: 'range',
          ref: fullMatch,
          col: startParsed.col,
          row: startParsed.row,
          endCol: endParsed.col,
          endRow: endParsed.row,
        })
      }
    } else {
      // 单元格引用
      const parsed = parseRef(startRef)
      if (parsed) {
        refs.push({
          type: 'cell',
          ref: fullMatch,
          col: parsed.col,
          row: parsed.row,
        })
      }
    }

    match = pattern.exec(formula)
  }

  return refs
}

class ReferenceHighlight {
  constructor({ container, viewModel }) {
    this.container = container
    this.viewModel = viewModel
    this.highlights = []
    this.colorIndex = 0

    this.initElements()
  }

  initElements() {
    // 高亮层容器
    this.layerEl = document.createElement('div')
    this.layerEl.classList.add('qt-reference-highlight-layer')
    this.container.appendChild(this.layerEl)
  }

  /**
   * @description 更新高亮显示
   * @param {string} formula - 当前公式
   */
  update(formula) {
    this.clear()

    if (!formula || !formula.startsWith('=')) {
      return []
    }

    const refs = extractReferences(formula)
    this.colorIndex = 0

    refs.forEach((ref) => {
      this.addHighlight(ref)
    })

    return refs.map((ref, index) => ({
      ...ref,
      color: HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length],
    }))
  }

  /**
   * @description 添加单个高亮
   */
  addHighlight(ref) {
    const color = HIGHLIGHT_COLORS[this.colorIndex % HIGHLIGHT_COLORS.length]
    this.colorIndex += 1

    if (ref.type === 'cell') {
      this.addCellHighlight(ref.col, ref.row, color)
    } else if (ref.type === 'range') {
      this.addRangeHighlight(ref.col, ref.row, ref.endCol, ref.endRow, color)
    }
  }

  /**
   * @description 添加单元格高亮
   */
  addCellHighlight(col, row, color) {
    const bbox = this.viewModel.getCellBBox({ col, row })
    if (!bbox) return

    const { scrollX, scrollY } = this.viewModel.sheetData
    const el = document.createElement('div')
    el.classList.add('qt-reference-highlight')
    el.style.left = `${bbox.left - scrollX}px`
    el.style.top = `${bbox.top - scrollY}px`
    el.style.width = `${bbox.width}px`
    el.style.height = `${bbox.height}px`
    el.style.borderColor = color.border
    el.style.backgroundColor = color.bg

    this.layerEl.appendChild(el)
    this.highlights.push(el)
  }

  /**
   * @description 添加范围高亮
   */
  addRangeHighlight(startCol, startRow, endCol, endRow, color) {
    const minCol = Math.min(startCol, endCol)
    const maxCol = Math.max(startCol, endCol)
    const minRow = Math.min(startRow, endRow)
    const maxRow = Math.max(startRow, endRow)

    const startBbox = this.viewModel.getCellBBox({ col: minCol, row: minRow })
    const endBbox = this.viewModel.getCellBBox({ col: maxCol, row: maxRow })

    if (!startBbox || !endBbox) return

    const { scrollX, scrollY } = this.viewModel.sheetData
    const el = document.createElement('div')
    el.classList.add('qt-reference-highlight')
    el.style.left = `${startBbox.left - scrollX}px`
    el.style.top = `${startBbox.top - scrollY}px`
    el.style.width = `${endBbox.left + endBbox.width - startBbox.left}px`
    el.style.height = `${endBbox.top + endBbox.height - startBbox.top}px`
    el.style.borderColor = color.border
    el.style.backgroundColor = color.bg

    this.layerEl.appendChild(el)
    this.highlights.push(el)
  }

  /**
   * @description 清除所有高亮
   */
  clear() {
    this.highlights.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }
    })
    this.highlights = []
    this.colorIndex = 0
  }

  /**
   * @description 显示高亮层
   */
  show() {
    this.layerEl.style.display = 'block'
  }

  /**
   * @description 隐藏高亮层
   */
  hide() {
    this.layerEl.style.display = 'none'
    this.clear()
  }

  /**
   * @description 销毁
   */
  destroy() {
    this.clear()
    if (this.layerEl && this.layerEl.parentNode) {
      this.layerEl.parentNode.removeChild(this.layerEl)
    }
  }
}

export { HIGHLIGHT_COLORS, extractReferences }
export default ReferenceHighlight
