<template>
  <div class="uniswap-stake scroll-container">
    <BackNavBar :title="title"></BackNavBar>
    <div class="uniswap-stake-container page-container">
      <div class="info-title">
        <McMIconHeader :image1="poolInfo.token1 | tokenIconUrlFormatter" :image2="poolInfo.token2 | tokenIconUrlFormatter"
                    :title="poolInfo.pairName" :sub-title="poolAddressSubTitle" :show-image2="true"/>
      </div>
      {{ poolInfo.token2 | tokenIconUrlFormatter }}
      <div class="operating-panel">
        <McMRadioGroupTabs v-model="selectedRadio" :options="radioOptions" />
        <template v-if="selectedRadio === 'stake'">
          <div class="input-container">
            <div class="label-line">
              <span>{{ $t('base.amount') }}</span>
              <span>
                {{ $t('base.balance') }}
                {{ stakeBalance | bigNumberFormatter(2) }}
              </span>
            </div>
            <div class="form-box">
              <van-form validate-first>
                <van-field v-model="stakeForm.amount" placeholder="0.0" :rules="stakeRules.amount" autocomplete="off">
                  <span slot="right-icon">{{ $t('base.lpToken') }}</span>
                </van-field>
              </van-form>
            </div>
            <div class="proportion-box">
              <McMButtonRadioGroup v-model="stakeForm.amountProportion" :values="[25, 50, 75, 100]" suffix="%" :class="[radioGroupSelectedClass]" />
            </div>
          </div>
          <div class="input-container-sub-info">
            <div class="label-line">
              <span>{{ $t('base.share') }}</span>
              <span class="value">{{ shareTokenPercentage | bigNumberFormatterByPrecision(2) }}%</span>
            </div>
          </div>
          <div class="button-box">
            <div class="more-button">
              <van-button class="blue round large" @click="onApproveEvent">{{ $t('base.approve') }}</van-button>
              <van-button class="blue round large" disabled @click="onStakeEvent">{{ $t('base.stake') }}</van-button>
            </div>
            <div class="steps">
              <McMHorizontalSteps :active="stakeForm.activeStep" :step-count="2" />
            </div>
            <!--            <div class="single-button">-->
            <!--              <van-button class="blue round large" @click="onStakeEvent">{{ $t('base.stake') }}</van-button>-->
            <!--            </div>-->
          </div>
        </template>
        <template v-if="selectedRadio === 'unstake'">
          <div class="input-container">
            <div class="label-line">
              <span>{{ $t('base.amount') }}</span>
              <span>
                {{ $t('base.balance') }}
                {{ unstakeBalance | bigNumberFormatter(2) }}
              </span>
            </div>
            <div class="form-box">
              <van-form validate-first>
                <van-field v-model="unstakeForm.amount" placeholder="0.0" :rules="unstakeRules.amount" autocomplete="off">
                  <span slot="right-icon">{{ $t('base.lpToken') }}</span>
                </van-field>
              </van-form>
            </div>
            <div class="proportion-box">
              <McMButtonRadioGroup v-model="unstakeForm.amountProportion" :values="[25, 50, 75, 100]" suffix="%" :class="[radioGroupSelectedClass]" />
            </div>
          </div>
          <div class="input-container-sub-info">
            <div class="label-line">
              <span>{{ $t('base.share') }}</span>
              <span class="value">{{ shareTokenPercentage | bigNumberFormatterByPrecision(2) }}%</span>
            </div>
          </div>
          <div class="button-box">
            <div class="single-button">
              <van-button class="orange round large" @click="onUnstakeEvent">{{ $t('base.unstake') }}</van-button>
            </div>
          </div>
        </template>
      </div>
      <div class="info-panel">
        <div class="title">{{ $t('dao.myShareReward') }}</div>
        <div class="content">
          <div class="label-line line-item">
            <span>{{ $t('dao.myShare') }}</span>
            <span class="value">0.1%</span>
          </div>
          <div class="label-line line-item">
            <span>{{ $t('dao.myStaked') }}</span>
            <span class="value">1000 {{ $t('base.lpToken') }}</span>
          </div>
          <div class="label-line line-item">
            <span>{{ $t('dao.claimable') }}</span>
            <span class="value">100 {{ miningTokenSymbol }}</span>
          </div>
        </div>
        <div class="button-box">
          <div class="single-button">
            <van-button class="orange round large">{{ $t('base.claim') }}</van-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import BigNumber from 'bignumber.js'
import { _0 } from '@mcdex/mai3.js'
import { McMIconHeader, McMRadioGroupTabs, McMButtonRadioGroup, McMHorizontalSteps } from '@/mobile/components'
import { ellipsisMiddle } from '@/utils'
import { MiningTokenSymbol } from '@/constants'
import BackNavBar from '@/mobile/template/Header/BackNavBar.vue'

