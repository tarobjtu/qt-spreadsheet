import './conditionalformat.scss'

/**
 * @description 条件格式类型
 */
const CONDITION_TYPES = {
  CELL_VALUE: 'cellValue', // 单元格值
  TEXT_CONTAINS: 'textContains', // 文本包含
  DUPLICATE: 'duplicate', // 重复值
  UNIQUE: 'unique', // 唯一值
  TOP_N: 'topN', // 前N项
  BOTTOM_N: 'bottomN', // 后N项
  ABOVE_AVERAGE: 'aboveAverage', // 高于平均值
  BELOW_AVERAGE: 'belowAverage', // 低于平均值
  COLOR_SCALE: 'colorScale', // 色阶
  DATA_BAR: 'dataBar', // 数据条
}

/**
 * @description 比较运算符
 */
const OPERATORS = {
  BETWEEN: 'between',
  NOT_BETWEEN: 'notBetween',
  EQUAL: 'equal',
  NOT_EQUAL: 'notEqual',
  GREATER: 'greater',
  LESS: 'less',
  GREATER_EQUAL: 'greaterEqual',
  LESS_EQUAL: 'lessEqual',
}

/**
 * @description 预设的格式样式
 */
const PRESET_STYLES = [
  { name: '浅红色填充', backgroundColor: '#ffc7ce', color: '#9c0006' },
  { name: '浅绿色填充', backgroundColor: '#c6efce', color: '#006100' },
  { name: '浅黄色填充', backgroundColor: '#ffeb9c', color: '#9c5700' },
  { name: '红色文本', backgroundColor: '', color: '#ff0000' },
  { name: '绿色文本', backgroundColor: '', color: '#00aa00' },
  { name: '蓝色文本', backgroundColor: '', color: '#0000ff' },
]

class ConditionalFormat {
  constructor({ sheet, container, viewModel }) {
    this.sheet = sheet
    this.container = container
    this.viewModel = viewModel
    this.isVisible = false

    // 条件格式规则: Array<{range, type, operator, values, style}>
    this.rules = []

    this.initElements()
    this.bindEvents()
  }

