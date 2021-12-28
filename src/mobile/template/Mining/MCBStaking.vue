<template>
  <div class="mcb-staking" @click="goStake">
    <div class="staking-info">
      <div class="staking">
        <div class="label">{{ $t('dao.staking') }}</div>
        <div class="value">
          <van-image class="token-icon" round :src="SATORITokenAddress | tokenIconUrlFormatter" error-icon="question" loading-icon="question"/>
          <span>SATORI</span>
        </div>
      </div>
      <div class="apy">
        <div class="label">{{ $t('base.APY') }}</div>
        <div class="value">
          <PNNumber :number="apy" suffix="%"/>
        </div>
      </div>
      <div class="icon">
        <van-icon name="arrow"/>
      </div>
    </div>
    <div class="claimable">
      <div class="label">{{ $t('dao.claimable') }}</div>
      <div class="values">
        <div class="claimable-item" v-for="(item, index) in claimables" :key="index">
          <div class="value">{{ item.value | bigNumberFormatterByPrecision }}</div>
          <div class="symbol">{{ item.tokenName }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { PNNumber } from '@/components'
import { ROUTE } from '@/mobile/router'
import { SATORI_ADDRESS } from '@/constants'
import { DaoStakingMixin } from '@/template/components/DAO/daoStakingMixin'

@Component({
  components: {
    PNNumber,
  },
})
export default class SATORIStaking extends Mixins(DaoStakingMixin)  {
  private SATORITokenAddress = SATORI_ADDRESS

  mounted() {
    this.updateUserData()
  }

  get apy() {
    return this.miningApy
  }

  get claimables() {
    return this.claimableTokens
  }

  private goStake() {
    this.$router.push({ name: ROUTE.SATORI_STAKE })
  }
}
</script>

<style lang="scss" scoped>
.mcb-staking {
  padding: 16px;
  border-radius: var(--mc-border-radius-l);
  background-color: var(--mc-background-color);

  .staking-info {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    font-size: 14px;
    line-height: 16px;
    color: var(--mc-text-color);

    .label {
      margin-bottom: 8px;
    }

    .staking .value, .apy .value {
      color: white;
      display: flex;
      align-items: center;
      height: 24px;

      .token-icon {
        background-color: #FFFFFF;
        border-radius: 50%;
        height: 24px;
        width: 24px;
        margin-right: 4px;
      }
    }
  }

  .claimable {
    color: var(--mc-text-color);
    margin-top: 16px;

    .label {
      font-size: 14px;
      line-height: 16px;
      margin-bottom: 8px;
    }

    .values {
      border-radius: var(--mc-border-radius-m);
      border: 1px solid var(--mc-border-color);
      font-size: 14px;
      line-height: 18px;
      padding: 8px 16px;
      min-height: 52px;

      .claimable-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 8px 0;

        .value {
          color: white;
        }
      }
    }
  }
}
</style>
