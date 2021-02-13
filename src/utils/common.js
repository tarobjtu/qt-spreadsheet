export function assignStyle(ctx, styles) {
  Object.keys(styles).forEach((k) => {
    ctx[k] = styles[k]
  })
}

/**
 * @description 深拷贝，比lodash的cloneDeep性能高3倍，不知为啥...
 * @param {*} object
 */
export function deepClone(object) {
  return JSON.parse(JSON.stringify(object))
}

// TODO: 非递归调用，性能有些小问题
const COLUMN_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const COLUMN_CHARSET_LENGTH = COLUMN_CHARSET.length
export function numberToAlpha(number) {
  const mode = COLUMN_CHARSET.substr(number % COLUMN_CHARSET_LENGTH, 1)
  const up = Math.floor(number / COLUMN_CHARSET_LENGTH)
  if (up > 0) {
    return `${numberToAlpha(up - 1)}${mode}`
  }
  return mode
}

export function perf(func, name) {
  if (func === undefined) return
  const t0 = window.performance.now()
  func.apply(this)
  const t1 = window.performance.now()
  console.warn(name, t1 - t0)
}

// 在开发环境快速查看电子表格核心数据，调试便利
if (process.env.NODE_ENV === 'development') {
  window.perf = perf
}

export default {
  assignStyle,
}
