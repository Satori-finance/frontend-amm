import Vue from 'vue'
import elementResizeDetectorMaker from 'element-resize-detector'
import debounceAsync from '@seregpie/debounce-async'

Vue.directive('fixed-table', {
  inserted(el, binding, vnode) {
    const resetHeight = () => {
      const currentDomHeight = el.offsetHeight
      const headDoms = el.getElementsByTagName('thead')
      const bodyDoms = el.getElementsByTagName('tbody')
      if(headDoms.length === 0 || bodyDoms.length === 0) {
        return
      }
      const headHeight = headDoms[0].offsetHeight
      bodyDoms[0].setAttribute('height', `${currentDomHeight - headHeight}px`)
    }
    const debounce = debounceAsync(resetHeight, 200)
    const erd = elementResizeDetectorMaker()
    if (erd) {
      erd.listenTo(el, (el) => {
        debounce()
      })
    }
  }
})
