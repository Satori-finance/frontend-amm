<template>
  <div class="error-404">
    <!-- <img src="@/assets/img/404.png" alt=""> -->
    <h1>404</h1>
    <div class="title">{{$t('404.title')}}</div>
    <div class="subtitle" v-html="$t('404.subtitle')"></div>
    <!-- <div class="links">
      <router-link :to="{name: ROUTE.TRADE_MAIN}">{{ $t('trade') }}</router-link>
      <router-link :to="{name: ROUTE.POOL}">{{ $t('base.pool') }}</router-link>
      <router-link :to="{name: ROUTE.MINING}">{{ $t('base.farm') }}</router-link>
      <router-link :to="{name: ROUTE.WALLET}">{{ $t('base.account') }}</router-link>
      <router-link :to="{name: ROUTE.DAO}">{{ $t('base.dao') }}</router-link>

    </div> -->
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { ROUTE } from '@/router'

@Component
export default class Error404 extends Vue {
  private ROUTE = ROUTE
}
</script>

<style lang="scss" scoped>
.error-404 {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--mc-background-color-darkest);
  text-align: center;
  h1 {
    font-size: 150px;
  }
  .title {
    margin-top: 24px;
    font-size: 18px;
    line-height: 24px;
    color: var(--mc-text-color-white);
  }

  .subtitle {
    margin-top: 4px;
    font-size: 14px;
    line-height: 20px;
    color: var(--mc-text-color);
  }

  .links {
    font-size: 16px;
    line-height: 24px;
    color: var(--mc-color-primary);
    margin-top: 24px;

    a {
      margin: 0 16px;
      text-decoration: underline;
    }
  }
}
</style>