  initElements() {
    const { container } = this

    this.dialogEl = document.createElement('div')
    this.dialogEl.classList.add('qt-spreadsheet-conditional-format')
    this.dialogEl.innerHTML = `
      <div class="qt-spreadsheet-conditional-format-header">
        <span class="qt-spreadsheet-conditional-format-title">条件格式</span>
        <button class="qt-spreadsheet-conditional-format-close">&times;</button>
      </div>
      <div class="qt-spreadsheet-conditional-format-body">
        <div class="qt-spreadsheet-conditional-format-row">
          <label>格式类型：</label>
          <select class="qt-spreadsheet-conditional-format-type">
            <option value="cellValue">单元格值</option>
            <option value="textContains">文本包含</option>
            <option value="duplicate">重复值</option>
            <option value="unique">唯一值</option>
            <option value="topN">前N项</option>
            <option value="bottomN">后N项</option>
            <option value="aboveAverage">高于平均值</option>
            <option value="belowAverage">低于平均值</option>
            <option value="colorScale">色阶</option>
            <option value="dataBar">数据条</option>
          </select>
        </div>
        <div class="qt-spreadsheet-conditional-format-row condition-row">
          <label>条件：</label>
          <select class="qt-spreadsheet-conditional-format-operator">
            <option value="between">介于</option>
            <option value="notBetween">不介于</option>
            <option value="equal">等于</option>
            <option value="notEqual">不等于</option>
            <option value="greater">大于</option>
            <option value="less">小于</option>
            <option value="greaterEqual">大于等于</option>
            <option value="lessEqual">小于等于</option>
          </select>
        </div>
        <div class="qt-spreadsheet-conditional-format-row value-row">
          <label>值：</label>
          <input type="text" class="qt-spreadsheet-conditional-format-value1" placeholder="值1">
          <span class="qt-spreadsheet-conditional-format-and">至</span>
          <input type="text" class="qt-spreadsheet-conditional-format-value2" placeholder="值2">
        </div>
        <div class="qt-spreadsheet-conditional-format-row text-row" style="display:none;">
          <label>文本：</label>
          <input type="text" class="qt-spreadsheet-conditional-format-text" placeholder="输入要匹配的文本">
        </div>
        <div class="qt-spreadsheet-conditional-format-row topn-row" style="display:none;">
          <label>数量：</label>
          <input type="number" class="qt-spreadsheet-conditional-format-n" value="10" min="1">
        </div>
        <div class="qt-spreadsheet-conditional-format-row style-row">
          <label>样式：</label>
          <select class="qt-spreadsheet-conditional-format-preset">
            ${PRESET_STYLES.map((s, i) => `<option value="${i}">${s.name}</option>`).join('')}
            <option value="custom">自定义...</option>
          </select>
        </div>
        <div class="qt-spreadsheet-conditional-format-row custom-style-row" style="display:none;">
          <label>背景色：</label>
          <input type="color" class="qt-spreadsheet-conditional-format-bg" value="#ffeb9c">
          <label style="margin-left:10px;">文字色：</label>
          <input type="color" class="qt-spreadsheet-conditional-format-fg" value="#9c5700">
        </div>
        <div class="qt-spreadsheet-conditional-format-row color-scale-row" style="display:none;">
          <label>最小色：</label>
          <input type="color" class="qt-spreadsheet-conditional-format-min-color" value="#f8696b">
          <label style="margin-left:10px;">最大色：</label>
          <input type="color" class="qt-spreadsheet-conditional-format-max-color" value="#63be7b">
        </div>
        <div class="qt-spreadsheet-conditional-format-row data-bar-row" style="display:none;">
          <label>数据条颜色：</label>
          <input type="color" class="qt-spreadsheet-conditional-format-bar-color" value="#638ec6">
        </div>
        <div class="qt-spreadsheet-conditional-format-preview">
          <label>预览：</label>
          <div class="qt-spreadsheet-conditional-format-preview-box">示例文本</div>
        </div>
      </div>
      <div class="qt-spreadsheet-conditional-format-footer">
        <button class="qt-spreadsheet-conditional-format-btn manage-btn">管理规则</button>
        <button class="qt-spreadsheet-conditional-format-btn cancel-btn">取消</button>
        <button class="qt-spreadsheet-conditional-format-btn apply-btn">应用</button>
      </div>
    `
    container.appendChild(this.dialogEl)

    // 获取元素引用
    this.typeSelect = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-type')
    this.operatorSelect = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-operator')
    this.value1Input = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-value1')
    this.value2Input = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-value2')
    this.textInput = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-text')
    this.nInput = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-n')
    this.presetSelect = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-preset')
    this.bgColorInput = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-bg')
    this.fgColorInput = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-fg')
    this.minColorInput = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-min-color')
    this.maxColorInput = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-max-color')
    this.barColorInput = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-bar-color')
    this.andSpan = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-and')
    this.previewBox = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-preview-box')

    this.conditionRow = this.dialogEl.querySelector('.condition-row')
    this.valueRow = this.dialogEl.querySelector('.value-row')
    this.textRow = this.dialogEl.querySelector('.text-row')
    this.topnRow = this.dialogEl.querySelector('.topn-row')
    this.styleRow = this.dialogEl.querySelector('.style-row')
    this.customStyleRow = this.dialogEl.querySelector('.custom-style-row')
    this.colorScaleRow = this.dialogEl.querySelector('.color-scale-row')
    this.dataBarRow = this.dialogEl.querySelector('.data-bar-row')

    this.closeBtn = this.dialogEl.querySelector('.qt-spreadsheet-conditional-format-close')
    this.manageBtn = this.dialogEl.querySelector('.manage-btn')
    this.cancelBtn = this.dialogEl.querySelector('.cancel-btn')
    this.applyBtn = this.dialogEl.querySelector('.apply-btn')
  }

  destroy() {
    this.events.forEach((ea) => {
      ea[0].removeEventListener(ea[1], ea[2])
    })
  }

