import Vue from 'vue'
import { InfiniteScroll } from 'element-ui'

Vue.directive('loadmore', {
  inserted(el, binding, vnode) {
    const selectWrap = el.querySelector('.el-table__body-wrapper')
    if (!selectWrap) {
      return
    }
    InfiniteScroll.inserted(el, binding, vnode)
  },
})
