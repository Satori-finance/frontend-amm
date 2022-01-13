import { Component, Prop, Vue } from 'vue-property-decorator'
import { McbCrowdsaleStorage } from '@/utils/SatoriCrowdsale/type'
import { padLeft } from '@/utils'

@Component
export default class RoundInfoMixin extends Vue {
  @Prop({ default: () => null }) crowdsaleStorage!: McbCrowdsaleStorage | null

  protected now = Date.now()
  protected timer = 0

  get availableSupply() {
    return this.crowdsaleStorage?.maxSupply || null
  }

  get subscriptionRate() {
    return this.crowdsaleStorage?.subscriptionRate.times(100) || null
  }

  get endTimeLeft() {
    if (!this.crowdsaleStorage) {
      return '--'
    }
    const minuteDuration = 1000 * 60
    const hourDuration = minuteDuration * 60
    const dayDuration = hourDuration * 24
    const milliseconds = this.crowdsaleStorage.endTime * 1000 - this.now
    const day = Math.max(Math.floor(milliseconds / dayDuration), 0)
    const hour = Math.max(Math.floor(milliseconds % dayDuration / hourDuration), 0)
    const minutes = Math.max(Math.floor(milliseconds % hourDuration / minuteDuration), 0)
    return `${padLeft(day, 2)}D ${padLeft(hour, 2)}H ${padLeft(minutes, 2)}M`
  }

  get isSubscribable() {
    return !!this.crowdsaleStorage?.isSubscribable
  }

  mounted() {
    this.timer = window.setInterval(() => {
      this.now = Date.now()
    }, 60000)
  }

  destroyed() {
    window.clearInterval(this.timer)
  }
}
