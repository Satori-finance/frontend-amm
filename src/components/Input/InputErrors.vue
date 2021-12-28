<template>
  <div>
    <div v-for="(error, index) in errors" :key="index" class="input-error-message">
      {{error}}
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator'
import { TranslateResult } from 'vue-i18n'

@Component
export default class InputErrors extends Vue {
  @Prop({ default: () => [] }) errors!: Array<TranslateResult>
}
</script>

<style lang="scss">
@import "~@mcdex/style/common/var";
.input-error-message {
  margin-top: 8px;
  font-size: 12px;
  line-height: 20px;
  width: 100%;
  height: 44px;
  padding: 8px 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
}
</style>

<style scoped lang="scss">
@import "~@mcdex/style/common/var";
.satori-fantasy {
  .input-error-message {
    color: var(--mc-color-error);
    background: rgba($--mc-color-error, 0.1);
  }
}
</style>
