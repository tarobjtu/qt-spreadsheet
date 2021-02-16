import { fetch } from 'whatwg-fetch'
import Spreadsheet from './core/Spreadsheet'
import './style/common.scss'

const options = {
  width: document.documentElement.clientWidth,
  height: document.documentElement.clientHeight,
}

const spreadsheet = new Spreadsheet({
  root: document.getElementById('root'),
  options,
})

spreadsheet.on('save', (data) => {
  localStorage.setItem('qt-spreadsheet-file', JSON.stringify(data))
})

spreadsheet.on('delete', () => {
  localStorage.removeItem('qt-spreadsheet-file')
})

// localStorage是同步读取，初始化加载性能有些问题
// 最大存储空间有限，不能本地保存过大的文档
const data = localStorage.getItem('qt-spreadsheet-file')
if (data) {
  spreadsheet.loadData(JSON.parse(data))
} else {
  fetch('assets/data/super-market-small.json')
    .then((response) => {
      return response.json()
    })
    .then((json) => {
      spreadsheet.loadData(json)
    })
    .catch((ex) => console.warn('parsing failed', ex))
}
