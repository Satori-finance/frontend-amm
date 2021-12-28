<template>
  <div class="referral-link">
    <div class="panel-item-header">
      <div class="title">{{ $t('base.myReferralLink') }}</div>
    </div>
    <div class="referral">
      <span class="link-address">{{ referralLinkAddress }}</span>
      <span class="tip-text-item icon-item copy-icon" @click="copyReferralLink">
                  <a v-show="!copyReferralLinkShow"><i class="el-icon-copy-document"></i></a>
                  <a v-show="copyReferralLinkShow"><i class="el-icon-circle-check"></i></a>
              </span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McLoading } from '@/components'
import { namespace } from 'vuex-class'
import { ErrorHandlerMixin } from '@/mixins'
import { copyToClipboard } from '@/utils'

const wallet = namespace('wallet')

@Component({
  components: {
    McLoading,
  },
})
export default class ReferralLink extends Mixins(ErrorHandlerMixin) {
  @wallet.Getter('address') address!: string | null

  private copyReferralLinkShow: boolean = false


  get referralLinkAddress() {
    return window.location.protocol + '//' + window.location.host + '/r?f=' + this.address
  }

  copyReferralLink() {
    copyToClipboard(this.referralLinkAddress)
    this.copyReferralLinkShow = true
    setTimeout(() => {
      this.copyReferralLinkShow = false
    }, 500)
  }
}
</script>

<style scoped lang="scss">
@import "./wallet.scss";

.referral-link {
  .referral {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
    border: 1px solid var(--mc-border-color);

    .tip-text-item {
      color: var(--mc-text-color);
    }

    .link-address {
      overflow: hidden;
      white-space: nowrap;
      color: var(--mc-text-color-white);
      margin-right: 4px;
      font-size: 16px;
      line-height: 16px;
    }

    .copy-icon {
      margin-left: 6px;

      i {
        font-size: 16px;
      }
    }
  }
}
</style>
