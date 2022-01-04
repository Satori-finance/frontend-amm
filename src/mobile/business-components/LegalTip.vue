<template>
  <div class="legal-tip" v-show="isShowCookie">
    <div class="legal-tip-wrapper">
      <div class="legal-tip-description">
        <p>{{ $t('cookie.policyDetail') }}</p>
      </div>
      <div class="legal-tip-button">
        <div class="links">
          <div class="legal-tip-link">
            <a :href="$t('cookie.privacyPolicyUrl')">
              <i class="iconfont icon-details"></i>
              <span>{{ $t('cookie.privacyPolicy') }}</span>
            </a>
          </div>
          <div class="legal-tip-link">
            <a :href="$t('cookie.cookiePolicyUrl')">
              <i class="iconfont icon-details"></i>
              <span>{{ $t('cookie.cookiePolicy') }}</span>
            </a>
          </div>
        </div>
        <van-button class="legal-accept" size="medium" @click="accept">
          {{ $t('base.accept') }}
        </van-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { getLocalStorage, setLocalStorage } from '@/utils'
import { COOKIE_STATUS_KEY } from '@/const'
import { namespace } from 'vuex-class'
const wallet = namespace('wallet')

@Component
export default class LegalTip extends Vue {
  @wallet.Getter('address') walletAddress!: string
  private isShowCookie: boolean = false

  init() {
    const visible = getLocalStorage(COOKIE_STATUS_KEY) !== 'authorized'
    this.isShowCookie = visible
    if (!visible) {
      this.$emit('close')
    }
  }

  accept() {
    this.isShowCookie = false
    setLocalStorage(COOKIE_STATUS_KEY, 'authorized')
    this.$emit('close')
  }
}
</script>
<style lang="scss" scoped>
$layout-breakpoint-medium: 897px;
$layout-breakpoint-small: 603px;
.legal-tip {
  position: fixed;
  bottom: -1px;
  left: 0;
  right: 0;
  //margin-left: 16px;
  //margin-right: 16px;
  z-index: 999;
  padding: 16px 0 16px 0;
  background: var(--mc-color-primary);
  border-radius: 12px 12px 0 0;

  .legal-tip-wrapper {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    max-width: 1232px;
    margin: 0 auto;

    .legal-tip-description {
      flex: 1 1 0;
      padding-left: 16px;
      font-size: 14px;
      line-height: 20px;
    }

    .legal-tip-button {
      margin-left: 81px;
      padding-right: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 46px;

      .links {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex: 1 1;
        margin-right: 24px;

        .legal-tip-link {
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          margin-left: 25px;
          span {
            margin-left: 5px;
          }
          &:first-child {
            margin: 0;
          }
        }
      }
      .legal-accept {
        background: #f7f8f9;
        border-radius: 8px;
        border-color: var(--mc-text-color-white);
        color: var(--mc-text-color-dark);
        width: 107px;
        font-size: 16px;
        height: 56px;

        ::v-deep .van-button__text {
          color: var(--mc-color-primary);
        }
      }
    }
  }
}
@media (max-width: $layout-breakpoint-medium) {
  .legal-tip {
    .legal-tip-button {
      justify-content: flex-end;
      align-items: flex-end !important;
      flex-direction: column;
      .links {
        justify-content: flex-end;
        margin-bottom: 16px;
        margin-right: 0 !important;
      }
    }
  }
}
@media (max-width: $layout-breakpoint-small) {
  .legal-tip {
    padding: 16px;
    display: flex;
    justify-content: center;
    //margin-left: 16px;
    //margin-right: 16px;

    .legal-tip-wrapper {
      flex-direction: column;
      width: 100%;
      .legal-tip-description {
        margin-bottom: 24px;
        padding-left: 0;
      }
      .legal-tip-button {
        margin-left: 0;
        padding-right: 0;
        width: 100%;
        .links {
          font-size: 14px;
          justify-content: space-around;
          margin-bottom: 16px;
          margin-right: 0;
          width: 100%;
        }
        .legal-accept {
          width: 100%;
        }
      }
    }
  }
}
</style>
