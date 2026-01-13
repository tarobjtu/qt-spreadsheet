/**
 * @description 公式栏组件
 * 显示当前选中单元格的地址和公式/值，支持直接编辑
 */

import { colToAlpha, toggleRefAbsolute } from '../formula/CellReference'
import FormulaAutocomplete from './FormulaAutocomplete'
import './formulabar.scss'

class FormulaBar {
  constructor({ container, sheet, viewModel, formulaEngine, referenceHighlight }) {
    this.container = container
    this.sheet = sheet
    this.viewModel = viewModel
    this.formulaEngine = formulaEngine
    this.referenceHighlight = referenceHighlight

    this.col = 0
    this.row = 0
    this.isEditing = false

    this.initElements()
    this.initAutocomplete()
    this.bindEvents()
    this.update()
  }

  /**
   * @description 初始化 DOM 元素
   */
  initElements() {
    // 单元格地址显示
    this.addressEl = document.createElement('div')
    this.addressEl.classList.add('qt-formula-bar-address')
    this.container.appendChild(this.addressEl)

    // 分隔线
    this.dividerEl = document.createElement('div')
    this.dividerEl.classList.add('qt-formula-bar-divider')
    this.container.appendChild(this.dividerEl)

    // fx 图标
    this.fxEl = document.createElement('div')
    this.fxEl.classList.add('qt-formula-bar-fx')
    this.fxEl.textContent = 'fx'
    this.container.appendChild(this.fxEl)

    // 输入框
    this.inputEl = document.createElement('input')
    this.inputEl.type = 'text'
    this.inputEl.classList.add('qt-formula-bar-input')
    this.container.appendChild(this.inputEl)
  }

  /**
   * @description 初始化自动补全
   */
  initAutocomplete() {
    this.autocomplete = new FormulaAutocomplete({
      container: document.body,
      onSelect: this.onAutocompleteSelect.bind(this),
    })
  }

  /**
   * @description 绑定事件
   */
  bindEvents() {
    // 监听选择变化
    this.sheet.on('select', this.update.bind(this))

    // 输入事件
    this.inputEl.addEventListener('input', this.onInput.bind(this))
    this.inputEl.addEventListener('keydown', this.onKeydown.bind(this))
    this.inputEl.addEventListener('focus', this.onFocus.bind(this))
    this.inputEl.addEventListener('blur', this.onBlur.bind(this))
  }

  /**
   * @description 更新公式栏显示
   */
  update() {
    const selector = this.viewModel.getSelector()
    const { activeCol, activeRow } = selector

    this.col = activeCol
    this.row = activeRow

    // 更新地址显示
    this.addressEl.textContent = `${colToAlpha(activeCol)}${activeRow + 1}`

    // 更新公式/值显示
    if (this.formulaEngine) {
      const formula = this.formulaEngine.getFormula(activeCol, activeRow)
      this.inputEl.value = formula ?? ''
    } else {
      const cellText = this.viewModel.getCellText(activeCol, activeRow)
      this.inputEl.value = cellText ?? ''
    }

    // 隐藏自动补全
    if (this.autocomplete) {
      this.autocomplete.hide()
    }
  }

  /**
   * @description 输入事件处理
   */
  onInput() {
    const { value } = this.inputEl

    // 实时更新单元格
    this.sheet.setCellText(value, this.col, this.row, 'input')

    // 同步到编辑器（如果编辑器打开）
    if (this.sheet.editor && this.sheet.editor.visible) {
      this.sheet.editor.setValue(value, this.col, this.row)
    }

    // 更新自动补全
    this.updateAutocomplete()

    // 更新引用高亮
    this.updateReferenceHighlight(value)
  }

  /**
   * @description 更新自动补全状态
   */
  updateAutocomplete() {
    const { value, selectionStart } = this.inputEl
    const rect = this.inputEl.getBoundingClientRect()

    this.autocomplete.update(value, selectionStart, {
      left: rect.left,
      bottom: rect.bottom,
    })
  }

  /**
   * @description 更新引用高亮
   */
  updateReferenceHighlight(formula) {
    if (this.referenceHighlight) {
      this.referenceHighlight.update(formula)
    }
  }

