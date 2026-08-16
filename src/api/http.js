import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

export const http = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('mall_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg =
      err.response?.data?.message ||
      err.message ||
      '网络异常，请稍后重试'
    return Promise.reject(new Error(msg))
  },
)
