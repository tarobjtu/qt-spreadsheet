import Spreadsheet from './core/Spreadsheet'

const options = {
  width: 800,
  height: 600,
}

const spreadsheet = new Spreadsheet({
  root: document.getElementById('root'),
  options,
})
console.warn(spreadsheet)
