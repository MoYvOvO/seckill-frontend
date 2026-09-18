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
        <span class="logo" aria-hidden="true">极</span>
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
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
  background:
    linear-gradient(rgba(24, 32, 42, 0.025) 1px, transparent 1px),
    var(--canvas);
  background-size: 100% 32px;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem clamp(1rem, 4vw, 2.5rem);
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  cursor: pointer;
  user-select: none;
}

.logo {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--text);
  color: #ffffff;
  font-size: 0.84rem;
  font-weight: 850;
}

.brand-name {
  font-size: 1rem;
  font-weight: 850;
  letter-spacing: -0.015em;
}

.nav {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.2rem;
}

.nav-link {
  position: relative;
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.badge {
  margin-left: 0.35rem;
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 750;
}

.nav-link:hover {
  background: var(--surface-muted);
  color: var(--text);
}

.nav-link.active {
  background: var(--accent-soft);
  color: var(--text);
}

.nav-link.active::after {
  position: absolute;
  right: 0.75rem;
  bottom: 0.2rem;
  left: 0.75rem;
  height: 2px;
  border-radius: var(--radius-pill);
  background: var(--accent);
  content: "";
}

.main {
  flex: 1;
  width: 100%;
  max-width: var(--page-width);
  margin: 0 auto;
  padding: clamp(1.25rem, 3vw, 2rem) clamp(1rem, 4vw, 2.5rem) 4rem;
}

@media (max-width: 680px) {
  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .nav {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .nav::-webkit-scrollbar {
    display: none;
  }

  .main {
    padding-top: 1.25rem;
  }
}
</style>
