<script setup>
import { ref, onMounted } from 'vue'
import { fetchOrders, updateOrderStatus } from '../api/orders'

const list = ref([])
const loading = ref(false)

const statusOptions = [
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

const statusMap = Object.fromEntries(statusOptions.map((o) => [o.value, o.label]))

async function load() {
  loading.value = true
  try {
   const body = await fetchOrders()
    console.log('订单返回的 body:', JSON.stringify(body, null, 2))  // 先打印确认

    // 因为实际数据在 body.data 里，直接取这个数组
    list.value = body.data || []
  } finally {
    loading.value = false
  }
}

async function onStatusChange(row, ev) {
  const prev = row.status
  const status = ev.target.value
  try {
    await updateOrderStatus(row.id, status)
    row.status = status
  } catch {
    ev.target.value = prev
  }
}

function formatMoney(n) {
  return `¥${Number(n).toFixed(2)}`
}

function formatTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { hour12: false })
}

function statusClass(s) {
  const map = {
    pending: 'warn',
    paid: 'ok',
    shipped: 'info',
    completed: 'muted',
    cancelled: 'bad',
    failed: 'bad',
  }
  return map[s] || 'muted'
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1>订单管理</h1>
        <p class="muted">查看订单列表与状态，可在表格内直接更新</p>
      </div>
      <button type="button" class="btn ghost" @click="load">刷新</button>
    </header>

    <div v-if="loading" class="state">加载中…</div>
    <div v-else class="table-wrap card">
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
            <td class="mono">{{ row.id }}</td>
            <td>{{ row.productName }}</td>
            <td>{{ row.username || row.userId }}</td>
            <td>{{ formatMoney(row.amount) }}</td>
            <td>
              <div class="status-cell">
                <span class="badge" :class="statusClass(row.status)">
                  {{ statusMap[row.status] || row.status }}
                </span>
                <select
                  class="select"
                  :value="row.status || 'pending'"
                  aria-label="更新订单状态"
                  @change="onStatusChange(row, $event)"
                >
                  <option v-for="o in statusOptions" :key="o.value" :value="o.value">
                    {{ o.label }}
                  </option>
                </select>
              </div>
            </td>
            <td class="muted">{{ formatTime(row.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!list.length" class="empty muted">暂无订单，用户在秒杀页抢购成功后会出现在这里</p>
    </div>
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
}
.muted {
  color: var(--text-muted);
  margin: 0;
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
  vertical-align: middle;
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
.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
}
.status-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.badge {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge.ok {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}
.badge.warn {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}
.badge.info {
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
}
.badge.muted {
  background: var(--surface-2);
  color: var(--text-muted);
}
.badge.bad {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}
.select {
  font: inherit;
  font-size: 0.8125rem;
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  max-width: 8rem;
}
</style>
