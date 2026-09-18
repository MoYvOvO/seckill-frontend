<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { register } from '../api/auth'

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
    success.value = '注册成功，即将跳转至秒杀会场'
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
    <section class="register-shell">
      <aside class="register-context">
        <RouterLink to="/seckill" class="back-link">返回秒杀会场</RouterLink>
        <div>
          <span class="register-context__label">极光商城</span>
          <h1>创建账户，开始抢购</h1>
          <p>注册后可以参与限时秒杀、同步购物车，并查看自己的订单状态。</p>
        </div>
        <div class="register-facts">
          <div>
            <strong>01</strong>
            <span>限时秒杀</span>
          </div>
          <div>
            <strong>02</strong>
            <span>实时库存</span>
          </div>
          <div>
            <strong>03</strong>
            <span>订单跟踪</span>
          </div>
        </div>
      </aside>

      <div class="register-form-panel">
        <div class="register-form-panel__heading">
          <span>新用户</span>
          <h2>注册账户</h2>
          <p>填写基础信息即可完成注册。</p>
        </div>

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
              placeholder="默认与用户名相同"
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

          <p v-if="error" class="form-message is-error" role="alert">{{ error }}</p>
          <p v-if="success" class="form-message is-success" role="status">{{ success }}</p>

          <button type="submit" class="btn primary wide" :disabled="loading">
            {{ loading ? '注册中...' : '立即注册' }}
          </button>
        </form>

        <p class="register-form-panel__footer">
          已有账户？
          <RouterLink to="/seckill">前往登录</RouterLink>
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.register {
  display: grid;
  max-width: 980px;
  min-height: min(680px, calc(100dvh - 150px));
  margin: 0 auto;
  place-items: center;
}

.register-shell {
  display: grid;
  width: 100%;
  overflow: hidden;
  grid-template-columns: minmax(0, 0.9fr) minmax(380px, 1.1fr);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-md);
}

.register-context {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  padding: clamp(2rem, 5vw, 3.5rem);
  background: var(--text);
  color: #ffffff;
}

.back-link {
  width: fit-content;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.78rem;
  font-weight: 650;
  text-decoration: none;
}

.back-link:hover {
  color: #ffffff;
}

.register-context__label {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 850;
  letter-spacing: 0.1em;
}

.register-context h1 {
  max-width: 9ch;
  margin: var(--space-4) 0 var(--space-4);
  font-size: clamp(2rem, 5vw, 3.2rem);
  line-height: 1.02;
  letter-spacing: -0.045em;
}

.register-context p {
  max-width: 36ch;
  margin: 0;
  color: rgba(255, 255, 255, 0.62);
  line-height: 1.7;
}

.register-facts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  margin-top: var(--space-10);
}

.register-facts div {
  padding-top: var(--space-3);
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.register-facts strong,
.register-facts span {
  display: block;
}

.register-facts strong {
  color: rgba(255, 255, 255, 0.42);
  font-size: 0.7rem;
}

.register-facts span {
  margin-top: var(--space-1);
  font-size: 0.78rem;
  font-weight: 650;
}

.register-form-panel {
  padding: clamp(2rem, 5vw, 3.5rem);
}

.register-form-panel__heading > span {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.register-form-panel__heading h2 {
  margin: var(--space-1) 0 var(--space-2);
  font-size: 1.65rem;
  letter-spacing: -0.025em;
}

.register-form-panel__heading p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.86rem;
}

.register-form {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field span {
  color: var(--text-soft);
  font-size: 0.78rem;
  font-weight: 700;
}

.field input {
  width: 100%;
  padding: 0.68rem 0.8rem;
}

.form-message {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 0.8rem;
}

.form-message.is-error {
  background: var(--danger-soft);
  color: var(--danger);
}

.form-message.is-success {
  background: var(--success-soft);
  color: var(--success);
}

.register-form-panel__footer {
  margin: var(--space-5) 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
  text-align: center;
}

.register-form-panel__footer a {
  color: var(--accent);
  font-weight: 750;
  text-decoration: none;
}

.register-form-panel__footer a:hover {
  text-decoration: underline;
}

@media (max-width: 760px) {
  .register {
    min-height: auto;
  }

  .register-shell {
    grid-template-columns: 1fr;
  }

  .register-context {
    gap: var(--space-8);
  }

  .register-context h1 {
    max-width: 12ch;
  }
}

@media (max-width: 480px) {
  .register-form-panel {
    padding: 1.5rem 1.25rem;
  }

  .register-facts {
    grid-template-columns: 1fr;
  }
}
</style>
