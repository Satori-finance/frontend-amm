<template>
  <div>
    <van-overlay :show="isShowSearchPopup" z-index="3"/>
    <div class="search" v-click-outside="blur">
      <div class="search-container">
      <van-search v-model="searchKey" :placeholder="$t('perpetualSearch.mobilePlaceholder')" :class="{active: isShowSearchPopup}"
                  @search="blur"
                  @focus="onfocus"/>
      </div>
      <div class="show-search-results"  v-show="isShowSearchPopup">
        <SearchResult :prop-search-key="searchKey"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue,Component } from 'vue-property-decorator'
import SearchResult from './SearchResult.vue'

@Component({
  components: {
    SearchResult
  },
})
export default class SearchPerpetual extends Vue{
  private searchKey = ''
  private isShowSearchPopup: Boolean = false

  private onfocus() {
    this.isShowSearchPopup = true
  }

  private blur() {
    this.isShowSearchPopup = false
  }
}
</script>

<style scoped lang="scss">
  .search {
    .search-container {
      position: relative;
      border-radius: 10px;
      width: 100%;
      height: 50px;
      z-index: 5;

      ::v-deep{
        .van-search {
          background: transparent;
          padding: 0;
          .van-cell {
            margin-top: 10px;
            font-size: 16px;
          }
        }

        input::-webkit-input-placeholder {
          color: #3E5081;
        }

        div.van-field__left-icon{
          color: #999897;
        }

        .van-search__content {
          height: 56px;
          background: var(--mc-background-color);
        }
        .van-search__content {
          border-radius: 10px;
        }
        .active {
          .van-search__content {
            border: 1px solid #B8DBEB;
          }
        }
      }
    }

    .show-search-results {
      position: absolute;
      top: 105px;
      padding-top: 20px;
      width: calc(100% - 32px);
      z-index: 4;
      background-color: var(--mc-background-color);
      border-radius: 0 0 10px 10px ;
      border: 1px solid var(--mc-border-color);
      border-top: 0;
    }

    .active {
      background-color: #0A1024;
    }
  }

</style>
