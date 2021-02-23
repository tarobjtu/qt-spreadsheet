import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'
import { deepClone } from './common'

export const EMPTY_CELL = { style: {}, value: '' }

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

/**
 * @description 生成空单元格数据
 * @param {*} rowCount
 * @param {*} colCount
 */
export function emptyData(rowCount, colCount) {
  const data = []
  for (let i = 0; i < rowCount; i += 1) {
    data.push([])
    for (let j = 0; j < colCount; j += 1) {
      data[i].push(EMPTY_CELL)
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
    data: data === undefined ? emptyData(rowCount, colCount) : defaultCells(data),
  }
}

/**
 * @description 重新计算offset
 * @param {*} targetMeta
 * @param {*} startPosition
 * @param {*} startOffset
 */
function reCalcOffset(targetMeta, startPosition, startOffset) {
  const nextMetaPosition = startPosition
  let nextMetaOffset = startOffset

  for (let i = nextMetaPosition; i < targetMeta.length; i += 1) {
    const nextMeta = targetMeta[i]
    nextMeta.offset = nextMetaOffset
    nextMetaOffset += nextMeta.size
  }
}

/**
 * @description 将源meta插入到目标meta中
 * @param {*} targetMeta 目标meta
 * @param {*} sourceMeta 源meta
 * @param {*} position 插入的位置
 */
export function insertMeta(targetMeta, sourceMeta, position) {
  targetMeta.splice(position, 0, ...deepClone(sourceMeta))

  // 重新计算offset
  const startPosition = position + sourceMeta.length
  const { offset, size } = targetMeta[startPosition - 1]
  const startOffset = offset + size

  reCalcOffset(targetMeta, startPosition, startOffset)

  return targetMeta
}

/**
 * @description 删除一些meta
 * @param {*} targetMeta
 * @param {*} position 起始的位置
 * @param {*} count 删除meta数量
 */
export function deleteMeta(targetMeta, position, count) {
  const startOffset = targetMeta[position].offset
  targetMeta.splice(position, count)
  reCalcOffset(targetMeta, position, startOffset)

  return targetMeta
}

/**
 * @description 隐藏一些行、列
 * @param {*} targetMeta
 * @param {*} position 起始的位置
 * @param {*} count 隐藏meta数量
 */
export function hideMeta(targetMeta, position, count) {
  for (let i = position; i < position + count; i += 1) {
    const meta = targetMeta[i]
    meta.hidden = true
    meta.originSize = meta.size
    meta.size = 0
  }

  const startOffset = targetMeta[position].offset
  reCalcOffset(targetMeta, position, startOffset)

  return targetMeta
}

/**
 * @description 取消隐藏一些行、列
 * @param {*} targetMeta
 * @param {*} position 起始的位置
 * @param {*} count 隐藏meta数量
 */
export function cancelHideMeta(targetMeta, position, count) {
  for (let i = position; i < position + count; i += 1) {
    const meta = targetMeta[i]
    if (meta.hidden) {
      meta.size = meta.originSize
      meta.hidden = undefined
      meta.originSize = undefined
    }
  }

  const startOffset = targetMeta[position].offset
  reCalcOffset(targetMeta, position, startOffset)

  return targetMeta
}

/**
 * @description 改变meta的尺寸
 * @param {*} targetMeta
 * @param {*} position 起始的meta
 * @param {*} count 改变的meta数量
 * @param {*} newSize 新的尺寸
 */
export function changeMetaSize(targetMeta, position, count, newSize) {
  for (let i = position; i < position + count; i += 1) {
    const meta = targetMeta[i]
    if (!meta.hidden) {
      meta.size = newSize
    }
  }

  const startOffset = targetMeta[position].offset
  reCalcOffset(targetMeta, position, startOffset)

  return targetMeta
}

export default {
  getSheetData,
  emptyData,
  insertMeta,
  deleteMeta,
  changeMetaSize,
}
