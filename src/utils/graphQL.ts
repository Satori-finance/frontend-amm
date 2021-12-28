import { ApolloClient } from 'apollo-client'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache, NormalizedCacheObject } from 'apollo-cache-inmemory'

export const graphClients: { [url: string]: ApolloClient<NormalizedCacheObject> } = {}

// factory
export function getGraphClient(url: string): ApolloClient<NormalizedCacheObject> {
  let ret = graphClients[url]
  if (!ret) {
    ret = new ApolloClient({
      link: new HttpLink({ uri: url }),
      cache: new InMemoryCache(),
    })
    graphClients[url] = ret
  }
  return ret
}
