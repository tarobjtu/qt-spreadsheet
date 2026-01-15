/**
 * @description 电子表格导入导出工具
 * 支持 CSV 和 Excel (XLSX) 格式
 */

class ImportExport {
  constructor(viewModel) {
    this.viewModel = viewModel
  }

  // ==================== CSV 导出 ====================

  /**
   * @description 导出为 CSV 格式
   * @param {Object} options - 导出选项
   * @param {string} options.filename - 文件名
   * @param {string} options.delimiter - 分隔符，默认逗号
   * @param {boolean} options.includeHeaders - 是否包含表头
   * @returns {string} CSV 字符串
   */
  exportToCSV(options = {}) {
    const { filename = 'spreadsheet.csv', delimiter = ',' } = options
    const { data } = this.viewModel.sheetData

    const rows = []
    const rowCount = data.length
    let maxCol = 0

    // 找到最大列数
    for (let r = 0; r < rowCount; r += 1) {
      if (data[r]) {
        maxCol = Math.max(maxCol, data[r].length)
      }
    }

    // 构建 CSV 内容
    for (let r = 0; r < rowCount; r += 1) {
      const rowData = []
      for (let c = 0; c < maxCol; c += 1) {
        const cell = data[r] && data[r][c]
        let value = cell ? cell.value || '' : ''

        // 处理特殊字符：如果包含分隔符、换行或引号，需要用引号包裹
        if (typeof value === 'string') {
          if (value.includes(delimiter) || value.includes('\n') || value.includes('"')) {
            value = `"${value.replace(/"/g, '""')}"`
          }
        }

        rowData.push(value)
      }
      rows.push(rowData.join(delimiter))
    }

    const csvContent = rows.join('\n')
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;')
    return csvContent
  }

  // ==================== CSV 导入 ====================

