/**
 * @description 公式自动补全组件
 * 提供函数名自动补全和参数提示功能
 */

import { getAllFunctionNames } from '../formula/functions/index'
import './formulaAutocomplete.scss'

// 函数描述和参数信息
const FUNCTION_INFO = {
  // 数学函数
  SUM: { desc: '求和', params: '(number1, [number2], ...)' },
  AVERAGE: { desc: '平均值', params: '(number1, [number2], ...)' },
  MAX: { desc: '最大值', params: '(number1, [number2], ...)' },
  MIN: { desc: '最小值', params: '(number1, [number2], ...)' },
  COUNT: { desc: '计数（数字）', params: '(value1, [value2], ...)' },
  COUNTA: { desc: '计数（非空）', params: '(value1, [value2], ...)' },
  ABS: { desc: '绝对值', params: '(number)' },
  ROUND: { desc: '四舍五入', params: '(number, [num_digits])' },
  ROUNDUP: { desc: '向上舍入', params: '(number, [num_digits])' },
  ROUNDDOWN: { desc: '向下舍入', params: '(number, [num_digits])' },
  INT: { desc: '取整', params: '(number)' },
  MOD: { desc: '取余', params: '(number, divisor)' },
  POWER: { desc: '幂运算', params: '(number, power)' },
  SQRT: { desc: '平方根', params: '(number)' },
  PI: { desc: '圆周率', params: '()' },
  RAND: { desc: '随机数', params: '()' },
  RANDBETWEEN: { desc: '范围随机整数', params: '(bottom, top)' },
  CEILING: { desc: '向上取整到倍数', params: '(number, [significance])' },
  FLOOR: { desc: '向下取整到倍数', params: '(number, [significance])' },
  LOG: { desc: '对数', params: '(number, [base])' },
  LOG10: { desc: '以10为底的对数', params: '(number)' },
  LN: { desc: '自然对数', params: '(number)' },
  EXP: { desc: 'e的幂', params: '(number)' },
  FACT: { desc: '阶乘', params: '(number)' },
  PRODUCT: { desc: '乘积', params: '(number1, [number2], ...)' },
  SIGN: { desc: '符号', params: '(number)' },
  GCD: { desc: '最大公约数', params: '(number1, [number2], ...)' },
  LCM: { desc: '最小公倍数', params: '(number1, [number2], ...)' },
  SIN: { desc: '正弦', params: '(number)' },
  COS: { desc: '余弦', params: '(number)' },
  TAN: { desc: '正切', params: '(number)' },

  // 逻辑函数
  IF: { desc: '条件判断', params: '(logical_test, value_if_true, [value_if_false])' },
  AND: { desc: '逻辑与', params: '(logical1, [logical2], ...)' },
  OR: { desc: '逻辑或', params: '(logical1, [logical2], ...)' },
  NOT: { desc: '逻辑非', params: '(logical)' },
  TRUE: { desc: '返回TRUE', params: '()' },
  FALSE: { desc: '返回FALSE', params: '()' },
  IFERROR: { desc: '错误处理', params: '(value, value_if_error)' },
  IFNA: { desc: '#N/A错误处理', params: '(value, value_if_na)' },

  // 文本函数
  CONCATENATE: { desc: '连接文本', params: '(text1, [text2], ...)' },
  CONCAT: { desc: '连接文本', params: '(text1, [text2], ...)' },
  LEN: { desc: '文本长度', params: '(text)' },
  LEFT: { desc: '左侧截取', params: '(text, [num_chars])' },
  RIGHT: { desc: '右侧截取', params: '(text, [num_chars])' },
  MID: { desc: '中间截取', params: '(text, start_num, num_chars)' },
  TRIM: { desc: '去除空白', params: '(text)' },
  UPPER: { desc: '转大写', params: '(text)' },
  LOWER: { desc: '转小写', params: '(text)' },
  PROPER: { desc: '首字母大写', params: '(text)' },
  FIND: { desc: '查找（区分大小写）', params: '(find_text, within_text, [start_num])' },
  SEARCH: { desc: '查找（不区分大小写）', params: '(find_text, within_text, [start_num])' },
  REPLACE: { desc: '替换', params: '(old_text, start_num, num_chars, new_text)' },
  SUBSTITUTE: { desc: '替换文本', params: '(text, old_text, new_text, [instance_num])' },
  REPT: { desc: '重复文本', params: '(text, number_times)' },
  TEXT: { desc: '格式化数字', params: '(value, format_text)' },
  VALUE: { desc: '文本转数字', params: '(text)' },
  TEXTJOIN: { desc: '分隔符连接', params: '(delimiter, ignore_empty, text1, ...)' },

  // 统计函数
  COUNTIF: { desc: '条件计数', params: '(range, criteria)' },
  SUMIF: { desc: '条件求和', params: '(range, criteria, [sum_range])' },
  AVERAGEIF: { desc: '条件平均', params: '(range, criteria, [average_range])' },
  COUNTBLANK: { desc: '空单元格计数', params: '(range)' },
  MEDIAN: { desc: '中位数', params: '(number1, [number2], ...)' },
  STDEV: { desc: '标准差(样本)', params: '(number1, [number2], ...)' },
  STDEVP: { desc: '标准差(总体)', params: '(number1, [number2], ...)' },
  VAR: { desc: '方差(样本)', params: '(number1, [number2], ...)' },
  VARP: { desc: '方差(总体)', params: '(number1, [number2], ...)' },
  LARGE: { desc: '第K大值', params: '(array, k)' },
  SMALL: { desc: '第K小值', params: '(array, k)' },

  // 查找函数
  VLOOKUP: {
    desc: '垂直查找',
    params: '(lookup_value, table_array, col_index_num, [range_lookup])',
  },
  HLOOKUP: {
    desc: '水平查找',
    params: '(lookup_value, table_array, row_index_num, [range_lookup])',
  },
  INDEX: { desc: '索引', params: '(array, row_num, [column_num])' },
  MATCH: { desc: '匹配', params: '(lookup_value, lookup_array, [match_type])' },
  CHOOSE: { desc: '选择', params: '(index_num, value1, [value2], ...)' },
  ROWS: { desc: '行数', params: '(array)' },
  COLUMNS: { desc: '列数', params: '(array)' },

  // 日期函数
  TODAY: { desc: '当前日期', params: '()' },
  NOW: { desc: '当前日期时间', params: '()' },
  DATE: { desc: '创建日期', params: '(year, month, day)' },
  TIME: { desc: '创建时间', params: '(hour, minute, second)' },
  YEAR: { desc: '获取年份', params: '(serial_number)' },
  MONTH: { desc: '获取月份', params: '(serial_number)' },
  DAY: { desc: '获取日期', params: '(serial_number)' },
  HOUR: { desc: '获取小时', params: '(serial_number)' },
  MINUTE: { desc: '获取分钟', params: '(serial_number)' },
  SECOND: { desc: '获取秒', params: '(serial_number)' },
  WEEKDAY: { desc: '星期几', params: '(serial_number, [return_type])' },
  WEEKNUM: { desc: '周数', params: '(serial_number, [return_type])' },
  DATEDIF: { desc: '日期差', params: '(start_date, end_date, unit)' },
  DAYS: { desc: '天数差', params: '(end_date, start_date)' },
  EDATE: { desc: '月份后日期', params: '(start_date, months)' },
  EOMONTH: { desc: '月末日期', params: '(start_date, months)' },
}

