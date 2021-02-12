import _ from 'lodash'

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
  if (!_.isArray(data)) {
    console.error('sheet的数据格式不是数组')
    return []
  }

  data.forEach((row, ri) => {
    if (!_.isArray(row)) {
      console.error('sheet的第', ri, '行数据格式不是数组')
      return
    }
    row.forEach((item, ci, arr) => {
      if (!_.isObject(item)) {
        // eslint-disable-next-line no-param-reassign
        arr[ci] = {
          style: {},
          value: item,
        }
      }
    })
  })

  return data
}

function defaultData(rowCount, colCount) {
  const data = new Array(rowCount)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = new Array(colCount)
  }
  return data
}

export function getSheetData({ rowCount, colCount, theme, data }) {
  let d = data
  if (d === undefined) {
    d = defaultData(rowCount, colCount)
  }
  return {
    mode: 'edit',
    scrollX: 0, // 表格视窗相对文档起始点的横轴位置
    scrollY: 0, // 表格视窗相对文档起始点的纵轴位置
    selector: {
      col: 0,
      row: 0,
      colCount: 1,
      rowCount: 1,
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
    data: defaultCells(d),
  }
}

export default {
  getSheetData,
}
