import Vue from 'vue'
import VueI18n from 'vue-i18n'

import zhCN from './zh-CN.json'
import enUS from './en-US.json'
import jaJP from './ja-JP.json'
import itIT from './it-IT.json'
import esES from './es-ES.json'
import frFR from './fr-FR.json'

const parser = require('accept-language-parser')

import { i18nDateTimeFormats } from './date-format'

import { getLocalStorage, setLocalStorage } from '@/utils'
import moment from 'moment'
import { Locale } from 'vant/lib'

let vantEnUS = {}
let vantZhCN = {}
let vantJaJP = {}
let vantEsES = {}

  vantEnUS = require('vant/es/locale/lang/en-US')
  vantZhCN = require('vant/es/locale/lang/zh-CN')
  vantJaJP = require('vant/es/locale/lang/ja-JP')
  vantEsES = require('vant/es/locale/lang/es-ES')

const usedEnUS = { ...enUS }
const usedZhCN = { ...zhCN }
const usedJaJP = { ...jaJP }
const usedItIT = { ...itIT }
const usedEsES = { ...esES }
const usedFrFR = { ...frFR }

Vue.use(VueI18n)

let lang = getLocalStorage('lang')

if (lang === 'en') {
  setLocalStorage('lang', 'en-US')
  lang = 'en-US'
}

if (lang === 'zh') {
  setLocalStorage('lang', 'zh-CN')
  lang = 'zh-CN'
}

// if (lang === 'ja') {
//   setLocalStorage('lang', 'ja-JP')
//   lang = 'ja-JP'
// }
//
// if (lang === 'it') {
//   setLocalStorage('lang', 'it-IT')
//   lang = 'it-IT'
// }
//
// if (lang === 'es') {
//   setLocalStorage('lang', 'es-ES')
//   lang = 'es-ES'
// }
//
// if (lang === 'fr') {
//   setLocalStorage('lang', 'fr-FR')
//   lang = 'fr-FR'
// }

if (!lang) {
  try {
    let language = ''
    let q = 1
    const dq = 0.01
    if (navigator.languages) {
      navigator.languages.forEach(x => {
        if (language != '') {
          language = language + ','
        }
        language = language + `${x};q=${q}`
        q = q - dq
        if (q < dq) {
          q = dq
        }
      })

    } else {
      // @ts-ignore
      language = navigator.language || navigator.userLanguage
    }

    lang = parser.pick(['en-US', 'zh-CN', 'ja-JP', 'it-IT', 'es-ES', 'fr-FR'], language)
    console.log(`pick language ${lang} from ${language}`)

  } catch (e) {
    console.warn('pick lang from navigator error:', e)
  }
}

if (!lang) {
  lang = 'en-US'
}


/* eslint-disable-next-line */
const env = process.env.NODE_ENV
const i18n = new VueI18n({
  locale: 'en-US',
  fallbackLocale: 'en-US',
  silentFallbackWarn: env === 'production',
  messages: {
    // 'zh-CN': usedZhCN,
    'en-US': usedEnUS,
    // 'ja-JP': usedJaJP,
    // 'it-IT': usedItIT,
    // 'es-ES': usedEsES,
    // 'fr-FR': usedFrFR,
  },
  dateTimeFormats: i18nDateTimeFormats,

})

export default i18n

export function changeLang(lang: string) {
  moment.locale(lang)

    let vantLocal
    switch (lang) {
      case 'zh-CN':
        vantLocal = vantZhCN
        break
      case 'en-US':
        vantLocal = vantEnUS
        break
      default:
        vantLocal = vantEnUS
        break
    }
    Locale.use(lang, vantLocal)
}
