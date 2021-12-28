import Vue from 'vue'
import i18n from './locales/index-mobile'
import './vant'
import router from '@/mobile/router'
import './filters'
import App from './AppMobile.vue'
import { McMTransaction, McMErrorToast, McMNotify } from '@/mobile/components'
import store from './store/index-mobile'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import './registerServiceWorker'
import vClickOutside  from 'v-click-outside'
import VueCookies from 'vue-cookies'
import './registerHook'

Vue.use(AsyncComputed)
Vue.use(McMTransaction)
Vue.use(McMErrorToast)
Vue.use(McMNotify)
Vue.use((vClickOutside))
Vue.use(VueCookies)
Vue.config.productionTip = false

document.body.classList.remove('satori-fantasy ')

window.SATORI_CONFIG?.onResolve(['oracle', 'pool', 'token']).then(() => {
  new Vue({
    router,
    i18n,
    store,
    render: h => h(App),
  }).$mount('#app')
})
