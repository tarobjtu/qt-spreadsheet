import EventEmitter from 'eventemitter3'
import _ from 'lodash'

/**
 * @description 电子表格通用事件注册与处理
 */
class Events extends EventEmitter {
  constructor({ sheet, canvas, viewModel }) {
    super()

    this.sheet = sheet
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
    const mousedown = this.onMousedown.bind(this)
    const mousemove = _.throttle(this.onMousemove.bind(this), 100)
    const mouseup = this.onMouseup.bind(this)
    this.events.push([canvas, 'mousedown', mousedown])
    this.events.push([window, 'mousemove', mousemove])
    this.events.push([window, 'mouseup', mouseup])

    canvas.addEventListener('mousedown', mousedown, false)
    window.addEventListener('mousemove', mousemove, false)
    window.addEventListener('mouseup', mouseup, false)
  }

  onMousedown(e) {
    this.startMousedown = true
    const { offsetX, offsetY } = e
    this.startOffsetX = offsetX
    this.startOffsetY = offsetY
    this.sheet.select(offsetX, offsetY)
  }

  onMousemove(e) {
    if (!this.startMousedown) return
    this.mousemoving = true

    const { startOffsetX, startOffsetY } = this
    const { offsetX, offsetY } = e
    this.sheet.select(startOffsetX, startOffsetY, offsetX, offsetY)
  }

  onMouseup(e) {
    if (!this.startMousedown) return
    this.startMousedown = false

    if (this.mousemoving) {
      this.mousemoving = false
      const { startOffsetX, startOffsetY } = this
      const { offsetX, offsetY } = e
      this.sheet.select(startOffsetX, startOffsetY, offsetX, offsetY)
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
    this.sheet.edit(offsetX, offsetY)
  }
}

export default Events
