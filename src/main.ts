import Vue from 'vue'
import ElementUI from 'element-ui'
import i18n from './locales/index-pc'
import router from './router'
import './filters'
import './directive'
import './registerHook'

import App from './App.vue'
import store from './store'
import { McTransaction } from '@/components'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import './registerServiceWorker'
import VueCookies from 'vue-cookies'
import vClickOutside from 'v-click-outside'

Vue.use(ElementUI)
Vue.use(McTransaction)
Vue.use(AsyncComputed)
Vue.use(VueCookies)
Vue.use(vClickOutside)
Vue.config.productionTip = false

window.SATORI_CONFIG?.onResolve(['oracle', 'pool', 'token']).then(() => {
  new Vue({
    router,
    i18n,
    store,
    render: h => h(App),
  }).$mount('#app')
})
