function defaultCRMeta({ size, count }) {
  const crMeta = []
  for (let i = 0; i < count; i += 1) {
    crMeta.push({
      size,
      offset: size * i,
    })
  }
  return crMeta
}

function defaultSheetData(config) {
  return {
    mode: 'edit',
    rowMeta: defaultCRMeta({
      size: config.rowMeta.height,
      count: config.rowMeta.count,
    }),
    colMeta: defaultCRMeta({
      size: config.colMeta.width,
      count: config.colMeta.count,
    }),
    data: [],
  }
}

export default defaultSheetData
