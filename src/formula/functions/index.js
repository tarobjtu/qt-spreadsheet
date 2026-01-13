/**
 * @description 公式函数注册表
 */

// 导入函数模块（在 registry 声明之后）
import registerMathFunctions from './math'
import registerLogicalFunctions from './logical'
import registerTextFunctions from './text'
import { FormulaError } from '../errors'

// 函数注册表
const registry = new Map()

/**
 * @description 注册函数
 * @param {string} name - 函数名（大写）
 * @param {Function} fn - 函数实现
 * @param {number} minArgs - 最小参数数量
 * @param {number} maxArgs - 最大参数数量（Infinity 表示无限制）
 */
export function registerFunction(name, fn, minArgs = 0, maxArgs = Infinity) {
  registry.set(name.toUpperCase(), {
    fn,
    minArgs,
    maxArgs,
  })
}

/**
 * @description 获取函数定义
 * @param {string} name
 * @returns {object|undefined}
 */
export function getFunction(name) {
  return registry.get(name.toUpperCase())
}

/**
 * @description 检查函数是否存在
 * @param {string} name
 * @returns {boolean}
 */
export function hasFunction(name) {
  return registry.has(name.toUpperCase())
}

/**
 * @description 调用函数
 * @param {string} name - 函数名
 * @param {Array} args - 参数列表
 * @returns {*} 函数返回值
 */
export function callFunction(name, args) {
  const func = getFunction(name)

  if (!func) {
    return FormulaError.NAME
  }

  // 验证参数数量
  if (args.length < func.minArgs) {
    return FormulaError.VALUE
  }

  if (args.length > func.maxArgs) {
    return FormulaError.VALUE
  }

  try {
    return func.fn(args)
  } catch (e) {
    return FormulaError.VALUE
  }
}

/**
 * @description 获取所有已注册的函数名
 * @returns {Array<string>}
 */
export function getAllFunctionNames() {
  return Array.from(registry.keys())
}

// 注册所有函数
registerMathFunctions(registerFunction)
registerLogicalFunctions(registerFunction)
registerTextFunctions(registerFunction)
