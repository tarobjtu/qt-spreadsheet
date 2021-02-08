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

function defaultSheetData(config, theme) {
  return {
    mode: 'edit',
    rowMeta: defaultCRMeta({
      size: config.rowMeta.height,
      count: config.rowMeta.count,
      headerOffset: theme.colHeaderHeight,
    }),
    colMeta: defaultCRMeta({
      size: config.colMeta.width,
      count: config.colMeta.count,
      headerOffset: theme.rowHeaderWidth,
    }),
    data: [],
  }
}

export default defaultSheetData
