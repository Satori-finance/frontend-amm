<template>
  <el-dialog custom-class="tunable-oracle-dialog" :title="dialogTitle" :visible.sync="currentVisible" top="0"
             append-to-body>
    <div class="table-box">
      <table class="mc-data-table">
        <thead>
        <tr>
          <th class="is-left">
            <span>{{ $t('tunableOracleDialog.route') }}</span>
          </th>
          <th class="is-left">
            <span>{{ $t('tunableOracleDialog.external') }}</span>
          </th>
          <th class="is-left">
            <span>{{ $t('tunableOracleDialog.deviation') }}</span>
          </th>
          <th class="is-right">
            <span>{{ $t('tunableOracleDialog.timeout') }}</span>
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="item in tunableOracles" v-if="item">
          <td class="is-left">
            <div class="cell">
              <svg class="svg-icon" aria-hidden="true"
                   v-if="getOracleTypeName(item) === 'Chainlink'">
                <use :xlink:href="`#icon-chainlink`"></use>
              </svg>
              <svg class="svg-icon" aria-hidden="true" v-if="getOracleTypeName(item) === 'Band'">
                <use :xlink:href="`#icon-band`"></use>
              </svg>
              <svg class="svg-icon" aria-hidden="true"
                   v-if="getOracleTypeName(item) === 'SATORI'">
                <use :xlink:href="`#icon-token-mcb`"></use>
              </svg>
              {{ item.oracle.underlyingAsset }}/{{ item.oracle.collateral }}
              <span v-if="isWithFineTuner(item)" class="fine-tuner">
                {{ getOracleTypeName(item) === 'SATORI' ? $t('base.chainlinkWithFineTuner') : $t('base.withFineTuner') }}
              </span>
              <el-link
                class="link-icon"
                :underline="false"
                target="_blank"
                :href="item.oracle.oracle | etherBrowserAddressFormatter"
              >
                <i class="iconfont icon-view"></i>
              </el-link>
            </div>
          </td>
          <td class="is-left">
            <div class="cell" v-if="item.externalOracle">
              <span class="external-oracle">{{ item.externalOracle | ellipsisMiddle }}</span>
              <McCopy :content="item.externalOracle"></McCopy>
            </div>
          </td>
          <td class="is-left">
            <template v-if="item.deviation">
              {{item.deviation.times(100) | bigNumberFormatterByPrecision(2)}}%
            </template>
          </td>
          <td class="is-right">
            <template v-if="item.timeout">
              {{item.timeout}}s
            </template>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { DumOracleRouterPath, TunableOracleInfo } from '@/type'
import { McCopy } from '@/components'
import { OracleVendor, getOracleInfo } from '@/config/oracle'

@Component({
  components: {
    McCopy,
  }
})
export default class TunableInfoDialog extends Vue {
  @Prop({ default: false }) visible!: boolean
  @Prop({ default: () => [] }) tunableOracles!: (TunableOracleInfo & { oracle: DumOracleRouterPath | null } | null)[]

  get dialogTitle() {
    return this.$t('tunableOracleDialog.title')
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  dialogClosed() {
    this.$emit('update:visible', false)
  }

  getOracleTypeName(item: (TunableOracleInfo & { oracle: DumOracleRouterPath | null })): string {
    const info = getOracleInfo(item.externalOracle || '') || getOracleInfo(item?.oracle?.oracle || '')
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
<style lang="scss">
.el-dialog.tunable-oracle-dialog {
  height: auto;
  width: 624px;
  min-height: auto;
  background: #12182c;
  border: 1px solid #242d43;
  border-radius: 12px;
  box-sizing: border-box;

  .el-dialog__body {
    padding-top: 20px;
    padding-left: 16px;
    padding-right: 16px;

    .el-dialog {
      padding: 16px 0;
    }
  }
}
</style>
<style lang="scss" scoped>
@import '~@mcdex/style/common/fantasy-var';

.mc-data-table {
  font-size: 14px;
  line-height: 20px;
  border-collapse: collapse;
  width: 100%;

  th {
    height: 36px;
    background-color: var(--mc-background-color-dark);
    color: var(--mc-text-color);
  }

  tr {
    border-bottom: solid 1px #1A2136;
  }

  td {

  }

  .cell {
    display: flex;
    align-items: center;
  }

  tbody td {
    height: 56px;
  }

  thead th,
  tbody td {
    margin: 0 8px;

    &:nth-child(1) {
      width: 50%;
    }

    &:nth-child(2) {
      width: 25%;
    }

    &:nth-child(3) {
      width: 12%;
    }

    &:nth-child(4) {
      width: 13%;
    }
  }

  .svg-icon {
    height: 24px;
    width: 24px;
    margin-right: 4px;
  }

  .fine-tuner {
    margin-left: 4px;
    font-size: 12px;
    line-height: 14px;
    margin-right: 4px;
    color: var(--mc-color-primary);
    background-color: rgb($--mc-color-primary, 0.1);
    padding: 4px 8px;
    border-radius: var(--mc-border-radius-m);
  }

  .link-icon {
    color: var(--mc-text-color);
    font-size: 16px;

    &:hover {
      color: #8694b9;
    }
  }

  .external-oracle {
    color: var(--mc-color-primary);
  }

  .mc-copy {
    margin-left: 4px;
  }
}
</style>