  bindEvents() {
    this.events = []

    const onClose = () => this.hide()
    const onTypeChange = () => this.onTypeChange()
    const onOperatorChange = () => this.onOperatorChange()
    const onPresetChange = () => this.onPresetChange()
    const onStyleChange = () => this.updatePreview()
    const onApply = () => this.applyRule()
    const onKeydown = (e) => {
      if (e.key === 'Escape') this.hide()
    }

    this.events.push([this.closeBtn, 'click', onClose])
    this.events.push([this.cancelBtn, 'click', onClose])
    this.events.push([this.typeSelect, 'change', onTypeChange])
    this.events.push([this.operatorSelect, 'change', onOperatorChange])
    this.events.push([this.presetSelect, 'change', onPresetChange])
    this.events.push([this.bgColorInput, 'input', onStyleChange])
    this.events.push([this.fgColorInput, 'input', onStyleChange])
    this.events.push([this.applyBtn, 'click', onApply])
    this.events.push([this.dialogEl, 'keydown', onKeydown])

    this.closeBtn.addEventListener('click', onClose)
    this.cancelBtn.addEventListener('click', onClose)
    this.typeSelect.addEventListener('change', onTypeChange)
    this.operatorSelect.addEventListener('change', onOperatorChange)
    this.presetSelect.addEventListener('change', onPresetChange)
    this.bgColorInput.addEventListener('input', onStyleChange)
    this.fgColorInput.addEventListener('input', onStyleChange)
    this.applyBtn.addEventListener('click', onApply)
    this.dialogEl.addEventListener('keydown', onKeydown)
  }

  onTypeChange() {
    const type = this.typeSelect.value

    // 隐藏所有行
    this.conditionRow.style.display = 'none'
    this.valueRow.style.display = 'none'
    this.textRow.style.display = 'none'
    this.topnRow.style.display = 'none'
    this.styleRow.style.display = 'flex'
    this.customStyleRow.style.display = 'none'
    this.colorScaleRow.style.display = 'none'
    this.dataBarRow.style.display = 'none'

    switch (type) {
      case CONDITION_TYPES.CELL_VALUE:
        this.conditionRow.style.display = 'flex'
        this.valueRow.style.display = 'flex'
        this.onOperatorChange()
        break
      case CONDITION_TYPES.TEXT_CONTAINS:
        this.textRow.style.display = 'flex'
        break
      case CONDITION_TYPES.TOP_N:
      case CONDITION_TYPES.BOTTOM_N:
        this.topnRow.style.display = 'flex'
        break
      case CONDITION_TYPES.COLOR_SCALE:
        this.styleRow.style.display = 'none'
        this.colorScaleRow.style.display = 'flex'
        break
      case CONDITION_TYPES.DATA_BAR:
        this.styleRow.style.display = 'none'
        this.dataBarRow.style.display = 'flex'
        break
      // duplicate, unique, aboveAverage, belowAverage 只需要样式设置
      default:
        break
    }

    this.onPresetChange()
  }

  onOperatorChange() {
    const operator = this.operatorSelect.value
    const showSecondValue = operator === 'between' || operator === 'notBetween'
    this.value2Input.style.display = showSecondValue ? 'block' : 'none'
    this.andSpan.style.display = showSecondValue ? 'inline' : 'none'
  }

  onPresetChange() {
    const presetIndex = this.presetSelect.value
    if (presetIndex === 'custom') {
      this.customStyleRow.style.display = 'flex'
    } else {
      this.customStyleRow.style.display = 'none'
      const preset = PRESET_STYLES[parseInt(presetIndex, 10)]
      if (preset) {
        this.bgColorInput.value = preset.backgroundColor || '#ffffff'
        this.fgColorInput.value = preset.color || '#000000'
      }
    }
    this.updatePreview()
  }

  updatePreview() {
    const bgColor = this.bgColorInput.value
    const fgColor = this.fgColorInput.value
    this.previewBox.style.backgroundColor = bgColor
    this.previewBox.style.color = fgColor
  }

  /**
   * @description 应用条件格式规则
   */
  applyRule() {
    const { col, row, colCount, rowCount } = this.viewModel.getSelector()
    const type = this.typeSelect.value

    const rule = {
      range: { col, row, colCount, rowCount },
      type,
      operator: this.operatorSelect.value,
      value1: this.value1Input.value,
      value2: this.value2Input.value,
      text: this.textInput.value,
      n: parseInt(this.nInput.value, 10) || 10,
      style: {
        backgroundColor: this.bgColorInput.value,
        color: this.fgColorInput.value,
      },
      minColor: this.minColorInput.value,
      maxColor: this.maxColorInput.value,
      barColor: this.barColorInput.value,
    }

    this.rules.push(rule)
    this.applyAllRules()
    this.hide()
  }

  /**
   * @description 应用所有条件格式规则
   */
  applyAllRules() {
    // 清除之前的条件格式
    this.clearConditionalStyles()

    // 应用每条规则
    this.rules.forEach((rule) => {
      this.applyRuleToRange(rule)
    })

    this.sheet.draw()
    this.sheet.emit('conditionalFormat')
  }

