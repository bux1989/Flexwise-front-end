<template>
  <div v-if="show" class="context-menu" :style="position" @click.stop @keydown="handleKeydown" tabindex="0">
    <div v-if="menuItems.length > 0" class="menu-items">
      <button
        v-for="(item, index) in menuItems"
        :key="item.key"
        :ref="el => setItemRef(el, index)"
        class="menu-item"
        :class="{
          'disabled': item.disabled,
          'destructive': item.destructive,
          'focused': focusedIndex === index
        }"
        :disabled="item.disabled"
        @click="onMenuItemClick(item)"
        @mouseenter="focusedIndex = index"
      >
        <span class="menu-icon" v-if="item.icon">{{ item.icon }}</span>
        <span class="menu-text">{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, nextTick } from 'vue';

export default {
  name: 'ContextMenu',
  props: {
    show: { type: Boolean, default: false },
    position: { type: Object, default: () => ({ top: '0px', left: '0px' }) },
    hasLesson: { type: Boolean, default: false },
    hasCopiedLesson: { type: Boolean, default: false },
    language: { type: String, default: 'de' }
  },
  emits: ['close', 'copy', 'paste', 'edit', 'delete'],
  setup(props, { emit }) {
    const focusedIndex = ref(0);
    const itemRefs = ref([]);

    // Translation utilities
    const translations = {
      de: {
        copy: 'Kopieren',
        paste: 'Einfügen',
        edit: 'Bearbeiten',
        delete: 'Löschen'
      },
      en: {
        copy: 'Copy',
        paste: 'Paste',
        edit: 'Edit',
        delete: 'Delete'
      }
    };

    const t = (key) => translations[props.language]?.[key] || translations.de[key] || key;

    const menuItems = computed(() => {
      const items = [];

      if (props.hasLesson) {
        // Cell has a lesson - show Copy | Edit | Delete
        items.push(
          { key: 'copy', label: t('copy'), icon: '', action: 'copy' },
          { key: 'edit', label: t('edit'), icon: '', action: 'edit' },
          { key: 'delete', label: t('delete'), icon: '', action: 'delete', destructive: true }
        );
      } else {
        // Empty cell - show Paste (disabled if no copied lesson)
        items.push(
          { 
            key: 'paste', 
            label: t('paste'), 
            icon: '', 
            action: 'paste',
            disabled: !props.hasCopiedLesson
          }
        );
      }

      return items;
    });

    const setItemRef = (el, index) => {
      if (el) {
        itemRefs.value[index] = el;
      }
    };

    const onMenuItemClick = (item) => {
      if (item.disabled) return;
      
      emit(item.action);
      emit('close');
    };

    const handleKeydown = (event) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          focusedIndex.value = Math.min(focusedIndex.value + 1, menuItems.value.length - 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          focusedIndex.value = Math.max(focusedIndex.value - 1, 0);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          const focusedItem = menuItems.value[focusedIndex.value];
          if (focusedItem && !focusedItem.disabled) {
            onMenuItemClick(focusedItem);
          }
          break;
        case 'Escape':
          event.preventDefault();
          emit('close');
          break;
      }
    };

    // Focus the menu when it becomes visible
    watch(() => props.show, (newShow) => {
      if (newShow) {
        focusedIndex.value = 0;
        nextTick(() => {
          // Focus the context menu container for keyboard navigation
          const menuEl = document.querySelector('.context-menu');
          if (menuEl) {
            menuEl.focus();
          }
        });
      }
    });

    return {
      menuItems,
      focusedIndex,
      setItemRef,
      onMenuItemClick,
      handleKeydown,
      t
    };
  }
};
</script>

<style lang="scss" scoped>
.context-menu {
  position: absolute;
  z-index: 2000;
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 4px 0;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  outline: none;
  
  .menu-items {
    .menu-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      font-size: 14px;
      color: #333;
      transition: background-color 0.15s ease;
      
      &:hover:not(.disabled), &.focused:not(.disabled) {
        background-color: #f8f9fa;
      }
      
      &.disabled {
        color: #999;
        cursor: not-allowed;
      }
      
      &.destructive {
        color: #dc3545;
        
        &:hover:not(.disabled), &.focused:not(.disabled) {
          background-color: #f8d7da;
        }
      }
      
      .menu-icon {
        margin-right: 8px;
        font-size: 12px;
        opacity: 0.8;
      }
      
      .menu-text {
        flex: 1;
      }
    }
  }
}
</style>