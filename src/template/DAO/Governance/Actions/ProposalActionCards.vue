<template>
  <div class="proposal-action-cards">
    <div v-for="(actionItem, index) in actions" class="action-item">
      <div class="proposal-action-card-item" :class="{'repeated-action-error': repeatedActionsIndex.includes(index)}" :key="index">
        <div class="header">
          <div class="title">{{ $t('dao.governancePage.action') }} {{ index+1 }}</div>
          <div class="button">
            <el-button size="mini" type="secondary" round @click="onDeleteAction(index)" :disabled="disableAction || index === 0">
              {{ $t('base.delete') }}
            </el-button>
          </div>
        </div>
        <div class="action-container">
          <div class="label-line">
            <span>{{ $t('dao.actionCard.actionType') }}</span>
          </div>
          <div class="action-type-select">
            <el-select :value="actionItem.selectActionType" @change="(event)=> changeActionSelectType(index, event)" :placeholder="$t('dao.actionCard.selectActionType')" size="medium" :disabled="disableAction">
              <el-option v-for="item in actionTypeOptions" :key="`${item.value}-${index}`" :label="item.label" :value="item.value">
              </el-option>
            </el-select>
          </div>
          <TransferVaultAssetsAction v-if="actionItem.selectActionType === actionTypes.TransferVaultAssets" :action-index="index" :action-default-datas="actionItem.datas" :disable-action="disableAction" @update="updateActionDatas" @validate="updateActionValidateState" :key="index" />
          <MintSATORIAction v-if="actionItem.selectActionType === actionTypes.MintSATORI" :action-index="index" :action-default-datas="actionItem.datas" :disable-action="disableAction" @update="updateActionDatas" @validate="updateActionValidateState" :key="index" />
          <SetLiquidityMiningRateAction v-if="actionItem.selectActionType === actionTypes.SetLiquidityMiningRate" :action-index="index" :action-default-datas="actionItem.datas" :disable-action="disableAction" @update="updateActionDatas" @validate="updateActionValidateState" :key="index" />
          <SetUniswapMiningRateAction v-if="actionItem.selectActionType === actionTypes.SetUniswapMiningRate" :action-index="index" :action-default-datas="actionItem.datas" :disable-action="disableAction" @update="updateActionDatas" @validate="updateActionValidateState" :key="index" />
          <SetStakingMiningRateAction v-if="actionItem.selectActionType === actionTypes.SetSATORIStakingMiningRate" :action-index="index" :action-default-datas="actionItem.datas" :disable-action="disableAction" @update="updateActionDatas" @validate="updateActionValidateState" :key="index" />
          <SetMiningSupplyAction v-if="actionItem.selectActionType === actionTypes.SetMiningSupply" :action-index="index" :action-default-datas="actionItem.datas" :disable-action="disableAction" @update="updateActionDatas" @validate="updateActionValidateState" :key="index" />
          <CustomAction v-if="actionItem.selectActionType === actionTypes.Custom" :action-index="index" :action-default-datas="actionItem.datas" :disable-action="disableAction" @update="updateActionDatas" @validate="updateActionValidateState" :key="index" />
        </div>
      </div>
      <div class="repeated-action-error-msg" v-if="repeatedActionsIndex.includes(index)">
        {{ $t('dao.actionCard.repeatedActionMsg') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { CombinedDaoActionTypes } from '@/template/components/DAO/lowLevelDaoProposal'
import {
  DaoActionData,
  EmptyCustomActionDatas,
  EmptyMintSATORIActionDatas,
  EmptySetLiquidityMiningRateActionDatas,
  EmptySetSATORIStakingMiningRateActionDatas,
  EmptySetMiningSupplyActionDatas,
  EmptySetUniswapMiningRateActionDatas,
  EmptyTransferVaultAssetsActionDatas,
} from '@/template/components/DAO/Actions/types'
import TransferVaultAssetsAction from './TransferVaultAssetsAction.vue'
import MintSATORIAction from './MintSatoriAction.vue'
import SetLiquidityMiningRateAction from './SetLiquidityMiningRateAction.vue'
import SetUniswapMiningRateAction from './SetUniswapMiningRateAction.vue'
import SetMiningSupplyAction from './SetMiningSupplyAction.vue'
import SetStakingMiningRateAction from './SetStakingMiningRateAction.vue'
import CustomAction from './CustomAction.vue'

function getDefaultEmptyActionData() {
  return {
    selectActionType: CombinedDaoActionTypes.TransferVaultAssets,
    datas: { ...EmptyTransferVaultAssetsActionDatas },
  }
}

@Component({
  components: {
    TransferVaultAssetsAction,
    MintSATORIAction,
    SetLiquidityMiningRateAction,
    SetUniswapMiningRateAction,
    SetStakingMiningRateAction,
    SetMiningSupplyAction,
    CustomAction,
  },
})
export default class ProposalActionCards extends Vue {
  @Prop({ default: () => [] }) repeatedActionsIndex!: number[]
  @Prop({ default: false }) disableAction!: boolean

  private actions: Array<DaoActionData> = [getDefaultEmptyActionData()]
  private actionValidatorState: Array<boolean> = [false]

  private actionTypes = CombinedDaoActionTypes

  get actionTypeOptions() {
    return [
      {
        value: CombinedDaoActionTypes.TransferVaultAssets,
        label: this.$t('dao.actionCard.transferVaultAssets').toString(),
      },
      {
        value: CombinedDaoActionTypes.MintSATORI,
        label: this.$t('dao.actionCard.mintSATORI').toString(),
      },
      {
        value: CombinedDaoActionTypes.SetLiquidityMiningRate,
        label: this.$t('dao.actionCard.setLiquidityMiningRate').toString(),
      },
      // {
      //   value: CombinedDaoActionTypes.SetUniswapMiningRate,
      //   label: this.$t('dao.actionCard.setSATORIUniswapMiningRate').toString()
      // },
      {
        value: CombinedDaoActionTypes.SetSATORIStakingMiningRate,
        label: this.$t('dao.actionCard.setSATORIStakingMiningRate').toString(),
      },
      {
        value: CombinedDaoActionTypes.SetMiningSupply,
        label: this.$t('dao.actionCard.setMiningSupply').toString(),
      },
      {
        value: CombinedDaoActionTypes.Custom,
        label: this.$t('base.custom').toString(),
      },
    ]
  }

  get allActionValidateState(): boolean {
    for (let i = 0; i < this.actionValidatorState.length; i++) {
      if (!this.actionValidatorState[i]) {
        return false
      }
    }
    return true
  }

  addAction() {
    this.actions.push(getDefaultEmptyActionData())
    this.actionValidatorState.push(false)
  }

  onDeleteAction(index: number) {
    this.actions.splice(index, 1)
    this.actionValidatorState.splice(index, 1)
  }

  getActionEmptyDatas(ty: CombinedDaoActionTypes) {
    switch (ty) {
      case CombinedDaoActionTypes.TransferVaultAssets:
        return { ...EmptyTransferVaultAssetsActionDatas }
      case CombinedDaoActionTypes.MintSATORI:
        return { ...EmptyMintSATORIActionDatas }
      case CombinedDaoActionTypes.SetLiquidityMiningRate:
        return { ...EmptySetLiquidityMiningRateActionDatas }
      case CombinedDaoActionTypes.SetUniswapMiningRate:
        return { ...EmptySetUniswapMiningRateActionDatas }
      case CombinedDaoActionTypes.SetSATORIStakingMiningRate:
        return { ...EmptySetSATORIStakingMiningRateActionDatas }
      case CombinedDaoActionTypes.SetMiningSupply:
        return { ...EmptySetMiningSupplyActionDatas }
      case CombinedDaoActionTypes.Custom:
        return { ...EmptyCustomActionDatas }
    }
    return null
  }

  changeActionSelectType(index: number, value: CombinedDaoActionTypes) {
    this.$set(this.actions, index, {
      ...this.actions[index],
      selectActionType: value,
      datas: this.getActionEmptyDatas(value),
    })
    this.updateActionValidateState(index, false)
  }

  updateActionDatas(index: number, datas: any) {
    this.$set(this.actions, index, {
      ...this.actions[index],
      datas: datas,
    })
    this.updateActionValidateState(index, false)
  }

  updateActionValidateState(index: number, state: boolean) {
    this.$set(this.actionValidatorState, index, state)
  }

  @Watch('actions', { immediate: true, deep: true })
  onActionsChanged() {
    this.$emit('updateActions', this.actions)
  }

  @Watch('allActionValidateState', { immediate: true })
  onActionValidatorStateChanged() {
    this.$emit('updateActionsState', this.allActionValidateState)
  }
}
</script>

<style scoped lang="scss">
@import './actions.scss';

.proposal-action-cards {
  .action-item {
    margin-bottom: 20px;

    .proposal-action-card-item {
      min-height: 291px;
      width: 750px;
      background: #131a31;
      border-radius: 8px;
      padding: 22px 20px;
      margin-bottom: 10px;

      .header {
        display: flex;
        justify-content: space-between;

        .title {
          font-size: 18px !important;
          font-weight: 700;
          color: var(--mc-text-color-white);
        }

        .button {
          .el-button {
            width: 85px;
          }
        }
      }
    }

    .repeated-action-error {
      border: 1px solid var(--mc-color-error);
    }

    .repeated-action-error-msg {
      color: var(--mc-color-error);
      font-size: 14px;
    }
  }
}
</style>
