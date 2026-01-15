# QT-Spreadsheet 测试方案

## 1. 测试概述

### 1.1 测试目标
- 确保电子表格核心功能的正确性和稳定性
- 验证公式引擎的计算准确性
- 保证数据操作的完整性
- 提高代码质量和可维护性

### 1.2 测试范围

| 模块分类 | 模块名称 | 优先级 | 测试类型 |
|---------|---------|-------|---------|
| 核心层 | ViewModel | P0 | 单元测试 |
| 核心层 | History | P0 | 单元测试 |
| 核心层 | Sheet | P1 | 集成测试 |
| 公式引擎 | Parser | P0 | 单元测试 |
| 公式引擎 | Evaluator | P0 | 单元测试 |
| 公式引擎 | CellReference | P0 | 单元测试 |
| 公式引擎 | DependencyGraph | P1 | 单元测试 |
| 公式引擎 | Functions | P0 | 单元测试 |
| 工具函数 | common.js | P1 | 单元测试 |
| 工具函数 | model.js | P1 | 单元测试 |
| 工具函数 | ImportExport | P1 | 单元测试 |
| 组件层 | DataValidation | P2 | 单元测试 |
| 组件层 | Filter | P2 | 单元测试 |
| 组件层 | ConditionalFormat | P2 | 单元测试 |

### 1.3 测试框架
- **测试框架**: Jest
- **断言库**: Jest 内置
- **Mock 工具**: Jest Mock
- **覆盖率工具**: Jest Coverage

---

## 2. 核心模块测试

### 2.1 ViewModel 测试

#### 2.1.1 数据管理
| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| setCellsData_single | 设置单个单元格数据 | 正确存储值和样式 |
| setCellsData_range | 批量设置单元格数据 | 所有单元格正确更新 |
| getCellData_exists | 获取存在的单元格 | 返回正确的单元格对象 |
| getCellData_empty | 获取空单元格 | 返回 null |
| deleteCells_single | 删除单个单元格 | 单元格被清空 |
| deleteCells_range | 批量删除单元格 | 范围内所有单元格被清空 |

#### 2.1.2 行列操作
| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| insertRows_single | 插入单行 | 行数增加，数据下移 |
| insertRows_multiple | 插入多行 | 正确插入指定数量的行 |
| deleteRows_single | 删除单行 | 行数减少，数据上移 |
| insertCols_single | 插入单列 | 列数增加，数据右移 |
| deleteCols_single | 删除单列 | 列数减少，数据左移 |
| rowResize | 调整行高 | 行高正确更新 |
| colResize | 调整列宽 | 列宽正确更新 |

#### 2.1.3 合并单元格
| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| mergeCell_basic | 基本合并 | 创建合并区域 |
| mergeCell_overlap | 重叠合并 | 处理重叠情况 |
| cancelMerge | 取消合并 | 恢复为独立单元格 |
| getMergedCellInfo | 获取合并信息 | 返回正确的合并区域 |

#### 2.1.4 排序功能
| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| sortByColumn_asc_number | 数字升序 | 按数值从小到大排序 |
| sortByColumn_desc_number | 数字降序 | 按数值从大到小排序 |
| sortByColumn_asc_string | 字符串升序 | 按字典序排序 |
| sortByColumn_mixed | 混合类型排序 | 正确处理混合数据 |
| sortByColumn_skipHeader | 跳过表头 | 第一行保持不变 |
| sortByColumn_emptyValues | 空值处理 | 空值排在最后 |

#### 2.1.5 查找替换
| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| searchAll_basic | 基本搜索 | 返回所有匹配单元格 |
| searchAll_caseSensitive | 大小写敏感 | 区分大小写匹配 |
| searchAll_wholeWord | 全字匹配 | 只匹配完整单词 |
| replaceCell_single | 替换单个 | 正确替换内容 |
| replaceAll | 全部替换 | 所有匹配项被替换 |

### 2.2 History 测试

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| save | 保存状态 | 状态入栈 |
| undo_single | 单次撤销 | 恢复到上一状态 |
| undo_multiple | 多次撤销 | 依次恢复 |
| redo_single | 单次重做 | 恢复到下一状态 |
| redo_after_new_action | 新操作后重做 | 清除重做栈 |
| canUndo | 检查可撤销 | 正确返回布尔值 |
| canRedo | 检查可重做 | 正确返回布尔值 |

