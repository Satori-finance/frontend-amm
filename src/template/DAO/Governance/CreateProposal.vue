<template>
  <div class="create-dao-proposal">
    <BaseCardFrame :title="$t('dao.satoriDao')">
      <template slot="title">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ name: 'daoMain' }">{{ $t('dao.satoriDao') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('dao.createProposal') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>
      <template slot="content">
        <div class="header">
          <span class="left">
            {{ $t('dao.governancePage.createProposal') }}
          </span>
          <span class="right">
            <div>
              {{ $t('dao.governancePage.proposalThreshold') }}:
              {{ proposalThresholdValue | bigNumberFormatter(votesDecimals) }} {{ $t('governance.votes') }}
            </div>
            <div v-if="accountAddress">
              {{ $t('dao.myVotes') }}: {{ accountVotes | bigNumberFormatter(votesDecimals) }}
              {{ $t('governance.votes') }}
            </div>
          </span>
        </div>
        <div class="content-container">
          <el-form
            size="large"
            :model="createBaseForm"
            :rules="createBaseFormRules"
            ref="createBaseForm"
            :inline-message="true"
            @submit.native.prevent
          >
            <div class="step-item">
              <div class="title-label">{{ $t('dao.governancePage.title') }}</div>
              <div class="content-body">
                <el-form-item prop="title">
                  <el-input v-model="createBaseForm.title" :maxlength="50" :disabled="disableInput"></el-input>
                </el-form-item>
              </div>
            </div>
            <div class="step-item">
              <div class="title-label">{{ $t('dao.governancePage.overview') }}</div>
              <div class="content-body">
                <el-form-item prop="overview">
                  <el-input
                    type="textarea"
                    v-model="createBaseForm.overview"
                    :maxlength="5000"
                    show-word-limit
                    :disabled="disableInput"
                  ></el-input>
                </el-form-item>
              </div>
            </div>
            <div class="step-item" v-if="createBaseForm.overview !== ''">
              <div class="title-label">{{ $t('base.preview') }}</div>
              <div class="content-body">
                <MarkdownView :body="createBaseForm.overview"></MarkdownView>
              </div>
            </div>
            <div class="step-item">
              <div class="title-label">{{ $t('dao.governancePage.forumLink') }}</div>
              <div class="content-body">
                <el-form-item prop="forumLink">
                  <el-input v-model="createBaseForm.forumLink" :disabled="disableInput"></el-input>
                </el-form-item>
              </div>
            </div>
          </el-form>
          <div class="step-item">
            <div class="title-label">{{ $t('dao.governancePage.action') }}</div>
            <div class="action-card-item">
              <ProposalActionCards
                ref="actionCards"
                @updateActions="updateActions"
                @updateActionsState="updateActionsState"
                :repeated-actions-index="repeatedActionsIndex"
                :disable-action="disableAction"
              />
            </div>
          </div>
          <div class="button-box">
            <div>
              <el-button
                size="large"
                type="secondary"
                class="add-button"
                @click="onAddAction"
                :disabled="disableAction"
              >
                {{ $t('dao.governancePage.addAction') }}
              </el-button>
            </div>
            <div class="create-button">
              <div class="create-steps">
                <McSteps ref="steps" :start-label="$t('dao.createProposalSteps.createTheProposal')">
                  <template #start="prop">
                      <template slot="content">
                        <span v-if="accountHasActiveProposal"
                              v-html="$t('dao.governancePage.hasActiveProposalTip')"></span>
                      </template>
                      <el-button size="large" class="create-button" @click="prop.start.start"
                                 :disabled="prop.start.success || createButtonIsDisabled">
                        {{ prop.start.label }}
                        <i v-if="prop.start.running" class="el-icon-loading"></i>
                      </el-button>
                      <template v-if="!isConnectedWallet">
                        <span class="warning-text">{{ $t('dao.governancePage.isConnectedTip') }}</span>
                      </template>
                      <template v-else>
                <span v-if="accountVotes.lt(proposalThresholdValue)" class="warning-text">{{
                    $t('dao.governancePage.hasEnoughVotesTip')
                  }}</span>
                        <span v-else-if="accountHasActiveProposal" class="warning-text">{{
                            $t('dao.governancePage.hasActiveProposalTip')
                          }}</span>
                      </template>
                  </template>
                  <McStepItem v-for="(step, index) in steps" :label="step.label" :action="step.action" :key="index"/>
                </McSteps>
              </div>
            </div>
          </div>
        </div>
      </template>
    </BaseCardFrame>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator'
