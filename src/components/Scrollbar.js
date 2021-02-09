class Scrollbar {
  constructor({ container, theme, viewModel }) {
    this.theme = theme
    this.viewModel = viewModel
    this.container = container

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
