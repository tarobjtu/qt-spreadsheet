import EventEmitter from 'eventemitter3'
import _ from 'lodash'

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

    // 键盘事件
    const keydown = this.onKeydown.bind(this)
    this.events.push([document, 'keydown', keydown])
    document.addEventListener('keydown', keydown, false)

    // 鼠标事件
    const mousedown = this.onMousedown.bind(this)
    const mousemove = _.throttle(this.onMousemove.bind(this), 100)
    const mouseup = this.onMouseup.bind(this)
    const click = this.onClick.bind(this)
    this.events.push([canvas, 'mousedown', mousedown])
    this.events.push([window, 'mousemove', mousemove])
    this.events.push([window, 'mouseup', mouseup])
    this.events.push([window, 'click', click])
    canvas.addEventListener('mousedown', mousedown, false)
    window.addEventListener('mousemove', mousemove, false)
    window.addEventListener('mouseup', mouseup, false)
    window.addEventListener('click', click, false)
  }

  onClick(e) {
    if (this.container.contains(e.target)) {
      this.canvasActive = true
    } else {
      this.canvasActive = false
    }
  }

  onKeydown(e) {
    if (!this.canvasActive) return
    const keyCode = e.keyCode || e.which
    const { shiftKey, ctrlKey, metaKey } = e

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
          this.sheet.setCellsStyle({ italic: 'italic' })
          e.preventDefault()
          break
        case 65: // Command + A 全选
          this.sheet.selectAllCells()
          e.preventDefault()
          break
        case 67: // Command + C 复制
          // this.sheet.copy()
          e.preventDefault()
          break
        case 86: // Command + V 黏贴
          // this.sheet.paste()
          e.preventDefault()
          break
        case 88: // Command + X 剪贴
          // this.sheet.cut()
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
          this.sheet.clearSelectedCellsText()
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
    this.startMousedown = true
    const { offsetX, offsetY, shiftKey } = e

    // shiftKey + click
    if (shiftKey) {
      if (this.startOffsetX === undefined) {
        const { left, top } = this.viewModel.getSelectedActiveCellBBox()
        this.startOffsetX = left
        this.startOffsetY = top
      }
      this.sheet.selectCellsByOffset(this.startOffsetX, this.startOffsetY, offsetX, offsetY)
    } else {
      this.startOffsetX = offsetX
      this.startOffsetY = offsetY
      this.sheet.selectCellsByOffset(offsetX, offsetY)
    }
    this.sheet.emit('startSelectCell')
  }

  onMousemove(e) {
    if (!this.startMousedown) return
    this.mousemoving = true

    const { startOffsetX, startOffsetY } = this
    const { offsetX, offsetY } = e
    this.sheet.selectCellsByOffset(startOffsetX, startOffsetY, offsetX, offsetY)
    this.sheet.emit('SelectingCell')
  }

  onMouseup(e) {
    if (!this.startMousedown) return
    this.startMousedown = false
    this.sheet.emit('endSelectCell')

    if (this.mousemoving) {
      this.mousemoving = false
      const { startOffsetX, startOffsetY } = this
      const { offsetX, offsetY } = e
      this.sheet.selectCellsByOffset(startOffsetX, startOffsetY, offsetX, offsetY)
    }
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
}

export default Events
