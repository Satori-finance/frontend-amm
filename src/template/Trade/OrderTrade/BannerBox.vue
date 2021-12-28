<template>
  <div class="banner-box">
<!--    <div class="banner-item is-arb" @click="openTxMiningLink" v-if="isARB">-->
<!--      <div class="left">-->
<!--        <img src="@/assets/img/banner/tx-mining-left.svg" alt="">-->
<!--      </div>-->
<!--      <div class="right">-->
<!--        <img src="@/assets/img/banner/tx-mining-right.png" alt="">-->
<!--      </div>-->
<!--    </div>-->
    <!-- <div class="banner-item is-bsc" @click="openTxMiningLink" v-if="isBSC || isARB">
      <div class="left">
        <img src="@/assets/img/banner/tx-mining-2-left.svg" alt="">
      </div>
      <div class="right">
        <img src="@/assets/img/banner/tx-mining-2-right.png" alt="">
      </div>
    </div> -->
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { SUPPORTED_NETWORK_ID, TARGET_NETWORK_ID } from '@/constants'

@Component
export default class BannerBox extends Vue {
  openTxMiningLink() {
    if (this.isARB) {
      window.open('https://mcdex.medium.com/trading-mining-program-round-1-6e1520eee510')
    }
    if (this.isBSC) {
      window.open('https://mcdex.medium.com/announcing-trading-mining-v2-on-bsc-46e9610d7bad')
    }
  }

  get isARB() {
    return TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.ARB
  }

  get isBSC() {
    return TARGET_NETWORK_ID === SUPPORTED_NETWORK_ID.BSC
  }
}
</script>

<style lang="scss" scoped>
.banner-box {
  padding: 0 16px;

  .is-arb {
    background-image: url("../../../assets/img/banner/tx-mining-bg.png");
    display: flex;
    justify-content: space-between;
    height: 140px;
    align-items: center;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;

    img {
      pointer-events: none;
    }

    .left {
      padding-left: 15px;
      img {
        margin-top: 13px;
        height: 96px;
      }
    }

    .right {
      padding-right: 14px;
    }

    img {
      height: 140px;
    }
  }

  .is-bsc {
    background: #01001a;
    height: 140px;
    border-radius: 8px;
    width: 100%;
    overflow: hidden;
    cursor: pointer;
    position: relative;

    img {
      pointer-events: none;
    }

    .left {
      position: absolute;
      display: inline-block;
      z-index: 2;
      margin: 12px 0 0 12px;
      height: 128px;
      img {
        height: 110px;
        width: 149px;
      }
    }

    .right {
      position: absolute;
      height: 140px;
      right: 0;
      display: inline-block;
      z-index: 1;

      img {
        height: 140px;
      }
    }
  }
}
</style>
