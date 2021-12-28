<template>
  <div class="about-votes-popup">
    <van-popup
      v-model="showPopup"
      class="safe-area-inset-bottom"
      safe-area-inset-bottom
      round
      position="bottom"
      closeable>
      <div class="popup-header">{{ $t('dao.aboutVotes') }}</div>
      <div class="popup-container">
        <div v-html="$t('dao.aboutVotesPrompt')"></div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class AboutVotesPopup extends Vue {
  @Prop({ required: true }) visible !: boolean

  get showPopup(): boolean {
    return this.visible
  }

  set showPopup(val: boolean) {
    this.$emit('update:visible', val)
  }
}
</script>

<style lang="scss" scoped>
.about-votes-popup {
  ::v-deep {
    .van-popup {
      padding: 16px;
      min-height: 120px;
      max-height: 270px;
    }

    .van-popup__close-icon {
      color: var(--mc-text-color-white);
    }
  }

  .popup-container {
    margin: 28px 0 0;
    font-size: 14px;
    line-height: 20px;
  }
}
</style>