---

## 3. 公式引擎测试

### 3.1 Parser 测试

#### 3.1.1 基本表达式
| 测试用例 | 输入 | 预期 AST |
|---------|------|---------|
| parse_number | `123` | NumberLiteral |
| parse_string | `"hello"` | StringLiteral |
| parse_boolean | `TRUE` | BooleanLiteral |
| parse_cellRef | `A1` | CellReference |
| parse_range | `A1:B5` | RangeReference |

#### 3.1.2 运算符
| 测试用例 | 输入 | 预期结果 |
|---------|------|---------|
| parse_add | `1+2` | BinaryExpression(+) |
| parse_subtract | `5-3` | BinaryExpression(-) |
| parse_multiply | `2*3` | BinaryExpression(*) |
| parse_divide | `6/2` | BinaryExpression(/) |
| parse_power | `2^3` | BinaryExpression(^) |
| parse_compare | `A1>10` | BinaryExpression(>) |
| parse_precedence | `1+2*3` | 正确的运算优先级 |
| parse_parentheses | `(1+2)*3` | 括号改变优先级 |

#### 3.1.3 函数调用
| 测试用例 | 输入 | 预期结果 |
|---------|------|---------|
| parse_function_noArgs | `NOW()` | FunctionCall |
| parse_function_singleArg | `ABS(-5)` | FunctionCall |
| parse_function_multiArgs | `SUM(1,2,3)` | FunctionCall |
| parse_function_nested | `SUM(A1,MAX(B1:B5))` | 嵌套函数调用 |

### 3.2 Evaluator 测试

#### 3.2.1 基本运算
| 测试用例 | 公式 | 预期结果 |
|---------|------|---------|
| eval_add | `=1+2` | 3 |
| eval_subtract | `=5-3` | 2 |
| eval_multiply | `=2*3` | 6 |
| eval_divide | `=6/2` | 3 |
| eval_power | `=2^3` | 8 |
| eval_complex | `=(1+2)*3-4/2` | 7 |

#### 3.2.2 比较运算
| 测试用例 | 公式 | 预期结果 |
|---------|------|---------|
| eval_equal | `=1=1` | TRUE |
| eval_notEqual | `=1<>2` | TRUE |
| eval_greater | `=5>3` | TRUE |
| eval_less | `=2<5` | TRUE |

#### 3.2.3 单元格引用
| 测试用例 | 公式 | 单元格数据 | 预期结果 |
|---------|------|-----------|---------|
| eval_cellRef | `=A1` | A1=10 | 10 |
| eval_cellRef_empty | `=A1` | A1为空 | 0 |
| eval_range_sum | `=SUM(A1:A3)` | A1=1,A2=2,A3=3 | 6 |

### 3.3 函数测试

#### 3.3.1 数学函数
| 函数 | 测试用例 | 输入 | 预期输出 |
|------|---------|------|---------|
| SUM | sum_numbers | `SUM(1,2,3)` | 6 |
| SUM | sum_range | `SUM(A1:A3)` | 范围求和 |
| AVERAGE | average_numbers | `AVERAGE(1,2,3)` | 2 |
| MAX | max_numbers | `MAX(1,5,3)` | 5 |
| MIN | min_numbers | `MIN(1,5,3)` | 1 |
| COUNT | count_numbers | `COUNT(1,"a",3)` | 2 |
| ABS | abs_negative | `ABS(-5)` | 5 |
| ROUND | round_basic | `ROUND(3.14159,2)` | 3.14 |
| SQRT | sqrt_positive | `SQRT(16)` | 4 |
| POWER | power_basic | `POWER(2,3)` | 8 |

#### 3.3.2 逻辑函数
| 函数 | 测试用例 | 输入 | 预期输出 |
|------|---------|------|---------|
| IF | if_true | `IF(1>0,"yes","no")` | "yes" |
| IF | if_false | `IF(1<0,"yes","no")` | "no" |
| AND | and_allTrue | `AND(TRUE,TRUE)` | TRUE |
| AND | and_someFalse | `AND(TRUE,FALSE)` | FALSE |
| OR | or_someTrue | `OR(TRUE,FALSE)` | TRUE |
| OR | or_allFalse | `OR(FALSE,FALSE)` | FALSE |
| NOT | not_true | `NOT(TRUE)` | FALSE |

