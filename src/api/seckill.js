import { http } from './http'

export function seckillBuy(productId, username) {   
  return http.post('/api/seckill', { productId, username }).then((body) => body.data)
}
