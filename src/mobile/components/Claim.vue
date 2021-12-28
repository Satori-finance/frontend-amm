<template>
  <div class="claim scroll-container">
    <HeaderBar></HeaderBar>
    <div class="container">
      <div class="bg">
        <img src="@/assets/img/satori-bg.png" alt="">
      </div>
      <div class="header-title">{{ $t('footer.claim') }}</div>
      <div class="claim-box">
        <div class="img-box">
          <div class="label">{{ $t('base.claimable') }}</div>
          <div class="value">
            {{ claimable | bigNumberFormatterTruncateByPrecision(9, 1, 2) }}
            <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
          </div>
        </div>
        <div class="value-box">
          <div class="left">
            <div class="value">
              <template v-if="!isConnectedWallet">--</template>
              <template v-else>
                {{ allocation | bigNumberFormatter}}
                <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
              </template>
            </div>
            <div class="label">{{ $t('mcbSale.allocation') }}</div>
          </div>
          <div class="split-line"></div>
          <div class="right">
            <div class="value">
              <template v-if="!isConnectedWallet">--</template>
              <template v-else>
                {{ claimedBalance | bigNumberFormatter}}
                <img :src="require('@/assets/img/tokens/SATORI.svg')" alt="">
              </template>
            </div>
            <div class="label">{{ $t('mcbSale.vested') }}</div>
          </div>
        </div>
        <div class="button-box">
          <McMStateButton :disabled="disable" :button-class="['round', 'large']"
                          :state.sync="claimState" @click="claim">
            {{ $t('base.claim') }}
          </McMStateButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins } from 'vue-property-decorator'
import HeaderBar from '@/mobile/template/Header/HeaderBar.vue'
import "@/mobile/assets/img/mobileClaim.png"
import SatoriSerialMixin from '@/template/Wallet/SatoriSerialMixin'
import { McMStateButton } from '@/mobile/components'

@Component({
  components: {
    HeaderBar,
    McMStateButton
  },
})
export default class Claim extends Mixins(SatoriSerialMixin){


}
</script>

<style scoped lang='scss'>
.claim {
  height: 100%;

  .container {
    width: 100%;
    padding: 0 16px;

    .bg {
      position: absolute;
      width: 800px;
      left: calc(50% - 352px);
      filter: blur(100px);
      z-index: 0;
      pointer-events: none;
    }

    .header-title {
      font-size: 18px;
      line-height: 24px;
      margin: 16px 0;
    }

    .claim-box {
      position: relative;

      .img-box {
        z-index: 3;
        position: relative;
        background-image: url("../assets/img/mobileClaim.png");
        background-size: 100%;
        height: 112px;
        width: 100%;
        padding: 24px;
        border-radius: var(--mc-border-radius-l);

        .label {
          font-size: 14px;
          color: var(--mc-text-color);
          line-height: 20px;
        }

        .value {
          margin-top: 4px;
          font-size: 32px;
          color: var(--mc-text-color-white);
          font-weight: 700;
          display: inline-flex;
          align-items: center;

          img {
            height: 32px;
            width: 32px;
            margin-left: 4px;
          }
        }
      }

      .value-box {
        z-index: 2;
        top: -24px;
        position: relative;
        height: 120px;
        width: 100%;
        background: var(--mc-background-color-dark);
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);
        display: flex;
        justify-content: flex-start;
        padding: 48px 24px 24px 24px;

        .left {
          flex: 0.5;
        }

        .right {
          flex: 0.4;
        }

        .split-line {
          width: 1px;
          background: var(--mc-border-color);
          height: 100%;
          margin: 0 16px;
        }

        .label {
          color: var(--mc-text-color);
          font-size: 14px;
          line-height: 20px;
        }

        .value {
          display: inline-flex;
          align-items: center;
          font-size: 20px;
          line-height: 24px;
          color: var(--mc-text-color-white);

          img {
            width: 22px;
            height: 22px;
            margin-left: 4px;
          }
        }
      }

      .button-box {
        z-index: 1;
        padding: 40px 16px 16px 16px;
        position: relative;
        top: -48px;
        height: 112px;
        width: 100%;
        background: var(--mc-background-color-darkest);
        border: 1px solid var(--mc-border-color);
        border-radius: var(--mc-border-radius-l);
      }
    }
  }
}
</style>