  /**
   * @description 将规则应用到指定范围
   * @param {Object} rule - 规则对象
   */
  applyRuleToRange(rule) {
    const { range, type } = rule
    const { col, row, colCount, rowCount } = range
    const { data } = this.viewModel.sheetData

    // 收集范围内的值用于计算
    const values = []
    for (let r = row; r < row + rowCount; r += 1) {
      for (let c = col; c < col + colCount; c += 1) {
        const cell = data[r] && data[r][c]
        const value = cell ? cell.value : ''
        values.push({ col: c, row: r, value })
      }
    }

    // 根据类型应用格式
    switch (type) {
      case CONDITION_TYPES.CELL_VALUE:
        this.applyCellValueRule(values, rule)
        break
      case CONDITION_TYPES.TEXT_CONTAINS:
        this.applyTextContainsRule(values, rule)
        break
      case CONDITION_TYPES.DUPLICATE:
        this.applyDuplicateRule(values, rule, false)
        break
      case CONDITION_TYPES.UNIQUE:
        this.applyDuplicateRule(values, rule, true)
        break
      case CONDITION_TYPES.TOP_N:
        this.applyTopNRule(values, rule, true)
        break
      case CONDITION_TYPES.BOTTOM_N:
        this.applyTopNRule(values, rule, false)
        break
      case CONDITION_TYPES.ABOVE_AVERAGE:
        this.applyAverageRule(values, rule, true)
        break
      case CONDITION_TYPES.BELOW_AVERAGE:
        this.applyAverageRule(values, rule, false)
        break
      case CONDITION_TYPES.COLOR_SCALE:
        this.applyColorScaleRule(values, rule)
        break
      case CONDITION_TYPES.DATA_BAR:
        this.applyDataBarRule(values, rule)
        break
      default:
        break
    }
  }

  applyCellValueRule(values, rule) {
    const { operator, value1, value2, style } = rule
    const v1 = parseFloat(value1)
    const v2 = parseFloat(value2)

    values.forEach(({ col, row, value }) => {
      const num = parseFloat(value)
      if (Number.isNaN(num)) return

      let match = false
      switch (operator) {
        case OPERATORS.BETWEEN:
          match = num >= v1 && num <= v2
          break
        case OPERATORS.NOT_BETWEEN:
          match = num < v1 || num > v2
          break
        case OPERATORS.EQUAL:
          match = num === v1
          break
        case OPERATORS.NOT_EQUAL:
          match = num !== v1
          break
        case OPERATORS.GREATER:
          match = num > v1
          break
        case OPERATORS.LESS:
          match = num < v1
          break
        case OPERATORS.GREATER_EQUAL:
          match = num >= v1
          break
        case OPERATORS.LESS_EQUAL:
          match = num <= v1
          break
        default:
          break
      }

      if (match) {
        this.setConditionalStyle(col, row, style)
      }
    })
  }

  applyTextContainsRule(values, rule) {
    const { text, style } = rule
    const searchText = text.toLowerCase()

    values.forEach(({ col, row, value }) => {
      if (String(value).toLowerCase().includes(searchText)) {
        this.setConditionalStyle(col, row, style)
      }
    })
  }

