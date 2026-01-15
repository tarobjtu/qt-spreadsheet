/**
 * ViewModel 集成测试
 * 测试 ViewModel + History + FormulaEngine 协同工作
 */
import History from '../../src/core/History'

// 创建简化的 ViewModel 测试类
class TestViewModel {
  constructor(initialData) {
    this.sheetData = initialData
    this.history = new History(this.sheetData)
  }

  // 更新数据并保存到历史
  updateData(newData) {
    this.sheetData = newData
    this.history.save(this.sheetData)
  }

  // 获取单元格数据
  getCellData(col, row) {
    return this.sheetData.data[row]?.[col] || null
  }

  // 设置单元格值
  setCellValue(col, row, value, saveHistory = true) {
    // 创建新的数据副本
    const newData = JSON.parse(JSON.stringify(this.sheetData))
    if (!newData.data[row]) {
      newData.data[row] = []
    }
    if (!newData.data[row][col]) {
      newData.data[row][col] = {}
    }
    newData.data[row][col].value = value
    this.sheetData = newData

    if (saveHistory) {
      this.history.save(this.sheetData)
    }
  }

  // 获取单元格值
  getCellValue(col, row) {
    return this.getCellData(col, row)?.value ?? ''
  }

  // 设置单元格样式
  setCellStyle(col, row, style, saveHistory = true) {
    const newData = JSON.parse(JSON.stringify(this.sheetData))
    if (!newData.data[row]) {
      newData.data[row] = []
    }
    if (!newData.data[row][col]) {
      newData.data[row][col] = {}
    }
    newData.data[row][col].style = {
      ...newData.data[row][col].style,
      ...style,
    }
    this.sheetData = newData

    if (saveHistory) {
      this.history.save(this.sheetData)
    }
  }

  // 获取单元格样式
  getCellStyle(col, row) {
    return this.getCellData(col, row)?.style || {}
  }

  // 设置选区
  setSelector(selector) {
    const newData = JSON.parse(JSON.stringify(this.sheetData))
    newData.selector = { ...newData.selector, ...selector }
    this.sheetData = newData
  }

  // 获取选区
  getSelector() {
    return this.sheetData.selector
  }

  // 批量设置单元格值
  setCellValuesBatch(cells) {
    const newData = JSON.parse(JSON.stringify(this.sheetData))
    cells.forEach(({ col, row, value }) => {
      if (!newData.data[row]) {
        newData.data[row] = []
      }
      if (!newData.data[row][col]) {
        newData.data[row][col] = {}
      }
      newData.data[row][col].value = value
    })
    this.sheetData = newData
    this.history.save(this.sheetData)
  }

  // 清除单元格
  clearCells(startCol, startRow, endCol, endRow) {
    const newData = JSON.parse(JSON.stringify(this.sheetData))
    for (let r = startRow; r <= endRow; r += 1) {
      for (let c = startCol; c <= endCol; c += 1) {
        if (newData.data[r] && newData.data[r][c]) {
          newData.data[r][c] = {}
        }
      }
    }
    this.sheetData = newData
    this.history.save(this.sheetData)
  }

  // 撤销
  undo() {
    this.history.undo((data) => {
      this.sheetData = data
    })
  }

  // 重做
  redo() {
    this.history.redo((data) => {
      this.sheetData = data
    })
  }

  canUndo() {
    return this.history.canUndo()
  }

  canRedo() {
    return this.history.canRedo()
  }
}

// 创建初始数据
function createInitialData(rows = 10, cols = 10) {
  const data = []
  for (let r = 0; r < rows; r += 1) {
    data[r] = []
    for (let c = 0; c < cols; c += 1) {
      data[r][c] = {}
    }
  }
  return {
    data,
    selector: { col: 0, row: 0, colCount: 1, rowCount: 1, activeCol: 0, activeRow: 0 },
    scrollX: 0,
    scrollY: 0,
  }
}

