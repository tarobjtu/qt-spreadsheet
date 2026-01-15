import './datavalidation.scss'

/**
 * @description 数据验证类型
 */
const VALIDATION_TYPES = {
  NUMBER: 'number', // 数字
  INTEGER: 'integer', // 整数
  DECIMAL: 'decimal', // 小数
  DATE: 'date', // 日期
  TEXT_LENGTH: 'textLength', // 文本长度
  LIST: 'list', // 下拉列表
  CUSTOM: 'custom', // 自定义公式
}

/**
 * @description 比较运算符
 */
const OPERATORS = {
  BETWEEN: 'between', // 介于
  NOT_BETWEEN: 'notBetween', // 不介于
  EQUAL: 'equal', // 等于
  NOT_EQUAL: 'notEqual', // 不等于
  GREATER: 'greater', // 大于
  LESS: 'less', // 小于
  GREATER_EQUAL: 'greaterEqual', // 大于等于
  LESS_EQUAL: 'lessEqual', // 小于等于
}

class DataValidation {
  constructor({ sheet, container, viewModel }) {
    this.sheet = sheet
    this.container = container
    this.viewModel = viewModel
    this.isVisible = false

    // 验证规则存储: { 'col,row': rule }
    this.validationRules = new Map()

    this.initElements()
    this.bindEvents()
  }

  initElements() {
    const { container } = this

    this.dialogEl = document.createElement('div')
    this.dialogEl.classList.add('qt-spreadsheet-validation')
    this.dialogEl.innerHTML = `
      <div class="qt-spreadsheet-validation-header">
        <span class="qt-spreadsheet-validation-title">数据验证</span>
        <button class="qt-spreadsheet-validation-close">&times;</button>
      </div>
      <div class="qt-spreadsheet-validation-body">
        <div class="qt-spreadsheet-validation-row">
          <label>验证类型：</label>
          <select class="qt-spreadsheet-validation-type">
            <option value="">无</option>
            <option value="number">数字</option>
            <option value="integer">整数</option>
            <option value="decimal">小数</option>
            <option value="textLength">文本长度</option>
            <option value="list">下拉列表</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div class="qt-spreadsheet-validation-row condition-row" style="display:none;">
          <label>条件：</label>
          <select class="qt-spreadsheet-validation-operator">
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
        <div class="qt-spreadsheet-validation-row value-row" style="display:none;">
          <label>值：</label>
          <input type="text" class="qt-spreadsheet-validation-value1" placeholder="最小值">
          <span class="qt-spreadsheet-validation-and">至</span>
          <input type="text" class="qt-spreadsheet-validation-value2" placeholder="最大值">
        </div>
        <div class="qt-spreadsheet-validation-row list-row" style="display:none;">
          <label>选项：</label>
          <input type="text" class="qt-spreadsheet-validation-list" placeholder="用逗号分隔，如：选项1,选项2,选项3">
        </div>
        <div class="qt-spreadsheet-validation-row custom-row" style="display:none;">
          <label>公式：</label>
          <input type="text" class="qt-spreadsheet-validation-formula" placeholder="如：=A1>0">
        </div>
        <div class="qt-spreadsheet-validation-row">
          <label>错误提示：</label>
          <input type="text" class="qt-spreadsheet-validation-message" placeholder="输入不符合验证规则时的提示信息">
        </div>
        <div class="qt-spreadsheet-validation-row">
          <label></label>
          <label class="qt-spreadsheet-validation-checkbox">
            <input type="checkbox" class="qt-spreadsheet-validation-reject" checked>
            拒绝无效输入
          </label>
        </div>
      </div>
      <div class="qt-spreadsheet-validation-footer">
        <button class="qt-spreadsheet-validation-btn clear-btn">清除验证</button>
        <button class="qt-spreadsheet-validation-btn cancel-btn">取消</button>
        <button class="qt-spreadsheet-validation-btn apply-btn">应用</button>
      </div>
    `
    container.appendChild(this.dialogEl)

    // 获取元素引用
    this.typeSelect = this.dialogEl.querySelector('.qt-spreadsheet-validation-type')
    this.operatorSelect = this.dialogEl.querySelector('.qt-spreadsheet-validation-operator')
    this.value1Input = this.dialogEl.querySelector('.qt-spreadsheet-validation-value1')
    this.value2Input = this.dialogEl.querySelector('.qt-spreadsheet-validation-value2')
    this.listInput = this.dialogEl.querySelector('.qt-spreadsheet-validation-list')
    this.formulaInput = this.dialogEl.querySelector('.qt-spreadsheet-validation-formula')
    this.messageInput = this.dialogEl.querySelector('.qt-spreadsheet-validation-message')
    this.rejectCheckbox = this.dialogEl.querySelector('.qt-spreadsheet-validation-reject')
    this.andSpan = this.dialogEl.querySelector('.qt-spreadsheet-validation-and')

    this.conditionRow = this.dialogEl.querySelector('.condition-row')
    this.valueRow = this.dialogEl.querySelector('.value-row')
    this.listRow = this.dialogEl.querySelector('.list-row')
    this.customRow = this.dialogEl.querySelector('.custom-row')

    this.closeBtn = this.dialogEl.querySelector('.qt-spreadsheet-validation-close')
    this.clearBtn = this.dialogEl.querySelector('.clear-btn')
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
    const onClear = () => this.clearValidation()
    const onApply = () => this.applyValidation()
    const onKeydown = (e) => {
      if (e.key === 'Escape') this.hide()
    }

    this.events.push([this.closeBtn, 'click', onClose])
    this.events.push([this.cancelBtn, 'click', onClose])
    this.events.push([this.typeSelect, 'change', onTypeChange])
    this.events.push([this.operatorSelect, 'change', onOperatorChange])
    this.events.push([this.clearBtn, 'click', onClear])
    this.events.push([this.applyBtn, 'click', onApply])
    this.events.push([this.dialogEl, 'keydown', onKeydown])

    this.closeBtn.addEventListener('click', onClose)
    this.cancelBtn.addEventListener('click', onClose)
    this.typeSelect.addEventListener('change', onTypeChange)
    this.operatorSelect.addEventListener('change', onOperatorChange)
    this.clearBtn.addEventListener('click', onClear)
    this.applyBtn.addEventListener('click', onApply)
    this.dialogEl.addEventListener('keydown', onKeydown)
  }

