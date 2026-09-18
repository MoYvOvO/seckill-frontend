<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchProducts } from '../api/products'
import { login, fetchMe } from '../api/auth'
import { seckillBuy } from '../api/seckill'
import { useCart } from '../composables/useCart'
import EmptyState from '../components/ui/EmptyState.vue'
import SeckillProductCard from '../components/shop/SeckillProductCard.vue'

const { add, items } = useCart()

const products = ref([])
const loading = ref(false)
const user = ref(null)
const loginUser = ref('')
const loginPass = ref('')
const loginLoading = ref(false)
const loginError = ref('')
const buyingId = ref(null)
const notice = ref({
  message: '',
  type: 'info',
})
let noticeTimer = null

function showToast(message, type = 'info') {
  notice.value = { message, type }
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = { message: '', type: 'info' }
  }, 4000)
}

const loggedIn = computed(() => !!user.value)
const cartProductIds = computed(() => new Set(items.value.map((item) => item.id)))

function friendlyPurchaseMessage(message = '') {
  const text = String(message || '').trim()
  if (!text) return '抢购失败，请稍后重试'
  if (text.includes('已购买') || text.includes('重复') || text.includes('限购')) {
    return '您已购买过该商品，每人限购一件'
  }
  if (text.includes('库存') || text.includes('售罄')) return '商品库存不足，请刷新后再试'
  if (text.includes('未开始')) return '秒杀尚未开始，请稍后再试'
  if (text.includes('已结束')) return '秒杀已经结束'
  return text
}

async function loadProducts() {
  loading.value = true
  try {
    const body = await fetchProducts()
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
    localStorage.setItem('mall_token', body.token || '')
    localStorage.setItem('mall_user', JSON.stringify(body.data))

    const userInfo = body.data
    const role = userInfo.role || (userInfo.username === 'admin' ? 'admin' : 'user')
    localStorage.setItem('role', role)

    user.value = body.data
    loginPass.value = ''
    showToast(`欢迎回来，${body.user.nickname || body.user.username}`, 'success')
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

function seckillWindow(product) {
  const start = new Date(product.seckillStart).getTime()
  const end = new Date(product.seckillEnd).getTime()
  const now = Date.now()
  if (now < start) return { label: '即将开始', active: false, ended: false }
  if (now > end) return { label: '已结束', active: false, ended: true }
  return { label: '进行中', active: true, ended: false }
}

async function onBuy(product) {
  if (!loggedIn.value) {
    showToast('请先登录后再抢购', 'error')
    return
  }

  const status = seckillWindow(product)
  if (!status.active) {
    showToast(status.ended ? '秒杀已结束' : '秒杀尚未开始', 'error')
    return
  }

  if (product.stock <= 0) {
    showToast('库存已抢完', 'error')
    return
  }

  let username = user.value?.username
  if (!username) {
    const storedUser = localStorage.getItem('mall_user')
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser)
        username = userObj.username
      } catch {
        showToast('用户信息读取失败，请重新登录', 'error')
        return
      }
    }
  }

  if (!username) {
    showToast('请先登录', 'error')
    return
  }

  buyingId.value = product.id
  showToast('正在处理抢购...', 'pending')
  const productIndex = products.value.findIndex((item) => item.id === product.id)

  if (productIndex !== -1) {
    products.value[productIndex].stock = Math.max(0, (products.value[productIndex].stock || 0) - 1)
  }

  try {
    const data = await seckillBuy(product.id, username)
    if (Number(data?.code) === 200) {
      showToast('抢购成功，订单处理中...', 'success')
    } else {
      const message = friendlyPurchaseMessage(data?.message)
      showToast(message, 'error')
      if (productIndex !== -1) {
        products.value[productIndex].stock += 1
      }
    }
  } catch (e) {
    if (productIndex !== -1) {
      products.value[productIndex].stock += 1
    }
    const message = friendlyPurchaseMessage(e?.message)
    showToast(message, 'error')
  } finally {
    buyingId.value = null
  }
}

function onAddCart(product) {
  if (!loggedIn.value) {
    showToast('请先登录', 'error')
    return
  }
  if (cartProductIds.value.has(product.id)) {
    showToast('该商品已在购物车中，每人限购一件', 'error')
    return
  }
  const result = add(product, 1)
  showToast(
    result.ok ? '已加入购物车' : friendlyPurchaseMessage(result.message),
    result.ok ? 'success' : 'error',
  )
}

onMounted(async () => {
  await trySession()
  await loadProducts()
})
</script>

