<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { useCart } from './composables/useCart'
import AiChatbot from './components/AiChatbot.vue'
const route = useRoute()
const router = useRouter()
const { count } = useCart()

function getToken() {
  return localStorage.getItem('mall_token')
}
function getRole() {
  return localStorage.getItem('role') || ''
}

const token = ref(getToken())
const role = ref(getRole())

function refreshAuthState() {
  token.value = getToken()
  role.value = getRole()
}

function handleStorageChange(e) {
  if (e.key === 'mall_token' || e.key === 'role' || e.key === null) {
    refreshAuthState()
  }
}
window.addEventListener('storage', handleStorageChange)

let timer = null
onMounted(() => {
  timer = setInterval(() => {
    const currentToken = getToken()
    const currentRole = getRole()
    if (currentToken !== token.value || currentRole !== role.value) {
      refreshAuthState()
    }
  }, 500)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  window.removeEventListener('storage', handleStorageChange)
})

const isLoggedIn = computed(() => !!token.value)

const nav = computed(() => {
  const items = []
  items.push({ to: '/seckill', label: '秒杀会场' })

  if (!isLoggedIn.value) {
    return items
  }

  items.push({ to: '/cart', label: '购物车', badge: true })
  items.push({ to: '/admin/orders', label: '订单管理' })

  if (role.value === 'admin') {
    items.push({ to: '/admin/products', label: '商品管理' })
  }

  return items
})

const active = computed(() => route.path)
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand" @click="router.push('/seckill')">
        <span class="logo" aria-hidden="true" />
        <span class="brand-name">极光商城</span>
      </div>
      <nav class="nav" aria-label="主导航">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: active === item.to || (item.to !== '/seckill' && active.startsWith(item.to)) }"
        >
          {{ item.label }}
          <span v-if="item.badge && count > 0" class="badge">{{ count }}</span>
        </RouterLink>
      </nav>
    </header>
    <main class="main">
      <RouterView />
    </main>
    <AiChatbot />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(1200px 600px at 10% -10%, rgba(14, 165, 233, 0.12), transparent),
    radial-gradient(900px 500px at 100% 0%, rgba(99, 102, 241, 0.1), transparent),
    var(--bg);
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  backdrop-filter: blur(12px);
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  user-select: none;
}
.logo {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.35);
}
.brand-name {
  font-weight: 700;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}
.nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.nav-link {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}
.badge {
  margin-left: 0.35rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 700;
  background: var(--accent);
  color: #fff;
}
.nav-link:hover {
  color: var(--text);
  background: var(--surface-2);
}
.nav-link.active {
  color: var(--text);
  background: var(--surface-2);
  box-shadow: inset 0 0 0 1px var(--border);
}
.main {
  flex: 1;
  padding: 1.5rem clamp(1rem, 4vw, 2.5rem) 2.5rem;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}
</style>