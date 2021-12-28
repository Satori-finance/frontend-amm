<template>
  <div class="proposal-details">
    <div class="detail-content">
      <div class="title">{{ $t('governance.proposalDetail') }}</div>
      <div class="body overview">
        <McLoading :show-loading="true" :hide-content="true">
          <div v-if="proposalOverview === ''">
            <McNoData :label="$t('base.empty')"></McNoData>
          </div>
          <div v-else>
            <MarkdownView :body='proposalOverview' />
          </div>
        </McLoading>
      </div>
    </div>
    <div class="detail-content">
      <div class="title">{{ $t('dao.governancePage.action') }}</div>
      <div class="body actions">
        <McLoading :show-loading="true" :hide-content="true">
          <div v-if="actions.length === 0">
            <McNoData></McNoData>
          </div>
          <div v-else>
            <div class="action-item" v-for="(action, index) in actions" :key="index">
              <span class="label">{{ $t('dao.governancePage.action') }} {{ action.id }}</span>
              <span class="value">{{ action.details }}</span>
            </div>
          </div>
        </McLoading>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import {
  DaoActionBase,
  DaoProposalDescription,
  DaoProposalIpfsStoreData
} from '@/template/components/DAO/daoProposalMixin'
import { MarkdownView, McNoData } from '@/components'
import McLoading from '@/components/McLoading.vue'

interface ActionItem {
  id: number
  details: string
}

@Component({
  components: {
    MarkdownView,
    McNoData,
    McLoading,
  }
})
export default class ProposalDetails extends Vue {
  @Prop({ required: true }) proposalIpfsStore!: DaoProposalIpfsStoreData | null
  @Prop({ required: true }) proposalActions!: DaoActionBase[]
  @Prop({ required: true }) proposalDescription!: DaoProposalDescription | null
  @Prop({ required: true }) loading!: boolean

  get proposalOverview(): string {
    return this.proposalIpfsStore?.overview || ''
  }

  get actions(): ActionItem[] {
    let result: ActionItem[] = []
    this.proposalActions.forEach((item, index) => {
      result.push({
        id: index + 1,
        details: item.details(this)
      })
    })
    return result
  }
}
</script>

<style lang="scss" scoped>
.proposal-details {
  .mc-loading {
    height: 56px;

    ::v-deep {
      .mc-loading__mask {
        background: transparent !important;
      }
    }
  }
  .detail-content {
    margin-bottom: 32px;

    .title {
      font-size: 20px;
      font-weight: 700;
      color: var(--mc-text-color-white);
      margin-bottom: 16px;
    }

    .body {
      padding: 16px;
      width: 100%;
      border-radius: 12px;
      background: var(--mc-background-color);
    }
  }

  .overview {
    font-size: 14px;
    min-height: 86px;
  }

  .actions {
    min-height: 50px;

    .action-item {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      min-height: 50px;
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: var(--mc-text-color);
        width: 24%;
      }

      .value {
        color: var(--mc-text-color-white);
        width: 76%;
        word-wrap:break-word;
      }
    }
  }
}
</style>