<template>
  <div class="seckill page">
    <section class="campaign-panel">
      <div class="campaign-copy">
        <span class="campaign-kicker">
          <span class="campaign-kicker__dot" aria-hidden="true" />
          限时秒杀
        </span>
        <h1>极光秒杀会场</h1>
        <p>好价限时开放，库存实时扣减。登录后即可参与抢购，也可以先加入购物车统一下单。</p>
        <div class="campaign-facts">
          <span>实时库存</span>
          <span>限时价格</span>
          <span>每人限购 1 件</span>
        </div>
      </div>

      <div class="auth-panel">
        <template v-if="!loggedIn">
          <div class="auth-panel__heading">
            <span>账户</span>
            <h2>登录后抢购</h2>
          </div>
          <form class="login-form" @submit.prevent="onLogin">
            <label class="field">
              <span>用户名</span>
              <input
                v-model="loginUser"
                type="text"
                autocomplete="username"
                placeholder="请输入用户名"
                required
              />
            </label>
            <label class="field">
              <span>密码</span>
              <input
                v-model="loginPass"
                type="password"
                autocomplete="current-password"
                placeholder="请输入密码"
                required
              />
            </label>
            <p v-if="loginError" class="form-message is-error">{{ loginError }}</p>
            <div class="auth-actions">
              <button type="submit" class="btn primary" :disabled="loginLoading">
                {{ loginLoading ? '登录中...' : '登录' }}
              </button>
              <RouterLink to="/register" class="btn secondary">注册</RouterLink>
            </div>
            <p class="auth-hint">演示环境输入任意非空用户名和密码即可登录</p>
          </form>
        </template>

        <template v-else>
          <div class="user-summary">
            <div class="user-summary__avatar">
              {{ (user.username || '?').slice(0, 1).toUpperCase() }}
            </div>
            <div class="user-summary__copy">
              <span>当前账户</span>
              <strong>{{ user.nickname || user.username }}</strong>
              <p>已登录，可参与秒杀和加入购物车</p>
            </div>
            <button type="button" class="btn ghost sm" @click="logout">退出</button>
          </div>
        </template>
      </div>
    </section>

    <section class="products-section">
      <header class="section-heading">
        <div>
          <p>今日场次</p>
          <h2>秒杀商品</h2>
        </div>
        <button type="button" class="btn ghost sm" :disabled="loading" @click="loadProducts">
          {{ loading ? '刷新中...' : '刷新列表' }}
        </button>
      </header>

      <div v-if="loading && !products.length" class="product-skeletons" aria-label="正在加载商品">
        <div v-for="item in 3" :key="item" class="product-skeleton">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div v-else-if="products.length" class="product-grid">
        <SeckillProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          :time-state="seckillWindow(product)"
          :logged-in="loggedIn"
          :buying="buyingId === product.id"
          :in-cart="cartProductIds.has(product.id)"
          @add-to-cart="onAddCart"
          @buy="onBuy"
        />
      </div>

      <EmptyState
        v-else
        title="暂时没有秒杀商品"
        description="商品上架后会显示在这里，你可以稍后刷新列表。"
      >
        <button type="button" class="btn ghost" @click="loadProducts">重新加载</button>
      </EmptyState>
    </section>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="notice.message"
          class="notice"
          :class="`is-${notice.type}`"
          role="alert"
          aria-live="assertive"
        >
          <span class="notice__dot" aria-hidden="true" />
          {{ notice.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.seckill {
  max-width: var(--content-width);
  margin: 0 auto;
}

.campaign-panel {
  display: grid;
  overflow: hidden;
  grid-template-columns: minmax(0, 1.4fr) minmax(310px, 0.8fr);
  margin-bottom: clamp(2rem, 5vw, 3.5rem);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.campaign-copy {
  display: flex;
  min-height: 330px;
  justify-content: center;
  flex-direction: column;
  padding: clamp(2rem, 5vw, 4rem);
  background:
    linear-gradient(90deg, var(--accent-soft), transparent 64%),
    var(--surface);
}

.campaign-kicker {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.1em;
}

.campaign-kicker__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 5px var(--accent-soft);
}

.campaign-copy h1 {
  max-width: 10ch;
  margin: var(--space-4) 0 var(--space-3);
  font-size: clamp(2.3rem, 6vw, 4.2rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.campaign-copy > p {
  max-width: 48ch;
  margin: 0;
  color: var(--text-soft);
  font-size: 0.96rem;
  line-height: 1.7;
}

.campaign-facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-6);
}

.campaign-facts span {
  padding: 0.35rem 0.65rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-soft);
  font-size: 0.76rem;
  font-weight: 650;
}

.auth-panel {
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: clamp(1.5rem, 4vw, 2.25rem);
  background: var(--text);
  color: #ffffff;
}

.auth-panel__heading > span {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.auth-panel__heading h2 {
  margin: var(--space-1) 0 var(--space-5);
  font-size: 1.35rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field > span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.78rem;
  font-weight: 650;
}

.field input {
  width: 100%;
  padding: 0.68rem 0.8rem;
  border-color: rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.field input:hover {
  border-color: rgba(255, 255, 255, 0.32);
}

.field input::placeholder {
  color: rgba(255, 255, 255, 0.42);
}

.form-message {
  margin: 0;
  font-size: 0.8rem;
}

.form-message.is-error {
  color: #ffb4aa;
}

.auth-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.auth-panel .btn.secondary {
  border-color: rgba(255, 255, 255, 0.22);
  background: transparent;
  color: #ffffff;
}

.auth-panel .btn.secondary:hover {
  border-color: rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.08);
}

.auth-hint {
  margin: 0;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.72rem;
  line-height: 1.5;
}

.user-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-4);
  align-items: center;
}

