import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'

function defaultCRMeta({ size, count, headerOffset }) {
  const crMeta = []
  for (let i = 0; i < count; i += 1) {
    crMeta.push({
      size,
      offset: size * i + headerOffset,
    })
  }
  return crMeta
}

function defaultCells(data) {
  if (!isArray(data)) {
    console.error('sheet的数据格式不是数组')
    return []
  }

  data.forEach((row, ri) => {
    if (!isArray(row)) {
      console.error('sheet的第', ri, '行数据格式不是数组')
      return
    }
    row.forEach((item, ci, arr) => {
      if (!isObject(item)) {
        // eslint-disable-next-line no-param-reassign
        arr[ci] = {
          style: {},
          value: item === undefined ? '' : item,
        }
      }
    })
  })

  return data
}

function defaultData(rowCount, colCount) {
  const data = []
  for (let i = 0; i < rowCount; i += 1) {
    data.push([])
    for (let j = 0; j < colCount; j += 1) {
      data[i].push({
        style: {},
        value: '',
      })
    }
  }
  return data
}

export function getSheetData({ rowCount, colCount, theme, data }) {
  return {
    name: '未命名文件',
    vender: 'qt-spreadsheet',
    version: '0.0.1',
    mode: 'edit',
    scrollX: 0, // 表格视窗相对文档起始点的横轴位置
    scrollY: 0, // 表格视窗相对文档起始点的纵轴位置
    selector: {
      col: 0,
      row: 0,
      colCount: 1,
      rowCount: 1,
      activeCol: 0,
      activeRow: 0,
      type: 'cell',
    }, // 选中的单元格或区域
    rowsMeta: defaultCRMeta({
      size: theme.rowHeight,
      count: rowCount,
      headerOffset: theme.colHeaderHeight,
    }),
    colsMeta: defaultCRMeta({
      size: theme.colWidth,
      count: colCount,
      headerOffset: theme.rowHeaderWidth,
    }),
    data: data === undefined ? defaultData(rowCount, colCount) : defaultCells(data),
  }
}

export default {
  getSheetData,
}
