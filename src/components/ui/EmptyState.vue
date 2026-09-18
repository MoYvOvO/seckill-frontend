<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="empty-state">
    <div class="empty-state__mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
    <h2>{{ title }}</h2>
    <p v-if="description">{{ description }}</p>
    <div v-if="$slots.default" class="empty-state__action">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.empty-state {
  display: grid;
  justify-items: center;
  padding: clamp(2.5rem, 8vw, 5rem) var(--space-6);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface);
  text-align: center;
}

.empty-state__mark {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  width: 54px;
  height: 54px;
  justify-content: center;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--surface-strong);
}

.empty-state__mark span {
  width: 7px;
  border-radius: var(--radius-pill);
  background: var(--border-strong);
}

.empty-state__mark span:nth-child(1) {
  height: 15px;
}

.empty-state__mark span:nth-child(2) {
  height: 27px;
  background: var(--accent);
}

.empty-state__mark span:nth-child(3) {
  height: 20px;
}

h2 {
  margin: var(--space-5) 0 var(--space-2);
  font-size: 1.15rem;
}

p {
  max-width: 48ch;
  margin: 0;
  color: var(--text-muted);
  line-height: 1.65;
}

.empty-state__action {
  margin-top: var(--space-5);
}
</style>
