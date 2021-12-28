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

let elementLocale
let enLocale = {}
let zhLocale = {}
let jaLocale = {}
let itLocale = {}
let esLocale = {}
let frLocale = {}

  elementLocale = require('element-ui/lib/locale').default

  enLocale = require('element-ui/lib/locale/lang/en').default
  zhLocale = require('element-ui/lib/locale/lang/zh-CN').default
  jaLocale = require('element-ui/lib/locale/lang/ja').default
  itLocale = require('element-ui/lib/locale/lang/it').default
  esLocale = require('element-ui/lib/locale/lang/es').default
  frLocale = require('element-ui/lib/locale/lang/fr').default

const usedEnUS = { ...enUS, ...enLocale }
const usedZhCN = { ...zhCN, ...zhLocale }
const usedJaJP = { ...jaJP, ...jaLocale }
const usedItIT = { ...itIT, ...itLocale }
const usedEsES = { ...esES, ...esLocale }
const usedFrFR = { ...frFR, ...frLocale }

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

if (elementLocale) {
  elementLocale.i18n((key: string, value: any) => i18n.t(key, value))
}

export default i18n

export function changeLang(lang: string) {
  moment.locale(lang)
}
