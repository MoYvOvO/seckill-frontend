<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchProducts } from '../api/products'
import { login, fetchMe } from '../api/auth'
import { seckillBuy } from '../api/seckill'
import { useCart } from '../composables/useCart'

const { add } = useCart()

const products = ref([])
const loading = ref(false)
const user = ref(null)
const loginUser = ref('')
const loginPass = ref('')
const loginLoading = ref(false)
const loginError = ref('')
const buyingId = ref(null)
const toast = ref('')

function showToast(msg) {
  toast.value = msg
  setTimeout(() => {
    toast.value = ''
  }, 2800)
}

const loggedIn = computed(() => !!user.value)

async function loadProducts() {
  loading.value = true
  try {
    const body = await fetchProducts()
    console.log('产品返回的 body:', JSON.stringify(body, null, 2))
    products.value = body.data || []
  } finally {
    loading.value = false
  }
}

async function trySession() {
  const token = localStorage.getItem('mall_token')
  if (!token) return
  try {
    user.value = await fetchMe()
  } catch {
    localStorage.removeItem('mall_token')
  }
}

async function onLogin() {
  loginError.value = ''
  loginLoading.value = true
  try {
    const body = await login({
      username: loginUser.value.trim(),
      password: loginPass.value,
    })
    console.log('登录返回的 body:', JSON.stringify(body, null, 2))
    localStorage.setItem('mall_token', body.token || '')
    localStorage.setItem('mall_user', JSON.stringify(body.data))
    
    // ============ 🆕 存 role ============
    // body.data 就是用户信息对象，从这里取 role
    const userInfo = body.data
    const role = userInfo.role || (userInfo.username === 'admin' ? 'admin' : 'user')
    // const role ='user'
    localStorage.setItem('role', role)

    user.value = body.data
    loginPass.value = ''
    showToast(`欢迎，${body.user.nickname || body.user.username}`)
  } catch (e) {
    loginError.value = e?.message || '登录失败'
  } finally {
    loginLoading.value = false
  }
}

function logout() {
  localStorage.removeItem('mall_token')
  localStorage.removeItem('mall_user')
  user.value = null
  showToast('已退出登录')
}

function seckillWindow(p) {
  const start = new Date(p.seckillStart).getTime()
  const end = new Date(p.seckillEnd).getTime()
  const t = Date.now()
  if (t < start) return { label: '即将开始', active: false, ended: false }
  if (t > end) return { label: '已结束', active: false, ended: true }
  return { label: '进行中', active: true, ended: false }
}

async function onBuy(p) {
  if (!loggedIn.value) {
    showToast('请先登录后再抢购')
    return
  }
  const w = seckillWindow(p)
  if (!w.active) {
    showToast(w.ended ? '秒杀已结束' : '秒杀尚未开始')
    return
  }
  if (p.stock <= 0) {
    showToast('库存已抢光')
    return
  }
  console.log('user.value 的值：', JSON.stringify(user.value))
  console.log('localStorage mall_user：', localStorage.getItem('mall_user'))
  let username = user.value?.username
  if (!username) {
    const storedUser = localStorage.getItem('mall_user')
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser)
        username = userObj.username
      } catch (e) {
        console.error('解析 mall_user 失败', e)
      }
    }
  }

  if (!username) {
    showToast('请先登录')
    return
  }
  buyingId.value = p.id
  const idx = products.value.findIndex((x) => x.id === p.id)

  if (idx !== -1) {
    products.value[idx].stock = Math.max(0, (products.value[idx].stock || 0) - 1)
  }

  try {
    const data = await seckillBuy(p.id, username)
   if (data.code === 200) {
  showToast('抢购请求已提交，订单处理中...')
} else {
  showToast(data.message);  
  if (idx !== -1) {
      products.value[idx].stock += 1
    }
}
  } catch (e) {
    if (idx !== -1) {
      products.value[idx].stock += 1
    }
    showToast(e?.message || '抢购失败')
  } finally {
    buyingId.value = null
  }
}

function onAddCart(p) {
  if (!loggedIn.value) {
    showToast('请先登录')
    return
  }
  const res = add(p, 1)
  showToast(res.ok ? '已加入购物车' : res.message)
}

function formatMoney(n) {
  return `¥${Number(n).toFixed(2)}`
}

onMounted(async () => {
  await trySession()
  await loadProducts()
})
</script>

