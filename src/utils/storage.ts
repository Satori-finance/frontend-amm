import Vue from 'vue'
import 'vue-cookies'

/**
 *
 * @param key string
 * @param parse
 * @returns {any}
 */
export const getLocalStorage = (key: string, parse: boolean = true) => {
  let value: any = window.localStorage.getItem(key)
  try {
    if (parse) {
      value = JSON.parse(value)
    }
  } catch (e) {
    // normally we will never get here
    console.warn(
      'getLocalStorage parse error, return plain string instead, ',
      e,
      key,
      value,
    )
  }
  return value
}

/**
 * @param key {string}
 * @param value {any} a value that can be stringified, the value would be stored as stringified
 */
export const setLocalStorage = (key: string, value: any) => {
  let valueString: any = null
  try {
    valueString = JSON.stringify(value)
    window.localStorage.setItem(key, valueString)
  } catch (e) {
    console.warn('setLocalStorage stringify value error, ', e, key, value)
  }
}

export const clearLocalStorage = (key: string) => {
  window.localStorage.removeItem(key)
}

/**
 *
 * @param key string
 * @returns {string}
 */
export const getCookieStorage = (key: string) => {
  return Vue.$cookies.get(key)
}

/**
 * @param key {string}
 * @param value {string}
 */
export const setCookieStorage = (key: string, value: string) => {
  Vue.$cookies.set(key, value, '1d', undefined, getCookieDomain())
}

export const clearCookieStorage = (key: string) => {
  Vue.$cookies.remove(key, undefined, getCookieDomain())
}

function getCookieDomain() {
  let host = location.hostname
  const ip = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/
  if (ip.test(host) || host === 'localhost') return host
  const regex = /([^]*).*/
  const match = host.match(regex)
  if (typeof match !== 'undefined' && null !== match) host = match[1]
  if (typeof host !== 'undefined' && null !== host) {
    const strAry = host.split('.')
    if (strAry.length > 1) {
      host = strAry[strAry.length - 2] + '.' + strAry[strAry.length - 1]
    }
  }
  return '.' + host
}
