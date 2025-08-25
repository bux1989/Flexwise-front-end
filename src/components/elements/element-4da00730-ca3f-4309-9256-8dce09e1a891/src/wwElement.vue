<template>
  <div
    class="alert-box"
    :class="[{ 'alert-box--visible': isVisible }, `alert-box--${variant}`]"
    role="alertdialog"
    aria-live="assertive"
    aria-modal="true"
  >
    <div class="alert-box__content">
      <div class="alert-box__header">
        <div class="alert-box__title">
          <svg class="alert-box__icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-8h-2v6h2V8z" />
          </svg>
          <span>{{ title }}</span>
        </div>
        <button class="alert-box__close" @click="hideAlert" aria-label="Close alert">×</button>
      </div>

      <div class="alert-box__message">{{ message }}</div>

      <div class="alert-box__actions">
        <button class="alert-box__button" @click="hideAlert">{{ buttonText }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true },
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    // Editor state
    const isEditing = computed(() => {
      // eslint-disable-next-line no-unreachable
      return false;
    });

    // Alert state
    const isVisible = ref(false);

    // Variant (warning | error | info | success) — default warning
    const variant = computed(() => props.content.variant || 'warning');

    // Variables exposed via WeWeb
    const { value: title, setValue: setTitle } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'title',
      type: 'string',
      defaultValue: computed(() => props.content.initialTitle || 'Warnung')
    });

    const { value: message, setValue: setMessage } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'message',
      type: 'string',
      defaultValue: computed(() => props.content.initialMessage || 'Es ist ein Konflikt aufgetreten.')
    });

    // Watch for initial value changes (editor bindings)
    watch(() => props.content.initialTitle, (val) => {
      if (val !== undefined && val !== title.value) setTitle(val);
    });
    watch(() => props.content.initialMessage, (val) => {
      if (val !== undefined && val !== message.value) setMessage(val);
    });

    // Methods
    const showAlert = () => {
      if (isEditing.value) return;
      isVisible.value = true;
      emit('trigger-event', { name: 'show', event: { title: title.value, message: message.value } });
    };

    const hideAlert = () => {
      if (isEditing.value) return;
      isVisible.value = false;
      emit('trigger-event', { name: 'hide', event: {} });
    };

    const updateTitle = (newTitle) => {
      if (newTitle !== undefined && newTitle !== title.value) {
        setTitle(newTitle);
        emit('trigger-event', { name: 'titleChange', event: { value: newTitle } });
      }
    };

    const updateMessage = (newMessage) => {
      if (newMessage !== undefined && newMessage !== message.value) {
        setMessage(newMessage);
        emit('trigger-event', { name: 'messageChange', event: { value: newMessage } });
      }
    };

    const buttonText = computed(() => props.content.buttonText || 'OK');

    return {
      isEditing,
      isVisible,
      title,
      message,
      buttonText,
      variant,
      showAlert,
      hideAlert,
      updateTitle,
      updateMessage,
      setTitle,
      setMessage,
    };
  }
};
</script>

<style lang="scss" scoped>
/***** Base *****/
.alert-box {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: opacity .25s ease, visibility .25s ease;
  pointer-events: none; // prevent blocking when hidden

  &--visible { opacity: 1; visibility: visible; }

  &__content {
    pointer-events: auto; // clickable
    background: var(--bg, #fff);
    color: var(--text, #111827);
    border: 1px solid var(--border, #e5e7eb);
    border-left: 6px solid var(--accent, #9ca3af);
    border-radius: 12px;
    box-shadow: 0 10px 24px rgba(0,0,0,.15);
    min-width: 320px;
    max-width: 440px;
    padding: 12px 14px 14px;
    transform: translateY(16px);
    animation: slide-up .25s ease forwards;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  &__title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 16px;
    line-height: 1.2;
  }

  &__icon { width: 18px; height: 18px; fill: var(--accent, currentColor); }

  &__close {
    appearance: none;
    border: 0;
    background: transparent;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    color: var(--text-muted, #6b7280);
    padding: 4px 6px;
    margin: -4px -2px 0 0; // tuck into corner
    border-radius: 8px;
    transition: background .15s ease, color .15s ease;
    &:hover { background: rgba(0,0,0,.06); color: #111827; }
  }

  &__message { font-size: 14px; margin: 0 2px 12px; }

  &__actions { display: flex; justify-content: flex-end; }

  &__button {
    appearance: none;
    border: 0;
    border-radius: 10px;
    padding: 8px 12px;
    font-weight: 600;
    cursor: pointer;
    background: var(--accent, #3b82f6);
    color: #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,.12);
    transition: transform .05s ease, filter .15s ease;
    &:active { transform: translateY(1px); }
    &:hover { filter: brightness(0.95); }
  }
}

@keyframes slide-up { to { transform: translateY(0); } }

/***** Variants *****/
.alert-box--warning { --bg:#FFFBEB; --border:#FDE68A; --accent:#F59E0B; --text:#78350F; --text-muted:#92400E; }
.alert-box--error   { --bg:#FEF2F2; --border:#FCA5A5; --accent:#EF4444; --text:#7F1D1D; --text-muted:#991B1B; }
.alert-box--info    { --bg:#EFF6FF; --border:#BFDBFE; --accent:#3B82F6; --text:#1E3A8A; --text-muted:#1D4ED8; }
.alert-box--success { --bg:#ECFDF5; --border:#A7F3D0; --accent:#10B981; --text:#065F46; --text-muted:#047857; }
</style>
