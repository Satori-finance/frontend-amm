import { Route } from 'vue-router'

export function getMetaProperty<T>(route: Route, property: string): T | null {
  if (route.meta && route.meta.hasOwnProperty(property)) {
    return route.meta[property]
  } else {
    for (let i = 0; i < route.matched.length; i++) {
      const r = route.matched[i]
      if (r.meta.hasOwnProperty(property)) {
        return r.meta[property]
      }
    }
    return null
  }
}
