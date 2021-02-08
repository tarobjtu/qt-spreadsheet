export function assignStyle(ctx, styles) {
  Object.keys(styles).forEach((k) => {
    ctx[k] = styles[k]
  })
}

export function perf(func, name) {
  const t0 = window.performance.now()
  func.apply(this)
  const t1 = window.performance.now()
  console.warn(name, t1 - t0)
}

export default {
  assignStyle,
}
