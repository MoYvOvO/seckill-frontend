import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'mall_cart'

const items = ref(load())

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
}

watch(items, save, { deep: true })

export function isSeckillActive(product) {
  const start = new Date(product.seckillStart).getTime()
  const end = new Date(product.seckillEnd).getTime()
  const t = Date.now()
  return t >= start && t <= end
}

export function unitPrice(product) {
  return isSeckillActive(product) ? product.seckillPrice : product.price
}

export function useCart() {
  const count = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0),
  )

  const total = computed(() =>
    items.value.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0),
  )

 function add(product, quantity = 1) {
  const start = new Date(product.seckillStart).getTime()
  const end = new Date(product.seckillEnd).getTime()
  const t = Date.now()
  if (t < start) {
    return { ok: false, message: '秒杀还未开始，暂不能加入购物车' }
  }
  if (t > end) {
    return { ok: false, message: '秒杀已结束，无法加入购物车' }
  }

  const existing = items.value.find((i) => i.id === product.id)
  if (existing) {
    return { ok: false, message: '每人限购 1 件' }
  }
  items.value.push({
    id: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    seckillPrice: product.seckillPrice,
    seckillStart: product.seckillStart,
    seckillEnd: product.seckillEnd,
    stock: product.stock,
    quantity: 1,
  })
  return { ok: true }
}

function updateQuantity(productId, quantity) {
  const item = items.value.find((i) => i.id === productId)
  if (!item) return
  if (quantity <= 0) {
    remove(productId)
    return
  }
  item.quantity = Math.min(quantity, 1)
}

  function remove(productId) {
    items.value = items.value.filter((i) => i.id !== productId)
  }

  function clear() {
    items.value = []
  }

  function syncStock(products) {
    for (const item of items.value) {
      const p = products.find((x) => x.id === item.id)
      if (p) {
        item.stock = p.stock
        item.seckillStart = p.seckillStart
        item.seckillEnd = p.seckillEnd
        if (item.quantity > p.stock) item.quantity = p.stock
      }
    }
    items.value = items.value.filter((i) => i.stock > 0)
  }

  return {
    items,
    count,
    total,
    add,
    updateQuantity,
    remove,
    clear,
    syncStock,
    unitPrice,
    isSeckillActive,
  }
}
