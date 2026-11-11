<template>
  <div class="chat-sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <div class="header-top">
        <h3>
          <i class="pi pi-comments"></i>
          Conversaciones
        </h3>
        <span v-if="totalUnread > 0" class="unread-badge">{{ totalUnread }}</span>
      </div>
      
      <!-- Buscador -->
      <div class="search-box">
        <i class="pi pi-search"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por pedido..."
          @input="filterConversations"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Cargando...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredConversations.length === 0" class="empty-state">
      <i class="pi pi-inbox"></i>
      <p>No hay conversaciones</p>
      <small>Las conversaciones aparecerán cuando recibas pedidos</small>
    </div>

    <!-- Lista de conversaciones -->
    <div v-else class="conversations-list">
      <div
        v-for="conversation in filteredConversations"
        :key="conversation.id"
        class="conversation-item"
        :class="{ 
          active: currentConversation?.id === conversation.id,
          unread: conversation.unread_count > 0 
        }"
        @click="selectConversation(conversation)"
      >
        <!-- Avatar -->
        <div class="conversation-avatar" :class="getStatusClass(conversation.order_status)">
          <i :class="getOrderIcon(conversation.order_status)"></i>
        </div>

        <!-- Info -->
        <div class="conversation-info">
          <div class="conversation-header">
            <span class="conversation-title">Pedido #{{ conversation.order_id }}</span>
            <span class="conversation-time">{{ conversation.last_message?.time_ago || '' }}</span>
          </div>
          
          <div class="conversation-subtitle">
            <span class="client-name">{{ conversation.client_name }}</span>
            <span v-if="conversation.delivery_person_name" class="delivery-name">
              · {{ conversation.delivery_person_name }}
            </span>
          </div>
          
          <div class="conversation-last-message">
            <span v-if="conversation.last_message">
              <span v-if="conversation.last_message.sender_name" class="sender">
                {{ conversation.last_message.sender_name }}:
              </span>
              <span v-else-if="conversation.last_message.sender_role === 'system'" class="system">
                {{ conversation.last_message.content }}
              </span>
              {{ conversation.last_message.content }}
            </span>
            <span v-else class="no-messages">Sin mensajes</span>
          </div>
        </div>

        <!-- Badges -->
        <div class="conversation-badges">
          <span v-if="conversation.unread_count > 0" class="badge-unread">
            {{ conversation.unread_count }}
          </span>
          <span v-if="conversation.is_support_requested" class="badge-support">
            <i class="pi pi-exclamation-triangle"></i>
          </span>
        </div>
      </div>
    </div>

    <!-- Footer con info -->
    <div class="sidebar-footer" v-if="conversations.length > 0">
      <small>{{ conversations.length }} conversación(es)</small>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useChatStore } from '@/stores/chat';

const emit = defineEmits(['select-conversation']);

const chatStore = useChatStore();

const searchQuery = ref('');

const conversations = computed(() => chatStore.conversations);
const currentConversation = computed(() => chatStore.currentConversation);
const loading = computed(() => chatStore.loading);
const totalUnread = computed(() => chatStore.totalUnread);

const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value;
  
  const query = searchQuery.value.toLowerCase();
  return conversations.value.filter(c => 
    c.order_id.toString().includes(query) ||
    c.client_name?.toLowerCase().includes(query) ||
    c.restaurant_name?.toLowerCase().includes(query)
  );
});

function getStatusClass(status) {
  const classes = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    preparing: 'status-preparing',
    ready: 'status-ready',
    in_delivery: 'status-delivery',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled',
  };
  return classes[status] || 'status-default';
}

function getOrderIcon(status) {
  const icons = {
    pending: 'pi pi-clock',
    confirmed: 'pi pi-check-circle',
    preparing: 'pi pi-spinner',
    ready: 'pi pi-check',
    in_delivery: 'pi pi-truck',
    delivered: 'pi pi-check-circle',
    cancelled: 'pi pi-times-circle',
  };
  return icons[status] || 'pi pi-shopping-bag';
}

function selectConversation(conversation) {
  emit('select-conversation', conversation);
}

function filterConversations() {
  // El computed ya hace el filtro
}

onMounted(() => {
  chatStore.fetchConversations();
  chatStore.fetchTotalUnread();
});
</script>

<style scoped>
.chat-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

/* Header */
.sidebar-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.header-top h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.unread-badge {
  background: var(--color-primary-2);
  color: white;
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  font-weight: 600;
}

.search-box {
  position: relative;
}

.search-box i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 0.85rem;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.85rem;
  background: #f9fafb;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary-3);
  background: white;
  box-shadow: 0 0 0 3px rgba(188, 74, 185, 0.1);
}

/* Loading/Empty */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
  flex: 1;
}

.loading-state i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.empty-state i {
  font-size: 2.5rem;
  color: #d1d5db;
  margin-bottom: 0.5rem;
}

.empty-state p {
  margin: 0;
  font-weight: 500;
  color: #1a1a2e;
}

.empty-state small {
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
  margin-top: 0.25rem;
}

/* Lista */
.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.conversations-list::-webkit-scrollbar {
  width: 4px;
}

.conversations-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversations-list::-webkit-scrollbar-thumb {
  background: var(--color-primary-3);
  border-radius: 2px;
}

.conversation-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.conversation-item:hover {
  background: #f9fafb;
}

.conversation-item.active {
  background: rgba(126, 9, 126, 0.06);
  border-left-color: var(--color-primary-2);
}

.conversation-item.unread {
  background: rgba(126, 9, 126, 0.03);
}

/* Avatar */
.conversation-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
  color: white;
}

.status-pending { background: #f59e0b; }
.status-confirmed { background: #3b82f6; }
.status-preparing { background: #8b5cf6; }
.status-ready { background: #22c55e; }
.status-delivery { background: #8b5cf6; }
.status-delivered { background: #22c55e; }
.status-cancelled { background: #ef4444; }
.status-default { background: #6b7280; }

/* Info */
.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.15rem;
}

.conversation-title {
  font-weight: 600;
  font-size: 0.85rem;
  color: #1a1a2e;
}

.conversation-time {
  font-size: 0.7rem;
  color: #9ca3af;
  flex-shrink: 0;
}

.conversation-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.client-name {
  font-weight: 500;
}

.delivery-name {
  color: #9ca3af;
}

.conversation-last-message {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sender {
  font-weight: 600;
  color: #374151;
}

.system {
  font-style: italic;
  color: #9ca3af;
}

.no-messages {
  font-style: italic;
  color: #d1d5db;
}

/* Badges */
.conversation-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.badge-unread {
  background: var(--color-primary-2);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 20px;
  min-width: 20px;
  text-align: center;
}

.badge-support {
  color: #f59e0b;
  font-size: 0.9rem;
}

/* Footer */
.sidebar-footer {
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #f3f4f6;
  text-align: center;
  color: #9ca3af;
}
</style>