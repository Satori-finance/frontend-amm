<template>
  <div class="home-page scroll-container">
    <HeaderBar/>
    <div class="bg">
      <img src="@/assets/img/satori-bg.png" alt="">
    </div>
    <div class="home-container page-container">

      <div class="text">
        <span>{{ $t('home.allNetworksStats') }}</span>
      </div>
      <div class="tvl-chart common">
        <TVLChart />
      </div>
      <div class="volume-chart common">
        <VolumeChart/>
      </div>
      <div class="text">
        <span>{{ $t('home.toPerpetualContracts') }}</span>
      </div>
      <div class="perpetual">
        <PerpetualContract/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import HeaderBar from '@/mobile/template/Header/HeaderBar.vue'
import TVLChart from './TVLChart.vue'
import VolumeChart from './VolumeChart.vue'
import PerpetualContract from './PerpetualContract.vue'
import {McNoData} from '@/components'
import SearchPerpetual from '@/mobile/template/Home/SearchPerpetual.vue'

@Component({
  components: {
    SearchPerpetual,
    McNoData,
    HeaderBar,
    TVLChart,
    VolumeChart,
    PerpetualContract,
  },
})
export default class Home extends Vue {

}
</script>

<style scoped lang="scss">
.home-page {
  height: 100%;
  width: 100%;
  padding-bottom: 8px;
  border-radius: 10px 10px 0 0;

  .bg {
    position: absolute;
    width: 800px;
    left: calc(50% - 368px);
    filter: blur(90px);
    z-index: 0;
    pointer-events: none;
  }

  .home-container {
    padding: 16px;
    width: 100%;
    z-index: 1;

    .common {
      border-radius: 12px;
      background: var(--mc-background-color-dark);
      border: 1px solid var(--mc-border-color);
    }

    .tvl-chart {
      margin-top: 16px;
    }

    .volume-chart {
      margin-top: 16px;
      margin-bottom: 32px;
    }

    .text{
      font-size: 18px;
      line-height: 24px;
    }

    .perpetual {
      height: fit-content;
    }
  }
}
</style>
