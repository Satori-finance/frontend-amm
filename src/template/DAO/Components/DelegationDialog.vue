<template>
  <div>
    <el-dialog
        :title="$t('delegationDialog.title')"
        append-to-body
        top="0"
        custom-class="is-small is-round delegation-dialog"
        :close-on-click-modal="false"
        :visible.sync="currentVisible"
        @closed="onClosed"
    >
      <div class="body">
        <div class="tip-box">{{ $t('delegationDialog.tip') }}</div>
        <!-- edit view -->
        <template v-if="currentViewType === 'edit'">
          <div class="input-box">
            <el-form
              size="large"
              :model="form"
              :rules="formRule"
              inline-message
              ref="form"
              @submit.native.prevent
            >
              <el-form-item prop="delegateAddress">
                <div class="input-item-box" :class="{'error': inputHasError}">
                  <el-input v-model="delegateAddress" size="large" :placeholder="$t('delegationDialog.delegateAddress')">
                    <template slot="suffix">
                    <span class="icon-box" @click="clearInput" v-if="delegateAddress!==''">
                      <svg class="svg-icon" aria-hidden="true">
                        <use :xlink:href="`#icon-clear`"></use>
                      </svg>
                    </span>
                    </template>
                  </el-input>
                </div>
              </el-form-item>
            </el-form>
            <div class="button-box">
              <el-button class="info" @click="onCancel">
                {{ $t('base.cancel') }}
              </el-button>
              <el-button @click="onConfirmEvent" size="large" :disabled="buttonIsDisabled"
                         v-if="currentViewType==='edit'" :loading="buttonIsLoading">
                {{ $t('base.confirm') }}
              </el-button>
            </div>
          </div>
        </template>
        <template v-if="currentViewType==='show'">
          <div class="view-box">
            <div class="left">
              <a :href="delegateToAddress | etherBrowserAddressFormatter" target="_blank">
                <span v-if="existingDelegationAlias === delegateToAddress">{{ delegateToAddress | ellipsisMiddle }}</span>
                <span v-else>{{ delegateToAddress | operatorNameFormatter }}</span>
                <i class="iconfont icon-view"></i>
              </a>
            </div>
            <div class="right">
              <i class="iconfont icon-edit edit-icon" @click="currentViewType='edit'"></i>
              <i class="iconfont icon-delete1 remove-icon" :class="{'is-disabled': buttonIsLoading}"
                 @click="onRemoveEvent"></i>
            </div>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import AsyncComputed from '@romancow/vue-async-computed-decorator'
import { ElForm } from 'element-ui/types/form'
import { ethers } from 'ethers'
import DelegateMixin from '@/template/components/DAO/delegateMixin'
import { VUE_EVENT_BUS, WALLET_EVENT } from '@/event'

@Component
export default class DelegationDialog extends Mixins(DelegateMixin) {
  @Prop({ default: false }) visible!: boolean

  private inputHasError: boolean = false
  private buttonIsLoading: boolean = false

  private formRule = {
    delegateAddress: [
      { validator: this.validateInputAddress, trigger: 'change' },
    ],
  }

  get currentVisible() {
    return this.visible
  }

  set currentVisible(val: boolean) {
    this.$emit('update:visible', val)
  }

  get buttonIsDisabled(): boolean {
    if (!this.formParamsValidatorIsPass || this.buttonIsLoading || this.delegateAddress === '' || !this.isConnectedWallet) {
      return true
    }
    return false
  }

  @AsyncComputed({
    watch: ['delegateAddress']
  })
  get formParamsValidatorIsPass() {
    return this.formValidator()
  }

  onConnectWallet() {
    VUE_EVENT_BUS.emit(WALLET_EVENT.ShowConnectWallet)
    this.currentVisible = false
  }

  onClosed() {
    this.form.delegateAddress = ''
  }

  onCancel() {
    if (this.hasDelegateUser) {
      this.currentViewType = 'show'
    } else {
      this.currentVisible = false
    }
  }

