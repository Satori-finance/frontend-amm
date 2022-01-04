<template>
  <div class="wallet-referral-link-wrapper" v-if="this.address !== null">
    <div class="wallet-referral-link-wrapper-title">{{ $t('accountWallet.walletReferralLink.title') }}</div>
    <div class="wallet-referral-link-wrapper-desc">
      {{ $t('accountWallet.walletReferralLink.referralDescription') }}
      <!-- <a href="">Learn More</a> -->
    </div>
    <div class="wallet-referral-link">
      <a :href="referralLinkAddress" target="_blank">
        {{ referralLinkAddress | ellipsisMiddle(15, 7) }}
      </a>
      <McCopy :content="referralLinkAddress"></McCopy>
    </div>
  </div>
</template>

<script lang="ts">
import { ErrorHandlerMixin } from '@/mixins'
import { namespace } from 'vuex-class'
import { Component, Mixins } from 'vue-property-decorator'
import { McCopy } from '@/components'

const wallet = namespace('wallet')

@Component({
  components: {
    McCopy,
  }
})
export default class walletReferralLink extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string | null

  get referralLinkAddress() {
    return 'https://satori.finance/?f=' + this.address
  }
}
</script>

<style scoped lang="scss">
.wallet-referral-link-wrapper {
  width: 100%;
  padding: 23px;
  background: #12182c;
  border: 1px solid #242d43;
  border-radius: 12px;

  &-title {
    font-size: 18px;
    line-height: 24px;
    color: #ffffff;
    margin-bottom: 8px;
  }

  &-desc {
    font-size: 14px;
    line-height: 20px;
    color: #999897;
    margin-bottom: 24px;
  }

  .wallet-referral-link {
    display: flex;
    align-items: center;

    a {
      font-size: 14px;
      line-height: 20px;
      color: #27a2f8;

      &:hover {
        text-decoration: underline;
      }
    }

    .mc-copy {
      margin-left: 4px;
    }
  }
}
</style>
