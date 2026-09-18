<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCart, unitPrice, isSeckillActive } from '../composables/useCart'
import { fetchProducts } from '../api/products'
import { seckillBuy } from '../api/seckill'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'

const router = useRouter()
const { items, total, count, updateQuantity, remove, syncStock } = useCart()

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

function formatMoney(value) {
  return `¥${Number(value).toFixed(2)}`
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

function friendlyMessage(msg = '') {
  const text = String(msg)
  if (text.includes('已购买') || text.includes('重复')) {
    return '您已抢购过该商品，每人限购一件'
  }
  if (text.includes('售罄')) return '手慢了，商品已售罄'
  if (text.includes('库存')) return '库存不足，请刷新后重试'
  if (text.includes('未开始')) return '秒杀还没开始，再等等吧'
  if (text.includes('已结束')) return '秒杀已经结束了'
  return '抢购失败，请稍后重试'
}

async function checkout() {
  if (empty.value) return
  checkingOut.value = true
  const successItems = []
  const failedItems = []

  for (const item of [...items.value]) {
    let itemOk = true
    for (let index = 0; index < item.quantity; index++) {
      try {
        const data = await seckillBuy(item.id)
        if (!data || data.code !== 200) {
          throw new Error(data?.message || '下单失败')
        }
      } catch (e) {
        itemOk = false
        failedItems.push(`${item.name}：${friendlyMessage(e.message)}`)
        break
      }
    }
    if (itemOk) {
      successItems.push(item.name)
      remove(item.id)
    }
  }

  checkingOut.value = false

  if (successItems.length && failedItems.length) {
    showToast(`成功 ${successItems.length} 件，失败：${failedItems[0]}`)
  } else if (successItems.length) {
    showToast(`结算成功，共 ${successItems.length} 件商品`)
  } else if (failedItems.length) {
    showToast(failedItems[0])
  }
}

onMounted(refreshStock)
</script>

<template>
  <div class="cart page">
    <PageHeader title="购物车" description="核对商品和数量后统一结算，库存会按当前数据同步。">
      <template #actions>
        <button type="button" class="btn ghost" :disabled="loading" @click="refreshStock">
          {{ loading ? '同步中...' : '刷新库存' }}
        </button>
      </template>
    </PageHeader>

    <EmptyState
      v-if="empty"
      title="购物车还是空的"
      description="去秒杀会场选择心仪商品，加入购物车后可以在这里统一结算。"
    >
      <button type="button" class="btn primary" @click="router.push('/seckill')">
        去逛秒杀会场
      </button>
    </EmptyState>

    <div v-else class="cart-layout">
      <section class="cart-list" aria-label="购物车商品">
        <article v-for="item in items" :key="item.id" class="cart-item">
          <img :src="item.image" :alt="item.name" class="cart-item__image" />

          <div class="cart-item__info">
            <div class="cart-item__heading">
              <h2>{{ item.name }}</h2>
              <span :class="{ 'is-seckill': isSeckillActive(item) }">
                {{ isSeckillActive(item) ? '秒杀价' : '原价' }}
              </span>
            </div>
            <p>当前库存 {{ item.stock }} 件</p>
            <strong>{{ formatMoney(unitPrice(item)) }}</strong>
          </div>

          <div class="cart-item__actions">
            <div class="quantity-control" aria-label="商品数量">
              <button
                type="button"
                aria-label="减少数量"
                @click="updateQuantity(item.id, item.quantity - 1)"
              >
                -
              </button>
              <span aria-live="polite">{{ item.quantity }}</span>
              <button
                type="button"
                aria-label="增加数量"
                :disabled="item.quantity >= 1"
                @click="updateQuantity(item.id, item.quantity + 1)"
              >
                +
              </button>
            </div>
            <button type="button" class="text-button" @click="remove(item.id)">删除</button>
          </div>
        </article>
      </section>

      <aside class="checkout-card">
        <div class="checkout-card__heading">
          <span>结算摘要</span>
          <h2>订单预览</h2>
        </div>

        <dl class="checkout-summary">
          <div>
            <dt>商品数量</dt>
            <dd>{{ count }} 件</dd>
          </div>
          <div class="checkout-summary__total">
            <dt>合计金额</dt>
            <dd>{{ formatMoney(total) }}</dd>
          </div>
        </dl>

        <button
          type="button"
          class="btn primary wide"
          :disabled="checkingOut"
          @click="checkout"
        >
          {{ checkingOut ? '结算中...' : '去结算' }}
        </button>
        <p>结算时逐件提交，已成功商品会自动从购物车移除。</p>
      </aside>
    </div>

    <Transition name="fade">
      <div v-if="toast" class="toast" role="status" aria-live="polite">{{ toast }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.cart {
  max-width: var(--content-width);
  margin: 0 auto;
}

.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: var(--space-6);
  align-items: start;
}

.cart-list {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.cart-item {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) auto;
  gap: var(--space-5);
  align-items: center;
  padding: var(--space-5);
  border-bottom: 1px solid var(--border);
}

.cart-item:last-child {
  border-bottom: 0;
}

.cart-item__image {
  width: 92px;
  height: 92px;
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  object-fit: cover;
}

.cart-item__info {
  min-width: 0;
}

.cart-item__heading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cart-item__heading h2 {
  overflow: hidden;
  margin: 0;
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-item__heading span {
  flex-shrink: 0;
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 750;
}

.cart-item__heading span.is-seckill {
  background: var(--accent-soft);
  color: var(--accent);
}

.cart-item__info p {
  margin: var(--space-2) 0 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.cart-item__info strong {
  display: block;
  margin-top: var(--space-2);
  color: var(--accent);
  font-size: 1.1rem;
}

.cart-item__actions {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: var(--space-3);
}

.quantity-control {
  display: grid;
  grid-template-columns: 34px 38px 34px;
  overflow: hidden;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
}

.quantity-control button,
.quantity-control span {
  display: grid;
  height: 34px;
  place-items: center;
  border: 0;
  background: var(--surface);
  color: var(--text);
  font-weight: 750;
}

.quantity-control span {
  border-right: 1px solid var(--border);
  border-left: 1px solid var(--border);
  font-size: 0.8rem;
}

.quantity-control button {
  cursor: pointer;
}

.quantity-control button:hover:not(:disabled) {
  background: var(--surface-muted);
}

.quantity-control button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.text-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--danger);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
}

.checkout-card {
  position: sticky;
  top: 88px;
  padding: var(--space-6);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.checkout-card__heading span {
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

.checkout-card__heading h2 {
  margin: var(--space-1) 0 var(--space-5);
  font-size: 1.2rem;
}

.checkout-summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0 0 var(--space-5);
  padding: var(--space-4) 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.checkout-summary > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.checkout-summary dt,
.checkout-summary dd {
  margin: 0;
}

.checkout-summary dt {
  color: var(--text-muted);
}

.checkout-summary dd {
  font-weight: 750;
}

.checkout-summary__total dd {
  color: var(--accent);
  font-size: 1.3rem;
}

.checkout-card > p {
  margin: var(--space-4) 0 0;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.6;
}

.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  z-index: 200;
  max-width: min(90vw, 420px);
  padding: 0.72rem 1.15rem;
  border-radius: var(--radius-md);
  background: var(--text);
  color: #ffffff;
  box-shadow: var(--shadow-md);
  font-size: 0.86rem;
  font-weight: 650;
  text-align: center;
  transform: translateX(-50%);
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

@media (max-width: 900px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .checkout-card {
    position: static;
  }
}

@media (max-width: 640px) {
  .cart-item {
    grid-template-columns: 76px minmax(0, 1fr);
    align-items: start;
    gap: var(--space-4);
    padding: var(--space-4);
  }

  .cart-item__image {
    width: 76px;
    height: 76px;
  }

  .cart-item__actions {
    grid-column: 2;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
  }
}
</style>
