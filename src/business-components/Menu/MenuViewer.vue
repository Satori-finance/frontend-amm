<template>
  <div class="menu-viewer">
    <el-popover
      placement="bottom-end"
      trigger="click"
      popper-class="menu-popover fantasy"
      v-model="popoverStatus"
      :visible-arrow="false"
    >
      <div class="menu-content-box popover-content">
        <MenuList v-if="currentMenu === 'list'" @selectLang="currentMenu = 'lang'"/>
<!--        <LangSelector v-else @close="currentMenu = 'list'"/>-->
      </div>
      <div class="menu-box" slot="reference" :class="{'is-focus': popoverStatus}">
        <div class="icon-wrapper">
          <svg class="svg-icon" aria-hidden="true">
            <use xlink:href="#icon-more-bold"></use>
          </svg>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import MenuList from './MenuList.vue'
import LangSelector from './LangSelector.vue'

@Component({
  components: {
    MenuList,
    LangSelector,
  }
})
export default class MenuViewer extends Vue {
  private popoverStatus: boolean = false
  private currentMenu: 'list' | 'lang' = 'list'
}
</script>

<style lang="scss" scoped>
.menu-content-box {
  padding: 16px;
}

.menu-viewer {
  .menu-box {
    height: 40px;
    width: 40px;
    border-radius: var(--mc-border-radius-l);
    overflow: hidden;
    padding: 1px;
    cursor: pointer;

    .icon-wrapper {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--mc-border-radius-l);

      .svg-icon {
        height: 24px;
        width: 24px;
      }
    }
  }
}

.satori-fantasy .menu-viewer {

  .menu-box {
    background-color: var(--mc-background-color);

    &:hover {
      background-color: var(--mc-background-color-light);

      .icon-wrapper {
        background-color: var(--mc-background-color-light);
      }
    }

    &.is-focus {
      background: linear-gradient(90deg, #00D8E2 0%, #27A2F8 100%);
    }

    .icon-wrapper {
      background-color: var(--mc-background-color);
    }
  }
}
</style>

<style lang="scss">
.satori-fantasy .el-popover.menu-popover[x-placement^=bottom] {
  width: 196px;
  margin-top: 10px;
}
</style>
