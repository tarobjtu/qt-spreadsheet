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
fetch('assets/super-market.json')
  .then((response) => {
    return response.json()
  })
  .then((json) => {
    spreadsheet.loadData(json)
  })
  .catch((ex) => console.warn('parsing failed', ex))
