/**
 * 在不修改 src/ 源码的前提下，注入用户注册模块（路由、导航、开发 Mock）。
 */
import fs from 'node:fs'
import path from 'node:path'

const USERS_FILE = path.join(process.cwd(), '.mall-mock', 'users.json')

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return []
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function writeUsers(users) {
  const dir = path.dirname(USERS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8')
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function normalizeId(filePath) {
  return filePath.replace(/\\/g, '/')
}

export function registerModulePlugin(options = {}) {
  const { enableDevMock = false } = options
  return {
    name: 'register-module',
    transform(code, id) {
      const normalized = normalizeId(id)

      if (normalized.endsWith('/src/main.js')) {
        if (code.includes('installRegisterModule')) return null
        return {
          code: `import { installRegisterModule } from '../modules/register/index.js'\n${code.replace(
            "createApp(App).use(router).mount('#app')",
            "installRegisterModule(router)\ncreateApp(App).use(router).mount('#app')",
          )}`,
          map: null,
        }
      }

      if (normalized.endsWith('/src/App.vue')) {
        if (code.includes("to: '/register'")) return null
        return {
          code: code.replace(
            "{ to: '/seckill', label: '秒杀会场' },",
            "{ to: '/seckill', label: '秒杀会场' },\n  { to: '/register', label: '用户注册' },",
          ),
          map: null,
        }
      }

      return null
    },
    configureServer(server) {
      if (!enableDevMock) return

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url !== '/api/auth/register') return next()

        try {
          const body = await parseBody(req)
          const username = String(body.username || '').trim()
          const password = String(body.password || '')
          const nickname = String(body.nickname || username).trim() || username

          if (!username || !password) {
            return sendJson(res, 400, { message: '请输入用户名和密码' })
          }
          if (password.length < 6) {
            return sendJson(res, 400, { message: '密码至少 6 位' })
          }

          const users = readUsers()
          if (users.some((u) => u.username === username)) {
            return sendJson(res, 409, { message: '用户名已被占用' })
          }

          const user = {
            id: username,
            username,
            nickname,
            createdAt: new Date().toISOString(),
          }
          users.push({ ...user, password })
          writeUsers(users)

          return sendJson(res, 201, {
            data: {
              user: { id: user.id, username: user.username, nickname: user.nickname },
            },
          })
        } catch (e) {
          return sendJson(res, 500, { message: e?.message || '注册失败' })
        }
      })
    },
  }
}
