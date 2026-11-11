<template>
  <div class="chat-input">
    <!-- Reply preview -->
    <div v-if="replyTo" class="reply-preview">
      <div class="reply-info">
        <i class="pi pi-reply"></i>
        <span class="reply-label">
          Respondiendo a <strong>{{ replyTo.sender?.full_name || 'Mensaje' }}</strong>
        </span>
      </div>
      <button class="cancel-reply" @click="$emit('cancel-reply')">
        <i class="pi pi-times"></i>
      </button>
    </div>

    <!-- Input -->
    <div class="input-wrapper" :class="{ disabled }">
      <textarea
        ref="textarea"
        v-model="messageText"
        :placeholder="disabled ? 'La conversación está cerrada' : 'Escribe un mensaje...'"
        :disabled="disabled"
        rows="1"
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.enter.shift.exact="newLine"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      ></textarea>
      
      <button 
        class="send-btn"
        :disabled="disabled || sending || !messageText.trim()"
        @click="sendMessage"
        title="Enviar mensaje"
      >
        <i class="pi pi-send"></i>
      </button>
    </div>

    <!-- Info -->
    <div class="input-footer">
      <small>
        <i class="pi pi-info-circle"></i>
        Presiona <kbd>Enter</kbd> para enviar, <kbd>Shift+Enter</kbd> para nueva línea
      </small>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  sending: {
    type: Boolean,
    default: false,
  },
  replyTo: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['send', 'typing', 'cancel-reply']);

const messageText = ref('');
const textarea = ref(null);
const typingTimer = ref(null);

function sendMessage() {
  if (props.disabled || !messageText.value.trim()) return;
  
  emit('send', messageText.value.trim());
  messageText.value = '';
  
  emit('typing', false);
  if (typingTimer.value) {
    clearTimeout(typingTimer.value);
    typingTimer.value = null;
  }
  
  nextTick(() => {
    if (textarea.value) {
      textarea.value.style.height = 'auto';
    }
  });
}

function newLine() {
  if (textarea.value) {
    messageText.value += '\n';
    autoResize();
  }
}

function handleInput() {
  autoResize();
  emit('typing', true);
  
  if (typingTimer.value) {
    clearTimeout(typingTimer.value);
  }
  typingTimer.value = setTimeout(() => {
    emit('typing', false);
  }, 1000);
}

function handleFocus() {}

function handleBlur() {
  emit('typing', false);
  if (typingTimer.value) {
    clearTimeout(typingTimer.value);
    typingTimer.value = null;
  }
}

function autoResize() {
  if (textarea.value) {
    textarea.value.style.height = 'auto';
    textarea.value.style.height = Math.min(textarea.value.scrollHeight, 120) + 'px';
  }
}
</script>

<style scoped>
.chat-input {
  padding: 0.75rem 1.25rem 1rem;
  background: white;
  border-top: 1px solid #f3f4f6;
}

.reply-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: rgba(126, 9, 126, 0.06);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  border-left: 3px solid var(--color-primary-2);
}

.reply-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.reply-label strong {
  color: var(--color-primary-2);
}

.cancel-reply {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.cancel-reply:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1a1a2e;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.5rem;
  transition: all 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary-3);
  background: white;
  box-shadow: 0 0 0 3px rgba(188, 74, 185, 0.1);
}

.input-wrapper.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

textarea {
  flex: 1;
  border: none;
  background: transparent;
  resize: none;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.4;
  padding: 0.4rem 0.5rem;
  max-height: 120px;
  outline: none;
  color: #1a1a2e;
}

textarea::placeholder {
  color: #9ca3af;
}

textarea:disabled {
  cursor: not-allowed;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: linear-gradient(135deg, var(--color-primary-2) 0%, var(--color-primary-4) 100%);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(126, 9, 126, 0.3);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #d1d5db;
}

.input-footer {
  margin-top: 0.5rem;
  text-align: center;
}

.input-footer small {
  font-size: 0.7rem;
  color: #9ca3af;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

kbd {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
  font-family: monospace;
  font-size: 0.65rem;
  color: #374151;
}
</style>
