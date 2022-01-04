<template>
  <div class="legal-banner" v-if="isShowCookie">
    <div class="legal-banner-wrapper">
      <div class="legal-banner-description">
        <p>{{ $t('cookie.policyDetail') }}</p>
      </div>
      <div class="legal-banner-button">
        <div class="links">
          <div class="legal-banner-link">
            <a target="_blank" :href="$t('cookie.privacyPolicyUrl')">
              <i class="iconfont icon-details"></i>
              <span>{{ $t('cookie.privacyPolicy') }}</span>
            </a>
          </div>
          <div class="legal-banner-link">
            <a target="_blank" :href="$t('cookie.cookiePolicyUrl')">
              <i class="iconfont icon-details"></i>
              <span>{{ $t('cookie.cookiePolicy') }}</span>
            </a>
          </div>
        </div>
        <el-button class="legal-accept" size="medium" @click="accept">{{ $t('base.accept') }}</el-button>
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
export default class LegalBanner extends Vue {
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
.legal-banner {
  position: fixed;
  bottom: 16px;
  left: 0;
  right: 0;
  margin-left: 16px;
  margin-right: 16px;
  z-index: 999;
  padding: 16px 0 16px 0;
  border-radius: 12px;

  .legal-banner-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1015px;
    padding: 0 20px;
    margin: 0 auto;

    .legal-banner-description {
      max-width: 527px;
      font-size: 14px;
      line-height: 26px;

    }

    .legal-banner-button {
      margin-left: 0;
      padding-right: 0;
      width: inherit;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-left: 60px;

      .links {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex: 1 1;
        margin-right: 24px;
        font-size: 14px;
        line-height: 16px;

        .legal-banner-link {
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          margin-left: 25.5px;
          span {
            margin-left: 4px;
          }
          &:first-child {
            margin: 0;
          }

          a {
            display: flex;
            align-items: center;
          }

          .icon-details {
            font-size: 16px;
          }
        }
      }
      .legal-accept {
        background: #f7f8f9;
        border-radius: 8px;
        font-size: 16px;
        width: 107px;
        height: 40px;
      }
    }
  }
}
@media (max-width: $layout-breakpoint-medium) {
  .legal-banner {
    .legal-banner-button {
      justify-content: flex-end;
      align-items: flex-end !important;
      flex-direction: column;
      .links {
        justify-content: flex-end;
        margin-bottom: 16px;
        margin-right: 0px !important;
      }
    }
  }
}
@media (max-width: $layout-breakpoint-small) {
  .legal-banner {
    padding: 16px;
    display: flex;
    justify-content: center;
    margin-left: 16px;
    margin-right: 16px;

    .legal-banner-wrapper {
      flex-direction: column;
      width: 100%;
      padding: 0;
      .legal-banner-description {
        margin-bottom: 24px;
        padding-left: 0px;
      }
      .legal-banner-button {
        margin-left: 0px;
        padding-right: 0px;
        width: 100%;
        .links {
          font-size: 14px;
          justify-content: space-around;
          margin-bottom: 16px;
          margin-right: 0px;
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

<style scoped lang="scss">
$layout-breakpoint-medium: 897px;
$layout-breakpoint-small: 603px;
.satori-fantasy {
  .legal-banner {
    background: var(--mc-color-primary);

    .legal-banner-wrapper {
      color: var(--color-text-regular);

      .legal-accept {
        background: #f7f8f9;
        color: var(--mc-color-primary);
      }
    }
  }
}
</style>