#### 3.3.3 文本函数
| 函数 | 测试用例 | 输入 | 预期输出 |
|------|---------|------|---------|
| LEN | len_basic | `LEN("hello")` | 5 |
| UPPER | upper_basic | `UPPER("hello")` | "HELLO" |
| LOWER | lower_basic | `LOWER("HELLO")` | "hello" |
| TRIM | trim_basic | `TRIM(" hello ")` | "hello" |
| LEFT | left_basic | `LEFT("hello",2)` | "he" |
| RIGHT | right_basic | `RIGHT("hello",2)` | "lo" |
| MID | mid_basic | `MID("hello",2,3)` | "ell" |
| CONCAT | concat_basic | `CONCAT("a","b")` | "ab" |

### 3.4 CellReference 测试

| 测试用例 | 描述 | 输入 | 预期输出 |
|---------|------|------|---------|
| parse_simple | 简单引用 | "A1" | {col:0, row:0} |
| parse_absolute | 绝对引用 | "$A$1" | {col:0, row:0, absCol:true, absRow:true} |
| parse_mixed | 混合引用 | "$A1" | {col:0, row:0, absCol:true, absRow:false} |
| toA1_basic | 转A1格式 | {col:0, row:0} | "A1" |
| toA1_largeCol | 大列号 | {col:27} | "AB" |
| adjustReference | 引用调整 | 移动行 | 正确更新行号 |

### 3.5 DependencyGraph 测试

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| addDependency | 添加依赖 | 建立依赖关系 |
| getDependents | 获取依赖项 | 返回所有依赖此单元格的单元格 |
| getDependencies | 获取被依赖项 | 返回此单元格依赖的所有单元格 |
| detectCycle | 循环检测 | A1->B1->A1 应检测到循环 |
| getUpdateOrder | 计算顺序 | 返回正确的拓扑排序 |

---

## 4. 工具函数测试

### 4.1 ImportExport 测试

#### 4.1.1 CSV 导出
| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| exportCSV_basic | 基本导出 | 正确的CSV格式 |
| exportCSV_withComma | 含逗号数据 | 用引号包裹 |
| exportCSV_withQuote | 含引号数据 | 引号转义 |
| exportCSV_withNewline | 含换行数据 | 正确处理 |

#### 4.1.2 CSV 导入
| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| parseCSV_basic | 基本解析 | 正确的二维数组 |
| parseCSV_withQuotes | 引号字段 | 正确解析 |
| parseCSV_escapedQuotes | 转义引号 | 正确解析 |

### 4.2 DataValidation 测试

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| validate_number_between | 数字介于范围 | 通过/拒绝 |
| validate_integer | 整数验证 | 通过/拒绝 |
| validate_textLength | 文本长度 | 通过/拒绝 |
| validate_list | 下拉列表 | 值在列表中 |

---

## 5. 测试执行

### 5.1 命令

```bash
# 运行所有测试
npm test

# 运行特定模块测试
npm test -- --testPathPattern=ViewModel

# 生成覆盖率报告
npm test -- --coverage

# 监视模式
npm test -- --watch
```

### 5.2 覆盖率目标

| 模块 | 行覆盖率 | 分支覆盖率 | 函数覆盖率 |
|------|---------|-----------|-----------|
| 核心层 | ≥80% | ≥70% | ≥80% |
| 公式引擎 | ≥90% | ≥85% | ≥90% |
| 工具函数 | ≥80% | ≥70% | ≥80% |

---

## 6. 持续集成

### 6.1 CI 流程
1. 代码提交触发 CI
2. 安装依赖
3. 运行 ESLint 检查
4. 运行单元测试
5. 生成覆盖率报告
6. 检查覆盖率阈值

### 6.2 质量门禁
- 所有测试必须通过
- 覆盖率不能低于阈值
- 无新增 ESLint 错误
