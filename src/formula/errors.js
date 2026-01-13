/**
 * @description 公式错误类型定义
 */

export const FormulaError = {
  REF: '#REF!', // 无效的单元格引用
  VALUE: '#VALUE!', // 参数类型错误
  DIV0: '#DIV/0!', // 除零错误
  NAME: '#NAME?', // 未知函数名
  CIRC: '#CIRC!', // 循环引用
  NUM: '#NUM!', // 无效的数值
  NULL: '#NULL!', // 空引用
}

/**
 * @description 检查值是否为公式错误
 * @param {*} value
 * @returns {boolean}
 */
export function isError(value) {
  return typeof value === 'string' && value.startsWith('#') && value.endsWith('!')
}

/**
 * @description 获取错误描述
 * @param {string} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  const messages = {
    [FormulaError.REF]: '无效的单元格引用',
    [FormulaError.VALUE]: '参数类型错误',
    [FormulaError.DIV0]: '除数不能为零',
    [FormulaError.NAME]: '未知的函数名称',
    [FormulaError.CIRC]: '检测到循环引用',
    [FormulaError.NUM]: '无效的数值',
    [FormulaError.NULL]: '空引用错误',
  }
  return messages[error] || '未知错误'
}
