export default [
  {
    key: 'cut',
    name: '剪切',
    hotkey: '⌘+X',
    icon: 'assets/icons/cut.png',
    scope: ['colHeader', 'rowHeader', 'cell'],
  },
  {
    key: 'copy',
    name: '复制',
    hotkey: '⌘+C',
    icon: 'assets/icons/copy.png',
    scope: ['colHeader', 'rowHeader', 'cell'],
  },
  {
    key: 'paste',
    name: '粘贴',
    hotkey: '⌘+V',
    icon: 'assets/icons/paste.png',
    scope: ['colHeader', 'rowHeader', 'cell'],
  },
  {
    key: 'divider',
  },
  {
    key: 'insert-up',
    name: '向上插入 $n 行',
    symbolType: 'rowHeader', // $m 通配符的类型
    icon: '',
    scope: ['rowHeader', 'cell'],
  },
  {
    key: 'insert-down',
    name: '向下插入 $n 行',
    symbolType: 'rowHeader', // $m 通配符的类型
    icon: '',
    scope: ['rowHeader', 'cell'],
  },
  {
    key: 'insert-left',
    name: '向左插入 $n 列',
    symbolType: 'colHeader', // $m 通配符的类型
    icon: '',
    scope: ['colHeader', 'cell'],
  },
  {
    key: 'insert-right',
    name: '向右插入 $n 列',
    symbolType: 'colHeader', // $m 通配符的类型
    icon: '',
    scope: ['colHeader', 'cell'],
  },
  {
    key: 'delete-row',
    name: '删除第 $m 行',
    symbolType: 'rowHeader', // $m 通配符的类型
    icon: 'assets/icons/delete.png',
    scope: ['rowHeader', 'cell'],
  },
  {
    key: 'delete-column',
    name: '删除第 $m 列',
    symbolType: 'colHeader', // $m 通配符的类型
    icon: 'assets/icons/delete.png',
    scope: ['colHeader', 'cell'],
  },
  {
    key: 'hide-row',
    name: '隐藏第 $m 行',
    symbolType: 'rowHeader', // $m 通配符的类型
    icon: '',
    scope: ['rowHeader'],
  },
  {
    key: 'hide-column',
    name: '隐藏第 $m 列',
    symbolType: 'colHeader', // $m 通配符的类型
    icon: '',
    scope: ['colHeader'],
  },
  {
    key: 'divider',
  },
  {
    key: 'clear-all',
    name: '清除全部',
    icon: '',
    scope: ['colHeader', 'rowHeader', 'cell'],
  },
  {
    key: 'clear-style',
    name: '清除样式',
    icon: '',
    scope: ['colHeader', 'rowHeader', 'cell'],
  },
  {
    key: 'insert-comment',
    name: '插入批注',
    icon: '',
    disable: true,
    scope: ['cell'],
  },
]
