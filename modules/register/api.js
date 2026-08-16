import { http } from '../../src/api/http'

export function register(payload) {
  return http.post('/api/auth/register', payload).then((body) => body.data)
}
