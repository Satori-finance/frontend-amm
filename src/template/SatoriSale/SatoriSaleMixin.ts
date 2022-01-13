import { Component, Vue, Watch } from 'vue-property-decorator'
import { Provider } from '@ethersproject/providers'
import { McbCrowdsaleAccountStorage, McbCrowdsaleStorage } from '@/utils/SatoriCrowdsale/type'
import { getCrowdsaleStorage, getMcbCrowdsaleContract, getCrowdsaleAccountStorage } from '@/utils/SatoriCrowdsale'
import { namespace } from 'vuex-class'

const wallet = namespace('wallet')

@Component
export default class SATORISaleMixin extends Vue {
  @wallet.Getter('address') address!: string | null
  @wallet.Getter('provider') provider!: Provider | null
 
  protected mcbCrowdsaleStorage: McbCrowdsaleStorage | null = null
  protected mcbCrowdsaleAccountStorage: McbCrowdsaleAccountStorage | null = null

  get roundStatus() {
    return 'subscription'
  }

  get mcbCrowdsaleContract() {
    return this.provider ? getMcbCrowdsaleContract(this.provider) : null
  }

  @Watch('mcbCrowdsaleContract', { immediate: true })
  async getMcbCrowsaleData() {
    if (!this.mcbCrowdsaleContract) {
      return
    }
    this.mcbCrowdsaleStorage = await getCrowdsaleStorage(this.mcbCrowdsaleContract)
  }

  @Watch('address', { immediate: true })
  @Watch('mcbCrowdsaleStorage', { immediate: true })
  async getCrowdsaleAccountStorage() {
    if (!this.mcbCrowdsaleContract || !this.address || !this.mcbCrowdsaleStorage) {
      return
    }
    this.mcbCrowdsaleAccountStorage = await getCrowdsaleAccountStorage(this.mcbCrowdsaleContract, this.address, this.mcbCrowdsaleStorage)
  }

  async updateData() {
    await Promise.all([
      this.getMcbCrowsaleData(),
      this.getCrowdsaleAccountStorage(),
    ])
  }
}