  applyDuplicateRule(values, rule, uniqueOnly) {
    const { style } = rule
    const counts = new Map()

    // 计算每个值的出现次数
    values.forEach(({ value }) => {
      const key = String(value)
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    // 应用样式
    values.forEach(({ col, row, value }) => {
      const count = counts.get(String(value))
      const isDuplicate = count > 1
      const shouldApply = uniqueOnly ? !isDuplicate : isDuplicate

      if (shouldApply) {
        this.setConditionalStyle(col, row, style)
      }
    })
  }

  applyTopNRule(values, rule, isTop) {
    const { n, style } = rule

    // 获取数值并排序
    const numericValues = values
      .filter(({ value }) => !Number.isNaN(parseFloat(value)))
      .map(({ col, row, value }) => ({ col, row, num: parseFloat(value) }))
      .sort((a, b) => (isTop ? b.num - a.num : a.num - b.num))

    // 取前/后N项
    const topN = numericValues.slice(0, n)
    topN.forEach(({ col, row }) => {
      this.setConditionalStyle(col, row, style)
    })
  }

  applyAverageRule(values, rule, aboveAverage) {
    const { style } = rule

    // 计算平均值
    const numericValues = values
      .map(({ value }) => parseFloat(value))
      .filter((num) => !Number.isNaN(num))

    if (numericValues.length === 0) return

    const average = numericValues.reduce((a, b) => a + b, 0) / numericValues.length

    // 应用样式
    values.forEach(({ col, row, value }) => {
      const num = parseFloat(value)
      if (Number.isNaN(num)) return

      const shouldApply = aboveAverage ? num > average : num < average
      if (shouldApply) {
        this.setConditionalStyle(col, row, style)
      }
    })
  }

  applyColorScaleRule(values, rule) {
    const { minColor, maxColor } = rule

    // 获取数值范围
    const numericValues = values
      .map(({ value }) => parseFloat(value))
      .filter((num) => !Number.isNaN(num))

    if (numericValues.length === 0) return

    const min = Math.min(...numericValues)
    const max = Math.max(...numericValues)
    const range = max - min

    // 应用渐变色
    values.forEach(({ col, row, value }) => {
      const num = parseFloat(value)
      if (Number.isNaN(num)) return

      const ratio = range === 0 ? 0.5 : (num - min) / range
      const bgColor = this.interpolateColor(minColor, maxColor, ratio)
      this.setConditionalStyle(col, row, { backgroundColor: bgColor })
    })
  }

  applyDataBarRule(values, rule) {
    const { barColor } = rule

    // 获取数值范围
    const numericValues = values
      .map(({ value }) => parseFloat(value))
      .filter((num) => !Number.isNaN(num))

    if (numericValues.length === 0) return

    const max = Math.max(...numericValues)

    // 应用数据条
    values.forEach(({ col, row, value }) => {
      const num = parseFloat(value)
      if (Number.isNaN(num) || max === 0) return

      const percent = Math.round((num / max) * 100)
      this.setConditionalStyle(col, row, {
        dataBar: { color: barColor, percent },
      })
    })
  }

  /**
   * @description 颜色插值
   */
  // eslint-disable-next-line class-methods-use-this
  interpolateColor(color1, color2, ratio) {
    const hex = (c) => parseInt(c, 16)
    const r1 = hex(color1.slice(1, 3))
    const g1 = hex(color1.slice(3, 5))
    const b1 = hex(color1.slice(5, 7))
    const r2 = hex(color2.slice(1, 3))
    const g2 = hex(color2.slice(3, 5))
    const b2 = hex(color2.slice(5, 7))

    const r = Math.round(r1 + (r2 - r1) * ratio)
    const g = Math.round(g1 + (g2 - g1) * ratio)
    const b = Math.round(b1 + (b2 - b1) * ratio)

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
      .toString(16)
      .padStart(2, '0')}`
  }

  /**
   * @description 设置单元格的条件格式样式
   */
  setConditionalStyle(col, row, style) {
    const { data } = this.viewModel.sheetData
    if (!data[row]) data[row] = []
    if (!data[row][col]) data[row][col] = {}
    if (!data[row][col].conditionalStyle) {
      data[row][col].conditionalStyle = {}
    }
    Object.assign(data[row][col].conditionalStyle, style)
  }

  /**
   * @description 清除所有条件格式样式
   */
  clearConditionalStyles() {
    const { data } = this.viewModel.sheetData
    for (let r = 0; r < data.length; r += 1) {
      if (data[r]) {
        for (let c = 0; c < data[r].length; c += 1) {
          if (data[r][c] && data[r][c].conditionalStyle) {
            delete data[r][c].conditionalStyle
          }
        }
      }
    }
  }

  /**
   * @description 清除指定范围的规则
   */
  clearRulesForRange(range) {
    const { col, row, colCount, rowCount } = range
    this.rules = this.rules.filter((rule) => {
      const r = rule.range
      // 检查是否有重叠
      const overlap = !(
        r.col + r.colCount <= col ||
        col + colCount <= r.col ||
        r.row + r.rowCount <= row ||
        row + rowCount <= r.row
      )
      return !overlap
    })
    this.applyAllRules()
  }

  show() {
    this.dialogEl.style.display = 'block'
    this.isVisible = true
    this.onTypeChange()
    this.updatePreview()
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
}

export { CONDITION_TYPES, OPERATORS }
export default ConditionalFormat
