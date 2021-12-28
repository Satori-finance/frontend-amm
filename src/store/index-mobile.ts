import Vuex, { StoreOptions } from 'vuex'
import { RootState, storeOption } from './index'
import interactiveState from '@/mobile/store/interactiveState'

const mobileStoreOption: StoreOptions<RootState> = {
  ...storeOption,
  modules: {
    ...storeOption.modules,
    interactiveState
  }
}

export default new Vuex.Store<RootState>(mobileStoreOption)
