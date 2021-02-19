import throttle from 'lodash/throttle'
import './scrollbar.scss'

class Scrollbar {
  constructor({ sheet, container, theme, viewModel }) {
    this.sheet = sheet
    this.theme = theme
    this.viewModel = viewModel
    this.container = container
    this.wheelTiming = 0

    this.initElements()
    this.bindEvent()
  }

  initElements() {
    const { container } = this
    this.scrollX = document.createElement('div')
    this.scrollY = document.createElement('div')
    this.scrollX.classList.add('qt-spreadsheet-scrollbar-x')
    this.scrollY.classList.add('qt-spreadsheet-scrollbar-y')
    container.appendChild(this.scrollX)
    container.appendChild(this.scrollY)

    this.triggerX = document.createElement('div')
    this.triggerY = document.createElement('div')
    this.triggerX.classList.add('qt-spreadsheet-scrollbar-trigger')
    this.triggerY.classList.add('qt-spreadsheet-scrollbar-trigger')
    this.scrollX.appendChild(this.triggerX)
    this.scrollY.appendChild(this.triggerY)
  }

  destroy() {
    this.events.forEach((ea) => {
      ea[0].removeEventListener(ea[1], ea[2])
    })
  }

  bindEvent() {
    this.events = []
    // 滚轮事件
    const wheel = this.onWheel.bind(this)
    this.events.push([this.container, 'wheel', wheel])
    this.container.addEventListener('wheel', wheel)

    // triggerX 拖拽事件
    const xMouseDown = this.onMouseDown.bind(this, 'X')
    const yMouseDown = this.onMouseDown.bind(this, 'Y')
    const mouseMove = throttle(this.onMouseMove.bind(this), 50)
    const mouseUp = this.onMouseUp.bind(this)
    this.events.push([this.triggerX, 'mousedown', xMouseDown])
    this.events.push([this.triggerY, 'mousedown', yMouseDown])
    this.events.push([window, 'mousemove', mouseMove])
    this.events.push([window, 'mouseup', mouseUp])

    this.triggerX.addEventListener('mousedown', xMouseDown, false)
    this.triggerY.addEventListener('mousedown', yMouseDown, false)
    window.addEventListener('mousemove', mouseMove, false)
    window.addEventListener('mouseup', mouseUp, false)
  }

  onMouseDown(direction, e) {
    this.dragStart = true
    this.direction = direction
    this.startPosition = this.direction === 'X' ? e.clientX : e.clientY
  }

  onMouseMove(e) {
    if (!this.dragStart) return
    this.moveTrigger(e.clientX, e.clientY)
  }

  onMouseUp(e) {
    if (!this.dragStart) return
    this.dragStart = false
    this.moveTrigger(e.clientX, e.clientY)
  }

  /**
   * @description 用鼠标拖拽滚动条的处理
   * @param {*} clientX
   * @param {*} clientY
   */
  moveTrigger(clientX, clientY) {
    const { viewModel, container } = this
    const { scrollX, scrollY } = viewModel.sheetData
    const docHeight = viewModel.getSheetHeight() // 表格文档的高度
    const docWidth = viewModel.getSheetWidth() // 表格文档的宽度
    const viewWidth = container.offsetWidth // 表格窗口的宽度（不含公式、工具条）
    const viewHeight = container.offsetHeight // 表格窗口的宽度（不含公式、工具条）

    this.curPosition = this.direction === 'X' ? clientX : clientY
    const delta = this.curPosition - this.startPosition

    // console.warn('moving distance', this.curPosition - this.startPosition)

    if (this.direction === 'X') {
      this.sheet.scroll(scrollX + Math.round((delta * docWidth) / viewWidth), scrollY)
      this.startPosition = this.curPosition
    } else {
      this.sheet.scroll(scrollX, scrollY + Math.round((delta * docHeight) / viewHeight))
      this.startPosition = this.curPosition
    }
  }

  onWheel(event) {
    event.preventDefault()
    if (this.wheelFlag) return
    this.wheelFlag = true

    setTimeout(() => {
      this.wheelFlag = false
      const { deltaX, deltaY } = event
      const { scrollX, scrollY } = this.viewModel.sheetData
      // console.warn({ deltaX, deltaY })
      this.sheet.scroll(scrollX + Math.round(deltaX), scrollY + Math.round(deltaY))
    }, 50)
  }

  draw() {
    const { container, viewModel, triggerX, triggerY } = this
    const { scrollX, scrollY } = viewModel.sheetData

    const docHeight = viewModel.getSheetHeight() // 表格文档的高度
    const docWidth = viewModel.getSheetWidth() // 表格文档的宽度
    const viewWidth = container.offsetWidth // 表格窗口的宽度（不含公式、工具条）
    const viewHeight = container.offsetHeight // 表格窗口的宽度（不含公式、工具条）

    const triggerYLength = Math.round((viewHeight / docHeight) * viewHeight) // 滚动条触发条的长度
    const triggerXLength = Math.round((viewWidth / docWidth) * viewWidth) // 滚动条触发条的长度
    triggerY.style.height = Math.max(triggerYLength, 20) + 'px'
    triggerX.style.width = Math.max(triggerXLength, 20) + 'px'

    const triggerYPosition = Math.round((scrollY / docHeight) * viewHeight) // 滚动条触发条距离起始点的位置
    const triggerXPosition = Math.round((scrollX / docWidth) * viewWidth) //  滚动条触发条距离起始点的位置
    triggerY.style.top = triggerYPosition + 'px'
    triggerX.style.left = triggerXPosition + 'px'
  }
}

export default Scrollbar
