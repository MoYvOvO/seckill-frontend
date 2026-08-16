import { http } from './http'

export function login(payload) {
  return http.post('/api/auth/login', payload).then((body) => body.data)
}

export function register(payload) {
  return http.post('/api/auth/register', payload).then((body) => body.data)
}

export function fetchMe() {
  return http.get('/api/auth/me').then((body) => body.data)
}
