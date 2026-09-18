<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
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
  <header class="page-header">
    <div class="page-header__copy">
      <p v-if="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p v-if="description" class="page-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-6);
  margin-bottom: var(--space-6);
}

.page-header__copy {
  min-width: 0;
}

.page-header__eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(1.55rem, 3vw, 2rem);
  line-height: 1.16;
  letter-spacing: -0.025em;
}

.page-header__description {
  max-width: 62ch;
  margin: var(--space-2) 0 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.page-header__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-3);
}

@media (max-width: 680px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-header__actions {
    width: 100%;
  }

  .page-header__actions :deep(.btn) {
    width: 100%;
  }
}
</style>
