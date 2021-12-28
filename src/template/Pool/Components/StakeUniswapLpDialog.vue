<template>
  <div>
    <el-dialog
      :title="dialogTitle"
      top="0"
      custom-class="is-medium stake-uniswap-lp-dialog"
      :close-on-click-modal="false"
      :visible.sync="currentVisible"
      append-to-body
      @closed="onClosed"
    >
      <div class="dialog-body">
        <div class="body-container">
          <div class="left-body panel-container">
            <div class="panel-title">
              {{ $t('dao.stakeDialog.yourStake') }}
            </div>
            <div class="panel-box">
              <div class="panel-line-item">
                <span>{{ $t('dao.stakeDialog.stakePool') }}</span>
                <span class="value">{{ stakePool | ellipsisMiddle(6, 4) }}</span>
              </div>
              <div class="panel-line-item">
                <span>{{ $t('dao.stakeDialog.myLpToken') }}</span>
                <span class="value">{{ myStake | bigNumberFormatter(2) }} {{ $t('dao.stakeDialog.lpToken') }}</span>
              </div>
              <div class="panel-line-item">
                <span>{{ $t('dao.myShare') }}</span>
                <span class="value">{{ myShare | bigNumberFormatter(2) }} %</span>
              </div>
              <div class="panel-line-item">
                <span>{{ $t('dao.claimable') }}</span>
                <div class="value">
                  <div class="claimable-item" v-for="(c, i) in claimableList" :key="i">
                    {{ c.value | bigNumberFormatter(2) }} {{ c.tokenName }}
                    <el-button class="withdraw-general-button" size="mini" type="orange" round @click="onClaimEvent">
                      {{ $t('base.claim') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="right-body option-container">
            <div class="radio-group">
              <el-radio-group v-model="activeRadioTab" size="medium">
                <el-radio-button label="stake">{{ $t('dao.stake') }}</el-radio-button>
                <el-radio-button label="unstake">{{ $t('dao.unstake') }}</el-radio-button>
              </el-radio-group>
            </div>
            <template v-if="isStakeTab">
              <div class="input">
                <div class="input-head">
                  <span>{{ $t('dao.stakeDialog.stakeAmount') }}</span>
                  <span>
                    {{ $t('base.walletBalance') }}
                    <span class="value">
                      <template v-if="walletBalance">
                        {{ walletBalance | bigNumberFormatter(2) }} {{ $t('dao.stakeDialog.lpToken') }}
                      </template>
                      <template v-else> 0 {{ $t('dao.stakeDialog.lpToken') }} </template>
                    </span>
                  </span>
                </div>
                <div class="input-box">
                  <el-form
                    size="large"
                    :model="stakeForm"
                    :rules="stakeFormRules"
                    ref="stakeForm"
                    :inline-message="true"
                    @submit.native.prevent
                  >
                    <div class="input-item">
                      <el-form-item prop="amount">
                        <el-input v-model="stakeForm.amount" size="large">
                          <template slot="suffix">
                            <div class="suffix-box">
                              <span class="max-btn">
                                <el-button type="primary" plain @click="setStakeMax" size="mini" round>
                                  {{ $t('base.max') }}
                                </el-button>
                              </span>
                              <span class="symbol">
                                <span>{{ $t('dao.stakeDialog.lpToken') }}</span>
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
                    <McSimpleSlider
                      :disabled="!walletBalance || walletBalance.isZero()"
                      :value="stakeAmountProportion"
                      @input="setStakeAmountProportion"
                      :step="1"
                      :max="100"
                    />
                  </span>
                  <span class="right value"> {{ stakeAmountProportion | bigNumberFormatter(0) }} % </span>
                </div>
                <div class="share-info">
                  <div>
                    <span>{{ $t('dao.stake') }}</span>
                    <span class="value">{{ deltaStakeShareToken | bigNumberFormatterByPrecision }}</span>
                  </div>
                  <div>
                    <span>{{ $t('dao.stakeDialog.shareOfPool') }}</span>
                    <span class="value">{{ deltaStakeSharePercentage | bigNumberFormatterByPrecision(2) }} %</span>
                  </div>
                </div>
                <div class="button-box">
                  <div class="button-item" v-if="!isApproved">
                    <el-button size="large" type="blue" @click="onApproveEvent">
                      {{ $t('base.approve') }} {{ $t('dao.stakeDialog.lpToken') }}
                    </el-button>
                  </div>
                  <div class="button-item" v-if="isApproved">
                    <el-button size="large" type="blue" @click="onStakeEvent">
                      {{ $t('dao.stake') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </template>

            <template v-if="isUnstakeTab">
              <div class="input">
                <div class="input-head">
                  <span>{{ $t('dao.stakeDialog.unstakeAmount') }}</span>
                  <span>
                    {{ $t('base.balance') }}
                    <span class="value"
                      >{{ stakeBalance | bigNumberFormatterByPrecision }}
                      {{ $t('dao.stakeDialog.stakedLpToken') }}</span
                    >
                  </span>
                </div>
                <div class="input-box">
                  <el-form
                    size="large"
                    :model="unstakeForm"
                    :rules="unstakeFormRules"
                    ref="unstakeForm"
                    :inline-message="true"
                    @submit.native.prevent
                  >
                    <div class="input-item">
                      <el-form-item prop="amount">
                        <el-input v-model="unstakeForm.amount" size="large">
                          <template slot="suffix">
                            <div class="suffix-box">
                              <span class="max-btn">
                                <el-button type="primary" plain @click="setUnstakeMax" size="mini" round>
                                  {{ $t('base.max') }}
                                </el-button>
                              </span>
                              <span class="symbol">
                                <span>{{ $t('dao.stakeDialog.stakedLpToken') }}</span>
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
                    <McSimpleSlider
                      :disabled="stakeBalance.isZero()"
                      :value="unstakeAmountProportion"
                      @input="setUnstakeAmountProportion"
                      :step="1"
                      :max="100"
                    />
                  </span>
                  <span class="right value"> {{ unstakeAmountProportion | bigNumberFormatter(0) }} % </span>
                </div>
                <div class="share-info">
                  <div>
                    <span>{{ $t('dao.stake') }}</span>
                    <span class="value">{{ deltaStakeShareToken | bigNumberFormatterByPrecision }}</span>
                  </div>
                  <div>
                    <span>{{ $t('dao.stakeDialog.shareOfPool') }}</span>
                    <span class="value">{{ deltaStakeSharePercentage | bigNumberFormatterByPrecision(2) }} %</span>
                  </div>
                </div>
                <div class="button-box">
                  <div class="button-item">
                    <el-button size="large" type="orange" @click="onUnstakeEvent">
                      {{ $t('dao.unstake') }}
                    </el-button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { ErrorHandlerMixin } from '@/mixins'
import { McSimpleSlider, McSteps, McStepItem } from '@/components'
import BigNumber from 'bignumber.js'

@Component({
  components: {
    McSimpleSlider,
    McSteps,
    McStepItem
  }
})
export default class StakeUniswapLpDialog extends Mixins(ErrorHandlerMixin) {
  @Prop({ default: false }) visible!: boolean
  @Prop({ required: true }) poolAddress!: string
  @Prop({ required: true }) poolName!: string

  private activeRadioTab: 'stake' | 'unstake' = 'stake'
  // TODO: Mock data
  private stakePool: string = '0xfe62314f9fb010bebf52808cd5a4c571a47c4c46'
  private myStake: BigNumber = new BigNumber(1000)
  private myShare: BigNumber = new BigNumber(10)
  private claimableList: Array<{ tokenName: string, value: BigNumber }> = [
    { tokenName: 'SATORI', value: new BigNumber(10) },
    { tokenName: 'USDC', value: new BigNumber(10) },
    { tokenName: 'USDT', value: new BigNumber(10) },
  ]

  private stakeForm = {
    amount: '',
    amountProportion: 0
  }

  private stakeFormRules = {
    amount: [

    ]
  }

  private unstakeForm = {
    amount: '',
    amountProportion: 0
  }

  private unstakeFormRules = {
    amount: [

    ]
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get dialogTitle(): string {
    return this.$t('dao.stakeDialog.stakeUniswapDialogTitle', {
      poolName: this.poolName
    }).toString()
  }

  get isStakeTab(): boolean {
    return this.activeRadioTab === 'stake'
  }

  get isUnstakeTab(): boolean {
    return this.activeRadioTab === 'unstake'
  }

  get walletBalance(): BigNumber {
    return new BigNumber(100)
  }

  get stakeBalance(): BigNumber {
    return new BigNumber(300)
  }

  get isApproved(): boolean {
    return true
  }

  get stakeAmountProportion(): number {
    return this.stakeForm.amountProportion
  }

  setStakeAmountProportion(val: number) {
    this.stakeForm.amountProportion = val
  }

  get unstakeAmountProportion(): number {
    return this.stakeForm.amountProportion
  }

  setUnstakeAmountProportion(val: number) {
    this.stakeForm.amountProportion = val
  }

  get deltaStakeShareToken(): BigNumber {
    return new BigNumber(10)
  }

  get deltaStakeSharePercentage(): BigNumber {
    return new BigNumber(2)
  }

  onClosed() {
    this.$emit('closed')
  }

  setStakeMax() {

  }

  setUnstakeMax() {

  }

  onApproveEvent() {

  }

  onStakeEvent() {

  }

  onUnstakeEvent() {

  }

  onClaimEvent() {

  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/var';

.stake-uniswap-lp-dialog {
  font-weight: 400;

  ::v-deep .el-dialog {
    width: 920px;
    height: 571px;
  }
  .dialog-body {
    padding: 13px 24px 0 24px;
    width: 100%;
    height: 100%;
  }

  .body-container {
    display: flex;
    width: 100%;
    height: 100%;
    .left-body {
      flex: 1;
      display: inline-block;
      width: 370px;
      height: 100%;
    }

    .right-body {
      flex: 0.78;
      display: inline-block;
      width: 360px;
      height: 100%;
    }
  }
  .panel-container {
    .panel-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--mc-text-color-white);
      margin-bottom: 20px;
    }

    .panel-box {
      width: 370px;
      padding: 12px;
      border-radius: 4px;
      background-color: rgba($--mc-background-color-dark, 0.5);
      overflow-y: auto;
      max-height: 340px;
    }

    .panel-line-item {
      display: flex;
      justify-content: space-between;
      color: var(--mc-text-color);
      font-size: 13px;
      font-weight: 400;
      line-height: 32px;

      .value {
        color: var(--mc-text-color-white);
      }
    }

    .claimable-item {
      display: flex;
      justify-content: space-between;
      line-height: 46px;

      .el-button {
        margin: auto 0 auto 15px;
      }
    }
  }

  .option-container {
    .radio-group {
      ::v-deep {
        .el-radio-button__inner {
          width: 180px;
        }
      }
    }

    .input {
      margin-top: 30px;

      .value {
        color: var(--mc-text-color-white);
      }

      .input-head {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--mc-text-color);
      }

      .input-box {
        margin-top: 10px;

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
    }

    .slider {
      display: flex;
      justify-content: space-between;
      height: 16px;
      line-height: 8px;

      .left {
        width: 297px;
      }

      .right {
        font-size: 12px;
        margin-right: 4px;
      }
    }

    .share-info {
      margin-top: 20px;

      div {
        display: flex;
        justify-content: space-between;
        color: var(--mc-text-color);
        height: 24px;
        margin-top: 20px;
        line-height: 24px;
        font-size: 18px;
        font-weight: 700;
      }
      .value {
        color: var(--mc-text-color-white);
      }
    }

    .button-box {
      margin-top: 30px;

      .button-item {
        width: 100%;

        .el-button {
          width: 100%;
        }
      }
    }
  }
}
</style>
