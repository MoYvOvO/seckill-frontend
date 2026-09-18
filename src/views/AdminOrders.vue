<script setup>
import { ref, onMounted } from 'vue'
import { fetchOrders, updateOrderStatus } from '../api/orders'
import PageHeader from '../components/ui/PageHeader.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import StatusBadge from '../components/ui/StatusBadge.vue'

const list = ref([])
const loading = ref(false)

const statusOptions = [
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

const statusMap = Object.fromEntries(statusOptions.map((option) => [option.value, option.label]))

async function load() {
  loading.value = true
  try {
    const body = await fetchOrders()
    list.value = body.data || []
  } finally {
    loading.value = false
  }
}

async function onStatusChange(row, event) {
  const previous = row.status
  const status = event.target.value
  try {
    await updateOrderStatus(row.id, status)
    row.status = status
  } catch {
    event.target.value = previous
  }
}

function formatMoney(value) {
  return `¥${Number(value).toFixed(2)}`
}

function formatTime(value) {
  if (!value) return '--'
  const date = new Date(value)
  return date.toLocaleString('zh-CN', { hour12: false })
}

function statusClass(status) {
  const map = {
    pending: 'warn',
    paid: 'ok',
    shipped: 'info',
    completed: 'muted',
    cancelled: 'bad',
    failed: 'bad',
  }
  return map[status] || 'muted'
}

onMounted(load)
</script>

<template>
  <div class="admin-orders page">
    <PageHeader
      eyebrow="运营后台"
      title="订单管理"
      description="查看订单列表和当前状态，并可直接更新订单流转状态。"
    >
      <template #actions>
        <button type="button" class="btn ghost" :disabled="loading" @click="load">
          {{ loading ? '刷新中...' : '刷新订单' }}
        </button>
      </template>
    </PageHeader>

    <div v-if="loading" class="table-loading" aria-label="正在加载订单">
      <span v-for="item in 6" :key="item" />
    </div>

    <div v-else-if="list.length" class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>商品</th>
            <th>用户</th>
            <th>金额</th>
            <th>状态</th>
            <th>下单时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in list" :key="row.id">
            <td class="order-id">{{ row.id }}</td>
            <td class="product-name">{{ row.productName }}</td>
            <td>{{ row.username || row.userId }}</td>
            <td class="amount">{{ formatMoney(row.amount) }}</td>
            <td>
              <div class="status-cell">
                <StatusBadge
                  :label="statusMap[row.status] || row.status"
                  :tone="statusClass(row.status)"
                />
                <select
                  class="select"
                  :value="row.status || 'pending'"
                  aria-label="更新订单状态"
                  @change="onStatusChange(row, $event)"
                >
                  <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </td>
            <td class="muted">{{ formatTime(row.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <EmptyState
      v-else
      title="暂无订单"
      description="用户抢购成功后，订单会出现在这里。"
    />
  </div>
</template>

<style scoped>
.admin-orders {
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
  min-width: 900px;
  border-collapse: collapse;
  font-size: 0.88rem;
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

.order-id {
  color: var(--text-muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.78rem;
}

.product-name {
  max-width: 280px;
  font-weight: 700;
}

.amount {
  color: var(--accent);
  font-weight: 750;
}

.muted {
  color: var(--text-muted);
  white-space: nowrap;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.select {
  width: 108px;
  min-height: 34px;
  padding: 0.35rem 0.5rem;
  font-size: 0.78rem;
}

.table-loading {
  display: grid;
  gap: 1px;
  padding: var(--space-4);
}

.table-loading span {
  height: 56px;
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  animation: skeleton-pulse 1.4s ease-in-out infinite alternate;
}

@keyframes skeleton-pulse {
  from {
    opacity: 0.55;
  }

  to {
    opacity: 1;
  }
}
</style>