  validateInputAddress(rule: any, value: string, callback: Function) {
    this.inputHasError = false
    if (value === '') {
      callback()
      return
    }
    const isAddress = ethers.utils.isAddress(value)
    if (!isAddress) {
      this.inputHasError = true
      callback(new Error(this.$t('commonErrors.addressError').toString()))
      return
    }
    if (this.userAddress && this.userAddress !== '') {
      if (value.toLowerCase() === this.userAddress.toLowerCase()) {
        this.inputHasError = true
        callback(new Error(this.$t('delegationDialog.selfAddressError').toString()))
        return
      }
    }
    callback()
    return
  }

  clearInput() {
    this.delegateAddress = ''
  }

  async formValidator(): Promise<boolean> {
    const form = this.$refs.form as ElForm
    let valid: boolean
    try {
      valid = await form.validate()
    } catch(e) {
      return false
    }
    return valid
  }

  @Watch('currentVisible', { immediate: true })
  @Watch('signer', { immediate: true })
  async onCurrentVisible() {
    if(!this.currentVisible) {
      return
    }
    await this.initialDelegateData()
  }

  async onConfirmEvent() {
    if (!this.formParamsValidatorIsPass) {
      return
    }
    this.buttonIsLoading = true
    await this.onConfirmDelegate()
    this.buttonIsLoading = false
  }

  async onRemoveEvent() {
    if (this.buttonIsLoading) {
      return
    }
    this.buttonIsLoading = true
    await this.onRemoveDelegate()
    this.buttonIsLoading = false
  }
}
</script>

<style lang="scss" scoped>
@import "~@mcdex/style/common/fantasy-var";

.delegation-dialog {
  ::v-deep &.is-small {
    min-height: 192px;
  }

  .tip-box {
    margin-top: 12px;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--mc-text-color);
    word-break: normal;
    line-height: 20px;
  }

  .input-box {
    .el-form-item {
      margin-bottom: 0;
    }

    .el-input {
      height: 56px;
      line-height: 56px;
      border-radius: var(--mc-border-radius-l);
      padding: 0 16px;

      ::v-deep .el-input__inner {
        height: 56px;
        font-size: 16px;
      }

      &:hover {
        border: unset;
        height: 54px;
        width: 364px;
      }
    }

    ::v-deep input::-webkit-input-placeholder,
    textarea::-webkit-input-placeholder {
      color: var(--mc-text-color-dark);
    }

    ::v-deep .el-form-item__error {
      margin-top: 8px;
      padding: 12px 16px;
      background: rgba($--mc-color-error, 0.1);
      border-radius: var(--mc-border-radius-l);
    }

    .icon-box {
      cursor: pointer;
    }

    .input-item-box {
      &.error {
        &:hover {
          background: var(--mc-color-error) !important;
        }
      }

      &:hover {
        border-radius: 12px;
        background: var(--mc-color-primary-gradient);
        height: 56px;
        width: 366px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .svg-icon {
      font-size: 16px;
      opacity: 0.75;

      &:hover {
        opacity: 1;
      }
    }

    ::v-deep .el-form-item__error {
      line-height: 20px;
    }
  }

  .button-box {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    .el-button {
      height: 56px;
      width: 177px;
      border-radius: var(--mc-border-radius-l);
    }

    .info {
      background: var(--mc-background-color);
    }
  }

  .view-box {
    display: flex;
    justify-content: space-between;
    height: 56px;
    border-radius: var(--mc-border-radius-l);
    border: 1px solid var(--mc-border-color);
    align-items: center;
    padding: 16px;

    .left {
      font-size: 16px;
      color: var(--mc-text-color-white);

      .icon-view {
        margin-left: 6px;
        color: var(--mc-text-color);
      }
    }

    .right {
      .iconfont {
        font-size: 18px;
        cursor: pointer;

        &.is-disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
      }

      .edit-icon {
        color: var(--mc-color-primary);
      }

      .remove-icon {
        margin-left: 12px;
        color: var(--mc-color-error);
      }
    }
  }
}
</style>
