/**
 * History 模块单元测试
 */
import History from '../../src/core/History'

describe('History', () => {
  let history

  beforeEach(() => {
    history = new History({ data: 'initial' })
  })

  describe('constructor', () => {
    test('should initialize with initial data', () => {
      expect(history.stack).toHaveLength(1)
      expect(history.stack[0]).toEqual({ data: 'initial' })
      expect(history.position).toBe(0)
    })
  })

  describe('save', () => {
    test('should add new state to stack', () => {
      history.save({ data: 'state1' })

      expect(history.stack).toHaveLength(2)
      expect(history.position).toBe(1)
    })

    test('should truncate future states when saving after undo', () => {
      history.save({ data: 'state1' })
      history.save({ data: 'state2' })
      history.undo()
      history.save({ data: 'state3' })

      expect(history.stack).toHaveLength(3)
      expect(history.stack[2]).toEqual({ data: 'state3' })
    })

    test('should emit change event', () => {
      const mockFn = jest.fn()
      history.on('change', mockFn)

      history.save({ data: 'state1' })

      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('last', () => {
    test('should return the last state', () => {
      history.save({ data: 'state1' })
      history.save({ data: 'state2' })

      expect(history.last()).toEqual({ data: 'state2' })
    })
  })

  describe('undo', () => {
    test('should move position back', () => {
      history.save({ data: 'state1' })
      history.undo()

      expect(history.position).toBe(0)
    })

    test('should call callback with previous state', () => {
      history.save({ data: 'state1' })
      const callback = jest.fn()

      history.undo(callback)

      expect(callback).toHaveBeenCalledWith({ data: 'initial' })
    })

    test('should not undo if at beginning', () => {
      const callback = jest.fn()
      history.undo(callback)

      expect(callback).not.toHaveBeenCalled()
      expect(history.position).toBe(0)
    })

    test('should emit change event', () => {
      history.save({ data: 'state1' })
      const mockFn = jest.fn()
      history.on('change', mockFn)

      history.undo()

      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('redo', () => {
    test('should move position forward', () => {
      history.save({ data: 'state1' })
      history.undo()
      history.redo()

      expect(history.position).toBe(1)
    })

    test('should call callback with next state', () => {
      history.save({ data: 'state1' })
      history.undo()
      const callback = jest.fn()

      history.redo(callback)

      expect(callback).toHaveBeenCalledWith({ data: 'state1' })
    })

    test('should not redo if at end', () => {
      history.save({ data: 'state1' })
      const callback = jest.fn()

      history.redo(callback)

      expect(callback).not.toHaveBeenCalled()
      expect(history.position).toBe(1)
    })

    test('should emit change event', () => {
      history.save({ data: 'state1' })
      history.undo()
      const mockFn = jest.fn()
      history.on('change', mockFn)

      history.redo()

      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('canUndo', () => {
    test('should return false at initial state', () => {
      expect(history.canUndo()).toBe(false)
    })

    test('should return true after save', () => {
      history.save({ data: 'state1' })
      expect(history.canUndo()).toBe(true)
    })

    test('should return false after undoing all changes', () => {
      history.save({ data: 'state1' })
      history.undo()
      expect(history.canUndo()).toBe(false)
    })
  })

  describe('canRedo', () => {
    test('should return false without undo', () => {
      history.save({ data: 'state1' })
      expect(history.canRedo()).toBe(false)
    })

    test('should return true after undo', () => {
      history.save({ data: 'state1' })
      history.undo()
      expect(history.canRedo()).toBe(true)
    })

    test('should return false after redo', () => {
      history.save({ data: 'state1' })
      history.undo()
      history.redo()
      expect(history.canRedo()).toBe(false)
    })
  })

  describe('complex scenarios', () => {
    test('should handle multiple undo/redo operations', () => {
      history.save({ data: 'state1' })
      history.save({ data: 'state2' })
      history.save({ data: 'state3' })

      history.undo() // position = 2
      history.undo() // position = 1

      expect(history.position).toBe(1)
      expect(history.canUndo()).toBe(true)
      expect(history.canRedo()).toBe(true)

      history.redo() // position = 2

      expect(history.position).toBe(2)
    })

    test('should clear redo stack when saving new state after undo', () => {
      history.save({ data: 'state1' })
      history.save({ data: 'state2' })
      history.undo()
      history.save({ data: 'state3' })

      expect(history.canRedo()).toBe(false)
      expect(history.stack).toHaveLength(3)
      expect(history.stack[2]).toEqual({ data: 'state3' })
    })
  })
})
