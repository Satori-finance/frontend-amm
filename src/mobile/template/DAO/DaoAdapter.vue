<template>
  <div class="dao-adapter">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'

const interactiveState = namespace('interactiveState')

@Component
export default class DaoAdapter extends Vue {
  @interactiveState.Mutation('updateDaoMainInfoTab') updateDaoMainInfoTab !: Function

  destroyed() {
    this.updateDaoMainInfoTab('info')
  }
}
</script>

<style lang="scss" scoped>
.dao-adapter {
  height: 100%;
}
</style>
