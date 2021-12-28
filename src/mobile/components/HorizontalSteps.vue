<template>
  <div class="horizontal-steps">
    <div class="steps-group">
      <div class="step-item" v-for="(stepID, i) in stepCount" :key="i">
        <span class="step-value" :class="{'un-active': active < i}">
          <span v-if="active < stepID">{{ stepID }}</span>
          <span v-else><van-icon name="success" /></span>
        </span>
        <div class="step-join-line" :class="{'un-active': active < stepID}" v-if="i<stepCount-1"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class HorizontalSteps extends Vue {
  @Prop({ required: true }) active !: number
  @Prop({ required: true }) stepCount !: number
}
</script>

<style scoped lang="scss">
.horizontal-steps {
  .steps-group {
    .step-item {
      line-height: 16px;
      display: inline-block;

      .step-value {
        display: inline-block;
        border: 1px solid var(--mc-color-blue);
        color: var(--mc-color-blue);
        border-radius: 50%;
        padding: 0 1px;
        width: 16px;
        height: 16px;
        line-height: 15px;
        text-align: center;
        font-size: 12px;

        ::v-deep {
          .van-icon {
            padding-top: 1px;
          }
        }
      }

      .step-join-line {
        display: inline-block;
        width: 131px;
        border-top: 1px dashed var(--mc-color-blue);
        margin: 3px 8px;
      }
    }

    .un-active {
      opacity: 0.5;
    }
  }
}
</style>
