import _ from 'lodash'
import EventEmitter from 'eventemitter3'

/**
 * @description 存储历史版本的sheetData，建议使用Immutable方案存储sheetData节省空间
 */
class History extends EventEmitter {
  constructor(initData) {
    super()
    this.stack = [initData]
    this.position = 0
  }

  save(current) {
    this.stack = this.stack.slice(0, this.position + 1)
    this.stack.push(current)
    this.position += 1
    this.emit('change')
  }

  redo(callback) {
    if (!this.canRedo()) return
    this.position += 1
    const item = this.stack[this.position]
    if (_.isFunction(callback)) {
      callback(item)
    }
    this.emit('change')
  }

  undo(callback) {
    if (!this.canUndo()) return
    this.position -= 1
    const item = this.stack[this.position]
    if (_.isFunction(callback)) {
      callback(item)
    }
    this.emit('change')
  }

  canRedo() {
    return this.position < this.stack.length - 1
  }

  canUndo() {
    return this.position > 0
  }
}

export default History