.user-summary__avatar {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.1);
  font-size: 1.25rem;
  font-weight: 850;
}

.user-summary__copy {
  min-width: 0;
}

.user-summary__copy > span {
  display: block;
  color: rgba(255, 255, 255, 0.56);
  font-size: 0.72rem;
  font-weight: 700;
}

.user-summary__copy strong {
  display: block;
  overflow: hidden;
  margin-top: 0.15rem;
  font-size: 1.05rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-summary__copy p {
  margin: var(--space-2) 0 0;
  color: rgba(255, 255, 255, 0.54);
  font-size: 0.76rem;
}

.user-summary .btn {
  grid-column: 2;
  width: fit-content;
  border-color: rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #ffffff;
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.section-heading p {
  margin: 0 0 var(--space-1);
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin: 0;
  font-size: clamp(1.4rem, 3vw, 1.85rem);
  letter-spacing: -0.025em;
}

.product-grid,
.product-skeletons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
}

.product-skeleton {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.product-skeleton span {
  display: block;
  background: var(--surface-strong);
  animation: skeleton-pulse 1.4s ease-in-out infinite alternate;
}

.product-skeleton span:first-child {
  aspect-ratio: 4 / 3;
}

.product-skeleton span:nth-child(2) {
  width: 72%;
  height: 20px;
  margin: var(--space-5) var(--space-5) var(--space-3);
}

.product-skeleton span:last-child {
  width: 46%;
  height: 34px;
  margin: 0 var(--space-5) var(--space-5);
}

.notice {
  position: fixed;
  top: 80px;
  left: 50%;
  z-index: 1200;
  display: flex;
  max-width: min(90vw, 520px);
  align-items: center;
  gap: var(--space-3);
  padding: 0.8rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-md);
  font-size: 0.86rem;
  font-weight: 750;
  text-align: center;
  transform: translateX(-50%);
}

.notice__dot {
  width: 9px;
  height: 9px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--text-muted);
}

.notice.is-pending {
  border-color: var(--border-strong);
  background: var(--surface);
}

.notice.is-pending .notice__dot {
  background: var(--accent);
  animation: notice-pulse 0.9s ease-in-out infinite alternate;
}

.notice.is-success {
  border-color: rgba(19, 122, 84, 0.24);
  background: var(--success-soft);
  color: var(--success);
}

.notice.is-success .notice__dot {
  background: var(--success);
}

.notice.is-error {
  border-color: rgba(180, 35, 24, 0.24);
  background: var(--danger-soft);
  color: var(--danger);
}

.notice.is-error .notice__dot {
  background: var(--danger);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

@keyframes skeleton-pulse {
  from {
    opacity: 0.55;
  }

  to {
    opacity: 1;
  }
}

@keyframes notice-pulse {
  from {
    opacity: 0.45;
  }

  to {
    opacity: 1;
  }
}

@media (max-width: 980px) {
  .campaign-panel {
    grid-template-columns: 1fr;
  }

  .campaign-copy {
    min-height: auto;
  }

  .product-grid,
  .product-skeletons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .notice {
    top: 72px;
    width: calc(100% - 2rem);
    max-width: none;
    justify-content: flex-start;
    text-align: left;
  }

  .campaign-copy {
    padding: 2rem 1.25rem;
  }

  .campaign-copy h1 {
    max-width: 8ch;
    font-size: 2.45rem;
  }

  .auth-panel {
    padding: 1.5rem 1.25rem;
  }

  .product-grid,
  .product-skeletons {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .section-heading .btn {
    width: 100%;
  }
}
</style>
