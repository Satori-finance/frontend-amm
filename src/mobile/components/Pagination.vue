<template>
  <div class="pagination">
    <button @click="sub" :class="{active: !leftBtnStatus|| middleStatus}" :disabled="rightBtnStatus && !middleStatus " ><i class="iconfont icon-left"></i></button>
    <span>Page {{ currentPage }} of {{ totalPage }}</span>
    <button @click="add" :class="{active: rightBtnStatus || middleStatus}" :disabled="!leftBtnStatus && !middleStatus"><i class="iconfont icon-right"></i></button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component({})
export default class Pagination extends Vue{
  @Prop({required: true}) totalPage!: number
  @Prop({required: true, default: 1}) currentPage!: number
  private leftBtnStatus: boolean = true
  private rightBtnStatus: boolean = true
  private middleStatus: boolean = false

  private add() {
    const newCurrentPage = this.currentPage + 1
    this.$emit('update:currentPage', newCurrentPage)
  }

  private sub() {
    const newCurrentPage = this.currentPage - 1
    this.$emit('update:currentPage', newCurrentPage)
  }

  @Watch('currentPage',{immediate: true})
  @Watch('totalPage')
  updateArrowBtn() {
    if(this.totalPage <= 1 ) {
      this.leftBtnStatus = false
      this.rightBtnStatus = true
      this.middleStatus = false
    }else {
      if (this.currentPage === 1) {
        this.leftBtnStatus = true
        this.rightBtnStatus = true
        this.middleStatus = false
      } else if (this.currentPage === this.totalPage) {
        this.leftBtnStatus = false
        this.rightBtnStatus = false
        this.middleStatus = false
      } else {
        this.middleStatus = true
        this.leftBtnStatus = false
        this.rightBtnStatus = true
      }
    }
  }
}
</script>

<style scoped lang="scss">
  .pagination {
    height: 50px;
    line-height: 50px;
    text-align: center;

    .iconfont {
      font-size: 18px;
    }

    span{
      display: inline-block;
      width: 30%;
      text-align: center;
    }

    button {
      color:  #999897
    }

    .active {
      color: #B8DBEB;
    }
  }
</style>
