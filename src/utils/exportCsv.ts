import { TranslateResult } from 'vue-i18n'

interface HeadFormat {
  name: TranslateResult | string
  key: string
}

export class ExportCsv {
  data!: Array<any>
  content!: string
  isFormat!: boolean
  fileName!: string

  constructor(data?: Array<any>) {
    this.setData(data)
  }

  setData(data?: Array<any>) {
    this.data = data || []
    this.isFormat = false
  }

  setFileName(fileName: string) {
    this.fileName = fileName
  }

  format(format: Array<HeadFormat>) {
    this.content = ''

    const headList = format.map(item => item.name)
    this._addHeader(headList)

    const keyList = format.map(item => item.key)
    this._addBody(keyList)

    this.isFormat = true
    return this.content
  }

  _addHeader(headList: Array<string | TranslateResult>) {
    if (!headList) return
    headList.forEach(headName => {
      this.content += `${headName},`
    })
    this.content += '\n'
  }

  _addBody(keyList: Array<string>) {
    if (!this.data) return
    this.data.forEach(item => {
      keyList.forEach(key => {
        this.content += `${item[key]},`
      })
      this.content += '\n'
    })
  }

  exportCsv() {
    if (!this.isFormat) {
      console.error('Need format data')
      return
    }
    const blob = new Blob([`\ufeff${this.content}`], {type: "text/csv;charset=utf-8;"})
    const url = window.URL.createObjectURL(blob)
    const tagA = document.createElement('a')
    tagA.download = this.fileName || `data-${new Date().toLocaleString()}.csv`
    tagA.href = url
    document.body.appendChild(tagA)
    let event = document.createEvent('MouseEvents')
    event.initEvent('click', true, true)
    tagA.dispatchEvent(event)
    document.body.removeChild(tagA)
  }
}