  /**
   * @description 从 CSV 导入数据
   * @param {string} csvContent - CSV 内容
   * @param {Object} options - 导入选项
   * @param {string} options.delimiter - 分隔符，默认逗号
   * @returns {Array} 解析后的二维数组
   */
  parseCSV(csvContent, options = {}) {
    const { delimiter = ',' } = options
    const lines = csvContent.split(/\r?\n/)
    const data = []

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]
      if (line.trim() !== '') {
        const row = this.parseCSVLine(line, delimiter)
        data.push(row)
      }
    }

    return data
  }

  /**
   * @description 解析单行 CSV（处理引号内的分隔符和换行）
   * @param {string} line - CSV 行
   * @param {string} delimiter - 分隔符
   * @returns {Array} 单元格值数组
   */
  // eslint-disable-next-line class-methods-use-this
  parseCSVLine(line, delimiter) {
    const cells = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          // 转义的引号
          current += '"'
          i += 1
        } else if (char === '"') {
          // 引号结束
          inQuotes = false
        } else {
          current += char
        }
      } else if (char === '"') {
        // 引号开始
        inQuotes = true
      } else if (char === delimiter) {
        // 分隔符
        cells.push(current)
        current = ''
      } else {
        current += char
      }
    }

    // 添加最后一个单元格
    cells.push(current)
    return cells
  }

  /**
   * @description 从 CSV 文件导入
   * @param {File} file - 文件对象
   * @param {Object} options - 导入选项
   * @returns {Promise} 导入结果
   */
  importFromCSV(file, options = {}) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const csvContent = e.target.result
          const parsedData = this.parseCSV(csvContent, options)
          this.applyImportedData(parsedData)
          resolve(parsedData)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // ==================== Excel 导出 ====================

  /**
   * @description 导出为 Excel (XLSX) 格式
   * 注意：完整的 XLSX 支持需要使用 SheetJS 库
   * 这里提供一个简单的 XML 格式的 Excel 导出
   * @param {Object} options - 导出选项
   * @param {string} options.filename - 文件名
   */
  exportToExcel(options = {}) {
    const { filename = 'spreadsheet.xlsx' } = options
    const { data } = this.viewModel.sheetData

    // 使用 Excel XML 格式 (兼容性更好)
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<?mso-application progid="Excel.Sheet"?>\n'
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n'
    xml += '  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n'
    xml += '  <Worksheet ss:Name="Sheet1">\n'
    xml += '    <Table>\n'

    const rowCount = data.length
    let maxCol = 0

    // 找到最大列数
    for (let r = 0; r < rowCount; r += 1) {
      if (data[r]) {
        maxCol = Math.max(maxCol, data[r].length)
      }
    }

    // 生成行数据
    for (let r = 0; r < rowCount; r += 1) {
      xml += '      <Row>\n'
      for (let c = 0; c < maxCol; c += 1) {
        const cell = data[r] && data[r][c]
        const value = cell ? cell.value || '' : ''
        const escapedValue = this.escapeXML(String(value))

        // 判断数据类型
        const numValue = parseFloat(value)
        const isNumber = !Number.isNaN(numValue) && value !== ''

        if (isNumber) {
          xml += `        <Cell><Data ss:Type="Number">${numValue}</Data></Cell>\n`
        } else {
          xml += `        <Cell><Data ss:Type="String">${escapedValue}</Data></Cell>\n`
        }
      }
      xml += '      </Row>\n'
    }

    xml += '    </Table>\n'
    xml += '  </Worksheet>\n'
    xml += '</Workbook>'

    // 使用 .xls 扩展名以兼容 XML 格式
    const actualFilename = filename.replace(/\.xlsx$/i, '.xls')
    this.downloadFile(xml, actualFilename, 'application/vnd.ms-excel')
    return xml
  }

  /**
   * @description 转义 XML 特殊字符
   * @param {string} str - 原始字符串
   * @returns {string} 转义后的字符串
   */
  // eslint-disable-next-line class-methods-use-this
  escapeXML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  // ==================== Excel 导入 ====================

  /**
   * @description 从 Excel 文件导入 (支持简单的 XML Excel 格式)
   * @param {File} file - 文件对象
   * @returns {Promise} 导入结果
   */
  importFromExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target.result

          // 检查是否是 XML Excel 格式
          if (content.includes('urn:schemas-microsoft-com:office:spreadsheet')) {
            const parsedData = this.parseExcelXML(content)
            this.applyImportedData(parsedData)
            resolve(parsedData)
          } else {
            // 尝试作为 CSV 解析
            const parsedData = this.parseCSV(content)
            this.applyImportedData(parsedData)
            resolve(parsedData)
          }
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * @description 解析 Excel XML 格式
   * @param {string} xmlContent - XML 内容
   * @returns {Array} 解析后的二维数组
   */
  // eslint-disable-next-line class-methods-use-this
  parseExcelXML(xmlContent) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')
    const rows = doc.querySelectorAll('Row')
    const data = []

    rows.forEach((row) => {
      const cells = row.querySelectorAll('Cell')
      const rowData = []

      cells.forEach((cell) => {
        const dataEl = cell.querySelector('Data')
        const value = dataEl ? dataEl.textContent : ''
        rowData.push(value)
      })

      data.push(rowData)
    })

    return data
  }

  // ==================== 通用方法 ====================

  /**
   * @description 将导入的数据应用到电子表格
   * @param {Array} parsedData - 解析后的二维数组
   */
  applyImportedData(parsedData) {
    const { data } = this.viewModel.sheetData

    // 清空现有数据并填入新数据
    for (let r = 0; r < parsedData.length; r += 1) {
      if (!data[r]) {
        data[r] = []
      }
      for (let c = 0; c < parsedData[r].length; c += 1) {
        if (!data[r][c]) {
          data[r][c] = {}
        }
        data[r][c].value = parsedData[r][c]
      }
    }

    // 保存到历史记录
    this.viewModel.history.save(this.viewModel.sheetData)
  }

  /**
   * @description 下载文件
   * @param {string} content - 文件内容
   * @param {string} filename - 文件名
   * @param {string} mimeType - MIME 类型
   */
  // eslint-disable-next-line class-methods-use-this
  downloadFile(content, filename, mimeType) {
    const blob = new Blob(['\ufeff' + content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  /**
   * @description 打开文件选择对话框
   * @param {string} accept - 接受的文件类型
   * @returns {Promise<File>} 选中的文件
   */
  // eslint-disable-next-line class-methods-use-this
  openFileDialog(accept = '.csv,.xls,.xlsx') {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.style.display = 'none'

      input.onchange = (e) => {
        const file = e.target.files[0]
        document.body.removeChild(input)
        resolve(file)
      }

      document.body.appendChild(input)
      input.click()
    })
  }
}

export default ImportExport
