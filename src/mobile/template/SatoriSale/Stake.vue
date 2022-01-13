<template>
  <section class="stake">
    <van-skeleton title :row="9" :loading="!mcbCrowdsaleAccountStorage || !mcbCrowdsaleStorage">
      <div class="title">
        {{ isSubscribable ? $t('base.subscribe') : $t('base.unstake') }}
      </div>
      <div class="content">
        <template v-if="isSubscribable">
          <div class="input-container">
            <div class="label-line">
              <span>{{ $t('mcbSale.subscribeAmount') }}</span>
            </div>
            <div class="form-box">
              <van-form validate-first ref="addForm">
                <McMNumberField v-model="subscribeAmount" placeholder="0.0" :rules="subscribeFormRule.amount">
                  <span slot="right-icon">SATORI</span>
                </McMNumberField>
              </van-form>
            </div>
            <div class="proportion-box">
              <McMButtonRadioGroup v-model="subscribeAmountProportion" :values="[25, 50, 75, 100]" suffix="%"
                                   class="blue-selected"/>
            </div>
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
          <div class="stake-doc">
          <span class="left"><van-checkbox class="mc-mobile__checkbox" v-model="confirmedDoc">
            <template #icon="props">
              <div class="selected box" v-if="props.checked">
                 <i class="iconfont icon-select"></i>
              </div>
              <div class="un-selected box" v-else></div>
            </template>
          </van-checkbox></span>
            <span class="right" v-html="$t('mcbSale.stakeDoc')"></span>
          </div>
          <div class="button-box">
            <div class="button-item">
              <McMStateButton :button-class="['blue', 'round', 'large']"
                              :disabled="disableAction || !this.validSubscribeAmount" @click="onSubscribeEvent"
                              state="">
                <template v-if="currentStep && currentStep.type === 'approveSATORI'">
                  {{ $t('mcbSale.approveSATORI') }}
                </template>
                <template v-else-if="currentStep && currentStep.type === 'approveUSDC'">
                  {{ $t('mcbSale.approveUSDC') }}
                </template>
                <template v-else>
                  {{ $t('base.subscribe') }}
                </template>
              </McMStateButton>
            </div>
          </div>
<!--          <McSteps :active="activeStep" :status="stepStatus">-->
<!--            <McStepItem v-for="(step, index) in steps" :label="$t(step.labelKey)" :key="index"/>-->
<!--          </McSteps>-->
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
              <McMStateButton :button-class="['orange', 'round', 'large']" :state.sync="unstakeState"
                              :disabled="disableUnstake" @click="onUnstakeEvent">
                {{ $t('mcbSale.unstakeAll') }}
              </McMStateButton>
            </div>
          </div>
        </template>
      </div>
    </van-skeleton>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McSimpleSlider, McSteps, McStepItem } from '@/components'
import BigNumber from 'bignumber.js'
import { StakeMixin } from '@/template/SatoriSale/stakeMixin'
import { McMButtonRadioGroup, McMNumberField, McMStateButton } from '@/mobile/components'

@Component({
  components: {
    McSimpleSlider,
    McSteps,
    McStepItem,
    McMStateButton,
    McMNumberField,
    McMButtonRadioGroup,
  },
})
export default class Stake extends Mixins(StakeMixin) {
  private validSubscribeAmount = true
  private subscribeFormRule = {
    amount: [
      {
        validator: (val: string, rule: any) => {
          const errorMsg = this.validateAddAmount(val)
          this.$mcmToastErrorMsg(errorMsg)
          return errorMsg === ''
        },
        message: '',
        trigger: 'onChange',
      },
    ],
  }

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
    return this.normalizeSubscribeAmount.div(this.maxSubscribeAmount).times(100).toNumber()
  }

  set subscribeAmountProportion(val: number) {
    this.subscribeForm.amount = this.maxSubscribeAmount.times(val).div(100).dp(18, BigNumber.ROUND_DOWN).toFixed()
  }

  private validateAddAmount(value: string) {
    if (value === '' || !this.normalizeSubscribeAmount || !this.maxSubscribeAmount) {
      this.validSubscribeAmount = true
      return ''
    }
    const valueFloat = Number(value)
    if (isNaN(valueFloat) || valueFloat < 0) {
      this.validSubscribeAmount = false
      return this.$t('commonErrors.inputError').toString()
    } else if (this.normalizeSubscribeAmount.gt(this.maxSubscribeAmount) || this.normalizeSubscribeAmount.lt(0)) {
      this.validSubscribeAmount = false
      return this.$t('commonErrors.inputMinMaxError', {
        min: 0,
        max: this.maxSubscribeAmount.toFormat(2),
      }).toString()
    } else {
      this.validSubscribeAmount = true
      return ''
    }
  }
}
</script>

<style scoped lang="scss">
.mc-steps .mc-step-item {
  margin: 16px 0;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.stake {
  .title {
    font-size: 20px;
    line-height: 23px;
    margin-bottom: 16px;
  }

  .content {
    background-color: var(--mc-background-color);
    border-radius: var(--mc-border-radius-l);
    padding: 16px;

    .input-container {
      width: 100%;
      border: 1px solid var(--mc-border-color);
      border-radius: 12px;
      padding: 16px;

      .label-line {
        color: var(--mc-text-color);
        font-size: 14px;
        line-height: 16px;
      }

      .form-box {
        margin-top: 16px;

        ::v-deep {
          .van-form {
            .van-cell {
              padding: 0;
              background-color: transparent;
            }

            .van-field__control {
              color: var(--mc-text-color-white);
              font-size: 24px;
              font-weight: 400;
              caret-color: var(--mc-text-color-white);
            }

            input::-webkit-input-placeholder {
              color: var(--mc-text-color-dark);
            }

            .van-field__right-icon {
              color: var(--mc-text-color-white);
              font-size: 16px;
              font-weight: 400;
            }
          }
        }
      }

      .proportion-box {
        margin-top: 20px;

        .blue-selected {
          ::v-deep {
            .is-selected {
              border: 1px solid var(--mc-color-blue);
              color: var(--mc-color-blue);
            }
          }
        }

        .orange-selected {
          ::v-deep {
            .is-selected {
              border-color: var(--mc-color-orange);
              color: var(--mc-color-orange);
            }
          }
        }
      }
    }

    .info-container {
      margin-top: 8px;

      .stake-info-box {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        font-size: 14px;
        line-height: 16px;

        + .stake-info-box {
          margin-top: 16px;
        }

        .label {
          color: var(--mc-text-color);
        }

        .value {
          color: var(--mc-text-color-white);
          text-align: right;

          div + div {
            margin-top: 8px;
          }
        }
      }
    }

    .stake-doc {
      display: flex;
      margin-top: 24px;

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
      margin-top: 16px;
    }
  }
}
</style>
