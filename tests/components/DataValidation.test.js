/**
 * DataValidation 逻辑单元测试
 * 测试验证逻辑，不测试 DOM 交互
 */

describe('DataValidation Logic', () => {
  // 模拟验证逻辑
  const OPERATORS = {
    BETWEEN: 'between',
    NOT_BETWEEN: 'notBetween',
    EQUAL: 'equal',
    NOT_EQUAL: 'notEqual',
    GREATER: 'greater',
    LESS: 'less',
    GREATER_EQUAL: 'greaterEqual',
    LESS_EQUAL: 'lessEqual',
  }

  function compareValue(value, operator, min, max) {
    switch (operator) {
      case OPERATORS.BETWEEN:
        return value >= min && value <= max
      case OPERATORS.NOT_BETWEEN:
        return value < min || value > max
      case OPERATORS.EQUAL:
        return value === min
      case OPERATORS.NOT_EQUAL:
        return value !== min
      case OPERATORS.GREATER:
        return value > min
      case OPERATORS.LESS:
        return value < min
      case OPERATORS.GREATER_EQUAL:
        return value >= min
      case OPERATORS.LESS_EQUAL:
        return value <= min
      default:
        return true
    }
  }

  function validateNumber(value, operator, min, max) {
    const num = parseFloat(value)
    if (Number.isNaN(num)) return false
    return compareValue(num, operator, parseFloat(min), parseFloat(max))
  }

  function validateInteger(value, operator, min, max) {
    const num = parseInt(value, 10)
    if (Number.isNaN(num) || num !== parseFloat(value)) return false
    return compareValue(num, operator, parseInt(min, 10), parseInt(max, 10))
  }

  function validateTextLength(value, operator, min, max) {
    const len = String(value).length
    return compareValue(len, operator, parseInt(min, 10), parseInt(max, 10))
  }

  function validateList(value, listValues) {
    if (!listValues || !Array.isArray(listValues)) return false
    return listValues.includes(String(value))
  }

  describe('compareValue', () => {
    test('should validate between', () => {
      expect(compareValue(5, OPERATORS.BETWEEN, 1, 10)).toBe(true)
      expect(compareValue(0, OPERATORS.BETWEEN, 1, 10)).toBe(false)
      expect(compareValue(11, OPERATORS.BETWEEN, 1, 10)).toBe(false)
    })

    test('should validate not between', () => {
      expect(compareValue(0, OPERATORS.NOT_BETWEEN, 1, 10)).toBe(true)
      expect(compareValue(11, OPERATORS.NOT_BETWEEN, 1, 10)).toBe(true)
      expect(compareValue(5, OPERATORS.NOT_BETWEEN, 1, 10)).toBe(false)
    })

    test('should validate equal', () => {
      expect(compareValue(5, OPERATORS.EQUAL, 5, null)).toBe(true)
      expect(compareValue(5, OPERATORS.EQUAL, 6, null)).toBe(false)
    })

    test('should validate not equal', () => {
      expect(compareValue(5, OPERATORS.NOT_EQUAL, 6, null)).toBe(true)
      expect(compareValue(5, OPERATORS.NOT_EQUAL, 5, null)).toBe(false)
    })

    test('should validate greater', () => {
      expect(compareValue(10, OPERATORS.GREATER, 5, null)).toBe(true)
      expect(compareValue(5, OPERATORS.GREATER, 10, null)).toBe(false)
      expect(compareValue(5, OPERATORS.GREATER, 5, null)).toBe(false)
    })

    test('should validate less', () => {
      expect(compareValue(5, OPERATORS.LESS, 10, null)).toBe(true)
      expect(compareValue(10, OPERATORS.LESS, 5, null)).toBe(false)
    })

    test('should validate greater or equal', () => {
      expect(compareValue(10, OPERATORS.GREATER_EQUAL, 5, null)).toBe(true)
      expect(compareValue(5, OPERATORS.GREATER_EQUAL, 5, null)).toBe(true)
      expect(compareValue(4, OPERATORS.GREATER_EQUAL, 5, null)).toBe(false)
    })

    test('should validate less or equal', () => {
      expect(compareValue(5, OPERATORS.LESS_EQUAL, 10, null)).toBe(true)
      expect(compareValue(10, OPERATORS.LESS_EQUAL, 10, null)).toBe(true)
      expect(compareValue(11, OPERATORS.LESS_EQUAL, 10, null)).toBe(false)
    })
  })

  describe('validateNumber', () => {
    test('should accept valid numbers', () => {
      expect(validateNumber('5', OPERATORS.BETWEEN, '1', '10')).toBe(true)
      expect(validateNumber('3.14', OPERATORS.BETWEEN, '1', '10')).toBe(true)
    })

    test('should reject non-numbers', () => {
      expect(validateNumber('abc', OPERATORS.BETWEEN, '1', '10')).toBe(false)
      expect(validateNumber('', OPERATORS.BETWEEN, '1', '10')).toBe(false)
    })

    test('should handle negative numbers', () => {
      expect(validateNumber('-5', OPERATORS.BETWEEN, '-10', '0')).toBe(true)
    })
  })

  describe('validateInteger', () => {
    test('should accept valid integers', () => {
      expect(validateInteger('5', OPERATORS.BETWEEN, '1', '10')).toBe(true)
      expect(validateInteger('10', OPERATORS.EQUAL, '10', null)).toBe(true)
    })

    test('should reject decimals', () => {
      expect(validateInteger('3.14', OPERATORS.BETWEEN, '1', '10')).toBe(false)
      expect(validateInteger('3.0', OPERATORS.BETWEEN, '1', '10')).toBe(true)
    })

    test('should reject non-numbers', () => {
      expect(validateInteger('abc', OPERATORS.BETWEEN, '1', '10')).toBe(false)
    })
  })

  describe('validateTextLength', () => {
    test('should validate text length', () => {
      expect(validateTextLength('hello', OPERATORS.BETWEEN, '1', '10')).toBe(true)
      expect(validateTextLength('hi', OPERATORS.EQUAL, '2', null)).toBe(true)
    })

    test('should handle empty string', () => {
      expect(validateTextLength('', OPERATORS.EQUAL, '0', null)).toBe(true)
    })

    test('should reject too long text', () => {
      expect(validateTextLength('hello world', OPERATORS.LESS, '5', null)).toBe(false)
    })
  })

  describe('validateList', () => {
    test('should accept value in list', () => {
      expect(validateList('apple', ['apple', 'banana', 'orange'])).toBe(true)
    })

    test('should reject value not in list', () => {
      expect(validateList('grape', ['apple', 'banana', 'orange'])).toBe(false)
    })

    test('should handle empty list', () => {
      expect(validateList('apple', [])).toBe(false)
    })

    test('should handle null list', () => {
      expect(validateList('apple', null)).toBe(false)
    })

    test('should convert value to string', () => {
      expect(validateList(123, ['123', 'abc'])).toBe(true)
    })
  })
})
