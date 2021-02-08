const defaultTheme = {
  colHeaderHeight: 24,
  rowHeaderWidth: 40,
  colWidth: 120,
  rowHeight: 24,
  cellPadding: {
    left: 5,
    right: 5,
    top: 4,
    bottom: 4,
  },
  default: {
    fillStyle: '#ffffff',
    strokeStyle: 'rgba(140,140,140,0.3)',
    protectedBackColor: 'rgba(140,140,140,0.1)',
    lineWidth: 1,
    textAlign: 'left',
    textBaseline: 'middle',
    fontSize: 9,
    color: '#262626',
    fontFamily:
      // eslint-disable-next-line max-len
      '"Helvetica Neue", "Chinese Quote", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  cellStyleDefault: {
    fontSize: 9,
    hAlign: 'left',
    vAlign: 'middle',
    fontWeight: 400,
    fontStyle: 'normal',
    underline: false,
    strikeThrough: false,
    color: '#262626',
    backColor: '#ffffff',
    overflow: 'overflow',
  },
  header: {
    fillStyle: '#fafafa',
    strokeStyle: 'rgba(120,120,120,0.3)',
    lineWidth: 1,
    textAlign: 'center',
    textBaseline: 'middle',
    font:
      // eslint-disable-next-line max-len
      '12px "Helvetica Neue", "Chinese Quote", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif',
    color: '#666',
  },
}

export default defaultTheme
