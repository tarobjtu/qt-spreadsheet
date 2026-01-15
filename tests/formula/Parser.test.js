/**
 * Parser 模块单元测试
 */
import Parser from '../../src/formula/Parser'

describe('Parser', () => {
  let parser

  beforeEach(() => {
    parser = new Parser()
  })

  describe('basic parsing', () => {
    test('should throw error if formula does not start with =', () => {
      expect(() => parser.parse('123')).toThrow('公式必须以 = 开头')
    })

    test('should parse empty formula', () => {
      const ast = parser.parse('=')
      expect(ast).toEqual({ type: 'Literal', value: '' })
    })

    test('should parse number literal', () => {
      const ast = parser.parse('=123')
      expect(ast).toEqual({ type: 'Literal', value: 123 })
    })

    test('should parse decimal number', () => {
      const ast = parser.parse('=3.14')
      expect(ast).toEqual({ type: 'Literal', value: 3.14 })
    })

    test('should parse string literal', () => {
      const ast = parser.parse('="hello"')
      expect(ast).toEqual({ type: 'Literal', value: 'hello' })
    })

    test('should parse negative number', () => {
      const ast = parser.parse('=-5')
      expect(ast).toEqual({
        type: 'UnaryOp',
        operator: '-',
        operand: { type: 'Literal', value: 5 },
      })
    })
  })

  describe('cell references', () => {
    test('should parse simple cell reference', () => {
      const ast = parser.parse('=A1')
      expect(ast.type).toBe('CellRef')
      expect(ast.ref.col).toBe(0)
      expect(ast.ref.row).toBe(0)
    })

    test('should parse absolute cell reference', () => {
      const ast = parser.parse('=$A$1')
      expect(ast.type).toBe('CellRef')
      expect(ast.ref.colAbsolute).toBe(true)
      expect(ast.ref.rowAbsolute).toBe(true)
    })

    test('should parse range reference', () => {
      const ast = parser.parse('=A1:B5')
      expect(ast.type).toBe('RangeRef')
      expect(ast.ref.col).toBe(0)
      expect(ast.ref.row).toBe(0)
      expect(ast.ref.endCol).toBe(1)
      expect(ast.ref.endRow).toBe(4)
    })
  })

  describe('arithmetic operators', () => {
    test('should parse addition', () => {
      const ast = parser.parse('=1+2')
      expect(ast).toEqual({
        type: 'BinaryOp',
        operator: '+',
        left: { type: 'Literal', value: 1 },
        right: { type: 'Literal', value: 2 },
      })
    })

    test('should parse subtraction', () => {
      const ast = parser.parse('=5-3')
      expect(ast.operator).toBe('-')
    })

    test('should parse multiplication', () => {
      const ast = parser.parse('=2*3')
      expect(ast.operator).toBe('*')
    })

    test('should parse division', () => {
      const ast = parser.parse('=6/2')
      expect(ast.operator).toBe('/')
    })

    test('should parse power', () => {
      const ast = parser.parse('=2^3')
      expect(ast.operator).toBe('^')
    })
  })

  describe('operator precedence', () => {
    test('should handle multiplication before addition', () => {
      const ast = parser.parse('=1+2*3')
      // Should be: 1 + (2 * 3)
      expect(ast.operator).toBe('+')
      expect(ast.left.value).toBe(1)
      expect(ast.right.operator).toBe('*')
    })

    test('should handle parentheses', () => {
      const ast = parser.parse('=(1+2)*3')
      // Should be: (1 + 2) * 3
      expect(ast.operator).toBe('*')
      expect(ast.left.operator).toBe('+')
      expect(ast.right.value).toBe(3)
    })

    test('should handle power precedence (right associative)', () => {
      const ast = parser.parse('=2^3^2')
      // Should be: 2 ^ (3 ^ 2) due to right associativity
      expect(ast.operator).toBe('^')
      expect(ast.left.value).toBe(2)
      expect(ast.right.operator).toBe('^')
    })
  })

  describe('comparison operators', () => {
    test('should parse equal', () => {
      const ast = parser.parse('=A1=10')
      expect(ast.operator).toBe('=')
    })

    test('should parse not equal', () => {
      const ast = parser.parse('=A1<>10')
      expect(ast.operator).toBe('<>')
    })

    test('should parse less than', () => {
      const ast = parser.parse('=A1<10')
      expect(ast.operator).toBe('<')
    })

    test('should parse greater than', () => {
      const ast = parser.parse('=A1>10')
      expect(ast.operator).toBe('>')
    })

    test('should parse less or equal', () => {
      const ast = parser.parse('=A1<=10')
      expect(ast.operator).toBe('<=')
    })

    test('should parse greater or equal', () => {
      const ast = parser.parse('=A1>=10')
      expect(ast.operator).toBe('>=')
    })
  })

  describe('string concatenation', () => {
    test('should parse concatenation', () => {
      const ast = parser.parse('="a"&"b"')
      expect(ast.operator).toBe('&')
    })
  })

  describe('function calls', () => {
    test('should parse function with no args', () => {
      const ast = parser.parse('=NOW()')
      expect(ast).toEqual({
        type: 'FunctionCall',
        name: 'NOW',
        args: [],
      })
    })

    test('should parse function with single arg', () => {
      const ast = parser.parse('=ABS(-5)')
      expect(ast.type).toBe('FunctionCall')
      expect(ast.name).toBe('ABS')
      expect(ast.args).toHaveLength(1)
    })

    test('should parse function with multiple args', () => {
      const ast = parser.parse('=SUM(1,2,3)')
      expect(ast.type).toBe('FunctionCall')
      expect(ast.name).toBe('SUM')
      expect(ast.args).toHaveLength(3)
    })

    test('should parse function with range arg', () => {
      const ast = parser.parse('=SUM(A1:A10)')
      expect(ast.type).toBe('FunctionCall')
      expect(ast.args[0].type).toBe('RangeRef')
    })

    test('should parse nested function calls', () => {
      const ast = parser.parse('=SUM(A1,MAX(B1:B5))')
      expect(ast.type).toBe('FunctionCall')
      expect(ast.name).toBe('SUM')
      expect(ast.args[1].type).toBe('FunctionCall')
      expect(ast.args[1].name).toBe('MAX')
    })

    test('should parse IF function', () => {
      const ast = parser.parse('=IF(A1>0,"yes","no")')
      expect(ast.type).toBe('FunctionCall')
      expect(ast.name).toBe('IF')
      expect(ast.args).toHaveLength(3)
    })
  })

  describe('complex expressions', () => {
    test('should parse complex arithmetic', () => {
      const ast = parser.parse('=(1+2)*3-4/2')
      expect(ast.operator).toBe('-')
    })

    test('should parse formula with cell refs and functions', () => {
      const ast = parser.parse('=SUM(A1:A10)/COUNT(A1:A10)')
      expect(ast.operator).toBe('/')
      expect(ast.left.type).toBe('FunctionCall')
      expect(ast.right.type).toBe('FunctionCall')
    })

    test('should handle whitespace', () => {
      const ast = parser.parse('= 1 + 2 ')
      expect(ast.operator).toBe('+')
    })
  })

  describe('error handling', () => {
    test('should throw error for missing closing paren', () => {
      expect(() => parser.parse('=(1+2')).toThrow()
    })

    test('should handle double plus as unary positive', () => {
      // =1++2 is valid and parses as 1 + (+2)
      const ast = parser.parse('=1++2')
      expect(ast.operator).toBe('+')
    })

    test('should throw error for invalid cell reference', () => {
      // This depends on implementation - adjust as needed
      expect(() => parser.parse('=123ABC')).toThrow()
    })
  })
})