  /**
   * @description 自动补全选择回调
   */
  onAutocompleteSelect(funcName) {
    const { value, selectionStart } = this.inputEl

    // 找到需要替换的函数名前缀（在 = 后面或运算符/括号后面）
    const beforeCursor = value.substring(0, selectionStart)
    const match = beforeCursor.match(/(?:^=|[+\-*/^(,=<>])([A-Z]+)$/i)

    if (match) {
      const prefixStart = selectionStart - match[1].length
      const newValue =
        value.substring(0, prefixStart) + funcName + '(' + value.substring(selectionStart)

      this.inputEl.value = newValue
      this.inputEl.setSelectionRange(
        prefixStart + funcName.length + 1,
        prefixStart + funcName.length + 1
      )

      // 更新单元格
      this.sheet.setCellText(newValue, this.col, this.row, 'input')

      // 更新自动补全显示参数提示
      this.updateAutocomplete()
    }

    this.inputEl.focus()
  }

  /**
   * @description 键盘事件处理
   */
  onKeydown(e) {
    // 先让自动补全处理
    if (this.autocomplete && this.autocomplete.handleKeydown(e)) {
      return
    }

    const keyCode = e.keyCode || e.which

    // Enter - 确认并向下移动
    if (keyCode === 13 && !e.altKey) {
      e.preventDefault()
      this.confirmEdit()
      this.sheet.selectorMove('down')
      this.inputEl.blur()
    }

    // Tab - 确认并向右移动
    if (keyCode === 9) {
      e.preventDefault()
      this.confirmEdit()
      this.sheet.selectorMove(e.shiftKey ? 'left' : 'right')
      this.inputEl.blur()
    }

    // Escape - 取消编辑
    if (keyCode === 27) {
      e.preventDefault()
      this.cancelEdit()
      this.inputEl.blur()
    }

    // F4 - 切换单元格引用的绝对/相对模式
    if (keyCode === 115) {
      e.preventDefault()
      this.toggleReferenceMode()
    }
  }

  /**
   * @description 切换光标位置处的单元格引用的绝对/相对模式
   */
  toggleReferenceMode() {
    const { value, selectionStart } = this.inputEl

    // 查找光标位置附近的单元格引用
    const refPattern = /\$?[A-Z]+\$?\d+/gi
    let match
    let foundRef = null
    let refStart = -1
    let refEnd = -1

    refPattern.lastIndex = 0

    // eslint-disable-next-line no-cond-assign
    while ((match = refPattern.exec(value)) !== null) {
      const matchStart = match.index
      const matchEnd = match.index + match[0].length

      if (selectionStart >= matchStart && selectionStart <= matchEnd) {
        ;[foundRef] = match
        refStart = matchStart
        refEnd = matchEnd
        break
      }
      if (matchStart <= selectionStart + 1 && matchEnd >= selectionStart) {
        ;[foundRef] = match
        refStart = matchStart
        refEnd = matchEnd
        break
      }
    }

    if (foundRef) {
      const newRef = toggleRefAbsolute(foundRef)
      const newValue = value.substring(0, refStart) + newRef + value.substring(refEnd)

      this.inputEl.value = newValue

      const newCursorPos = refStart + newRef.length
      this.inputEl.setSelectionRange(newCursorPos, newCursorPos)

      this.sheet.setCellText(newValue, this.col, this.row, 'input')

      if (this.sheet.editor && this.sheet.editor.visible) {
        this.sheet.editor.setValue(newValue, this.col, this.row)
      }
    }
  }

  /**
   * @description 获得焦点
   */
  onFocus() {
    this.isEditing = true
    this.inputEl.classList.add('editing')

    // 显示引用高亮
    const { value } = this.inputEl
    this.updateReferenceHighlight(value)
  }

  /**
   * @description 失去焦点
   */
  onBlur() {
    // 延迟隐藏，以便点击自动补全项时能处理
    setTimeout(() => {
      if (this.autocomplete) {
        this.autocomplete.hide()
      }
      // 隐藏引用高亮
      if (this.referenceHighlight) {
        this.referenceHighlight.hide()
      }
    }, 150)

    if (this.isEditing) {
      this.confirmEdit()
    }
    this.isEditing = false
    this.inputEl.classList.remove('editing')
  }

  /**
   * @description 确认编辑
   */
  confirmEdit() {
    const { value } = this.inputEl
    this.sheet.setCellText(value, this.col, this.row, 'finished')
    this.sheet.draw()
  }

  /**
   * @description 取消编辑
   */
  cancelEdit() {
    this.update() // 恢复原值
  }

  /**
   * @description 设置输入值（供外部调用，如编辑器同步）
   */
  setValue(value) {
    if (!this.isEditing) {
      this.inputEl.value = value ?? ''
    }
  }

  /**
   * @description 聚焦输入框
   */
  focus() {
    this.inputEl.focus()
  }

  /**
   * @description 销毁
   */
  destroy() {
    this.inputEl.removeEventListener('input', this.onInput)
    this.inputEl.removeEventListener('keydown', this.onKeydown)
    this.inputEl.removeEventListener('focus', this.onFocus)
    this.inputEl.removeEventListener('blur', this.onBlur)

    if (this.autocomplete) {
      this.autocomplete.destroy()
    }
  }
}

export default FormulaBar
