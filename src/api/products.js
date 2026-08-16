import { http } from './http'

export function fetchProducts() {
  return http.get('/api/products').then((body) => body.data)
}

export function createProduct(payload) {
  return http.post('/api/products', payload).then((body) => body.data)
}

export function updateProduct(id, payload) {
  return http.put(`/api/products/${id}`, payload).then((body) => body.data)
}

export function deleteProduct(id) {
  return http.delete(`/api/products/${id}`).then((body) => body.data)
}
