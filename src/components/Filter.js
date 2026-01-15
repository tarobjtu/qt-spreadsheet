import './filter.scss'

/**
 * @description 筛选器组件
 * 提供列数据的筛选功能，类似 Excel 的自动筛选
 */
class Filter {
  constructor({ sheet, container, viewModel }) {
    this.sheet = sheet
    this.container = container
    this.viewModel = viewModel
    this.isVisible = false

    // 当前筛选的列
    this.currentCol = -1

    // 筛选状态: { col: { values: Set, condition: {...} } }
    this.filterState = new Map()

    // 筛选的行范围 (表头行不参与筛选)
    this.filterRange = { startRow: 1, endRow: -1 }

    // 是否启用筛选
    this.filterEnabled = false

    this.initElements()
    this.bindEvents()
  }

  initElements() {
    const { container } = this

    this.dialogEl = document.createElement('div')
    this.dialogEl.classList.add('qt-spreadsheet-filter')
    this.dialogEl.innerHTML = `
      <div class="qt-spreadsheet-filter-header">
        <span class="qt-spreadsheet-filter-title">筛选</span>
        <button class="qt-spreadsheet-filter-close">&times;</button>
      </div>
      <div class="qt-spreadsheet-filter-body">
        <div class="qt-spreadsheet-filter-search">
          <input type="text" class="qt-spreadsheet-filter-search-input" placeholder="搜索...">
        </div>
        <div class="qt-spreadsheet-filter-options">
          <label class="qt-spreadsheet-filter-option select-all">
            <input type="checkbox" checked> 全选
          </label>
        </div>
        <div class="qt-spreadsheet-filter-list"></div>
      </div>
      <div class="qt-spreadsheet-filter-footer">
        <button class="qt-spreadsheet-filter-btn clear-btn">清除筛选</button>
        <button class="qt-spreadsheet-filter-btn cancel-btn">取消</button>
        <button class="qt-spreadsheet-filter-btn apply-btn">确定</button>
      </div>
    `
    container.appendChild(this.dialogEl)

    // 获取元素引用
    this.searchInput = this.dialogEl.querySelector('.qt-spreadsheet-filter-search-input')
    this.selectAllCheckbox = this.dialogEl.querySelector('.select-all input')
    this.listEl = this.dialogEl.querySelector('.qt-spreadsheet-filter-list')
    this.closeBtn = this.dialogEl.querySelector('.qt-spreadsheet-filter-close')
    this.clearBtn = this.dialogEl.querySelector('.clear-btn')
    this.cancelBtn = this.dialogEl.querySelector('.cancel-btn')
    this.applyBtn = this.dialogEl.querySelector('.apply-btn')

    // 筛选按钮容器
    this.filterButtonsEl = document.createElement('div')
    this.filterButtonsEl.classList.add('qt-spreadsheet-filter-buttons')
    container.appendChild(this.filterButtonsEl)
  }

  destroy() {
    this.events.forEach((ea) => {
      ea[0].removeEventListener(ea[1], ea[2])
    })
  }

  bindEvents() {
    this.events = []

    const onClose = () => this.hide()
    const onClear = () => this.clearFilter()
    const onApply = () => this.applyFilter()
    const onSearch = () => this.onSearch()
    const onSelectAllChange = () => this.onSelectAllChange()
    const onKeydown = (e) => {
      if (e.key === 'Escape') this.hide()
    }

    this.events.push([this.closeBtn, 'click', onClose])
    this.events.push([this.cancelBtn, 'click', onClose])
    this.events.push([this.clearBtn, 'click', onClear])
    this.events.push([this.applyBtn, 'click', onApply])
    this.events.push([this.searchInput, 'input', onSearch])
    this.events.push([this.selectAllCheckbox, 'change', onSelectAllChange])
    this.events.push([this.dialogEl, 'keydown', onKeydown])

    this.closeBtn.addEventListener('click', onClose)
    this.cancelBtn.addEventListener('click', onClose)
    this.clearBtn.addEventListener('click', onClear)
    this.applyBtn.addEventListener('click', onApply)
    this.searchInput.addEventListener('input', onSearch)
    this.selectAllCheckbox.addEventListener('change', onSelectAllChange)
    this.dialogEl.addEventListener('keydown', onKeydown)
  }

