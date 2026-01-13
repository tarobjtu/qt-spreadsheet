/**
 * @description 日期和时间函数
 * TODAY, NOW, DATE, TIME, YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, WEEKDAY, DATEDIF
 */

import { FormulaError } from '../errors'

/**
 * @description Excel 日期序列号基准日期 (1900-01-01 = 1)
 * 注意: Excel 有 1900 年闰年 bug，这里不模拟
 */
const EXCEL_EPOCH = new Date(1899, 11, 30) // 1899-12-30

/**
 * @description 将 Date 对象转换为 Excel 日期序列号
 */
function dateToSerial(date) {
  const diff = date.getTime() - EXCEL_EPOCH.getTime()
  return Math.floor(diff / (24 * 60 * 60 * 1000))
}

/**
 * @description 将 Excel 日期序列号转换为 Date 对象
 */
function serialToDate(serial) {
  const date = new Date(EXCEL_EPOCH.getTime() + serial * 24 * 60 * 60 * 1000)
  return date
}

/**
 * @description 解析日期参数
 */
function parseDate(value) {
  if (value instanceof Date) {
    return value
  }
  if (typeof value === 'number') {
    return serialToDate(value)
  }
  if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  return null
}

/**
 * @description 注册所有日期时间函数
 * @param {Function} registerFunction - 注册函数的方法
 */
