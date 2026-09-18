<script setup>
import { ref, reactive, onMounted } from 'vue'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../api/products'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'

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

function toLocalInput(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInput(value) {
  if (!value) return new Date().toISOString()
  return new Date(value).toISOString()
}

async function load() {
  loading.value = true
  try {
    const body = await fetchProducts()
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
  if (!confirm(`确定删除“${row.name}”吗？`)) return
  await deleteProduct(row.id)
  await load()
}

function formatMoney(value) {
  return `¥${Number(value).toFixed(2)}`
}

onMounted(load)
</script>

<template>
  <div class="admin-products page">
    <PageHeader
      eyebrow="运营后台"
      title="秒杀商品管理"
      description="维护商品资料、秒杀价格、活动时间和可售库存。"
    >
      <template #actions>
        <button type="button" class="btn primary" @click="openCreate">新建商品</button>
      </template>
    </PageHeader>

    <div v-if="loading" class="table-loading" aria-label="正在加载商品">
      <span v-for="item in 5" :key="item" />
    </div>

    <div v-else-if="list.length" class="table-wrap">
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
              <div class="product-cell">
                <img :src="row.image" alt="" class="product-cell__image" />
                <div class="product-cell__copy">
                  <strong>{{ row.name }}</strong>
                  <span>{{ row.description }}</span>
                </div>
              </div>
            </td>
            <td class="muted">{{ formatMoney(row.price) }}</td>
            <td class="accent">{{ formatMoney(row.seckillPrice) }}</td>
            <td>{{ row.stock }}</td>
            <td class="right">
              <div class="row-actions">
                <button type="button" class="btn ghost sm" @click="openEdit(row)">编辑</button>
                <button type="button" class="btn danger ghost sm" @click="onDelete(row)">
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <EmptyState
      v-else
      title="还没有商品"
      description="创建第一个秒杀商品后，它会立即出现在管理列表中。"
    >
      <button type="button" class="btn primary" @click="openCreate">新建商品</button>
    </EmptyState>

    <Teleport to="body">
      <div v-if="dialogOpen" class="modal-backdrop" @click.self="dialogOpen = false">
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title">
          <header class="modal-header">
            <div>
              <span>商品资料</span>
              <h2 id="product-dialog-title">
                {{ editingId ? '编辑商品' : '新建商品' }}
              </h2>
            </div>
            <button type="button" class="modal-close" aria-label="关闭弹窗" @click="dialogOpen = false">
              关闭
            </button>
          </header>

          <form class="form" @submit.prevent="onSave">
            <label class="field">
              <span>商品名称</span>
              <input v-model="form.name" required maxlength="80" />
            </label>

            <label class="field">
              <span>商品描述</span>
              <textarea v-model="form.description" rows="3" maxlength="500"></textarea>
            </label>

            <div class="form-grid">
              <label class="field">
                <span>原价</span>
                <input v-model.number="form.price" type="number" min="0" step="0.01" required />
              </label>
              <label class="field">
                <span>秒杀价</span>
                <input
                  v-model.number="form.seckillPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </label>
            </div>

            <label class="field">
              <span>库存数量</span>
              <input v-model.number="form.stock" type="number" min="0" step="1" required />
            </label>

            <label class="field">
              <span>封面图片 URL</span>
              <input v-model="form.image" type="url" placeholder="https://..." />
            </label>

            <div class="form-grid">
              <label class="field">
                <span>秒杀开始时间</span>
                <input v-model="form.seckillStart" type="datetime-local" required />
              </label>
              <label class="field">
                <span>秒杀结束时间</span>
                <input v-model="form.seckillEnd" type="datetime-local" required />
              </label>
            </div>

            <footer class="modal-actions">
              <button type="button" class="btn ghost" @click="dialogOpen = false">取消</button>
              <button type="submit" class="btn primary" :disabled="saving">
                {{ saving ? '保存中...' : '保存商品' }}
              </button>
            </footer>
          </form>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-products {
  max-width: var(--content-width);
  margin: 0 auto;
}

.table-wrap,
.table-loading {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th,
.data-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--border);
  text-align: left;
  vertical-align: middle;
}

.data-table th {
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.data-table tbody tr:last-child td {
  border-bottom: 0;
}

.data-table tbody tr:hover {
  background: #fcfcfd;
}

.right {
  text-align: right;
}

.muted {
  color: var(--text-muted);
}

.accent {
  color: var(--accent);
  font-weight: 750;
}

.product-cell {
  display: flex;
  min-width: 260px;
  align-items: center;
  gap: var(--space-3);
}

.product-cell__image {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  object-fit: cover;
}

.product-cell__copy {
  min-width: 0;
}

.product-cell__copy strong,
.product-cell__copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-cell__copy strong {
  max-width: 320px;
  font-size: 0.9rem;
}

.product-cell__copy span {
  max-width: 320px;
  margin-top: 0.15rem;
  color: var(--text-muted);
  font-size: 0.76rem;
}

.row-actions {
  display: inline-flex;
  gap: var(--space-2);
  white-space: nowrap;
}

.table-loading {
  display: grid;
  gap: 1px;
  padding: var(--space-4);
}

.table-loading span {
  height: 64px;
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  animation: skeleton-pulse 1.4s ease-in-out infinite alternate;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  padding: var(--space-4);
  background: rgba(24, 32, 42, 0.52);
  backdrop-filter: blur(6px);
  place-items: center;
}

.modal {
  width: min(100%, 620px);
  max-height: min(90dvh, 760px);
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-md);
}

.modal-header {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
}

.modal-header span {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.modal-header h2 {
  margin: var(--space-1) 0 0;
  font-size: 1.2rem;
}

.modal-close {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
}

.form {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-6);
}

.field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2);
}

.field > span {
  color: var(--text-soft);
  font-size: 0.78rem;
  font-weight: 700;
}

.field input,
.field textarea {
  width: 100%;
  padding: 0.66rem 0.78rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-2);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
}

@keyframes skeleton-pulse {
  from {
    opacity: 0.55;
  }

  to {
    opacity: 1;
  }
}

@media (max-width: 620px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-header,
  .form {
    padding-right: var(--space-4);
    padding-left: var(--space-4);
  }

  .modal-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .modal-actions .btn {
    width: 100%;
  }
}
</style>
