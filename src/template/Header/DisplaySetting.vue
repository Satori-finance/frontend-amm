<template>
  <span class="display-setting">
    <el-popover
      placement="bottom"
      trigger="click">
      <div class="display-setting-popper">
        <div class="title mc-font-p16">{{$t('displaySetting.title')}}</div>
        <div class="content">
<!--          <div class="setting-item">-->
<!--            <el-switch-->
<!--              v-model="orderConfirm">-->
<!--            </el-switch>-->
<!--            <div class="label mc-font-p12">-->
<!--              {{$t('displaySetting.orderConfirm')}}-->
<!--            </div>-->
<!--          </div>-->
        </div>
      </div>
      <img class="display-setting-icon" slot="reference" src="@/assets/img/settings.svg" alt="">
    </el-popover>
  </span>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class DisplaySetting extends Vue {

}
</script>

<style lang="scss" scoped>
.display-setting-popper {
  width: 276px;
  padding: 8px;

  .title {
    line-height: 24px;
  }

  .content {
    margin-top: 14px;

    .setting-item {
      display: flex;
      align-items: center;

      .el-switch {
        width: 32px;
      }

      .label {
        margin-left: 10px;
        color: var(--mc-text-color);
      }
    }
  }
}

.display-setting {
  display: inline-block;

  ::v-deep {
    .el-popover__reference-wrapper {
      display: flex;
      align-items: center;
    }
  }
}
.display-setting-icon {
  display: inline-block;
}
</style>
