import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { mallMockApiPlugin } from './vite-plugin-mall-mock.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
   // mallMockApiPlugin()
  ],
   server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // 转发到后端端口
        changeOrigin: true,
       }
      //  '/ai': {
      //   target: 'http://localhost:8086',  // Agent 服务端口
      //   changeOrigin: true,
      // }
    }
  }
})
