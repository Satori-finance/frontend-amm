<template>
  <div >
    <div class="proposer-info">
      <div class="left">
        <span v-html="headPortrait"></span>
      </div>
      <div class="right">
        <div class="text-item-head proposer-info-item">{{ $t('governance.proposer') }}</div>
        <div class="text-item proposer-info-item">
          {{ proposerAddress | ellipsisMiddle(12, 15)}}
          <el-link class="icon" :underline="false" target="_blank"
                   :href="proposerAddress | etherBrowserAddressFormatter">
            <i class="iconfont icon-transmit"></i>
          </el-link>
        </div>
        </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { EllipsisText } from '@/components'
import jdenticon from 'jdenticon/standalone'

@Component({
  components: {
    EllipsisText
  }
})
export default class ProposalProposer extends Vue {
  @Prop({ required: true }) proposerAddress !: string

  get headPortrait(): string {
    return jdenticon.toSvg('mcvote5', 48)
  }
}
</script>

<style scoped lang="scss">
.proposer-info {
  height: 48px;
  display: flex;
  width: 356px;

  .v-popover {
    display: inline;
  }

  .proposer-info-item {
    margin: 4px 0;
  }

  .left {
  }

  .right {
    margin-left: 30px;
  }

  .icon {
    width: 10px;
    height: 10px;
    font-size: 10px;
    color: var(--mc-text-color);
    margin-left: 4px;
    display: inline;
  }

  .icon:hover {
    color: var(--mc-color-primary);
  }

  .text-item-head {
    font-size: 18px;
    font-weight: 400;
    color: var(--mc-text-color-white);
  }

  .text-item {
    font-size: 14px;
    font-weight: 400;
    color: var(--mc-text-color);
  }
}
</style>