import { BaseCardFrame, MarkdownView, McSteps, McStepItem } from '@/components'
import ProposalActionCards from './Actions/ProposalActionCards.vue'
import CreateDaoProposalMixin from '@/template/components/DAO/createDaoProposalMixin'

@Component({
  components: {
    BaseCardFrame,
    ProposalActionCards,
    MarkdownView,
    McSteps,
    McStepItem,
  },
})
export default class CreateDaoProposal extends Mixins(CreateDaoProposalMixin) {

  @Ref('steps') stepsElement!: McSteps | undefined

  get steps() {
    return [
      { label: this.$t('dao.createProposalSteps.verifyProposalAction'), action: this.verifyProposalAction.bind(this) },
      { label: this.$t('dao.createProposalSteps.uploadToIPFS'), action: this.uploadToIpfsActon.bind(this) },
      { label: this.$t('dao.createProposalSteps.createTheProposal'), action: this.createProposalAction.bind(this) },
    ]
  }

  private createBaseFormRules = {
    title: [],
    overview: [],
    forumLink: [
      { validator: this.validateForumLink, trigger: 'change' },
    ],
  }

  get creating(): boolean {
    return !!this.stepsElement?.running
  }

  get disableAction(): boolean {
    return (this.stepsElement?.active || 0) > 0 || this.creating
  }

  get disableInput(): boolean {
    return (this.stepsElement?.active || 0) > 0
  }

  validateForumLink(rule: any, value: string, callback: Function) {
    const val = this.createBaseForm.forumLink
    if (val === '') {
      callback()
    } else {
      if (this.isMcdexForumLink(val)) {
        callback()
      } else {
        callback(new Error(this.$t('commonErrors.inputError').toString()))
      }
    }
  }

  onAddAction() {
    (this.$refs.actionCards as any).addAction()
  }

  @Watch('actions', { immediate: true })
  onActionsChange() {
    this.stepsElement?.reset()
  }
}
</script>

<style scoped lang="scss">
.create-dao-proposal {
  width: 1440px;
  min-width: 1440px;
  margin: auto;
  display: flex;
  flex-direction: column;
  height: 100%;

  .base-card-frame {
    flex: 1;
  }

  ::v-deep .base-card-frame {
    height: 100%;

    .title {
      font-size: 14px;

      .el-breadcrumb__inner {
        color: var(--mc-text-color);
        font-weight: 400 !important;
        cursor: pointer;
      }
    }

    .content {
      padding: 30px;
      min-height: 970px;
    }
  }

  ::v-deep {
    .el-textarea__inner:hover {
      border-color: var(--mc-border-color);
    }
  }
}
</style>

<style lang="scss" scoped>
.create-dao-proposal {
  .header {
    display: flex;
    justify-content: space-between;
    font-size: 18px;
    font-weight: 700;
    color: var(--mc-text-color-white);
  }

  .content-container {
    margin-top: 60px;
    padding: 0 278px;

    .step-item {
      margin-bottom: 30px;

      .title-label {
        font-size: 16px;
        font-weight: 700;
        color: var(--mc-text-color-white);
        margin-bottom: 18px;
      }

      .content-body {
        ::v-deep {
          .el-textarea__inner, .el-input__inner {
            font-size: 16px;
            font-weight: 400;
          }

          .el-textarea .el-input__count {
            background: transparent;
            color: var(--mc-text-color);
          }

          .el-textarea__inner {
            min-height: 350px !important;
            font-family: normal;
            padding: 8px;
          }

          .el-textarea__inner:focus {
            border-color: var(--mc-border-color);
          }
        }

        .action-card-item {
          margin-bottom: 20px;
        }
      }
    }

    .button-box {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      margin-bottom: 60px;
      .create-button {
        .warning-text {
          color: var(--mc-color-warning);
          text-decoration: none;
          line-height: 20px;
          display: block;
          margin-top: 8px;
          font-size: 14px;
        }
      }
    }

    .add-button {
      width: 180px;
      background: var(--mc-background-color);
    }

    .create-button {
      width: 360px;
    }

    ::v-deep {
      .el-select {
        .el-input__inner {
          color: var(--mc-text-color-white);
        }
      }

      .el-input.is-disabled {
        .el-input__inner {
          cursor: not-allowed;
        }
      }

      .el-textarea.is-disabled {
        .el-textarea__inner {
          cursor: not-allowed;
          border: 1px solid var(--mc-background-color-dark);
          background-color: var(--mc-background-color-dark);
          color: var(--mc-text-color-white);
        }
      }
    }
  }
}
</style>

<style lang="scss">
.el-select-dropdown__empty {
  font-size: 14px;
  color: var(--mc-text-color);
}
</style>
