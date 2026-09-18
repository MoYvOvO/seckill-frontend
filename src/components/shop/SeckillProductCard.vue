<script setup>
defineProps({
  product: {
    type: Object,
    required: true,
  },
  timeState: {
    type: Object,
    required: true,
  },
  loggedIn: {
    type: Boolean,
    default: false,
  },
  buying: {
    type: Boolean,
    default: false,
  },
  inCart: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['buy', 'add-to-cart'])

function formatMoney(value) {
  return `¥${Number(value).toFixed(2)}`
}
</script>

<template>
  <article class="product-card">
    <div class="product-card__media">
      <img :src="product.image" :alt="product.name" loading="lazy" />
      <span
        class="product-card__status"
        :class="timeState.active ? 'is-live' : timeState.ended ? 'is-ended' : 'is-upcoming'"
      >
        <span class="product-card__status-dot" aria-hidden="true" />
        {{ timeState.label }}
      </span>
    </div>

    <div class="product-card__body">
      <div class="product-card__heading">
        <h3>{{ product.name }}</h3>
        <p>{{ product.description }}</p>
      </div>

      <div class="product-card__price">
        <span class="product-card__price-label">秒杀价</span>
        <strong>{{ formatMoney(product.seckillPrice) }}</strong>
        <del>{{ formatMoney(product.price) }}</del>
      </div>

      <div class="product-card__stock">
        <span>剩余库存</span>
        <strong>{{ product.stock }}</strong>
        <span>件</span>
      </div>

      <div class="product-card__actions">
        <button
          type="button"
          class="btn ghost"
          :disabled="!loggedIn || product.stock <= 0 || inCart"
          @click="$emit('add-to-cart', product)"
        >
          {{ inCart ? '已加入购物车' : '加入购物车' }}
        </button>
        <button
          type="button"
          class="btn primary"
          :disabled="buying || product.stock <= 0 || !timeState.active || !loggedIn"
          @click="$emit('buy', product)"
        >
          <template v-if="buying">抢购中...</template>
          <template v-else-if="!loggedIn">登录后抢购</template>
          <template v-else-if="product.stock <= 0">已抢完</template>
          <template v-else-if="!timeState.active">不可抢购</template>
          <template v-else>立即抢购</template>
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  display: flex;
  min-width: 0;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.product-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.product-card__media {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  background: var(--surface-strong);
}

.product-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-card__media img {
  transform: scale(1.025);
}

.product-card__status {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 28px;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-pill);
  background: rgba(24, 32, 42, 0.78);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 750;
  backdrop-filter: blur(8px);
}

.product-card__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.product-card__status.is-live {
  background: rgba(19, 122, 84, 0.94);
}

.product-card__status.is-upcoming {
  background: rgba(161, 92, 0, 0.94);
}

.product-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: var(--space-5);
}

.product-card__heading {
  flex: 1;
}

h3 {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.35;
}

.product-card__heading p {
  display: -webkit-box;
  overflow: hidden;
  min-height: 2.8em;
  margin: var(--space-2) 0 var(--space-4);
  color: var(--text-muted);
  font-size: 0.84rem;
  line-height: 1.45;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.product-card__price {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}

.product-card__price-label {
  width: 100%;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
}

.product-card__price strong {
  color: var(--accent);
  font-size: 1.5rem;
  line-height: 1;
  letter-spacing: -0.025em;
}

.product-card__price del {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.product-card__stock {
  display: flex;
  justify-content: space-between;
  margin-top: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 0.78rem;
}

.product-card__stock strong {
  color: var(--text);
  font-size: 0.88rem;
}

.product-card__actions {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

@media (max-width: 520px) {
  .product-card__actions {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .product-card,
  .product-card__media img {
    transition: none;
  }
}
</style>