  /**
   * @description 启用/禁用筛选功能
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.filterEnabled = enabled
    if (enabled) {
      this.renderFilterButtons()
    } else {
      this.clearAllFilters()
      this.filterButtonsEl.innerHTML = ''
    }
  }

  /**
   * @description 渲染筛选按钮到列头
   */
  renderFilterButtons() {
    if (!this.filterEnabled) return

    this.filterButtonsEl.innerHTML = ''
    const { colsMeta, scrollX } = this.viewModel.sheetData
    const headerHeight = this.viewModel.getRowHeight(0)
    const { freezeX } = this.viewModel.getFreeze()

    // 仅为第一行（表头行）的列添加筛选按钮
    colsMeta.forEach((meta, colIndex) => {
      if (meta.hidden) return

      const btn = document.createElement('div')
      btn.classList.add('qt-spreadsheet-filter-btn-icon')
      btn.setAttribute('data-col', colIndex)

      // 计算按钮位置
      let left = meta.offset + meta.size - 20

      // 处理冻结列
      if (colIndex >= freezeX) {
        left -= scrollX
      }

      // 检查是否有筛选
      if (this.filterState.has(colIndex)) {
        btn.classList.add('active')
      }

      btn.style.left = `${left}px`
      btn.style.top = `${(headerHeight - 16) / 2}px`

      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.showForColumn(colIndex, e.target)
      })

      this.filterButtonsEl.appendChild(btn)
    })
  }

  /**
   * @description 显示指定列的筛选对话框
   * @param {number} col - 列索引
   * @param {HTMLElement} targetEl - 触发元素
   */
  showForColumn(col, targetEl) {
    this.currentCol = col
    this.loadColumnValues(col)
    this.positionNearElement(targetEl)
    this.show()
  }

  /**
   * @description 加载列的唯一值
   * @param {number} col - 列索引
   */
  loadColumnValues(col) {
    const { data } = this.viewModel.sheetData
    const values = new Map() // value -> count

    // 获取当前筛选状态
    const currentFilter = this.filterState.get(col)
    const selectedValues = currentFilter ? currentFilter.values : null

    // 收集列中的所有唯一值
    for (let r = this.filterRange.startRow; r < data.length; r += 1) {
      const cell = data[r] && data[r][col]
      const value = cell ? String(cell.value || '') : ''

      if (values.has(value)) {
        values.set(value, values.get(value) + 1)
      } else {
        values.set(value, 1)
      }
    }

    // 渲染值列表
    this.listEl.innerHTML = ''

    // 排序值
    const sortedValues = Array.from(values.keys()).sort((a, b) => {
      if (a === '') return 1
      if (b === '') return -1
      return String(a).localeCompare(String(b), 'zh-CN')
    })

    sortedValues.forEach((value) => {
      const count = values.get(value)
      const isChecked = selectedValues ? selectedValues.has(value) : true

      const label = document.createElement('label')
      label.classList.add('qt-spreadsheet-filter-item')
      label.innerHTML = `
        <input type="checkbox" value="${this.escapeHtml(value)}" ${isChecked ? 'checked' : ''}>
        <span class="qt-spreadsheet-filter-item-text">${value || '(空白)'}</span>
        <span class="qt-spreadsheet-filter-item-count">(${count})</span>
      `
      this.listEl.appendChild(label)
    })

    // 更新全选状态
    this.updateSelectAllState()
  }

  // eslint-disable-next-line class-methods-use-this
  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  onSearch() {
    const keyword = this.searchInput.value.toLowerCase()
    const items = this.listEl.querySelectorAll('.qt-spreadsheet-filter-item')

    items.forEach((el) => {
      const text = el.querySelector('.qt-spreadsheet-filter-item-text').textContent.toLowerCase()
      el.style.display = text.includes(keyword) ? 'flex' : 'none' // eslint-disable-line no-param-reassign
    })
  }

  onSelectAllChange() {
    const isChecked = this.selectAllCheckbox.checked
    const checkboxes = this.listEl.querySelectorAll('input[type="checkbox"]')
    checkboxes.forEach((checkbox) => {
      if (checkbox.parentElement.style.display !== 'none') {
        checkbox.checked = isChecked // eslint-disable-line no-param-reassign
      }
    })
  }

  updateSelectAllState() {
    const checkboxes = this.listEl.querySelectorAll('input[type="checkbox"]')
    const allChecked = Array.from(checkboxes).every((cb) => cb.checked)
    const someChecked = Array.from(checkboxes).some((cb) => cb.checked)

    this.selectAllCheckbox.checked = allChecked
    this.selectAllCheckbox.indeterminate = someChecked && !allChecked
  }

  /**
   * @description 应用筛选
   */
  applyFilter() {
    const checkboxes = this.listEl.querySelectorAll('input[type="checkbox"]')
    const selectedValues = new Set()

    checkboxes.forEach((cb) => {
      if (cb.checked) {
        selectedValues.add(cb.value)
      }
    })

    // 检查是否全选
    const allChecked = checkboxes.length === selectedValues.size

    if (allChecked) {
      // 全选则清除此列的筛选
      this.filterState.delete(this.currentCol)
    } else {
      // 保存筛选状态
      this.filterState.set(this.currentCol, {
        values: selectedValues,
      })
    }

    this.applyAllFilters()
    this.hide()
    this.renderFilterButtons()
  }

  /**
   * @description 应用所有筛选条件
   */
  applyAllFilters() {
    const { data, rowsMeta } = this.viewModel.sheetData

    // 重置所有行的可见性
    for (let r = 0; r < rowsMeta.length; r += 1) {
      if (r >= this.filterRange.startRow) {
        // 标记为筛选隐藏
        rowsMeta[r].filteredOut = false
      }
    }

    // 如果没有筛选条件，显示所有行
    if (this.filterState.size === 0) {
      this.sheet.draw()
      this.sheet.emit('filter')
      return
    }

    // 应用每个列的筛选条件
    for (let r = this.filterRange.startRow; r < data.length; r += 1) {
      let visible = true

      this.filterState.forEach((filter, col) => {
        const cell = data[r] && data[r][col]
        const value = cell ? String(cell.value || '') : ''

        if (!filter.values.has(value)) {
          visible = false
        }
      })

      if (!visible) {
        rowsMeta[r].filteredOut = true
      }
    }

    this.sheet.draw()
    this.sheet.emit('filter')
  }

  /**
   * @description 清除当前列的筛选
   */
  clearFilter() {
    this.filterState.delete(this.currentCol)
    this.applyAllFilters()
    this.hide()
    this.renderFilterButtons()
  }

  /**
   * @description 清除所有筛选
   */
  clearAllFilters() {
    this.filterState.clear()
    this.applyAllFilters()
    this.renderFilterButtons()
  }

  /**
   * @description 定位对话框到触发元素附近
   * @param {HTMLElement} targetEl
   */
  positionNearElement(targetEl) {
    const rect = targetEl.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()

    let left = rect.left - containerRect.left
    let top = rect.bottom - containerRect.top + 5

    // 确保不超出边界
    const dialogWidth = 280
    const dialogHeight = 350
    const maxLeft = containerRect.width - dialogWidth - 10
    const maxTop = containerRect.height - dialogHeight - 10

    left = Math.min(left, maxLeft)
    top = Math.min(top, maxTop)

    this.dialogEl.style.left = `${left}px`
    this.dialogEl.style.top = `${top}px`
  }

  show() {
    this.dialogEl.style.display = 'block'
    this.isVisible = true
    this.searchInput.value = ''
    this.searchInput.focus()
  }

  hide() {
    this.dialogEl.style.display = 'none'
    this.isVisible = false
  }

  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * @description 检查行是否被筛选隐藏
   * @param {number} row - 行索引
   * @returns {boolean}
   */
  isRowFiltered(row) {
    const rowMeta = this.viewModel.sheetData.rowsMeta[row]
    return rowMeta && rowMeta.filteredOut === true
  }
}

export default Filter
