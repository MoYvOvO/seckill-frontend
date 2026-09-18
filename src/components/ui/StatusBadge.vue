<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  tone: {
    type: String,
    default: 'muted',
  },
})
</script>

<template>
  <span class="status-badge" :class="`is-${tone}`">{{ label }}</span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 750;
  white-space: nowrap;
}

.is-ok {
  background: var(--success-soft);
  color: var(--success);
}

.is-warn {
  background: var(--warning-soft);
  color: var(--warning);
}

.is-info {
  background: var(--info-soft);
  color: var(--info);
}

.is-bad {
  background: var(--danger-soft);
  color: var(--danger);
}

.is-muted {
  background: var(--surface-strong);
  color: var(--text-muted);
}
</style>
