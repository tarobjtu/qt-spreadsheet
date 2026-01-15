import './findreplace.scss'

class FindReplace {
  constructor({ sheet, container, viewModel }) {
    this.sheet = sheet
    this.container = container
    this.viewModel = viewModel
    this.searchResults = []
    this.currentIndex = -1
    this.isVisible = false

    this.initElements()
    this.bindEvents()
  }

  initElements() {
    const { container } = this

    this.dialogEl = document.createElement('div')
    this.dialogEl.classList.add('qt-spreadsheet-findreplace')
    this.dialogEl.innerHTML = `
      <div class="qt-spreadsheet-findreplace-header">
        <span class="qt-spreadsheet-findreplace-title">查找和替换</span>
        <button class="qt-spreadsheet-findreplace-close">&times;</button>
      </div>
      <div class="qt-spreadsheet-findreplace-body">
        <div class="qt-spreadsheet-findreplace-row">
          <label>查找：</label>
          <input type="text" class="qt-spreadsheet-findreplace-find" placeholder="输入要查找的内容">
        </div>
        <div class="qt-spreadsheet-findreplace-row">
          <label>替换：</label>
          <input type="text" class="qt-spreadsheet-findreplace-replace" placeholder="输入要替换的内容">
        </div>
        <div class="qt-spreadsheet-findreplace-options">
          <label><input type="checkbox" class="qt-spreadsheet-findreplace-case"> 区分大小写</label>
          <label><input type="checkbox" class="qt-spreadsheet-findreplace-whole"> 全字匹配</label>
        </div>
        <div class="qt-spreadsheet-findreplace-status"></div>
      </div>
      <div class="qt-spreadsheet-findreplace-footer">
        <button class="qt-spreadsheet-findreplace-btn find-prev">上一个</button>
        <button class="qt-spreadsheet-findreplace-btn find-next">下一个</button>
        <button class="qt-spreadsheet-findreplace-btn replace-one">替换</button>
        <button class="qt-spreadsheet-findreplace-btn replace-all">全部替换</button>
      </div>
    `
    container.appendChild(this.dialogEl)

    // 获取元素引用
    this.findInput = this.dialogEl.querySelector('.qt-spreadsheet-findreplace-find')
    this.replaceInput = this.dialogEl.querySelector('.qt-spreadsheet-findreplace-replace')
    this.caseCheckbox = this.dialogEl.querySelector('.qt-spreadsheet-findreplace-case')
    this.wholeCheckbox = this.dialogEl.querySelector('.qt-spreadsheet-findreplace-whole')
    this.statusEl = this.dialogEl.querySelector('.qt-spreadsheet-findreplace-status')
    this.closeBtn = this.dialogEl.querySelector('.qt-spreadsheet-findreplace-close')
    this.findPrevBtn = this.dialogEl.querySelector('.find-prev')
    this.findNextBtn = this.dialogEl.querySelector('.find-next')
    this.replaceOneBtn = this.dialogEl.querySelector('.replace-one')
    this.replaceAllBtn = this.dialogEl.querySelector('.replace-all')
  }

  destroy() {
    this.events.forEach((ea) => {
      ea[0].removeEventListener(ea[1], ea[2])
    })
  }

  bindEvents() {
    this.events = []

    const onClose = () => this.hide()
    const onFindPrev = () => this.findPrev()
    const onFindNext = () => this.findNext()
    const onReplaceOne = () => this.replaceOne()
    const onReplaceAll = () => this.replaceAll()
    const onInputChange = () => this.onSearchChange()
    const onKeydown = (e) => this.onKeydown(e)

    this.events.push([this.closeBtn, 'click', onClose])
    this.events.push([this.findPrevBtn, 'click', onFindPrev])
    this.events.push([this.findNextBtn, 'click', onFindNext])
    this.events.push([this.replaceOneBtn, 'click', onReplaceOne])
    this.events.push([this.replaceAllBtn, 'click', onReplaceAll])
    this.events.push([this.findInput, 'input', onInputChange])
    this.events.push([this.dialogEl, 'keydown', onKeydown])

    this.closeBtn.addEventListener('click', onClose)
    this.findPrevBtn.addEventListener('click', onFindPrev)
    this.findNextBtn.addEventListener('click', onFindNext)
    this.replaceOneBtn.addEventListener('click', onReplaceOne)
    this.replaceAllBtn.addEventListener('click', onReplaceAll)
    this.findInput.addEventListener('input', onInputChange)
    this.dialogEl.addEventListener('keydown', onKeydown)
  }

  onKeydown(e) {
    if (e.key === 'Escape') {
      this.hide()
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        this.findPrev()
      } else {
        this.findNext()
      }
    }
  }

  onSearchChange() {
    this.search()
    this.updateStatus()
  }

  search() {
    const keyword = this.findInput.value
    if (!keyword) {
      this.searchResults = []
      this.currentIndex = -1
      return
    }

    const caseSensitive = this.caseCheckbox.checked
    const wholeWord = this.wholeCheckbox.checked
    this.searchResults = this.viewModel.findAll(keyword, { caseSensitive, wholeWord })
    this.currentIndex = this.searchResults.length > 0 ? 0 : -1

    if (this.currentIndex >= 0) {
      this.goToResult(this.currentIndex)
    }
  }

  findNext() {
    if (this.searchResults.length === 0) {
      this.search()
      return
    }
    this.currentIndex = (this.currentIndex + 1) % this.searchResults.length
    this.goToResult(this.currentIndex)
    this.updateStatus()
  }

  findPrev() {
    if (this.searchResults.length === 0) {
      this.search()
      return
    }
    this.currentIndex =
      (this.currentIndex - 1 + this.searchResults.length) % this.searchResults.length
    this.goToResult(this.currentIndex)
    this.updateStatus()
  }

  goToResult(index) {
    if (index < 0 || index >= this.searchResults.length) return
    const { col, row } = this.searchResults[index]
    this.sheet.selectCell(col, row, 1, 1)
  }

  replaceOne() {
    if (this.currentIndex < 0 || this.currentIndex >= this.searchResults.length) return

    const { col, row } = this.searchResults[this.currentIndex]
    const replaceValue = this.replaceInput.value
    const keyword = this.findInput.value
    const caseSensitive = this.caseCheckbox.checked

    this.viewModel.replaceCell(col, row, keyword, replaceValue, { caseSensitive })
    this.sheet.draw()

    // 重新搜索并移动到下一个
    this.search()
    this.updateStatus()
  }

  replaceAll() {
    const keyword = this.findInput.value
    const replaceValue = this.replaceInput.value
    const caseSensitive = this.caseCheckbox.checked
    const wholeWord = this.wholeCheckbox.checked

    const count = this.viewModel.replaceAll(keyword, replaceValue, { caseSensitive, wholeWord })
    this.sheet.draw()

    this.searchResults = []
    this.currentIndex = -1
    this.statusEl.textContent = `已替换 ${count} 处`
  }

  updateStatus() {
    if (this.searchResults.length === 0) {
      this.statusEl.textContent = this.findInput.value ? '未找到匹配项' : ''
    } else {
      this.statusEl.textContent = `第 ${this.currentIndex + 1} 个，共 ${
        this.searchResults.length
      } 个`
    }
  }

  show() {
    this.dialogEl.style.display = 'block'
    this.isVisible = true
    this.findInput.focus()
    this.findInput.select()
  }

  hide() {
    this.dialogEl.style.display = 'none'
    this.isVisible = false
    this.searchResults = []
    this.currentIndex = -1
  }

  toggle() {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }
}

export default FindReplace
