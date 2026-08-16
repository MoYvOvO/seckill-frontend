<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCart, unitPrice, isSeckillActive } from '../composables/useCart'
import { fetchProducts } from '../api/products'
import { seckillBuy } from '../api/seckill'

const router = useRouter()
const { items, total, count, updateQuantity, remove, clear, syncStock } = useCart()

const loading = ref(false)
const checkingOut = ref(false)
const toast = ref('')

const empty = computed(() => count.value === 0)

function showToast(msg) {
  toast.value = msg
  setTimeout(() => {
    toast.value = ''
  }, 2800)
}

function formatMoney(n) {
  return `¥${Number(n).toFixed(2)}`
}

async function refreshStock() {
  loading.value = true
  try {
    const products = (await fetchProducts()) || []
    syncStock(products)
  } finally {
    loading.value = false
  }
}

async function checkout() {
  if (empty.value) return
  checkingOut.value = true
  const failed = []
  const success = []

  for (const item of [...items.value]) {
    for (let i = 0; i < item.quantity; i++) {
      try {
        const data = await seckillBuy(item.id)
        success.push(data.order.id)
      } catch (e) {
        failed.push(`${item.name}: ${e.message}`)
        break
      }
    }
  }

  clear()
  checkingOut.value = false

  if (success.length) {
    showToast(`结算成功，共 ${success.length} 笔订单`)
  }
  if (failed.length) {
    showToast(failed[0])
  }
}

onMounted(refreshStock)
</script>

<template>
  <div class="cart page">
    <div class="section-head">
      <h1>购物车</h1>
      <button type="button" class="btn ghost sm" :disabled="loading" @click="refreshStock">
        {{ loading ? '刷新中…' : '刷新库存' }}
      </button>
    </div>

    <div v-if="empty" class="state card">
      <p>购物车是空的</p>
      <button type="button" class="btn primary" @click="router.push('/seckill')">
        去秒杀会场逛逛
      </button>
    </div>

    <template v-else>
      <ul class="list">
        <li v-for="item in items" :key="item.id" class="item card">
          <img :src="item.image" :alt="item.name" class="thumb" />
          <div class="info">
            <h3>{{ item.name }}</h3>
            <p class="muted small">
              {{ isSeckillActive(item) ? '秒杀价' : '原价' }}
              · 库存 {{ item.stock }}
            </p>
            <div class="price">{{ formatMoney(unitPrice(item)) }}</div>
          </div>
          <div class="actions">
            <div class="qty">
              <button
                type="button"
                class="btn ghost sm"
                @click="updateQuantity(item.id, item.quantity - 1)"
              >
                −
              </button>
              <span>{{ item.quantity }}</span>
              <button
                type="button"
                class="btn ghost sm"
                :disabled="item.quantity >= item.stock"
                @click="updateQuantity(item.id, item.quantity + 1)"
              >
                +
              </button>
            </div>
            <button type="button" class="btn ghost sm" @click="remove(item.id)">删除</button>
          </div>
        </li>
      </ul>

      <footer class="footer card">
        <div class="sum">
          共 <strong>{{ count }}</strong> 件，合计
          <strong class="total">{{ formatMoney(total) }}</strong>
        </div>
        <button type="button" class="btn primary" :disabled="checkingOut" @click="checkout">
          {{ checkingOut ? '结算中…' : '去结算' }}
        </button>
      </footer>
    </template>

    <Transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.cart {
  max-width: 720px;
  margin: 0 auto;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.section-head h1 {
  margin: 0;
  font-size: 1.5rem;
}
.state {
  padding: 3rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}
.state p {
  margin: 0;
  color: var(--text-muted);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  align-items: center;
}
.thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
}
.info {
  flex: 1;
  min-width: 0;
}
.info h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}
.muted {
  color: var(--text-muted);
}
.muted.small {
  font-size: 0.8125rem;
  margin: 0;
}
.price {
  font-weight: 800;
  color: var(--accent);
  margin-top: 0.35rem;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
  flex-shrink: 0;
}
.qty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.footer {
  margin-top: 1.25rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.sum {
  color: var(--text-muted);
}
.total {
  color: var(--accent);
  font-size: 1.25rem;
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
</style>
