import defaultConfig from './defaultConfig'
import '../style/core.scss'

class Spreadsheet {
  constructor({ root, options }) {
    const opts = { ...defaultConfig, ...options }
    const canvas = document.createElement('canvas')
    canvas.classList.add('qt-spreadsheet-canvas')
    root.appendChild(canvas)

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width * opts.ratio
    canvas.height = height * opts.ratio
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    const ctx = canvas.getContext('2d')
    ctx.scale(opts.ratio, opts.ratio)
    ctx.translate(-0.5, 0.5)

    ctx.fillStyle = 'green'
    ctx.fillRect(0, 0, width, height)
    ctx.textAlign = 'center'
    ctx.font = '24px serif'
    ctx.fillStyle = '#fff'
    ctx.fillText('导演的电子表格', 100, 100)
  }
}

export default Spreadsheet
