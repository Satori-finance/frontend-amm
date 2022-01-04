<template>
  <div class='risk-notice'>
    <el-dialog
      :visible.sync="currentVisible"
      append-to-body
      top='0'
      custom-class="is-small is-round"
      :close-on-click-modal="false"
      :show-close="showClo"
      :title="$t('perpetualRiskNotice.riskNotice')"
    >
      <div slot="title" class="head">
        <span class="warn-svg">
          <img src="@/assets/img/Warning.svg" alt="" />
        </span>
        <span class="head-title">{{ $t('perpetualRiskNotice.riskNotice') }}</span>
      </div>

      <McLoading :show-loading='loading' :mask-color="'transparent'" v-show="loading"/>
      <div v-show='!loading'>
        <span class="text">
          {{ $t('perpetualRiskNotice.riskNoticeText') }}
        </span>

        <div class='container'>
          <div class="title">
            {{ symbol }} {{ $t('perpetualRiskNotice.perpetualContract',{ name: name }) }}
          </div>
          <div class="info-item">
            <span class='sub-title'>{{ $t('base.underlyingAssets') }}</span>
            <span class="flex-box">

              <el-image class="token-img" :src="underlyingAsset | tokenIconUrlFormatter">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </el-image>
              <span class='name'>{{ underlyingAsset }}</span>
            </span>
          </div>
          <div class="info-item">
            <span class='sub-title'>{{ $t('base.collateral') }}</span>
            <span class="flex-box">
              <el-image class="token-img" :src="collateralAddress | tokenIconUrlFormatter">
                <div slot="error" class="image-slot">
                  <img src="@/assets/img/tokens/Unknow.svg" alt="">
                </div>
              </el-image>
              <span class='name'>{{ collateral }}</span>
              <a class='address' :href="collateralAddress | etherBrowserAddressFormatter" target="_blank">
                {{ collateralAddress | ellipsisMiddle }}
              </a>
              <McCopy :content="collateralAddress" :tooltip="false"/>
            </span>
          </div>

          <div class='info-item oracle'>
            <span class='sub-title'>{{ $t('base.oracle') }}</span>

            <div class="oracle-flex-box">
              <img v-if="oracleType === 'uniswapv3' && uniswapV3RouterPath" class="oracle-img"
                   src="@/assets/img/uniswap.png" alt="">
              <img v-else class="oracle-img"
                   src="@/assets/img/tokens/Unknow.svg" alt="">
              <span class='oracle-name' v-if="(oracleType === 'whitelist' || oracleType === 'oracleRouter') && oracleDetail && oracleDetail.oracles">
                <span v-for="(item, index) in oracleDetail.oracles" :key="index">
                  <span>{{ getOracleTypeName(item) }}</span>
                  <span>
                    {{ item.oracle.underlyingAsset }}-{{ item.oracle.collateral }}
                  </span>
                  <span v-if="isWithFineTuner(item)" class="fine-tuner">
                    {{ getOracleTypeName(item) === 'SATORI' ? $t('base.chainlinkWithFineTuner') : $t('base.withFineTuner') }}
                  </span>
                  <span class="oracle-item-split oracle-arrow" v-if="index < (oracleDetail.oracles.length - 1)">
                    <i class="iconfont icon-arrow-up"></i>
                  </span>
                </span>
              </span>
              <span class='oracle-name' v-if="oracleType === 'uniswapv3' && uniswapV3RouterPath">
                <span>Uniswap</span>&nbsp;
                <span v-for="(item, index) in uniswapV3RouterPath.symbols" :key="index">
                  <span>{{ item }}</span>
                  <span class="oracle-item-split" v-if="index < (uniswapV3RouterPath.symbols.length - 1)">
                    <i class="iconfont icon-arrow-up"></i>
                  </span>
                </span>
              </span>
              <span class='oracle-name' v-if="oracleType === 'custom' && oracleDetail && oracleDetail.oracles">
                <span v-for="(item, index) in oracleDetail.oracles" :key="index">
                  <span>{{ getOracleTypeName(item) }}</span>
                  <span>
                    {{ item.oracle.underlyingAsset }}-{{ item.oracle.collateral }}
                  </span>
                  <span v-if="isWithFineTuner(item)" class="fine-tuner">
                    {{ getOracleTypeName(item) === 'SATORI' ? $t('base.chainlinkWithFineTuner') : $t('base.withFineTuner') }}
                  </span>
                  <span class="oracle-item-split oracle-arrow" v-if="index < (oracleDetail.oracles.length - 1)"> → </span>
                </span>
              </span>

              <div>
                <a class='address' :href="oracleAddress | etherBrowserAddressFormatter" target="_blank">
                  {{ oracleAddress | ellipsisMiddle }}
                </a>
                <McCopy :content="oracleAddress" :tooltip="false"/>
              </div>
              <div class="warn-box">
                <span class='warn' v-if='this.isOracleUnregistered'>
                  <i class="iconfont icon-warning-triangle"></i>
                  <span class='unknown-text'>
                    {{ $t('perpetualRiskNotice.unknownOracle') }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class='dont-show'>
          <el-checkbox v-model="isCheckKnow">{{ $t('orderConfirmDialog.donShow') }}</el-checkbox>
        </div>

        <div class='confirm-btn'>
          <el-button @click='confirmEvent'>
            {{ $t('base.confirm') }}
          </el-button>
        </div>
      </div>

    </el-dialog>
  </div>
</template>

<script lang='ts'>
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { setLocalStorage } from '@/utils'
import { McLoading, McCopy } from '@/components'
import PerpetualRiskNoticeMixin from '@/business-components/PerpetualRiskNotice/PerpetualRiskNoticeMixin'
import { RISK_NOTICE_POP_UP } from '@/const'

@Component({
  components: {
    McLoading,
    McCopy,
  },
})
export default class PerpetualRiskNotice extends Mixins(PerpetualRiskNoticeMixin) {
  private showClo: boolean = false

  init() {
    this.active = true
  }

  confirmEvent() {
    if (this.isCheckKnow) {
      setLocalStorage(`${RISK_NOTICE_POP_UP}-${this.symbol}-${this.address}`, true)
    }
    this.isCheckKnow = false
    this.currentVisible = false
    this.$emit('close')
  }

  @Watch('currentVisible', { immediate: true })
  @Watch('provider')
  async onOracle() {
    if (!this.currentVisible) {
      return
    }
    await this.loadOracleBaseInfo()
  }

}
</script>

<style scoped lang='scss'>
@import '~@mcdex/style/common/var';

::v-deep .el-dialog {
  border-radius: 12px;
  padding: 16px;

  .el-dialog__header {
    padding: 0 0 28px;
  }

  .el-dialog__body {
    padding: 0;
  }

  .head {
    display: flex;

    .warn-svg {
      display: flex;
      justify-content: center;
      align-items: center;

      img {
        width: 24px;
      }
    }

    .head-title {
      margin-left: 8px;
      font-size: 18px;
      line-height: 24px;
    }
  }
}

.mc-loading {
  height: 441px;
}

.mc-copy {
  margin-left: 6px;
}

.text {
  width: 100%;
  font-size: 14px;
  line-height: 20px;
  white-space: normal;
  word-break: break-word;
}

.container {
  border-radius: 12px;
  margin-top: 12px;
  padding: 16px;

  .title {
    font-size: 16px;
    line-height: 24px;
  }

  .sub-title {
    display: block;
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 4px;
  }

  .flex-box {
    height: 24px;
    display: flex;
    align-items: center;
    margin-top: 4px;

    .token-img {
      width: 24px;
      height: 24px;
      margin-right: 8px;
    }

    ::v-deep img {
      width: 24px;
      height: 24px;
    }
  }

  .name {
    font-size: 16px;
    line-height: 24px;
    margin-right: 8px;
  }

  .info-item {
    margin-top: 12px;

    .oracle-name{
      padding-right: 8px;

      span {
        line-height: 24px;
        font-size: 16px;
        vertical-align: middle;
      }

      .fine-tuner {
        display: inline-block;
        font-size: 12px;
        line-height: 16px;
        color: var(--mc-color-primary);
        background-color: rgb($--mc-color-primary, 0.1);
        padding: 3px 8px;
        border-radius: var(--mc-border-radius-m);
        border: 1px solid rgb($--mc-color-primary, 0.1);
      }

      .oracle-item-split {
        margin: 0 8px;
        font-size: 16px;

        i {
          transform: rotate(0.25turn);
          display: inline-block
        }
      }

      .oracle-arrow {
        font-size: 19px;
      }
    }

    .address {
      &:hover {
        text-decoration: underline;
      }
    }
  }

  .oracle {
    white-space: normal;
    word-break: break-word;

    .oracle-flex-box {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      line-height: 24px;

      .oracle-img {
        margin-right: 8px;
        line-height: 1;
        width: 24px;
        height: 24px;
      }
    }
  }

  .warn-box {
    padding: 4px 0;

    .warn {
      height: 24px;
      border-radius: 8px;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      line-height: 1;
      margin-left: 4px;

      i {
        font-size: 16px;
        height: 16px;
      }

      .unknown-text {
        margin-left: 4px;
        font-size: 12px;
        line-height: 16px;
      }
    }
  }
}

.dont-show {
  margin-top: 24px;
  ::v-deep.el-checkbox {
    span {
      font-size: 14px;
      line-height: 20px;
    }
  }
}

.confirm-btn {
  margin-top: 12px;
  .el-button {
    width: 100%;
    height: 56px;
    border-radius: 12px;
  }
}
</style>

<style scoped lang="scss">
@import '~@mcdex/style/common/var';

.satori-fantasy {
  .container {
    background: var(--mc-background-color-darkest);

    .sub-title {
      color: var(--mc-text-color);
    }

    .info-item {
      .address {
        color: var(--mc-color-primary);
      }
    }

    .warn-box {
      .warn {
        background: rgba($--mc-color-warning, 0.1);
        border: 1px solid rgba($--mc-color-warning, 0.1);

        i {
          color: var(--mc-color-warning);
        }

        .unknown-text {
          color: var(--mc-color-warning);
        }
      }
    }
  }

  .dont-show {
    ::v-deep.el-checkbox {
      span {
        color: var(--mc-text-color-white);
      }

      .el-checkbox__input {
        border-color: var(--mc-text-color);
      }
    }
  }
}

</style>
