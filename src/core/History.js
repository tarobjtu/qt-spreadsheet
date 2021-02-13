import _ from 'lodash'
/**
 * @description 存储历史版本的sheetData，建议使用Immutable方案存储sheetData节省空间
 */
class History {
  constructor() {
    this.stack = []
    this.position = 0
  }

  save(current) {
    this.stack = this.stack.slice(0, this.position + 1)
    this.stack.push(current)
    this.position += 1
  }

  redo(callback) {
    if (!this.canRedo()) return
    const item = this.stack[(this.position += 1)]
    if (_.isFunction(callback)) {
      callback(item)
    }
  }

  undo(callback) {
    if (!this.canUndo()) return
    const item = this.stack[(this.position -= 1)]
    if (_.isFunction(callback)) {
      callback(item)
    }
  }

  canRedo() {
    return this.position < this.stack.length - 1
  }

  canUndo() {
    return this.position > 0
  }
}

export default History
