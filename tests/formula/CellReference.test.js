/**
 * CellReference 模块单元测试
 */
import {
  alphaToCol,
  colToAlpha,
  parseRef,
  parseRange,
  parseCellOrRange,
  refToString,
  adjustRef,
  cellKey,
  parseKey,
  expandRange,
  adjustFormulaRefs,
  toggleRefAbsolute,
} from '../../src/formula/CellReference'

describe('CellReference', () => {
  describe('alphaToCol', () => {
    test('should convert single letter to column index', () => {
      expect(alphaToCol('A')).toBe(0)
      expect(alphaToCol('B')).toBe(1)
      expect(alphaToCol('Z')).toBe(25)
    })

    test('should convert double letter to column index', () => {
      expect(alphaToCol('AA')).toBe(26)
      expect(alphaToCol('AB')).toBe(27)
      expect(alphaToCol('AZ')).toBe(51)
      expect(alphaToCol('BA')).toBe(52)
    })

    test('should be case insensitive', () => {
      expect(alphaToCol('a')).toBe(0)
      expect(alphaToCol('aa')).toBe(26)
    })

    test('should handle triple letter columns', () => {
      expect(alphaToCol('AAA')).toBe(702)
    })
  })

  describe('colToAlpha', () => {
    test('should convert column index to single letter', () => {
      expect(colToAlpha(0)).toBe('A')
      expect(colToAlpha(1)).toBe('B')
      expect(colToAlpha(25)).toBe('Z')
    })

    test('should convert column index to double letter', () => {
      expect(colToAlpha(26)).toBe('AA')
      expect(colToAlpha(27)).toBe('AB')
      expect(colToAlpha(51)).toBe('AZ')
      expect(colToAlpha(52)).toBe('BA')
    })

    test('should be inverse of alphaToCol', () => {
      for (let i = 0; i < 100; i += 1) {
        expect(alphaToCol(colToAlpha(i))).toBe(i)
      }
    })
  })

  describe('parseRef', () => {
    test('should parse simple cell reference', () => {
      const result = parseRef('A1')
      expect(result).toEqual({
        type: 'cell',
        col: 0,
        row: 0,
        colAbsolute: false,
        rowAbsolute: false,
      })
    })

    test('should parse absolute column reference', () => {
      const result = parseRef('$A1')
      expect(result.colAbsolute).toBe(true)
      expect(result.rowAbsolute).toBe(false)
    })

    test('should parse absolute row reference', () => {
      const result = parseRef('A$1')
      expect(result.colAbsolute).toBe(false)
      expect(result.rowAbsolute).toBe(true)
    })

    test('should parse fully absolute reference', () => {
      const result = parseRef('$A$1')
      expect(result.colAbsolute).toBe(true)
      expect(result.rowAbsolute).toBe(true)
    })

    test('should parse multi-digit row', () => {
      const result = parseRef('A100')
      expect(result.row).toBe(99) // 0-based
    })

    test('should parse multi-letter column', () => {
      const result = parseRef('AA1')
      expect(result.col).toBe(26)
    })

    test('should return null for invalid reference', () => {
      expect(parseRef('invalid')).toBeNull()
      expect(parseRef('1A')).toBeNull()
      expect(parseRef('')).toBeNull()
    })
  })

  describe('parseRange', () => {
    test('should parse simple range', () => {
      const result = parseRange('A1:B5')
      expect(result).toEqual({
        type: 'range',
        col: 0,
        row: 0,
        endCol: 1,
        endRow: 4,
        colAbsolute: false,
        rowAbsolute: false,
        endColAbsolute: false,
        endRowAbsolute: false,
      })
    })

    test('should handle reversed range', () => {
      const result = parseRange('B5:A1')
      expect(result.col).toBe(0)
      expect(result.row).toBe(0)
      expect(result.endCol).toBe(1)
      expect(result.endRow).toBe(4)
    })

    test('should parse absolute range', () => {
      const result = parseRange('$A$1:$B$5')
      expect(result.colAbsolute).toBe(true)
      expect(result.rowAbsolute).toBe(true)
      expect(result.endColAbsolute).toBe(true)
      expect(result.endRowAbsolute).toBe(true)
    })

    test('should return null for invalid range', () => {
      expect(parseRange('A1')).toBeNull()
      expect(parseRange('A1:B:C')).toBeNull()
    })
  })

  describe('parseCellOrRange', () => {
    test('should parse cell reference', () => {
      const result = parseCellOrRange('A1')
      expect(result.type).toBe('cell')
    })

    test('should parse range reference', () => {
      const result = parseCellOrRange('A1:B5')
      expect(result.type).toBe('range')
    })
  })

  describe('refToString', () => {
    test('should convert cell reference to string', () => {
      const ref = {
        type: 'cell',
        col: 0,
        row: 0,
        colAbsolute: false,
        rowAbsolute: false,
      }
      expect(refToString(ref)).toBe('A1')
    })

    test('should convert absolute cell reference to string', () => {
      const ref = {
        type: 'cell',
        col: 0,
        row: 0,
        colAbsolute: true,
        rowAbsolute: true,
      }
      expect(refToString(ref)).toBe('$A$1')
    })

    test('should convert range reference to string', () => {
      const ref = {
        type: 'range',
        col: 0,
        row: 0,
        endCol: 1,
        endRow: 4,
        colAbsolute: false,
        rowAbsolute: false,
        endColAbsolute: false,
        endRowAbsolute: false,
      }
      expect(refToString(ref)).toBe('A1:B5')
    })
  })

  describe('adjustRef', () => {
    test('should adjust row reference when inserting rows', () => {
      const ref = parseRef('A5')
      const adjusted = adjustRef(ref, 'row', 2, 3)
      expect(adjusted.row).toBe(7) // 4 + 3
    })

    test('should not adjust row if before insertion point', () => {
      const ref = parseRef('A1')
      const adjusted = adjustRef(ref, 'row', 5, 3)
      expect(adjusted.row).toBe(0)
    })

    test('should not adjust absolute reference', () => {
      const ref = parseRef('A$5')
      const adjusted = adjustRef(ref, 'row', 2, 3)
      expect(adjusted.row).toBe(4) // unchanged (0-based)
    })

    test('should return null if reference deleted', () => {
      const ref = parseRef('A5')
      const adjusted = adjustRef(ref, 'row', 2, -5)
      expect(adjusted).toBeNull()
    })

    test('should adjust column reference', () => {
      const ref = parseRef('C1')
      const adjusted = adjustRef(ref, 'col', 1, 2)
      expect(adjusted.col).toBe(4) // 2 + 2
    })
  })

  describe('cellKey and parseKey', () => {
    test('should create and parse cell key', () => {
      const key = cellKey(5, 10)
      expect(key).toBe('5,10')

      const parsed = parseKey(key)
      expect(parsed).toEqual({ col: 5, row: 10 })
    })
  })

  describe('expandRange', () => {
    test('should expand range to cell array', () => {
      const range = {
        col: 0,
        row: 0,
        endCol: 1,
        endRow: 1,
      }
      const cells = expandRange(range)
      expect(cells).toHaveLength(4)
      expect(cells).toContainEqual({ col: 0, row: 0 })
      expect(cells).toContainEqual({ col: 1, row: 0 })
      expect(cells).toContainEqual({ col: 0, row: 1 })
      expect(cells).toContainEqual({ col: 1, row: 1 })
    })

    test('should handle single cell range', () => {
      const range = {
        col: 0,
        row: 0,
        endCol: 0,
        endRow: 0,
      }
      const cells = expandRange(range)
      expect(cells).toHaveLength(1)
      expect(cells[0]).toEqual({ col: 0, row: 0 })
    })
  })

  describe('adjustFormulaRefs', () => {
    test('should adjust simple reference', () => {
      const result = adjustFormulaRefs('=A1', 1, 1)
      expect(result).toBe('=B2')
    })

    test('should not adjust absolute column', () => {
      const result = adjustFormulaRefs('=$A1', 1, 1)
      expect(result).toBe('=$A2')
    })

    test('should not adjust absolute row', () => {
      const result = adjustFormulaRefs('=A$1', 1, 1)
      expect(result).toBe('=B$1')
    })

    test('should not adjust fully absolute reference', () => {
      const result = adjustFormulaRefs('=$A$1', 1, 1)
      expect(result).toBe('=$A$1')
    })

    test('should adjust range reference', () => {
      const result = adjustFormulaRefs('=SUM(A1:B5)', 1, 1)
      expect(result).toBe('=SUM(B2:C6)')
    })

    test('should return #REF! for negative index', () => {
      const result = adjustFormulaRefs('=A1', -1, -1)
      expect(result).toBe('=#REF!')
    })

    test('should return formula as-is if not starting with =', () => {
      const result = adjustFormulaRefs('hello', 1, 1)
      expect(result).toBe('hello')
    })

    test('should handle empty formula', () => {
      expect(adjustFormulaRefs('', 1, 1)).toBe('')
      expect(adjustFormulaRefs(null, 1, 1)).toBe(null)
    })
  })

  describe('toggleRefAbsolute', () => {
    test('should cycle through absolute modes', () => {
      expect(toggleRefAbsolute('A1')).toBe('$A$1')
      expect(toggleRefAbsolute('$A$1')).toBe('A$1')
      expect(toggleRefAbsolute('A$1')).toBe('$A1')
      expect(toggleRefAbsolute('$A1')).toBe('A1')
    })

    test('should return unchanged for invalid reference', () => {
      expect(toggleRefAbsolute('invalid')).toBe('invalid')
    })
  })
})
