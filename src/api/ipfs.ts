import fleekStorage from '@fleekhq/fleek-storage-js'
import { fleekApiConfig, fleekIpfsReadApi } from '@/config/ipfs'
import axios from 'axios'

// return ipfs hashV0
export async function uploadDataToIPFS(data: any, key: string): Promise<string> {
  if (!data) {
    return ''
  }
  const uploadResult = await fleekStorage.upload({
    apiKey: fleekApiConfig.apiKey,
    apiSecret: fleekApiConfig.apiSecret,
    data: JSON.stringify(data),
    key: key,
  })
  return uploadResult.hashV0
}

export async function getIpfsStorageData(hash: string): Promise<any> {
  if (hash === '') {
    return null
  }
  const url = fleekIpfsReadApi+hash
  const response = await axios.get(url)
  return response.data
}
