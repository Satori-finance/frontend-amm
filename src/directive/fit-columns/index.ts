import Vue from 'vue'
import './style.css'
import elementResizeDetectorMaker from 'element-resize-detector'
import _ from 'lodash'

const erd = elementResizeDetectorMaker({ strategy: 'scroll', callOnAdd: true })

function adjustColumnWidth(table: HTMLElement, padding = 32) {
  const colgroup = table.querySelector('colgroup')
  if (!colgroup) {
    return
  }
  const colDefs = [...colgroup.querySelectorAll('col')]
  colDefs.forEach((col) => {
    const clsName = col.getAttribute('name')
    const cells = [
      ...table.querySelectorAll(`td.${clsName}`),
      ...table.querySelectorAll(`th.${clsName}`),
    ]
    if (cells[0]?.classList?.contains?.('leave-alone')) {
      return
    }
    const widthList = cells.map((el) => {
      return el.querySelector('.cell')?.scrollWidth || 0
    })
    const max = Math.max(...widthList)
    table.querySelectorAll(`col[name=${clsName}]`).forEach((el) => {
      el.setAttribute('width', `${max + padding}`)
    })
  })
}


Vue.directive('fit-columns', {
  update() {
  },
  bind(el, binding) {
    const debounceFunc = _.debounce(() => {
      adjustColumnWidth(el, binding.value)
    }, 200, { maxWait: 500 })
    erd.listenTo(el, () => {
      debounceFunc()
    })
  },
  inserted(el, binding) {
    el.classList.add('r-table')
    setTimeout(() => {
      adjustColumnWidth(el, binding.value)
    }, 300)
  },
  componentUpdated(el, binding) {
    el.classList.add('r-table')
    setTimeout(() => {
      adjustColumnWidth(el, binding.value)
    }, 300)
  },
  unbind() {
  },
})

