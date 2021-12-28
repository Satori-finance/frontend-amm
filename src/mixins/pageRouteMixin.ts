import Vue from 'vue'
import { Route, NavigationGuardNext } from 'vue-router'
import router from '@/router'

export async function validate(validator: (to: Route) => Promise<any>, to: Route, next: NavigationGuardNext) {
  validator(to).catch(() => {
    router.replace({ path: '/404' })
  })
  next()
}

export function PageRouteMixinFactory(validator: (to: Route) => Promise<any>) {
  return Vue.extend({
    beforeRouteEnter: async (to: Route, from: Route, next: NavigationGuardNext) => {
      await validate(validator, to, next)
    },
    beforeRouteUpdate: async (to: Route, from: Route, next: NavigationGuardNext) => {
      await validate(validator, to, next)
    },
  })
}