export default function registerDateTimeFunctions(registerFunction) {
  // TODAY - 当前日期
  registerFunction(
    'TODAY',
    () => {
      const now = new Date()
      return dateToSerial(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    },
    0,
    0
  )

  // NOW - 当前日期和时间
  registerFunction(
    'NOW',
    () => {
      const now = new Date()
      const serial = dateToSerial(now)
      const timeDecimal =
        (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / (24 * 3600)
      return serial + timeDecimal
    },
    0,
    0
  )

  // DATE - 创建日期
  registerFunction(
    'DATE',
    (args) => {
      const [year, month, day] = args
      if (typeof year !== 'number' || typeof month !== 'number' || typeof day !== 'number') {
        return FormulaError.VALUE
      }
      // month 是 1-12，Date 构造函数需要 0-11
      const date = new Date(year, month - 1, day)
      return dateToSerial(date)
    },
    3,
    3
  )

  // TIME - 创建时间（返回小数）
  registerFunction(
    'TIME',
    (args) => {
      const [hour, minute, second] = args
      if (typeof hour !== 'number' || typeof minute !== 'number' || typeof second !== 'number') {
        return FormulaError.VALUE
      }
      return (hour * 3600 + minute * 60 + second) / (24 * 3600)
    },
    3,
    3
  )

  // YEAR - 获取年份
  registerFunction(
    'YEAR',
    (args) => {
      const [dateValue] = args
      const date = parseDate(dateValue)
      if (!date) return FormulaError.VALUE
      return date.getFullYear()
    },
    1,
    1
  )

  // MONTH - 获取月份
  registerFunction(
    'MONTH',
    (args) => {
      const [dateValue] = args
      const date = parseDate(dateValue)
      if (!date) return FormulaError.VALUE
      return date.getMonth() + 1
    },
    1,
    1
  )

  // DAY - 获取日期
  registerFunction(
    'DAY',
    (args) => {
      const [dateValue] = args
      const date = parseDate(dateValue)
      if (!date) return FormulaError.VALUE
      return date.getDate()
    },
    1,
    1
  )

  // HOUR - 获取小时
  registerFunction(
    'HOUR',
    (args) => {
      const [timeValue] = args
      if (typeof timeValue === 'number') {
        const timeDecimal = timeValue % 1
        return Math.floor(timeDecimal * 24)
      }
      const date = parseDate(timeValue)
      if (!date) return FormulaError.VALUE
      return date.getHours()
    },
    1,
    1
  )

  // MINUTE - 获取分钟
  registerFunction(
    'MINUTE',
    (args) => {
      const [timeValue] = args
      if (typeof timeValue === 'number') {
        const timeDecimal = timeValue % 1
        const totalMinutes = timeDecimal * 24 * 60
        return Math.floor(totalMinutes % 60)
      }
      const date = parseDate(timeValue)
      if (!date) return FormulaError.VALUE
      return date.getMinutes()
    },
    1,
    1
  )

  // SECOND - 获取秒
  registerFunction(
    'SECOND',
    (args) => {
      const [timeValue] = args
      if (typeof timeValue === 'number') {
        const timeDecimal = timeValue % 1
        const totalSeconds = timeDecimal * 24 * 60 * 60
        return Math.floor(totalSeconds % 60)
      }
      const date = parseDate(timeValue)
      if (!date) return FormulaError.VALUE
      return date.getSeconds()
    },
    1,
    1
  )

  // WEEKDAY - 获取星期几
  registerFunction(
    'WEEKDAY',
    (args) => {
      const [dateValue, returnType = 1] = args
      const date = parseDate(dateValue)
      if (!date) return FormulaError.VALUE

      const day = date.getDay() // 0 = Sunday

      // returnType:
      // 1: 1 (Sunday) - 7 (Saturday)
      // 2: 1 (Monday) - 7 (Sunday)
      // 3: 0 (Monday) - 6 (Sunday)
      if (returnType === 1) {
        return day + 1
      }
      if (returnType === 2) {
        return day === 0 ? 7 : day
      }
      if (returnType === 3) {
        return day === 0 ? 6 : day - 1
      }
      return FormulaError.VALUE
    },
    1,
    2
  )

  // WEEKNUM - 获取周数
  registerFunction(
    'WEEKNUM',
    (args) => {
      const [dateValue] = args
      const date = parseDate(dateValue)
      if (!date) return FormulaError.VALUE

      const startOfYear = new Date(date.getFullYear(), 0, 1)
      const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
      return Math.ceil((days + startOfYear.getDay() + 1) / 7)
    },
    1,
    2
  )

  // EOMONTH - 月末日期
  registerFunction(
    'EOMONTH',
    (args) => {
      const [startDate, months] = args
      const date = parseDate(startDate)
      if (!date || typeof months !== 'number') return FormulaError.VALUE

      const newDate = new Date(date.getFullYear(), date.getMonth() + months + 1, 0)
      return dateToSerial(newDate)
    },
    2,
    2
  )

  // EDATE - 增加月份后的日期
  registerFunction(
    'EDATE',
    (args) => {
      const [startDate, months] = args
      const date = parseDate(startDate)
      if (!date || typeof months !== 'number') return FormulaError.VALUE

      const newDate = new Date(date.getFullYear(), date.getMonth() + months, date.getDate())
      return dateToSerial(newDate)
    },
    2,
    2
  )

  // DATEDIF - 计算日期差
  registerFunction(
    'DATEDIF',
    (args) => {
      const [startDate, endDate, unit] = args
      const start = parseDate(startDate)
      const end = parseDate(endDate)

      if (!start || !end) return FormulaError.VALUE
      if (start > end) return FormulaError.NUM

      const unitStr = String(unit).toUpperCase()

      if (unitStr === 'D') {
        return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      }
      if (unitStr === 'M') {
        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      }
      if (unitStr === 'Y') {
        return end.getFullYear() - start.getFullYear()
      }
      if (unitStr === 'MD') {
        // 忽略月和年的天数差
        return end.getDate() - start.getDate()
      }
      if (unitStr === 'YM') {
        // 忽略年的月数差
        let months = end.getMonth() - start.getMonth()
        if (months < 0) months += 12
        return months
      }
      if (unitStr === 'YD') {
        // 忽略年的天数差
        const startThisYear = new Date(end.getFullYear(), start.getMonth(), start.getDate())
        if (startThisYear > end) {
          startThisYear.setFullYear(startThisYear.getFullYear() - 1)
        }
        return Math.floor((end.getTime() - startThisYear.getTime()) / (24 * 60 * 60 * 1000))
      }

      return FormulaError.VALUE
    },
    3,
    3
  )

  // DAYS - 计算两日期间的天数
  registerFunction(
    'DAYS',
    (args) => {
      const [endDate, startDate] = args
      const start = parseDate(startDate)
      const end = parseDate(endDate)

      if (!start || !end) return FormulaError.VALUE
      return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    },
    2,
    2
  )

  // NETWORKDAYS - 工作日数（简化版，不考虑假期）
  registerFunction(
    'NETWORKDAYS',
    (args) => {
      const [startDate, endDate] = args
      const start = parseDate(startDate)
      const end = parseDate(endDate)

      if (!start || !end) return FormulaError.VALUE

      let count = 0
      const current = new Date(start)

      while (current <= end) {
        const day = current.getDay()
        if (day !== 0 && day !== 6) {
          count += 1
        }
        current.setDate(current.getDate() + 1)
      }

      return count
    },
    2,
    3
  )
}