describe('ViewModel Integration', () => {
  let vm

  beforeEach(() => {
    vm = new TestViewModel(createInitialData())
  })

  describe('单元格操作与历史记录', () => {
    test('设置单元格值应保存到历史', () => {
      vm.setCellValue(0, 0, 'Hello')
      expect(vm.getCellValue(0, 0)).toBe('Hello')
      expect(vm.canUndo()).toBe(true)
    })

    test('撤销应恢复之前的值', () => {
      vm.setCellValue(0, 0, 'First')
      vm.setCellValue(0, 0, 'Second')

      vm.undo()
      expect(vm.getCellValue(0, 0)).toBe('First')
    })

    test('重做应恢复撤销的值', () => {
      vm.setCellValue(0, 0, 'First')
      vm.setCellValue(0, 0, 'Second')

      vm.undo()
      vm.redo()
      expect(vm.getCellValue(0, 0)).toBe('Second')
    })

    test('多次撤销应正确恢复', () => {
      vm.setCellValue(0, 0, 'A')
      vm.setCellValue(0, 0, 'B')
      vm.setCellValue(0, 0, 'C')

      vm.undo() // C -> B
      vm.undo() // B -> A
      vm.undo() // A -> empty

      expect(vm.getCellValue(0, 0)).toBe('')
    })
  })

  describe('批量操作', () => {
    test('批量设置值应保存为单次历史', () => {
      vm.setCellValuesBatch([
        { col: 0, row: 0, value: 'A1' },
        { col: 1, row: 0, value: 'B1' },
        { col: 0, row: 1, value: 'A2' },
      ])

      expect(vm.getCellValue(0, 0)).toBe('A1')
      expect(vm.getCellValue(1, 0)).toBe('B1')
      expect(vm.getCellValue(0, 1)).toBe('A2')

      // 一次撤销应该恢复所有值
      vm.undo()
      expect(vm.getCellValue(0, 0)).toBe('')
      expect(vm.getCellValue(1, 0)).toBe('')
      expect(vm.getCellValue(0, 1)).toBe('')
    })

    test('清除单元格应保存到历史', () => {
      vm.setCellValue(0, 0, 'A1')
      vm.setCellValue(1, 0, 'B1')
      vm.setCellValue(0, 1, 'A2')

      vm.clearCells(0, 0, 1, 1)

      expect(vm.getCellValue(0, 0)).toBe('')
      expect(vm.getCellValue(1, 0)).toBe('')

      vm.undo()
      expect(vm.getCellValue(0, 0)).toBe('A1')
    })
  })

  describe('样式操作', () => {
    test('设置样式应保存到历史', () => {
      vm.setCellStyle(0, 0, { bold: true, fontSize: 14 })

      expect(vm.getCellStyle(0, 0)).toEqual({ bold: true, fontSize: 14 })
      expect(vm.canUndo()).toBe(true)
    })

    test('撤销应恢复样式', () => {
      vm.setCellStyle(0, 0, { bold: true })
      vm.setCellStyle(0, 0, { bold: false, italic: true })

      vm.undo()
      expect(vm.getCellStyle(0, 0)).toEqual({ bold: true })
    })

    test('值和样式修改应独立撤销', () => {
      vm.setCellValue(0, 0, 'Hello')
      vm.setCellStyle(0, 0, { bold: true })

      vm.undo() // 撤销样式
      expect(vm.getCellValue(0, 0)).toBe('Hello')
      expect(vm.getCellStyle(0, 0)).toEqual({})

      vm.undo() // 撤销值
      expect(vm.getCellValue(0, 0)).toBe('')
    })
  })

  describe('选区操作', () => {
    test('设置选区应正确更新', () => {
      vm.setSelector({ col: 2, row: 3, colCount: 2, rowCount: 3 })

      const selector = vm.getSelector()
      expect(selector.col).toBe(2)
      expect(selector.row).toBe(3)
      expect(selector.colCount).toBe(2)
      expect(selector.rowCount).toBe(3)
    })

    test('移动选区应正确更新活动单元格', () => {
      vm.setSelector({ col: 5, row: 5, activeCol: 5, activeRow: 5 })

      const selector = vm.getSelector()
      expect(selector.activeCol).toBe(5)
      expect(selector.activeRow).toBe(5)
    })
  })

  describe('复杂操作场景', () => {
    test('模拟用户编辑流程', () => {
      // 用户输入数据
      vm.setCellValue(0, 0, 'Product')
      vm.setCellValue(1, 0, 'Price')
      vm.setCellValue(0, 1, 'Apple')
      vm.setCellValue(1, 1, '10')

      // 设置表头样式
      vm.setCellStyle(0, 0, { bold: true })
      vm.setCellStyle(1, 0, { bold: true })

      // 验证数据
      expect(vm.getCellValue(0, 0)).toBe('Product')
      expect(vm.getCellStyle(0, 0).bold).toBe(true)

      // 撤销操作
      vm.undo() // 撤销 B1 样式
      vm.undo() // 撤销 A1 样式
      vm.undo() // 撤销 B2 值
      vm.undo() // 撤销 A2 值

      expect(vm.getCellValue(0, 1)).toBe('') // A2 被撤销
      expect(vm.getCellValue(1, 1)).toBe('') // B2 被撤销
      expect(vm.getCellValue(0, 0)).toBe('Product') // A1 仍然存在
      expect(vm.getCellValue(1, 0)).toBe('Price') // B1 仍然存在

      // 重做
      vm.redo()
      expect(vm.getCellValue(0, 1)).toBe('Apple') // A2 恢复
    })

    test('新操作应清除重做栈', () => {
      vm.setCellValue(0, 0, 'A')
      vm.setCellValue(0, 0, 'B')
      vm.setCellValue(0, 0, 'C')

      vm.undo() // C -> B
      vm.undo() // B -> A

      // 新操作
      vm.setCellValue(0, 0, 'D')

      // 不能重做了
      expect(vm.canRedo()).toBe(false)

      // 撤销应该回到 A
      vm.undo()
      expect(vm.getCellValue(0, 0)).toBe('A')
    })
  })

  describe('边界情况', () => {
    test('初始状态不能撤销', () => {
      expect(vm.canUndo()).toBe(false)
    })

    test('无操作时不能重做', () => {
      vm.setCellValue(0, 0, 'Test')
      expect(vm.canRedo()).toBe(false)
    })

    test('访问空单元格应返回空值', () => {
      expect(vm.getCellValue(99, 99)).toBe('')
      expect(vm.getCellStyle(99, 99)).toEqual({})
    })
  })
})

describe('ViewModel 与 History 状态同步', () => {
  test('History 状态应与 ViewModel 保持一致', () => {
    const vm = new TestViewModel(createInitialData())

    vm.setCellValue(0, 0, 'A')
    vm.setCellValue(1, 0, 'B')

    // History 位置应该在最后
    expect(vm.history.position).toBe(2) // 初始 + 2次操作

    vm.undo()
    expect(vm.history.position).toBe(1)
    expect(vm.getCellValue(1, 0)).toBe('')

    vm.redo()
    expect(vm.history.position).toBe(2)
    expect(vm.getCellValue(1, 0)).toBe('B')
  })

  test('History 栈应正确管理', () => {
    const vm = new TestViewModel(createInitialData())

    vm.setCellValue(0, 0, 'A')
    vm.setCellValue(0, 0, 'B')
    vm.undo()
    vm.setCellValue(0, 0, 'C') // 新分支

    // 栈应该是: 初始 -> A -> C (B 被丢弃)
    expect(vm.history.stack.length).toBe(3)
    expect(vm.getCellValue(0, 0)).toBe('C')
  })
})
