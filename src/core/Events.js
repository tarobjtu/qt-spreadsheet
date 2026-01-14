import EventEmitter from 'eventemitter3'
import throttle from 'lodash/throttle'

/**
 * @description 电子表格通用事件注册与处理
 */
class Events extends EventEmitter {
  constructor({ sheet, canvas, container, viewModel }) {
    super()

    this.sheet = sheet
    this.container = container
    this.canvas = canvas
    this.viewModel = viewModel

    this.bindEvents()
  }

  destroy() {
    this.events.forEach((ea) => {
      ea[0].removeEventListener(ea[1], ea[2])
    })
  }

  bindEvents() {
    const { canvas } = this
    this.events = []

    const resize = throttle(this.resize.bind(this), 100)
    const click = this.onClick.bind(this)
    const keydown = this.onKeydown.bind(this)
    const mousedown = this.onMousedown.bind(this)
    const mouseup = this.onMouseup.bind(this)
    const mousemove = throttle(this.onMousemove.bind(this), 50)
    const mouseleave = this.onMouseleave.bind(this)

    this.events.push([window, 'resize', resize])
    this.events.push([window, 'click', click])
    this.events.push([document, 'keydown', keydown])
    this.events.push([canvas, 'mousedown', mousedown])
    this.events.push([window, 'mouseup', mouseup])
    this.events.push([canvas, 'mousemove', mousemove])
    this.events.push([canvas, 'mouseleave', mouseleave])

    window.addEventListener('resize', resize)
    window.addEventListener('click', click, false)
    document.addEventListener('keydown', keydown, false)
    canvas.addEventListener('mousedown', mousedown, false)
    window.addEventListener('mouseup', mouseup, false)
    canvas.addEventListener('mousemove', mousemove, false)
    canvas.addEventListener('mouseleave', mouseleave, false)
  }

  resize() {
    this.sheet.resize()
  }

  onClick(e) {
    if (this.container.contains(e.target)) {
      this.canvasActive = true
    } else {
      this.canvasActive = false
    }
  }

  onKeydown(e) {
    // 如果焦点在输入框或编辑器中，不处理键盘事件
    const { tagName } = e.target
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
      return
    }

    const keyCode = e.keyCode || e.which
    const { shiftKey, ctrlKey, metaKey, altKey } = e

    // Windows的Ctrl、Mac的Command辅助键与功能键同时按下的情况
    if (ctrlKey || metaKey) {
      // switch+case缩进的eslint判断有些问题
      /* eslint-disable */
      switch (keyCode) {
        case 90: //Command + Z 撤销， Command + Shift + Z 重做
          if (shiftKey) {
            this.sheet.redo()
          } else {
            this.sheet.undo()
          }
          e.preventDefault()
          break
        case 89: //Command + Y 重做
          this.sheet.redo()
          e.preventDefault()
          break
        case 66: // Command + B 加粗
          this.sheet.setCellsStyle({ bold: 'bold' })
          e.preventDefault()
          break
        case 73: // Command + I 斜体
          // Command + Alt + I 是Chrome的Dev Tools快捷键，避免冲突
          if (!altKey) {
            this.sheet.setCellsStyle({ italic: 'italic' })
            e.preventDefault()
          }
          break
        case 65: // Command + A 全选
          this.sheet.selectAllCells()
          e.preventDefault()
          break
        case 83: // Command + S 保存
          e.preventDefault()
          this.sheet.save()
          break
        case 67: // Command + C 复制
          this.sheet.copy()
          e.preventDefault()
          break
        case 86: // Command + V 黏贴
          this.sheet.paste()
          e.preventDefault()
          break
        case 88: // Command + X 剪贴
          this.sheet.cut()
          e.preventDefault()
          break
        default:
          break
      }
      /* eslint-enable */
    } else {
      /* eslint-disable */
      switch (keyCode) {
        case 37: // left
          this.sheet.selectorMove('left', shiftKey)
          e.preventDefault()
          break
        case 38: // up
          this.sheet.selectorMove('up', shiftKey)
          e.preventDefault()
          break
        case 39: // right
          this.sheet.selectorMove('right', shiftKey)
          e.preventDefault()
          break
        case 40: // down
          this.sheet.selectorMove('down', shiftKey)
          e.preventDefault()
          break
        case 9: // tab
          this.sheet.selectorMove(shiftKey ? 'left' : 'right')
          e.preventDefault()
          break
        case 13: // enter
          this.sheet.selectorMove(shiftKey ? 'up' : 'down')
          e.preventDefault()
          break
        case 8: // backspace
          this.sheet.clearSelectedCellsData()
          e.preventDefault()
          break
        case 27: // esc
          this.sheet.escape()
          e.preventDefault()
          break
        case 113: // F2 - 编辑当前单元格
          this.sheet.showEditor()
          e.preventDefault()
          break
        default:
          break
      }
      /* eslint-enable */

      // 输入文本 或 等号
      if (
        (keyCode >= 65 && keyCode <= 90) ||
        (keyCode >= 48 && keyCode <= 57) ||
        (keyCode >= 96 && keyCode <= 105) ||
        e.key === '='
      ) {
        this.sheet.showEditor({ clearText: true })
      }
    }
  }

  onMousedown(e) {
    const { button } = e
    if (button === 2) return
    this.startMousedown = true
  }

  onMouseup(e) {
    if (!this.startMousedown) return
    this.startMousedown = false

    // 鼠标双击
    if (this.mouseupTiming === undefined) this.mouseupTiming = 0
    if (Date.now() - this.mouseupTiming < 300) {
      this.dbclick(e)
    }
    this.mouseupTiming = Date.now()
  }

  dbclick(e) {
    const { offsetX, offsetY } = e
    this.sheet.showEditorByOffset(offsetX, offsetY)
  }

  /**
   * @description 鼠标移动事件 - 用于显示错误提示
   */
  onMousemove(e) {
    const { sheet, viewModel } = this
    if (!sheet.errorTooltip) return

    const { offsetX, offsetY } = e
    const { scrollX, scrollY } = viewModel.sheetData
    const frozenColsWidth = viewModel.getFrozenColsWidth()
    const frozenRowsHeight = viewModel.getFrozenRowsHeight()

    // 判断鼠标位置是否在冻结区域内
    const inFrozenColsArea = offsetX < frozenColsWidth
    const inFrozenRowsArea = offsetY < frozenRowsHeight

    // 计算文档坐标
    let docX = offsetX
    let docY = offsetY

    if (!inFrozenColsArea) {
      docX = offsetX + scrollX
    }
    if (!inFrozenRowsArea) {
      docY = offsetY + scrollY
    }

    const cellInfo = viewModel.getCellByOffset(docX, docY)

    if (cellInfo && cellInfo.type === 'cell') {
      const { col, row } = cellInfo
      if (sheet.errorTooltip.hasError(col, row)) {
        sheet.errorTooltip.show(col, row, { x: offsetX, y: offsetY })
      } else {
        sheet.errorTooltip.hide()
      }
    } else {
      sheet.errorTooltip.hide()
    }
  }

  /**
   * @description 鼠标离开事件
   */
  onMouseleave() {
    const { sheet } = this
    if (sheet.errorTooltip) {
      sheet.errorTooltip.hide()
    }
  }
}

export default Events
