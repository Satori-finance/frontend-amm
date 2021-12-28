<template>
  <div class="mc-pagination" v-if="total > pageSize">
    <div class="prev arrow-item">
      <i class="iconfont icon-left1" @click="$refs.paginationRef.prev()"
         :class="{ 'disabled-icon': currentPage === 1 }"></i>
    </div>
    <el-pagination layout="pager"
                   hide-on-single-page
                   :page-size="pageSize"
                   :total="total"
                   :current-page.sync="visibleCurrentPage"
                   ref="paginationRef">
    </el-pagination>
    <div class="next arrow-item">
      <i class="iconfont icon-right1" @click="$refs.paginationRef.next()"
         :class="{ 'disabled-icon': currentPage === Math.ceil(total/pageSize) }"></i>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component
export default class McPagination extends Vue {
  @Prop({ required: true }) pageSize !: number
  @Prop({ required: true }) total !: number
  @Prop({ required: true }) currentPage !: number


  get visibleCurrentPage(): number {
    return this.currentPage
  }

  set visibleCurrentPage(v: number) {
    this.$emit('update:currentPage', v)
  }
}
</script>

<style lang="scss" scoped>
.mc-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  ::v-deep .el-pagination {
    padding: unset;
    color: var(--mc-text-color-white);

    .el-pager {
      li {
        background: transparent;
        height: 36px;
        width: 36px;
        line-height: 36px;
        font-size: 14px;
      }
      .btn-quicknext, .btn-quickprev {
        color: var(--mc-text-color-white);
      }

      .el-icon-d-arrow-right, .el-icon-d-arrow-left {
        color: var(--mc-color-primary);
      }

      .active {
        background: var(--mc-color-primary-gradient);
        border-radius: 8px;
        color: var(--mc-text-color-white);
      }

      .number:hover {
        color: var(--mc-text-color-white);
        background: var(--mc-color-primary-gradient);
        border-radius: 8px;
      }
    }
  }

  .iconfont {
    font-size: 16px;
    cursor: pointer;
    color: var(--mc-text-color-white);
  }

  .disabled-icon {
    color: var(--mc-text-color);
    cursor: not-allowed;
  }

  .arrow-item {
    width: 36px;
    height: 36px;
    line-height: 36px;
    text-align: center;
  }

  .prev {
    margin-right: 16px;
  }

  .next {
    margin-left: 16px;
  }
}
</style>
