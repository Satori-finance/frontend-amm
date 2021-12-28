<template>
  <div v-if="isShowSATORISerialA" class="mcb-serial">
    <div class="panel-item-header">
      <div class="title">
        {{ $t('mcbSale.serial') }}
      </div>
    </div>
    <div class="table-container">
      <McLoading :show-loading="loading" :min-show-time="300" :hide-content="true">
        <div class="table-container">
          <table class="mc-data-table">
            <thead>
              <tr>
                <th>{{ $t('mcbSale.allocation') }}</th>
                <th>{{ $t('mcbSale.vested') }}</th>
                <th>{{ $t('base.claimable') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span v-if='!isConnectedWallet'>---</span>
                  <span v-else>{{ allocation || 0 | bigNumberFormatter }} SATORI</span>
                </td>
                <td>
                  <span v-if='!isConnectedWallet'>---</span>
                  <span v-else>{{ claimedBalance || 0 | bigNumberFormatter }} SATORI</span>
                </td>
                <td>
                  <span v-if='!isConnectedWallet'>---</span>
                  <span v-else class="text">{{ claimable || 0 | bigNumberFormatterTruncateByPrecision(8, 1, 2) }} SATORI</span>
                  <el-button size="small" plain class="operation-btn" :class="disable?'disable-btn':''"
                             :loading="claiming" @click="claimEvent">
                    {{ $t('base.claim') }}
                  </el-button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </McLoading>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { McLoading } from '@/components'
import SatoriSerialMixin from '@/template/Wallet/SatoriSerialMixin'

@Component({
  components: {
    McLoading,
  },
})
export default class SATORISerial extends Mixins(SatoriSerialMixin) {
  async claimEvent() {
    try {
      await this.claim()
    } catch (e) {
      this.$notify({
        title: this.$t(e.helpCaptionKey).toString(),
        message: this.$t(e.helpKey, { message: e.message }).toString(),
        type: 'error',
        position: 'bottom-right',
        customClass: 'is-error',
      })
    }
  }
}
</script>

<style scoped lang="scss">
@import './wallet.scss';

.mcb-serial {
  .table-container {
    border-radius: 12px;
    padding: 0 1px;

    table {
      width: 100%;
      border: 1px solid;
      border-radius: 12px;
      border-collapse: collapse;
      border-style: hidden;
      overflow: hidden;
      font-size: 14px;

      tr {
        text-align: left;

        span,th {
          padding-left: 16px;
        }

        ::v-deep.el-button {
          padding: 0;
          text-align: center;
          span {
            padding: 0;
            text-align: center;
          }

          .el-icon-loading {
            padding: 0;
          }
        }
      }

      td {
        width: 33%;
      }

      .text {
        margin-right: 12px;
      }
    }
  }

  .operation-btn{
    border-radius: 8px;
    font-size: 12px;
    line-height: 16px;
    width: 80px;
    height: 32px;
  }

  .disable-btn {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy {
  .mcb-serial {
    .table-container {
      table {
        border-color: var(--mc-border-color);
        -webkit-box-shadow: 0 0 0 1px var(--mc-border-color);
        box-shadow: 0 0 0 1px var(--mc-border-color);

        tbody {
          background-color: var(--mc-background-color-dark);
        }
      }
    }
  }
}

</style>
