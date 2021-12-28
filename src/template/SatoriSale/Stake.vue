<template>
  <section class="stake">
    <div class="title">
      {{ isSubscribable ? $t('base.subscribe') : $t('base.unstake') }}
    </div>
    <div class="content">
      <template v-if="isSubscribable">
        <div class="input-head">
          <span>{{ $t('mcbSale.subscribeAmount') }}</span>
        </div>
        <div class="input-box">
          <el-form size="large" :model="subscribeForm" :rules="subscribeFormRule" ref="addLiquidityForm"
                   :inline-message="true" @submit.native.prevent>
            <div class="input-item">
              <el-form-item prop="amount">
                <el-input v-model="subscribeAmount" size="large">
                  <template slot="suffix">
                    <div class="suffix-box">
                        <span class="max-btn">
                          <el-button type="primary" plain @click="setSubscribeMax" size="mini" round>
                            {{ $t('base.max') }}
                          </el-button>
                        </span>
                      <span class="symbol">
                          <span>SATORI</span>
                        </span>
                    </div>
                  </template>
                </el-input>
              </el-form-item>
            </div>
          </el-form>
        </div>
        <div class="slider">
            <span class="left">
              <McSimpleSlider :value="subscribeAmountProportion" @input="setSubscribeAmountProportion" :step="1"
                              :max="100"/>
            </span>
          <span class="right value">
              {{ subscribeAmountProportion | bigNumberFormatter(0) }} %
            </span>
        </div>
        <div class="info-container">
          <div class="stake-info-box">
            <div class="label">{{ $t('mcbSale.needToStake') }}</div>
            <div class="value">
              <div>{{ needStakeSATORI | bigNumberFormatter }} SATORI</div>
              <div>{{ needStakeUSDC | bigNumberFormatter }} USDC</div>
            </div>
          </div>
        </div>
        <el-alert v-if="errorMessage" type="error" :closable="false">
          {{ errorMessage }}
        </el-alert>
        <div class="stake-doc">
          <span class="left"><el-checkbox v-model="confirmedDoc"></el-checkbox></span>
          <span class="right" v-html="$t('mcbSale.stakeDoc')"></span>
        </div>
        <div class="button-box">
          <div class="button-item">
            <el-button size="large" type="blue"
                       :disabled="disableAction"
                       @click="onSubscribeEvent"
                       :loading="stepStatus === 1">
              <template v-if="currentStep && currentStep.type === 'approveSATORI'">
                {{ $t('mcbSale.approveSATORI') }}
              </template>
              <template v-else-if="currentStep && currentStep.type === 'approveUSDC'">
                {{ $t('mcbSale.approveUSDC') }}
              </template>
              <template v-else>
                {{ $t('base.subscribe') }}
              </template>
            </el-button>
          </div>
        </div>
<!--        <McSteps :active="activeStep" :status="stepStatus">-->
<!--          <McStepItem v-for="(step, index) in steps" :label="$t(step.labelKey)" :key="index"/>-->
<!--        </McSteps>-->
      </template>
      <template v-else>
        <div class="info-container">
          <div class="stake-info-box">
            <div class="label">{{ $t('mcbSale.unstakable') }}</div>
            <div class="value">
              <div>{{ unstakableSATORI | bigNumberFormatter }} SATORI</div>
              <div>{{ unstakaleUSDC | bigNumberFormatter }} USDC</div>
            </div>
          </div>
          <div class="stake-info-box">
            <div class="label">{{ $t('mcbSale.unstakeIn') }}</div>
            <div class="value">{{ unlockTimeLeft }}</div>
          </div>
        </div>
        <div class="button-box">
          <div class="button-item">
            <el-button :disabled="disableUnstake" size="large" type="orange" @click="onUnstakeEvent"
                       :loading="unstaking">
              {{ $t('mcbSale.unstakeAll') }}
            </el-button>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McSimpleSlider, McSteps, McStepItem } from '@/components'
import BigNumber from 'bignumber.js'
import { StakeMixin } from './stakeMixin'

@Component({
  components: {
    McSimpleSlider,
    McSteps,
    McStepItem,
  },
})
export default class Stake extends Mixins(StakeMixin) {
  private subscribeFormRule = {
    amount: [
      { validator: this.validateAddAmount, trigger: 'change' },
    ],
  }
  private errorMessage = ''

  get subscribeAmount(): string {
    return this.subscribeForm.amount
  }

  set subscribeAmount(val: string) {
    this.subscribeForm.amount = val
  }

  get subscribeAmountProportion() {
    if (!this.normalizeSubscribeAmount || !this.maxSubscribeAmount) {
      return 0
    }
    return BigNumber.min(this.normalizeSubscribeAmount.div(this.maxSubscribeAmount).times(100), 100)
  }

  private setSubscribeAmountProportion(val: number) {
    this.subscribeForm.amount = this.maxSubscribeAmount.times(val).div(100).dp(18, BigNumber.ROUND_DOWN).toFixed()
  }

  private validateAddAmount(rule: any, value: string, callback: Function) {
    if (value === '') {
      return
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat) || valueFloat < 0) {
      this.errorMessage = this.$t('commonErrors.inputError').toString()
    } else if (this.normalizeSubscribeAmount && this.maxSubscribeAmount && (this.normalizeSubscribeAmount.gt(this.maxSubscribeAmount) || this.normalizeSubscribeAmount.lt(0))) {
      this.errorMessage = this.$t('commonErrors.inputMinMaxError', {
        min: 0,
        max: this.maxSubscribeAmount.toFormat(2),
      }).toString()
    } else {
      this.errorMessage = ''
    }
    callback()
  }
}
</script>

<style scoped lang="scss">
.stake {
  .title {
    font-size: 16px;
    line-height: 22px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .content {


    .el-form-item {
      margin-bottom: 0;
    }

    .input-head {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--mc-text-color);
      margin-top: 30px;
    }

    .input-box {
      margin-top: 4px;

      ::v-deep .el-input__inner {
        font-size: 16px;
      }

      .symbol {
        font-size: 16px;
        color: var(--mc-text-color);
      }

      .suffix-box {
        display: flex;
        align-items: center;
        line-height: 1;
      }

      .max-btn {
        margin-right: 12px;

        .el-button {
          height: 24px;
          min-width: 49px;
        }
      }
    }

    .slider {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 18px;
      line-height: 8px;
      margin: 20px 0;

      .left {
        width: 350px;
      }

      .right {
        font-size: 12px;
        margin-right: 4px;
      }
    }

    .info-container {
      .stake-info-box {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        font-size: 18px;
        line-height: 24px;
        font-weight: bold;

        + .stake-info-box {
          margin-top: 20px;
        }

        .label {
          color: var(--mc-text-color);
        }

        .value {
          color: var(--mc-text-color-white);
          text-align: right;

          div + div {
            margin-top: 10px;
          }
        }
      }
    }

    .el-alert {
      margin-top: 8px;
      font-size: 14px;
      padding: 10px;
      line-height: 20px;

      ::v-deep .el-alert__description {
        margin: 0;
      }
    }

    .stake-doc {
      margin-top: 30px;
      display: flex;

      .left {
        padding-top: 2px;
      }

      .right {
        flex: 1;
        margin-left: 10px;
        font-size: 14px;
        line-height: 20px;

        ::v-deep a {
          color: var(--mc-color-primary);
        }
      }
    }

    .button-box {
      margin-top: 20px;

      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
