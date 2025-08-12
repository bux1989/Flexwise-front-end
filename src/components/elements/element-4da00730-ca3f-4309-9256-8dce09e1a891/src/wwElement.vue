<template>
<div class="alert-box" :class="{ 'alert-box--visible': isVisible }">
<div class="alert-box__content">
<div class="alert-box__header">
<div class="alert-box__title">{{ title }}</div>
<div class="alert-box__close" @click="hideAlert">×</div>
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

// Internal variables to expose outside
const { value: title, setValue: setTitle } = wwLib.wwVariable.useComponentVariable({
uid: props.uid,
name: 'title',
type: 'string',
defaultValue: computed(() => props.content.initialTitle || 'Alert Title')
});

const { value: message, setValue: setMessage } = wwLib.wwVariable.useComponentVariable({
uid: props.uid,
name: 'message',
type: 'string',
defaultValue: computed(() => props.content.initialMessage || 'Alert message content goes here.')
});

// Watch for initial value changes
watch(() => props.content.initialTitle, (newValue) => {
if (newValue !== undefined && newValue !== title.value) {
setTitle(newValue);
}
});

watch(() => props.content.initialMessage, (newValue) => {
if (newValue !== undefined && newValue !== message.value) {
setMessage(newValue);
}
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

// Button text
const buttonText = computed(() => props.content.buttonText || 'OK');

return {
isEditing,
isVisible,
title,
message,
buttonText,
showAlert,
hideAlert,
updateTitle,
updateMessage,
setTitle,
setMessage
};
}
};
</script>

<style lang="scss" scoped>
.alert-box {
position: fixed;
bottom: 20px; // Change from top: 0 to bottom: 20px
right: 20px; // Change from left: 0 to right: 20px
width: auto; // Change from width: 100%
height: auto; // Change from height: 100%
background-color: transparent; // Change from rgba(0, 0, 0, 0.5)
display: flex;
align-items: flex-end; // Change from align-items: center
justify-content: flex-end; // Change from justify-content: center
z-index: 9999;
opacity: 0;
visibility: hidden;
transition: opacity 0.3s, visibility 0.3s;

&--visible {
opacity: 1;
visibility: visible;

.alert-box__content {
transform: translateY(0); // Add this to animate the alert sliding up
}
}

&__content {
background-color: white;
border-radius: 8px;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
width: 100%;
max-width: 400px;
padding: 20px;
transform: translateY(20px); // Add this for animation
transition: transform 0.3s; // Add this for animation
}
}
</style>