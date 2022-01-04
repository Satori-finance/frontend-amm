<template>
    <div class="referrer-main">

    </div>
</template>

<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import { url } from 'inspector'
import { ethers } from 'ethers'
import { getTimestamp, setLocalStorage } from '@/utils'
import {REFERRAL_KEY} from '@/const'
import { ROUTE } from '@/router'

@Component({})
export default class ReferrerMain extends Vue {

  created() {
    const url = new URL(window.location.href)
    const referralAddress = url.searchParams.get('f') || ''
    const toUrl = url.searchParams.get('to') || ''
    const isValidAddress = ethers.utils.isAddress(referralAddress)

    if (referralAddress !== '' && isValidAddress) {
        const referralTime = getTimestamp()
        setLocalStorage(REFERRAL_KEY, {address : referralAddress, timestamp : referralTime})
    }
    if(toUrl !==''){
      window.location.href = toUrl
    } else {
      // this.$router.replace('/trade/')
      window.location.replace('/trade/')
    }
  }
}
</script>

<style scoped lang="scss">
.referrer-main {

}
</style>
