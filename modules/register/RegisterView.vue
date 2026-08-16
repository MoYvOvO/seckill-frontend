<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { register } from './api'

const router = useRouter()

const username = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function onSubmit() {
  error.value = ''
  success.value = ''

  const name = username.value.trim()
  const nick = nickname.value.trim()
  const pass = password.value
  const confirm = confirmPassword.value

  if (!name || !pass) {
    error.value = '请填写用户名和密码'
    return
  }
  if (pass.length < 6) {
    error.value = '密码至少 6 位'
    return
  }
  if (pass !== confirm) {
    error.value = '两次输入的密码不一致'
    return
  }

  loading.value = true
  try {
    await register({
      username: name,
      password: pass,
      nickname: nick || name,
    })
    success.value = '注册成功，即将跳转至秒杀会场…'
    setTimeout(() => router.push('/seckill'), 1500)
  } catch (e) {
    error.value = e?.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register page">
    <section class="card panel">
      <p class="eyebrow">新用户</p>
      <h1>创建账号</h1>
      <p class="lead muted">注册后即可登录参与秒杀抢购。</p>

      <form class="register-form" @submit.prevent="onSubmit">
        <label class="field">
          <span>用户名</span>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="请输入用户名"
            required
          />
        </label>
        <label class="field">
          <span>昵称（可选）</span>
          <input
            v-model="nickname"
            type="text"
            autocomplete="nickname"
            placeholder="显示名称，默认同用户名"
          />
        </label>
        <label class="field">
          <span>密码</span>
          <input
            v-model="password"
            type="password"
            autocomplete="new-password"
            placeholder="至少 6 位"
            required
          />
        </label>
        <label class="field">
          <span>确认密码</span>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            placeholder="再次输入密码"
            required
          />
        </label>

        <p v-if="error" class="error">{{ error }}</p>
        <p v-if="success" class="success">{{ success }}</p>

        <button type="submit" class="btn primary wide" :disabled="loading">
          {{ loading ? '注册中…' : '立即注册' }}
        </button>
      </form>

      <p class="footer muted">
        已有账号？
        <RouterLink to="/seckill" class="link">前往登录</RouterLink>
      </p>
    </section>
  </div>
</template>

<style scoped>
.register {
  max-width: 480px;
  margin: 0 auto;
}
.panel {
  padding: 2rem;
}
.panel h1 {
  margin: 0.35rem 0 0.75rem;
  font-size: clamp(1.5rem, 4vw, 1.85rem);
  font-weight: 700;
  letter-spacing: -0.03em;
}
.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
}
.lead {
  margin: 0 0 1.5rem;
  line-height: 1.6;
}
.register-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field span {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-muted);
}
.field input {
  font: inherit;
  padding: 0.65rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}
.error {
  margin: 0;
  font-size: 0.8125rem;
  color: #dc2626;
}
.success {
  margin: 0;
  font-size: 0.8125rem;
  color: #059669;
}
.footer {
  margin: 1.25rem 0 0;
  font-size: 0.875rem;
  text-align: center;
}
.link {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
.muted {
  color: var(--text-muted);
}
.wide {
  width: 100%;
}
</style>
