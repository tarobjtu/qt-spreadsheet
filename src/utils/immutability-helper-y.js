import update from 'immutability-helper-x'

/**
 * @description 恶心的写法，覆写immutability-helper的isEquals方法，让其失效，相同的内容也可以起到immutable的效果
 * @perf super-market.json 数据量 10000行 * 21列，deepClone耗时125ms，_.cloneDeep耗时275ms，immutable拷贝耗时2.5ms
 *       存储空间节省更多。
 */
update.isEquals = () => {
  return false
}

export default update