  onTypeChange() {
    const type = this.typeSelect.value

    // 隐藏所有条件行
    this.conditionRow.style.display = 'none'
    this.valueRow.style.display = 'none'
    this.listRow.style.display = 'none'
    this.customRow.style.display = 'none'

    if (type === 'number' || type === 'integer' || type === 'decimal' || type === 'textLength') {
      this.conditionRow.style.display = 'flex'
      this.valueRow.style.display = 'flex'
      this.onOperatorChange()
    } else if (type === 'list') {
      this.listRow.style.display = 'flex'
    } else if (type === 'custom') {
      this.customRow.style.display = 'flex'
    }
  }

  onOperatorChange() {
    const operator = this.operatorSelect.value
    const showSecondValue = operator === 'between' || operator === 'notBetween'
    this.value2Input.style.display = showSecondValue ? 'block' : 'none'
    this.andSpan.style.display = showSecondValue ? 'inline' : 'none'
  }

  /**
   * @description 设置验证规则
   * @param {number} col - 列索引
   * @param {number} row - 行索引
   * @param {Object} rule - 验证规则
   */
  setRule(col, row, rule) {
    const key = `${col},${row}`
    if (rule) {
      this.validationRules.set(key, rule)
    } else {
      this.validationRules.delete(key)
    }
  }

  /**
   * @description 获取验证规则
   * @param {number} col - 列索引
   * @param {number} row - 行索引
   * @returns {Object|null} 验证规则
   */
  getRule(col, row) {
    const key = `${col},${row}`
    return this.validationRules.get(key) || null
  }

  /**
   * @description 验证单元格值
   * @param {number} col - 列索引
   * @param {number} row - 行索引
   * @param {*} value - 要验证的值
   * @returns {{valid: boolean, message: string}}
   */
  validate(col, row, value) {
    const rule = this.getRule(col, row)
    if (!rule) {
      return { valid: true, message: '' }
    }

    const { type, operator, value1, value2, listValues, formula, message, rejectInvalid } = rule

    let valid = true
    const errorMessage = message || '输入值不符合验证规则'

    switch (type) {
      case VALIDATION_TYPES.NUMBER:
      case VALIDATION_TYPES.DECIMAL:
        valid = this.validateNumber(value, operator, value1, value2)
        break
      case VALIDATION_TYPES.INTEGER:
        valid = this.validateInteger(value, operator, value1, value2)
        break
      case VALIDATION_TYPES.TEXT_LENGTH:
        valid = this.validateTextLength(value, operator, value1, value2)
        break
      case VALIDATION_TYPES.LIST:
        valid = this.validateList(value, listValues)
        break
      case VALIDATION_TYPES.CUSTOM:
        valid = this.validateCustom(col, row, value, formula)
        break
      default:
        valid = true
    }

    return {
      valid,
      message: valid ? '' : errorMessage,
      rejectInvalid,
    }
  }

