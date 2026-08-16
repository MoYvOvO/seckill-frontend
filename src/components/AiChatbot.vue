<template>
  <div class="ai-chatbot">
    <!-- 悬浮按钮 -->
    <div class="chat-toggle" @click="toggleChat">
      <svg v-if="!isOpen" viewBox="0 0 24 24" width="28" height="28">
        <path fill="white" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="28" height="28">
        <path fill="white" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </div>

    <!-- 聊天弹窗 -->
    <div v-show="isOpen" class="chat-panel">
      <div class="chat-header">
        <span>🤖 AI 助手</span>
        <span class="status">在线</span>
      </div>

      <div class="chat-messages" ref="messagesRef">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
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
          @keydown.enter="sendMessage"
        />
        <button @click="sendMessage" :disabled="loading || !inputMsg.trim()">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const isOpen = ref(false)
const loading = ref(false)
const inputMsg = ref('')
const messages = ref([
  { role: 'assistant', content: '你好！我是 AI 助手，有什么可以帮你的？', timestamp: Date.now() }
])
const messagesRef = ref(null)

// ========== 直接从 localStorage 取 userId，不依赖任何 store ==========
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
        userId: userId.value
      })
    })
    const result = await response.json()
    if (result.code === 200) {
      messages.value.push({
        role: 'assistant',
        content: result.data,
        timestamp: Date.now()
      })
    } else {
      messages.value.push({
        role: 'assistant',
        content: '抱歉，处理失败：' + result.message,
        timestamp: Date.now()
      })
    }
  } catch (e) {
    messages.value.push({
      role: 'assistant',
      content: '网络异常，请稍后重试',
      timestamp: Date.now()
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

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.ai-chatbot {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 999;
}

.chat-toggle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #4f46e5;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4);
  transition: transform 0.2s;
}
.chat-toggle:hover {
  transform: scale(1.05);
}

.chat-panel {
  position: absolute;
  bottom: 72px;
  right: 0;
  width: 380px;
  height: 520px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.chat-header {
  padding: 16px 20px;
  background: #4f46e5;
  color: white;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.status {
  font-size: 12px;
  background: rgba(255,255,255,0.2);
  padding: 2px 12px;
  border-radius: 999px;
}

.chat-messages {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  background: #f8f9fc;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.msg {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}
.msg-user {
  align-self: flex-end;
}
.msg-assistant {
  align-self: flex-start;
}
.msg-bubble {
  padding: 10px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.msg-user .msg-bubble {
  background: #4f46e5;
  color: white;
  border-bottom-right-radius: 4px;
}
.msg-assistant .msg-bubble {
  background: white;
  color: #1e293b;
  border: 1px solid #e9edf4;
  border-bottom-left-radius: 4px;
}
.msg-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  padding: 0 4px;
}
.msg-user .msg-time {
  text-align: right;
}

.typing {
  display: inline-block;
  animation: pulse 1.2s infinite;
}
@keyframes pulse {
  0%, 80%, 100% { opacity: 0.3; }
  40% { opacity: 1; }
}

.chat-input {
  padding: 12px 16px;
  border-top: 1px solid #eef2f6;
  display: flex;
  gap: 10px;
  background: white;
  flex-shrink: 0;
}
.chat-input input {
  flex: 1;
  padding: 8px 14px;
  border: 1px solid #dce1eb;
  border-radius: 40px;
  font-size: 14px;
  outline: none;
}
.chat-input input:focus {
  border-color: #4f46e5;
}
.chat-input button {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 40px;
  font-weight: 600;
  cursor: pointer;
}
.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>