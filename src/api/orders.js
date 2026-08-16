import { http } from './http'

export function fetchOrders() {
  return http.get('/api/orders').then((body) => body.data)
}

export function updateOrderStatus(id, status) {
  return http.patch(`/api/orders/${id}/status`, { status }).then((body) => body.data)
}