  validateNumber(value, operator, min, max) {
    const num = parseFloat(value)
    if (Number.isNaN(num)) return false
    return this.compareValue(num, operator, parseFloat(min), parseFloat(max))
  }

  validateInteger(value, operator, min, max) {
    const num = parseInt(value, 10)
    if (Number.isNaN(num) || num !== parseFloat(value)) return false
    return this.compareValue(num, operator, parseInt(min, 10), parseInt(max, 10))
  }

  validateTextLength(value, operator, min, max) {
    const len = String(value).length
    return this.compareValue(len, operator, parseInt(min, 10), parseInt(max, 10))
  }

  // eslint-disable-next-line class-methods-use-this
  validateList(value, listValues) {
    if (!listValues || !Array.isArray(listValues)) return false
    return listValues.includes(String(value))
  }

  // eslint-disable-next-line class-methods-use-this
  validateCustom() {
    // 简单的公式验证，目前仅支持简单比较
    // 完整实现需要集成公式引擎
    // TODO: 使用公式引擎计算
    return true
  }

  // eslint-disable-next-line class-methods-use-this
  compareValue(value, operator, min, max) {
    switch (operator) {
      case OPERATORS.BETWEEN:
        return value >= min && value <= max
      case OPERATORS.NOT_BETWEEN:
        return value < min || value > max
      case OPERATORS.EQUAL:
        return value === min
      case OPERATORS.NOT_EQUAL:
        return value !== min
      case OPERATORS.GREATER:
        return value > min
      case OPERATORS.LESS:
        return value < min
      case OPERATORS.GREATER_EQUAL:
        return value >= min
      case OPERATORS.LESS_EQUAL:
        return value <= min
      default:
        return true
    }
  }

  /**
   * @description 为选中区域应用验证规则
   */
  applyValidation() {
    const type = this.typeSelect.value
    if (!type) {
      this.clearValidation()
      return
    }

    const { col, row, colCount, rowCount } = this.viewModel.getSelector()

    const rule = {
      type,
      operator: this.operatorSelect.value,
      value1: this.value1Input.value,
      value2: this.value2Input.value,
      listValues: this.listInput.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      formula: this.formulaInput.value,
      message: this.messageInput.value,
      rejectInvalid: this.rejectCheckbox.checked,
    }

    // 为选中区域的每个单元格设置规则
    for (let r = row; r < row + rowCount; r += 1) {
      for (let c = col; c < col + colCount; c += 1) {
        this.setRule(c, r, rule)
      }
    }

    this.hide()
    this.sheet.emit('validationChange')
  }

  /**
   * @description 清除选中区域的验证规则
   */
  clearValidation() {
    const { col, row, colCount, rowCount } = this.viewModel.getSelector()

    for (let r = row; r < row + rowCount; r += 1) {
      for (let c = col; c < col + colCount; c += 1) {
        this.setRule(c, r, null)
      }
    }

    this.resetForm()
    this.hide()
    this.sheet.emit('validationChange')
  }

  resetForm() {
    this.typeSelect.value = ''
    this.operatorSelect.value = 'between'
    this.value1Input.value = ''
    this.value2Input.value = ''
    this.listInput.value = ''
    this.formulaInput.value = ''
    this.messageInput.value = ''
    this.rejectCheckbox.checked = true
    this.onTypeChange()
  }

  loadCurrentRule() {
    const { col, row } = this.viewModel.getSelector()
    const rule = this.getRule(col, row)

    if (rule) {
      this.typeSelect.value = rule.type || ''
      this.operatorSelect.value = rule.operator || 'between'
      this.value1Input.value = rule.value1 || ''
      this.value2Input.value = rule.value2 || ''
      this.listInput.value = (rule.listValues || []).join(',')
      this.formulaInput.value = rule.formula || ''
      this.messageInput.value = rule.message || ''
      this.rejectCheckbox.checked = rule.rejectInvalid !== false
      this.onTypeChange()
    } else {
      this.resetForm()
    }
  }

  show() {
    this.dialogEl.style.display = 'block'
    this.isVisible = true
    this.loadCurrentRule()
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
   * @description 获取单元格的下拉列表选项
   * @param {number} col - 列索引
   * @param {number} row - 行索引
   * @returns {Array|null} 下拉选项数组
   */
  getListOptions(col, row) {
    const rule = this.getRule(col, row)
    if (rule && rule.type === VALIDATION_TYPES.LIST) {
      return rule.listValues || []
    }
    return null
  }
}

export { VALIDATION_TYPES, OPERATORS }
export default DataValidation
