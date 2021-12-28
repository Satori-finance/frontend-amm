<template>
  <van-popup
    class="tunable-info-popup safe-area-inset-bottom"
    round closeable v-model="currentVisible"
    position="bottom"
    safe-area-inset-bottom
    get-container="body">
    <div class="title">{{ $t('tunableOracleDialog.title') }}</div>
    <div class="oracle-list">
      <div class="oracle-item" v-for="(item, index) in tunableOracles" :key="index">
        <div class="row">
          <div class="symbol">
            <div class="label">
              <svg class="svg-icon" aria-hidden="true"
                   v-if="getOracleTypeName(item.oracle.oracle) === 'Chainlink'">
                <use :xlink:href="`#icon-chainlink`"></use>
              </svg>
              <svg class="svg-icon" aria-hidden="true" v-if="getOracleTypeName(item.oracle.oracle) === 'Band'">
                <use :xlink:href="`#icon-band`"></use>
              </svg>
              <svg class="svg-icon" aria-hidden="true"
                   v-if="getOracleTypeName(item.oracle.oracle) === 'SATORI'">
                <use :xlink:href="`#icon-token-mcb`"></use>
              </svg>
              {{ item.oracle.underlyingAsset }}/{{ item.oracle.collateral }}
              <a class="route-address" :href="item.oracle.oracle | etherBrowserAddressFormatter"><i
                class="iconfont icon-view"></i></a>
            </div>
            <div v-if="isWithFineTuner(item)" class="fine-tuner value">
              {{
                getOracleTypeName(item.oracle.oracle) === 'SATORI' ? $t('base.chainlinkWithFineTuner') : $t('base.withFineTuner')
              }}
            </div>
          </div>
          <div class="external">
            <div class="label">
              <span>{{ $t('tunableOracleDialog.external') }}</span>
            </div>
            <div class="value">
              <span class="external-oracle">{{ item.externalOracle | ellipsisMiddle }}</span>
              <McMCopy :content="item.externalOracle"></McMCopy>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="deviation">
            <div class="label">{{ $t('tunableOracleDialog.deviation') }}</div>
            <div class="value" v-if="item.deviation">{{
                item.deviation.times(100) | bigNumberFormatterByPrecision(2)
              }}%
            </div>
          </div>
          <div class="timeout">
            <div class="label">{{ $t('tunableOracleDialog.timeout') }}</div>
            <div class="value" v-if="item.timeout">{{ item.timeout }}s</div>
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { DumOracleRouterPath, TunableOracleInfo } from '@/type'
import { getOracleInfo, OracleVendor } from '@/config/oracle'
import { McMCopy } from '@/mobile/components'

@Component({
  components: {
    McMCopy,
  },
})
export default class TunableInfoPopup extends Vue {
  @Prop({ default: false }) visible!: boolean
  @Prop({ default: () => [] }) tunableOracles!: (TunableOracleInfo & { oracle: DumOracleRouterPath | null } | null)[]

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  getOracleTypeName(oracleAddress: string): string {
    const info = getOracleInfo(oracleAddress)
    if (!info) {
      return this.$t('base.custom').toString()
    }
    return OracleVendor[info?.vendor]
  }

  isWithFineTuner(tunableInfo?: TunableOracleInfo | null) {
    return !!(tunableInfo && tunableInfo.fineTuner && Number(tunableInfo.fineTuner) !== 0)
  }
}
</script>

<style lang="scss" scoped>
@import '~@mcdex/style/common/fantasy-var';

.tunable-info-popup {

  & > .title {
    padding: 16px;
    font-size: 18px;
    line-height: 20px;
  }

  .oracle-list {
    padding: 0 16px;

    .oracle-item {
      margin: 16px 0;
      font-size: 14px;
      line-height: 24px;

      &:not(:last-of-type) {
        border-bottom: 1px solid #1A2136;
      }
    }

    .row {
      margin: 16px 0;
      display: flex;
      justify-content: space-between;

      & > div {
        &:last-of-type {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        &.symbol .label {
          color: var(--mc-text-color-white);
        }

        &.external .value {
          color: var(--mc-color-primary);

          .mc-copy-container {
            margin-left: 4px;
          }
        }
      }

      .label {
        color: var(--mc-text-color);
        display: flex;
        align-items: center;

        .svg-icon {
          height: 24px;
          width: 24px;
          margin-right: 4px;
        }

        .route-address {
          color: var(--mc-text-color);
          font-size: 16px;
          margin-left: 4px;

          &:hover {
            color: #8694b9;
          }
        }
      }

      .value {
        &.fine-tuner {
          font-size: 12px;
          line-height: 16px;
          color: var(--mc-color-primary);
          background-color: rgb($--mc-color-primary, 0.1);
          padding: 3px 8px;
          border-radius: var(--mc-border-radius-m);
          border: solid 1px rgb($--mc-color-primary, 0.1);
        }
      }
    }
  }
}
</style>