<template>
  <div class="seckill">
    <section class="hero card">
      <div class="hero-text">
        <p class="eyebrow">限时秒杀</p>
        <h1>极光秒杀会场</h1>
        <p class="lead">登录后即可以秒杀价下单，库存实时扣减。</p>
      </div>
      <div class="auth-panel">
        <template v-if="!loggedIn">
          <h2>用户登录</h2>
          <form class="login-form" @submit.prevent="onLogin">
            <input
              v-model="loginUser"
              type="text"
              autocomplete="username"
              placeholder="用户名"
              required
            />
            <input
              v-model="loginPass"
              type="password"
              autocomplete="current-password"
              placeholder="密码"
              required
            />
            <p v-if="loginError" class="error">{{ loginError }}</p>
            <div class="btn-group">
              <button type="submit" class="btn primary" :disabled="loginLoading">
                {{ loginLoading ? '登录中…' : '登录' }}
              </button>
              <RouterLink to="/register" class="btn secondary">
                注册
              </RouterLink>
            </div>
            <p class="hint muted">演示环境任意非空用户名与密码即可</p>
          </form>
        </template>
        <template v-else>
          <div class="user-card">
            <div class="avatar">{{ (user.username || '?').slice(0, 1).toUpperCase() }}</div>
            <div>
              <div class="uname">{{ user.nickname || user.username }}</div>
              <div class="muted small">已登录，可参与抢购</div>
            </div>
            <button type="button" class="btn ghost" @click="logout">退出</button>
          </div>
        </template>
      </div>
    </section>

    <section class="products-section">
      <div class="section-head">
        <h2>秒杀商品</h2>
        <button type="button" class="btn ghost sm" :disabled="loading" @click="loadProducts">
          {{ loading ? '刷新中…' : '刷新列表' }}
        </button>
      </div>
      <div v-if="loading && !products.length" class="state">加载商品中…</div>
      <div v-else class="grid">
        <article v-for="p in products" :key="p.id" class="product card">
          <div class="img-wrap">
            <img :src="p.image" :alt="p.name" loading="lazy" />
            <span class="pill" :class="{ on: seckillWindow(p).active, off: !seckillWindow(p).active }">
              {{ seckillWindow(p).label }}
            </span>
          </div>
          <div class="body">
            <h3>{{ p.name }}</h3>
            <p class="desc muted">{{ p.description }}</p>
            <div class="prices">
              <span class="seckill">{{ formatMoney(p.seckillPrice) }}</span>
              <span class="orig">{{ formatMoney(p.price) }}</span>
            </div>
            <p class="stock muted small">剩余库存 {{ p.stock }}</p>
            <div class="btn-row">
              <button
                type="button"
                class="btn ghost wide"
                :disabled="!loggedIn || p.stock <= 0"
                @click="onAddCart(p)"
              >
                加入购物车
              </button>
              <button
                type="button"
                class="btn primary wide buy"
                :disabled="
                  buyingId === p.id || p.stock <= 0 || !seckillWindow(p).active || !loggedIn
                "
                @click="onBuy(p)"
              >
                <template v-if="buyingId === p.id">抢购中…</template>
                <template v-else-if="!loggedIn">登录后抢购</template>
                <template v-else-if="p.stock <= 0">已抢光</template>
                <template v-else-if="!seckillWindow(p).active">不可抢购</template>
                <template v-else>立即抢购</template>
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <Transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.seckill {
  max-width: 1120px;
  margin: 0 auto;
}
.hero {
  display: grid;
  grid-template-columns: 1fr minmax(260px, 320px);
  gap: 2rem;
  padding: 2rem;
  margin-bottom: 2rem;
  align-items: stretch;
}
@media (max-width: 840px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
.hero-text h1 {
  margin: 0.35rem 0 0.75rem;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.03em;
}
.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}
.lead {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 36ch;
}
.auth-panel h2 {
  margin: 0 0 1rem;
  font-size: 1rem;
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.login-form input {
  font: inherit;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}
.error {
  margin: 0;
  font-size: 0.8125rem;
  color: #dc2626;
}
.hint {
  margin: 0.25rem 0 0;
  font-size: 0.75rem;
}
.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--accent), #6366f1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
}
.uname {
  font-weight: 650;
}
.muted {
  color: var(--text-muted);
}
.muted.small {
  font-size: 0.8125rem;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.section-head h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 650;
}
.state {
  padding: 3rem;
  text-align: center;
  color: var(--text-muted);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}
.product {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
}
.img-wrap {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--surface-2);
}
.img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.pill {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.pill.on {
  background: rgba(16, 185, 129, 0.95);
  color: #fff;
}
.pill.off {
  background: rgba(15, 23, 42, 0.55);
  color: #fff;
  backdrop-filter: blur(4px);
}
.body {
  padding: 1.1rem 1.25rem 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.body h3 {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
}
.desc {
  margin: 0 0 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  flex: 1;
}
.prices {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.seckill {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.02em;
}
.orig {
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-decoration: line-through;
}
.stock {
  margin: 0 0 1rem;
}
.btn-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
}
.buy {
  margin-top: 0;
}
.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.65rem 1.25rem;
  border-radius: 999px;
  background: var(--text);
  color: var(--surface);
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: var(--shadow-lg);
  z-index: 200;
  max-width: min(90vw, 420px);
  text-align: center;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
.wide {
  width: 100%;
}

/* 新增：登录和注册按钮并排 */
.btn-group {
  display: flex;
  gap: 0.65rem;
}
.btn-group .btn {
  flex: 1;
  text-align: center;
  justify-content: center;
}
.btn.secondary {
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn.secondary:hover {
  background: var(--border);
}
</style>