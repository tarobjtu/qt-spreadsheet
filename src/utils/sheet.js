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

export function getSheetData({ rowCount, colCount, theme, data }) {
  return {
    mode: 'edit',
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
    data: data || [],
  }
}

export default {
  getSheetData,
}
