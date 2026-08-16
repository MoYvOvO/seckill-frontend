/**
 * Dev-only mock REST API for mall demo (products, orders, auth, seckill).
 */
import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), '.mall-mock')
const FILES = {
  products: path.join(DATA_DIR, 'products.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readJson(file, fallback) {
  ensureDir()
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2), 'utf8')
      return structuredClone(fallback)
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return structuredClone(fallback)
  }
}

function writeJson(file, data) {
  ensureDir()
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
}

const seedProducts = [
  {
    id: 'p1',
    name: '无线降噪耳机 Pro',
    description: '40dB 主动降噪，30 小时续航',
    price: 1299,
    seckillPrice: 399,
    stock: 200,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    seckillStart: new Date().toISOString(),
    seckillEnd: new Date(Date.now() + 86400000 * 7).toISOString(),
  },
  {
    id: 'p2',
    name: '智能运动手表',
    description: '血氧心率监测，5ATM 防水',
    price: 899,
    seckillPrice: 199,
    stock: 500,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    seckillStart: new Date().toISOString(),
    seckillEnd: new Date(Date.now() + 86400000 * 7).toISOString(),
  },
  {
    id: 'p3',
    name: '便携蓝牙音箱',
    description: '360° 立体声，IPX7 防水',
    price: 459,
    seckillPrice: 99,
    stock: 80,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',
    seckillStart: new Date().toISOString(),
    seckillEnd: new Date(Date.now() + 86400000 * 7).toISOString(),
  },
]

function nowIso() {
  return new Date().toISOString()
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
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

function send(res, status, body, headers = {}) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
  res.end(JSON.stringify(body))
}

function parseUrl(url) {
  const u = new URL(url, 'http://local')
  return { pathname: u.pathname, searchParams: u.searchParams }
}

export function mallMockApiPlugin() {
  return {
    name: 'mall-mock-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) return next()
        const { pathname } = parseUrl(req.url)
        const method = (req.method || 'GET').toUpperCase()

        try {
          if (pathname === '/api/products' && method === 'GET') {
            const list = readJson(FILES.products, seedProducts)
            return send(res, 200, { data: list })
          }

          if (pathname === '/api/products' && method === 'POST') {
            const body = await parseBody(req)
            const list = readJson(FILES.products, seedProducts)
            const id = `p${Date.now()}`
            const item = {
              id,
              name: String(body.name || '未命名商品'),
              description: String(body.description || ''),
              price: Number(body.price) || 0,
              seckillPrice: Number(body.seckillPrice) || 0,
              stock: Math.max(0, Number(body.stock) || 0),
              image: String(body.image || '').trim() || seedProducts[0].image,
              seckillStart: body.seckillStart || nowIso(),
              seckillEnd: body.seckillEnd || new Date(Date.now() + 86400000).toISOString(),
            }
            list.push(item)
            writeJson(FILES.products, list)
            return send(res, 201, { data: item })
          }

          const productMatch = pathname.match(/^\/api\/products\/([^/]+)$/)
          if (productMatch && method === 'PUT') {
            const id = productMatch[1]
            const body = await parseBody(req)
            let list = readJson(FILES.products, seedProducts)
            const idx = list.findIndex((p) => p.id === id)
            if (idx === -1) return send(res, 404, { message: '商品不存在' })
            list[idx] = {
              ...list[idx],
              ...body,
              id: list[idx].id,
              price: Number(body.price ?? list[idx].price),
              seckillPrice: Number(body.seckillPrice ?? list[idx].seckillPrice),
              stock: Math.max(0, Number(body.stock ?? list[idx].stock)),
            }
            writeJson(FILES.products, list)
            return send(res, 200, { data: list[idx] })
          }

          if (productMatch && method === 'DELETE') {
            const id = productMatch[1]
            let list = readJson(FILES.products, seedProducts)
            const nextList = list.filter((p) => p.id !== id)
            if (nextList.length === list.length) return send(res, 404, { message: '商品不存在' })
            writeJson(FILES.products, nextList)
            return send(res, 200, { data: { ok: true } })
          }

          if (pathname === '/api/orders' && method === 'GET') {
            const orders = readJson(FILES.orders, [])
            return send(res, 200, { data: orders })
          }

          const orderStatusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/)
          if (orderStatusMatch && method === 'PATCH') {
            const id = orderStatusMatch[1]
            const body = await parseBody(req)
            const orders = readJson(FILES.orders, [])
            const o = orders.find((x) => x.id === id)
            if (!o) return send(res, 404, { message: '订单不存在' })
            o.status = body.status || o.status
            o.updatedAt = nowIso()
            writeJson(FILES.orders, orders)
            return send(res, 200, { data: o })
          }

          if (pathname === '/api/auth/login' && method === 'POST') {
            const body = await parseBody(req)
            const username = String(body.username || '').trim()
            const password = String(body.password || '')
            if (!username || !password) {
              return send(res, 400, { message: '请输入用户名和密码' })
            }
            const token = Buffer.from(JSON.stringify({ u: username, t: Date.now() })).toString(
              'base64url',
            )
            return send(res, 200, {
              data: {
                token,
                user: { id: username, username, nickname: username },
              },
            })
          }

          if (pathname === '/api/auth/me' && method === 'GET') {
            const auth = req.headers.authorization || ''
            const m = auth.match(/^Bearer\s+(.+)$/i)
            if (!m) return send(res, 401, { message: '未登录' })
            try {
              const payload = JSON.parse(Buffer.from(m[1], 'base64url').toString('utf8'))
              return send(res, 200, {
                data: { id: payload.u, username: payload.u, nickname: payload.u },
              })
            } catch {
              return send(res, 401, { message: '登录已失效' })
            }
          }

          if (pathname === '/api/seckill' && method === 'POST') {
            const auth = req.headers.authorization || ''
            if (!/^Bearer\s+/i.test(auth)) return send(res, 401, { message: '请先登录' })
            const body = await parseBody(req)
            const productId = body.productId
            const list = readJson(FILES.products, seedProducts)
            const p = list.find((x) => x.id === productId)
            if (!p) return send(res, 404, { message: '商品不存在' })
            const start = new Date(p.seckillStart).getTime()
            const end = new Date(p.seckillEnd).getTime()
            const t = Date.now()
            if (t < start) return send(res, 400, { message: '秒杀尚未开始' })
            if (t > end) return send(res, 400, { message: '秒杀已结束' })
            if (p.stock <= 0) return send(res, 400, { message: '库存不足' })
            p.stock -= 1
            writeJson(FILES.products, list)
            let user = { id: 'guest', username: 'guest' }
            try {
              const m = auth.match(/^Bearer\s+(.+)$/i)
              if (m) {
                const payload = JSON.parse(Buffer.from(m[1], 'base64url').toString('utf8'))
                user = { id: payload.u, username: payload.u }
              }
            } catch {
              /* ignore */
            }
            const orders = readJson(FILES.orders, [])
            const order = {
              id: `o${Date.now()}`,
              productId: p.id,
              productName: p.name,
              userId: user.id,
              username: user.username,
              status: 'paid',
              amount: p.seckillPrice,
              createdAt: nowIso(),
              updatedAt: nowIso(),
            }
            orders.unshift(order)
            writeJson(FILES.orders, orders)
            return send(res, 200, { data: { order, product: p } })
          }

          return send(res, 404, { message: 'Not Found' })
        } catch (e) {
          return send(res, 500, { message: e?.message || 'Server error' })
        }
      })
    },
  }
}
