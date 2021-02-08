import Spreadsheet from './core/Spreadsheet'

const options = {
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
}

const spreadsheet = new Spreadsheet({
  root: document.getElementById('root'),
  options,
})
console.warn(spreadsheet)
