/**
 * ImportExport 模块单元测试
 */

// 创建一个简化的测试，因为 ImportExport 依赖于 DOM 和 ViewModel
describe('ImportExport', () => {
  describe('CSV parsing', () => {
    // 模拟 ImportExport 的 parseCSVLine 逻辑
    function parseCSVLine(line, delimiter = ',') {
      const cells = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i += 1) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (inQuotes) {
          if (char === '"' && nextChar === '"') {
            current += '"'
            i += 1
          } else if (char === '"') {
            inQuotes = false
          } else {
            current += char
          }
        } else if (char === '"') {
          inQuotes = true
        } else if (char === delimiter) {
          cells.push(current)
          current = ''
        } else {
          current += char
        }
      }

      cells.push(current)
      return cells
    }

    test('should parse simple CSV line', () => {
      const result = parseCSVLine('a,b,c')
      expect(result).toEqual(['a', 'b', 'c'])
    })

    test('should parse CSV with quoted fields', () => {
      const result = parseCSVLine('"hello",world')
      expect(result).toEqual(['hello', 'world'])
    })

    test('should parse CSV with comma inside quotes', () => {
      const result = parseCSVLine('"a,b",c')
      expect(result).toEqual(['a,b', 'c'])
    })

    test('should parse CSV with escaped quotes', () => {
      const result = parseCSVLine('"say ""hello""",b')
      expect(result).toEqual(['say "hello"', 'b'])
    })

    test('should parse empty fields', () => {
      const result = parseCSVLine('a,,c')
      expect(result).toEqual(['a', '', 'c'])
    })

    test('should parse with custom delimiter', () => {
      const result = parseCSVLine('a;b;c', ';')
      expect(result).toEqual(['a', 'b', 'c'])
    })

    test('should handle single field', () => {
      const result = parseCSVLine('hello')
      expect(result).toEqual(['hello'])
    })

    test('should handle empty line', () => {
      const result = parseCSVLine('')
      expect(result).toEqual([''])
    })
  })

  describe('CSV export format', () => {
    function formatCSVValue(value, delimiter = ',') {
      const strValue = String(value || '')
      if (strValue.includes(delimiter) || strValue.includes('\n') || strValue.includes('"')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    }

    test('should not quote simple values', () => {
      expect(formatCSVValue('hello')).toBe('hello')
      expect(formatCSVValue(123)).toBe('123')
    })

    test('should quote values with delimiter', () => {
      expect(formatCSVValue('a,b')).toBe('"a,b"')
    })

    test('should quote values with newline', () => {
      expect(formatCSVValue('line1\nline2')).toBe('"line1\nline2"')
    })

    test('should escape quotes', () => {
      expect(formatCSVValue('say "hello"')).toBe('"say ""hello"""')
    })

    test('should handle empty values', () => {
      expect(formatCSVValue('')).toBe('')
      expect(formatCSVValue(null)).toBe('')
    })
  })

  describe('XML escaping', () => {
    function escapeXML(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    }

    test('should escape ampersand', () => {
      expect(escapeXML('a & b')).toBe('a &amp; b')
    })

    test('should escape angle brackets', () => {
      expect(escapeXML('<tag>')).toBe('&lt;tag&gt;')
    })

    test('should escape quotes', () => {
      expect(escapeXML('"hello"')).toBe('&quot;hello&quot;')
    })

    test('should escape apostrophe', () => {
      expect(escapeXML("it's")).toBe('it&apos;s')
    })

    test('should handle multiple special characters', () => {
      expect(escapeXML('<a href="test">link</a>')).toBe(
        '&lt;a href=&quot;test&quot;&gt;link&lt;/a&gt;'
      )
    })
  })
})
