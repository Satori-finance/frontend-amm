<template>
  <div class="proposal-details">
    <div class="detail-title">
      <div class="title">
        {{ $t('governance.proposalDetail') }}
      </div>
      <div class="links">
        <span class="link-item" v-if="ipfsUrlLink !== ''">
          <a :href="ipfsUrlLink" target="_blank">{{ $t('dao.governancePage.ipfsLink') }}</a>
        </span>
        <span class="link-item" v-if="forumUrlLink !== ''">
          <a :href="forumUrlLink" target="_blank">{{ $t('dao.governancePage.mcdexForumLink') }}</a>
        </span>
      </div>
    </div>
    <div class="detail-content">
      <MarkdownView :body='proposalOverview' />
    </div>
    <div class="detail-actions">
      <div class="action-title">
        {{ $t('dao.governancePage.action') }}
      </div>
      <div class="action-table-container">
        <table class="mc-data-table">
          <thead>
            <tr>
              <th>{{ $t('dao.governancePage.action') }}</th>
              <th>{{ $t('dao.details') }}</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr class="loading-data">
              <td colspan="2">
                <McLoading :show-loading="loading"></McLoading>
              </td>
            </tr>
          </tbody>
          <tbody v-if="!loading">
            <tr v-for="(action, index) in actions" :key="index">
              <td>{{ $t('dao.governancePage.action') }} {{ action.id }}</td>
              <td>{{ action.details }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import {
  DaoActionBase,
  DaoProposalDescription,
  DaoProposalIpfsStoreData,
} from '@/template/components/DAO/daoProposalMixin'
import { MarkdownView, McLoading } from '@/components'
import { formatIPFSUrlLink } from '@/utils'

interface ActionItem {
  id: number
  details: string
}

@Component({
  components: {
    MarkdownView,
    McLoading,
  }
})
export default class ProposalDetails extends Vue {
  @Prop({ required: true }) proposalIpfsStore!: DaoProposalIpfsStoreData | null
  @Prop({ required: true }) proposalActions!: DaoActionBase[]
  @Prop({ required: true }) proposalDescription!: DaoProposalDescription | null
  @Prop({ required: true, default: false }) loading !: boolean

  get proposalOverview(): string {
    return this.proposalIpfsStore?.overview || ''
  }

  get ipfsUrlLink(): string {
    const hash = this.proposalDescription?.ipfsHash || ''
    if (hash === '') {
      return ''
    }
    return formatIPFSUrlLink(hash)
  }

  get forumUrlLink(): string {
    return this.proposalIpfsStore?.forumLink || ''
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

<style scoped lang="scss">
.proposal-details {
  width: 805px;

  .detail-title {
    display: flex;
    justify-content: space-between;

    .title {
      font-size: 18px !important;
      color: var(--mc-text-color-white);
      font-weight: 700;
    }

    .links {
      font-size: 14px;
      color: var(--mc-color-primary);
      text-decoration: underline;

      .link-item {
        margin: 0 12px;
      }
    }
  }

  .detail-content {
    margin-top: 25px;
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
    color: var(--mc-text-color-white);
  }

  .detail-actions {
    margin-top: 25px;

    .action-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--mc-text-color-white);
      margin-bottom: 25px;
    }

    .action-table-container {
      table {
        width: 100%;

        thead {
          text-align: center;
        }

        tr {
          font-size: 16px;
          font-weight: 400;
          height: 46px;
          border: 1px solid var(--mc-border-color);
        }

        td:nth-of-type(1) {
          width: 22%;
          text-align: center;
        }
        td:nth-of-type(2) {
          font-size: 14px;
          width: 78%;
        }

        .loading-data {
          height: 100px;
        }
      }
    }
  }
}
</style>
