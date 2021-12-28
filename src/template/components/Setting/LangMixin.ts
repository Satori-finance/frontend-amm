import { Vue, Component } from 'vue-property-decorator'

@Component
export default class LangMixin extends Vue {
  get lang() {
    return this.$i18n.locale
  }

  get langMessages() {
    return this.$i18n.messages
  }

  get selectedLang() {
    return this.$i18n.messages[this.lang]
  }
}
