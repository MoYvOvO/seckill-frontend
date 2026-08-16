<script setup>
import { ref, reactive, onMounted } from 'vue'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../api/products'

const list = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogOpen = ref(false)
const editingId = ref(null)

const form = reactive({
  name: '',
  description: '',
  price: 0,
  seckillPrice: 0,
  stock: 0,
  image: '',
  seckillStart: '',
  seckillEnd: '',
})

function resetForm() {
  form.name = ''
  form.description = ''
  form.price = 0
  form.seckillPrice = 0
  form.stock = 0
  form.image = ''
  const now = new Date()
  form.seckillStart = toLocalInput(now)
  form.seckillEnd = toLocalInput(new Date(now.getTime() + 86400000 * 7))
}

function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInput(s) {
  if (!s) return new Date().toISOString()
  return new Date(s).toISOString()
}

async function load() {
  loading.value = true
  try {
     const body = await fetchProducts()
    console.log('产品返回的 body:', JSON.stringify(body, null, 2))  // 先打印确认

    // 因为实际数据在 body.data 里，直接取这个数组
    list.value = body.data || []
   
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  resetForm()
  dialogOpen.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.name = row.name
  form.description = row.description || ''
  form.price = row.price
  form.seckillPrice = row.seckillPrice
  form.stock = row.stock
  form.image = row.image || ''
  form.seckillStart = toLocalInput(new Date(row.seckillStart))
  form.seckillEnd = toLocalInput(new Date(row.seckillEnd))
  dialogOpen.value = true
}

async function onSave() {
  saving.value = true
  try {
    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      seckillPrice: form.seckillPrice,
      stock: form.stock,
      image: form.image,
      seckillStart: fromLocalInput(form.seckillStart),
      seckillEnd: fromLocalInput(form.seckillEnd),
    }
    if (editingId.value) {
      await updateProduct(editingId.value, payload)
    } else {
      await createProduct(payload)
    }
    dialogOpen.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function onDelete(row) {
  if (!confirm(`确定删除「${row.name}」？`)) return
  await deleteProduct(row.id)
  await load()
}

function formatMoney(n) {
  return `¥${Number(n).toFixed(2)}`
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>秒杀商品管理</h1>
        <p class="muted">维护商品信息、秒杀价与库存</p>
      </div>
      <button type="button" class="btn primary" @click="openCreate">新建商品</button>
    </header>

    <div v-if="loading" class="state">加载中…</div>
    <div v-else class="table-wrap card">
      <table class="data-table">
        <thead>
          <tr>
            <th>商品</th>
            <th>原价</th>
            <th>秒杀价</th>
            <th>库存</th>
            <th class="right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in list" :key="row.id">
            <td>
              <div class="cell-product">
                <img :src="row.image" alt="" class="thumb" />
                <div>
                  <div class="name">{{ row.name }}</div>
                  <div class="muted small">{{ row.description }}</div>
                </div>
              </div>
            </td>
            <td>{{ formatMoney(row.price) }}</td>
            <td class="accent">{{ formatMoney(row.seckillPrice) }}</td>
            <td>{{ row.stock }}</td>
            <td class="right actions">
              <button type="button" class="btn ghost sm" @click="openEdit(row)">编辑</button>
              <button type="button" class="btn danger ghost sm" @click="onDelete(row)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!list.length" class="empty muted">暂无商品，点击右上角新建</p>
    </div>

    <Teleport to="body">
      <div v-if="dialogOpen" class="modal-backdrop" @click.self="dialogOpen = false">
        <div class="modal card">
          <h2>{{ editingId ? '编辑商品' : '新建商品' }}</h2>
          <form class="form" @submit.prevent="onSave">
            <label>
              <span>名称</span>
              <input v-model="form.name" required maxlength="80" />
            </label>
            <label>
              <span>描述</span>
              <textarea v-model="form.description" rows="2" maxlength="500"></textarea>
            </label>
            <div class="row2">
              <label>
                <span>原价</span>
                <input v-model.number="form.price" type="number" min="0" step="0.01" required />
              </label>
              <label>
                <span>秒杀价</span>
                <input v-model.number="form.seckillPrice" type="number" min="0" step="0.01" required />
              </label>
            </div>
            <label>
              <span>库存</span>
              <input v-model.number="form.stock" type="number" min="0" step="1" required />
            </label>
            <label>
              <span>封面图 URL</span>
              <input v-model="form.image" type="url" placeholder="https://..." />
            </label>
            <div class="row2">
              <label>
                <span>秒杀开始</span>
                <input v-model="form.seckillStart" type="datetime-local" required />
              </label>
              <label>
                <span>秒杀结束</span>
                <input v-model="form.seckillEnd" type="datetime-local" required />
              </label>
            </div>
            <footer class="modal-actions">
              <button type="button" class="btn ghost" @click="dialogOpen = false">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">
                {{ saving ? '保存中…' : '保存' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.page-head h1 {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}
.muted {
  color: var(--text-muted);
  margin: 0;
}
.muted.small {
  font-size: 0.8125rem;
}
.state,
.empty {
  padding: 2rem;
  text-align: center;
}
.table-wrap {
  overflow: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}
.data-table th,
.data-table td {
  padding: 0.875rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.data-table th {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.8125rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.data-table tr:last-child td {
  border-bottom: none;
}
.right {
  text-align: right;
}
.cell-product {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.thumb {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: cover;
  background: var(--surface-2);
}
.name {
  font-weight: 600;
}
.accent {
  color: var(--accent);
  font-weight: 600;
}
.actions {
  white-space: nowrap;
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
}
.modal {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: auto;
  padding: 1.5rem;
}
.modal h2 {
  margin: 0 0 1.25rem;
  font-size: 1.125rem;
}
.form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}
.form label span {
  color: var(--text-muted);
  font-weight: 500;
}
.form input,
.form textarea {
  font: inherit;
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}
.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}
</style>