class FormulaAutocomplete {
  constructor({ container, onSelect }) {
    this.container = container
    this.onSelect = onSelect
    this.visible = false
    this.selectedIndex = 0
    this.matches = []
    this.currentFunction = null

    this.initElements()
    this.bindEvents()
  }

  initElements() {
    // 自动补全下拉框
    this.dropdownEl = document.createElement('div')
    this.dropdownEl.classList.add('qt-formula-autocomplete')
    this.dropdownEl.style.display = 'none'
    this.container.appendChild(this.dropdownEl)

    // 参数提示框
    this.tooltipEl = document.createElement('div')
    this.tooltipEl.classList.add('qt-formula-tooltip')
    this.tooltipEl.style.display = 'none'
    this.container.appendChild(this.tooltipEl)
  }

  bindEvents() {
    // 点击选择
    this.dropdownEl.addEventListener('click', (e) => {
      const item = e.target.closest('.qt-formula-autocomplete-item')
      if (item) {
        const funcName = item.dataset.function
        this.selectFunction(funcName)
      }
    })

    // 鼠标悬停
    this.dropdownEl.addEventListener('mouseover', (e) => {
      const item = e.target.closest('.qt-formula-autocomplete-item')
      if (item) {
        const index = parseInt(item.dataset.index, 10)
        this.setSelectedIndex(index)
      }
    })
  }

