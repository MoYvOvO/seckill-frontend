<script setup>
import { ref, computed, nextTick } from 'vue'

const isOpen = ref(false)
const loading = ref(false)
const inputMsg = ref('')
const messages = ref([
  { role: 'assistant', content: '你好，我是 AI 助手，有什么可以帮你的？', timestamp: Date.now() },
])
const messagesRef = ref(null)

const userId = computed(() => {
  const userStr = localStorage.getItem('mall_user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      return user.id || 'anonymous'
    } catch {
      return 'anonymous'
    }
  }
  return 'anonymous'
})

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => scrollToBottom())
  }
}

async function sendMessage() {
  const msg = inputMsg.value.trim()
  if (!msg) return
  inputMsg.value = ''

  messages.value.push({ role: 'user', content: msg, timestamp: Date.now() })
  scrollToBottom()

  loading.value = true
  try {
    const response = await fetch('agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        userId: userId.value,
      }),
    })
    const result = await response.json()
    if (result.code === 200) {
      messages.value.push({
        role: 'assistant',
        content: result.data,
        timestamp: Date.now(),
      })
    } else {
      messages.value.push({
        role: 'assistant',
        content: '抱歉，处理失败：' + result.message,
        timestamp: Date.now(),
      })
    }
  } catch {
    messages.value.push({
      role: 'assistant',
      content: '网络异常，请稍后重试',
      timestamp: Date.now(),
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="ai-chatbot">
    <button
      type="button"
      class="chat-toggle"
      :aria-label="isOpen ? '关闭 AI 助手' : '打开 AI 助手'"
      :aria-expanded="isOpen"
      @click="toggleChat"
    >
      <svg v-if="!isOpen" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          fill="currentColor"
          d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"
        />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          fill="currentColor"
          d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        />
      </svg>
    </button>

    <section v-show="isOpen" class="chat-panel" aria-label="AI 助手对话窗口">
      <header class="chat-header">
        <div>
          <span>AI 助手</span>
          <strong>购物咨询</strong>
        </div>
        <span class="status">在线</span>
      </header>

      <div ref="messagesRef" class="chat-messages">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="msg"
          :class="msg.role === 'user' ? 'msg-user' : 'msg-assistant'"
        >
          <div class="msg-bubble">
            <span class="msg-text">{{ msg.content }}</span>
          </div>
          <div class="msg-time">{{ formatTime(msg.timestamp) }}</div>
        </div>
        <div v-if="loading" class="msg msg-assistant">
          <div class="msg-bubble">
            <span class="typing">...</span>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <input
          v-model="inputMsg"
          placeholder="输入消息..."
          aria-label="输入消息"
          @keydown.enter="sendMessage"
        />
        <button type="button" @click="sendMessage" :disabled="loading || !inputMsg.trim()">
          发送
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ai-chatbot {
  position: fixed;
  right: clamp(1rem, 3vw, 2rem);
  bottom: clamp(1rem, 3vw, 2rem);
  z-index: 999;
}

.chat-toggle {
  display: grid;
  width: 56px;
  height: 56px;
  margin-left: auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--accent);
  color: #ffffff;
  box-shadow: 0 14px 34px rgba(229, 72, 45, 0.3);
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.chat-toggle:hover {
  background: var(--accent-hover);
  box-shadow: 0 18px 40px rgba(229, 72, 45, 0.38);
  transform: translateY(-2px);
}

.chat-panel {
  position: absolute;
  right: 0;
  bottom: 72px;
  display: flex;
  width: min(380px, calc(100vw - 2rem));
  height: min(520px, calc(100dvh - 120px));
  overflow: hidden;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  box-shadow: var(--shadow-md);
  animation: chat-enter 0.22s ease;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5);
  background: var(--text);
  color: #ffffff;
}

.chat-header span,
.chat-header strong {
  display: block;
}

.chat-header div > span {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.68rem;
  font-weight: 700;
}

.chat-header strong {
  margin-top: 0.1rem;
  font-size: 0.94rem;
}

.chat-header .status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0.15rem 0.55rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--radius-pill);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.68rem;
}

.chat-messages {
  display: flex;
  overflow-y: auto;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5);
  background: var(--surface-muted);
}

.msg {
  display: flex;
  max-width: 84%;
  flex-direction: column;
}

.msg-user {
  align-self: flex-end;
}

.msg-assistant {
  align-self: flex-start;
}

.msg-bubble {
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
  line-height: 1.55;
  word-break: break-word;
}

.msg-user .msg-bubble {
  background: var(--accent);
  color: #ffffff;
}

.msg-assistant .msg-bubble {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
}

.msg-time {
  margin-top: 0.25rem;
  padding: 0 0.2rem;
  color: var(--text-muted);
  font-size: 0.65rem;
}

.msg-user .msg-time {
  text-align: right;
}

.typing {
  display: inline-block;
  animation: pulse 1.2s infinite;
}

.chat-input {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3);
  border-top: 1px solid var(--border);
  background: var(--surface);
}

.chat-input input {
  min-width: 0;
  min-height: 40px;
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-pill);
  font-size: 0.82rem;
}

.chat-input button {
  min-width: 68px;
  min-height: 40px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--accent);
  color: #ffffff;
  cursor: pointer;
  font-weight: 750;
}

.chat-input button:hover:not(:disabled) {
  background: var(--accent-hover);
}

.chat-input button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@keyframes chat-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes pulse {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }

  40% {
    opacity: 1;
  }
}

@media (max-width: 520px) {
  .ai-chatbot {
    right: 1rem;
    bottom: max(1rem, env(safe-area-inset-bottom));
  }

  .chat-panel {
    position: fixed;
    right: 0.75rem;
    bottom: calc(80px + env(safe-area-inset-bottom));
    left: 0.75rem;
    width: auto;
    height: min(560px, calc(100dvh - 112px));
  }
}
</style>
