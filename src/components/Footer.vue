<template>
  <div class="mc-footer">
    <div class="links">
      <div class="logo">
        <img src="../assets/img/logo-mini-dark.png" alt="">
      </div>
      <div class="nav-container">
        <div class="navs">
          <!--          <el-link class="mc-font-p14">{{ $t('footer.about') }}</el-link>-->
          <el-link class="mc-font-p14" href="#" target="_blank">{{
              $t('footer.docs')
            }}
          </el-link>

        </div>

      </div>
    </div>
    <div class="community">

      <el-link href="https://github.com/Satori-finance" :underline="false" target="_blank">
        <i class="iconfont icon-github"></i>
      </el-link>

      <el-link href="#" :underline="false" target="_blank">
        <i class="iconfont icon-twitter"></i>
      </el-link>

      <el-link href="#" :underline="false" target="_blank">
        <i class="iconfont icon-discord"></i>
      </el-link>

      <el-link :href="telegramAddress" :underline="false" target="_blank">
        <i class="iconfont icon-telegram"></i>
      </el-link>

      <!-- <el-link href="#" :underline="false" target="_blank">
        <i class="iconfont icon-youtube"></i>
      </el-link> -->

    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { copyToClipboard } from '@/utils/common'
import Popover from './Popover.vue'
import { ROUTE } from '@/router'

@Component({
  components: {
    Popover,
  },
})
export default class McFooter extends Vue {
  address = ''

  get telegramAddress(): string {
    if (this.$i18n.locale === 'zh-CN') {
      return '#'
    }
    return '#'
  }

  private onCopyToClipboard() {
    copyToClipboard(this.address)
  }

  // private goSATORISale() {
  //   this.$router.push({ name: ROUTE.SATORI_SALE })
  // }
}
</script>

<style lang="scss" scoped>
.mc-footer {
  background-color: #232b48;
  margin-top: 1px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--mc-text-color);
  padding: 12px 30px;

  .links {
    display: flex;
    align-items: center;

    .logo {
      display: flex;
      align-items: center;

      img {
        height: 43px;
        width: 63px;
      }
    }

    .nav-container {
      margin-left: 30px;

      .navs {
        ::v-deep .el-link {
          color: var(--mc-text-color);
          margin-right: 34px;
        }
      }

      .mcb {
        display: flex;
        align-items: center;
        margin-top: 6px;

        a {
          margin-left: 5px;
        }
      }
    }
  }

  .community {
    .el-link {
      color: var(--mc-text-color);
      font-size: 18px;
      margin-left: 34px;
    }
  }
}
</style>

<style scoped lang="scss">
.satori-fantasy .mc-footer {
  background-color: var(--mc-background-color-darkest);
}
</style>