  /**
   * @description 更新自动补全状态
   * @param {string} text - 当前输入文本
   * @param {number} cursorPos - 光标位置
   * @param {object} inputRect - 输入框位置
   */
  update(text, cursorPos, inputRect) {
    if (!text || !text.startsWith('=')) {
      this.hide()
      return
    }

    const beforeCursor = text.substring(0, cursorPos)

    // 检查是否在函数名输入中（在 = 后面或运算符/括号后面输入字母）
    const funcMatch = beforeCursor.match(/(?:^=|[+\-*/^(,=<>])([A-Z]+)$/i)

    if (funcMatch && funcMatch[1].length > 0) {
      this.showAutocomplete(funcMatch[1], inputRect)
      return
    }

    // 检查是否在函数参数中（已经输入了函数名和左括号）
    const funcParamMatch = beforeCursor.match(/([A-Z]+)\s*\([^)]*$/i)
    if (funcParamMatch) {
      this.showTooltip(funcParamMatch[1].toUpperCase(), inputRect)
      this.hideDropdown()
      return
    }

    this.hide()
  }

  /**
   * @description 显示自动补全下拉框
   */
  showAutocomplete(prefix, inputRect) {
    const allFunctions = getAllFunctionNames()
    const upperPrefix = prefix.toUpperCase()

    this.matches = allFunctions.filter((name) => name.startsWith(upperPrefix)).slice(0, 10) // 最多显示10个

    if (this.matches.length === 0) {
      this.hideDropdown()
      return
    }

    this.selectedIndex = 0
    this.renderDropdown()
    this.positionDropdown(inputRect)
    this.dropdownEl.style.display = 'block'
    this.visible = true
  }

  /**
   * @description 渲染下拉框内容
   */
  renderDropdown() {
    const html = this.matches
      .map((name, index) => {
        const info = FUNCTION_INFO[name] || { desc: '', params: '(...)' }
        const selected = index === this.selectedIndex ? 'selected' : ''
        return `
          <div class="qt-formula-autocomplete-item ${selected}"
               data-function="${name}"
               data-index="${index}">
            <span class="func-name">${name}</span>
            <span class="func-desc">${info.desc}</span>
          </div>
        `
      })
      .join('')

    this.dropdownEl.innerHTML = html
  }

  /**
   * @description 定位下拉框
   */
  positionDropdown(inputRect) {
    this.dropdownEl.style.left = `${inputRect.left}px`
    this.dropdownEl.style.top = `${inputRect.bottom + 2}px`
  }

  /**
   * @description 显示参数提示
   */
  showTooltip(funcName, inputRect) {
    const info = FUNCTION_INFO[funcName]
    if (!info) {
      this.hideTooltip()
      return
    }

    this.currentFunction = funcName
    this.tooltipEl.innerHTML = `
      <span class="func-name">${funcName}</span>
      <span class="func-params">${info.params}</span>
    `
    this.tooltipEl.style.left = `${inputRect.left}px`
    this.tooltipEl.style.top = `${inputRect.bottom + 2}px`
    this.tooltipEl.style.display = 'block'
  }

  /**
   * @description 设置选中项
   */
  setSelectedIndex(idx) {
    let newIndex = idx
    if (newIndex < 0) newIndex = this.matches.length - 1
    if (newIndex >= this.matches.length) newIndex = 0

    this.selectedIndex = newIndex
    this.renderDropdown()
  }

  /**
   * @description 选择函数
   */
  selectFunction(funcName) {
    if (this.onSelect) {
      this.onSelect(funcName)
    }
    this.hide()
  }

  /**
   * @description 处理键盘事件
   * @returns {boolean} 是否已处理
   */
  handleKeydown(e) {
    if (!this.visible) return false

    const keyCode = e.keyCode || e.which

    // 上箭头
    if (keyCode === 38) {
      e.preventDefault()
      this.setSelectedIndex(this.selectedIndex - 1)
      return true
    }

    // 下箭头
    if (keyCode === 40) {
      e.preventDefault()
      this.setSelectedIndex(this.selectedIndex + 1)
      return true
    }

    // Tab 或 Enter - 选择当前项
    if (keyCode === 9 || keyCode === 13) {
      if (this.matches.length > 0) {
        e.preventDefault()
        this.selectFunction(this.matches[this.selectedIndex])
        return true
      }
    }

    // Escape - 关闭
    if (keyCode === 27) {
      this.hide()
      return true
    }

    return false
  }

  /**
   * @description 隐藏下拉框
   */
  hideDropdown() {
    this.dropdownEl.style.display = 'none'
    this.visible = false
    this.matches = []
  }

  /**
   * @description 隐藏参数提示
   */
  hideTooltip() {
    this.tooltipEl.style.display = 'none'
    this.currentFunction = null
  }

  /**
   * @description 隐藏所有
   */
  hide() {
    this.hideDropdown()
    this.hideTooltip()
  }

  /**
   * @description 销毁
   */
  destroy() {
    if (this.dropdownEl && this.dropdownEl.parentNode) {
      this.dropdownEl.parentNode.removeChild(this.dropdownEl)
    }
    if (this.tooltipEl && this.tooltipEl.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl)
    }
  }
}

export default FormulaAutocomplete