@Component({
  components: {
    McMIconHeader,
    McMRadioGroupTabs,
    McMButtonRadioGroup,
    McMHorizontalSteps,
    BackNavBar,
  }
})
export default class UniswapStake extends Vue {
  private miningTokenSymbol: string = MiningTokenSymbol

  private poolInfo = {
    token1: '0xae13d989dac2f0debff460ac112a837c89baa7cd',
    token2: '0xe70b7523f4bffa1f2e88d2ba709afd026030f412',
    pairName: 'SATORI-USDC',
    pairAddress: '0x10cfa744c77f1cb9a77fa418ac4a1b6ec62bcce4'
  }

  private stakeForm = {
    amount: '',
    amountProportion: 25,
    activeStep: 0
  }

  private stakeRules = {
    amount: [{ validator: (val: string) => {}, message: 'xxx' }]
  }

  private unstakeForm = {
    amount: '',
    amountProportion: 25
  }

  private unstakeRules = {
    amount: [{ validator: (val: string) => {}, message: 'xxx' }]
  }

  private selectedRadio: 'stake' | 'unstake' = 'stake'
  get radioOptions() {
    return [
      {
        label: this.$t('base.stake').toString(),
        value: 'stake',
        itemSelectedClass: 'blue-radio',
      },
      {
        label: this.$t('base.unstake').toString(),
        value: 'unstake',
        itemSelectedClass: 'orange-radio',
      }
    ]
  }

  get title() {
    return this.$t('dao.uniswapMining').toString()
  }

  get radioGroupSelectedClass() {
    if (this.selectedRadio === 'stake') return 'blue-selected'
    if (this.selectedRadio === 'unstake') return 'orange-selected'
    return ''
  }

  get poolAddressSubTitle(): string {
    return `${this.$t('base.poolAddress').toString()} ${ellipsisMiddle(this.poolInfo.pairAddress, 6, 4)}`
  }

  get normalizeAddAmount() {
    return this.stakeForm.amount ? new BigNumber(this.stakeForm.amount) : _0
  }

  get normalizeRemoveAmount(): BigNumber {
    return this.unstakeForm.amount ? new BigNumber(this.unstakeForm.amount) : _0
  }

  get stakeBalance(): BigNumber {
    return new BigNumber(100)
  }

  get unstakeBalance(): BigNumber {
    return new BigNumber(200)
  }

  get shareTokenPercentage(): BigNumber {
    return new BigNumber(0)
  }

  async onApproveEvent() {

  }

  async onStakeEvent() {

  }

  async onUnstakeEvent() {

  }
}
</script>

<style lang="scss">

</style>

<style lang="scss" scoped>
.uniswap-stake {
  .uniswap-stake-container {
    padding: 16px;

    .operating-panel {
      margin-top: 16px;
      padding: 16px;
      width: 100%;
      border-radius: 24px;
      background: var(--mc-background-color);

      .radio-group-tabs ::v-deep {
        .blue-radio {
          color: var(--mc-color-blue);
          background: var(--mc-background-color);
        }

        .orange-radio {
          color: var(--mc-color-orange);
          background: var(--mc-background-color);
        }
      }

      .input-container {
        margin-top: 12px;
        width: 100%;
        border: 1px solid var(--mc-border-color);
        min-height: 100px;
        border-radius: 12px;
        padding: 16px;
      }

      .input-container-sub-info {
        margin-top: 8px;
        padding: 0 4px;
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

            input::-webkit-input-placeholder{
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

      .button-box {
        margin-top: 16px;
      }
    }

    .info-panel {
      margin-top: 16px;
      border-radius: 24px;
      background: var(--mc-background-color);
      padding: 16px;

      .title {
        font-size: 18px;
        font-weight: 400;
        color: var(--mc-text-color-white);
      }

      .content {
        margin-top: 16px;
        width: 100%;
        border: 1px solid var(--mc-border-color);
        border-radius: 12px;
        padding: 16px;

        .line-item {
          line-height: 26px
        }
      }

      .button-box {
        margin-top: 24px;
      }
    }

    .button-box {
      .more-button {
        ::v-deep {
          .van-button {
            width: calc(50% - 8px);
          }
          .van-button:first-child {
            margin-right: 15px;
          }
        }
      }

      .single-button {
        ::v-deep {
          .van-button {
            width:  100%;
          }
        }
      }
    }

    .steps {
      margin-top: 8px;
      text-align: center;
    }

    .label-line {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: var(--mc-text-color);
    }

    .value {
      color: var(--mc-text-color-white);
    }
  }
}
</style>
