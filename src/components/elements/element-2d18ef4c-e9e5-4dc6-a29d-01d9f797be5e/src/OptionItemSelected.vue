<template>
    <template v-if="layoutType === 'text'">
        <wwElement
            class="multiselect-tag-el"
            v-bind="tagElement"
            :ww-props="{ text: option.label || '' }"
            :states="optionStates"
        />
        <wwElement
            v-if="!isReadOnly"
            @mousedown.prevent="isEditing ? null : handleTagRemove(option, $event)"
            v-bind="removeTagIconElement"
        />
    </template>
    <template v-else>
        <wwElement class="multiselect-tag-el free-layout" v-bind="selectedFlexboxElement" :states="optionStates" />
        <!-- <wwElement
            v-if="!isReadOnly"
            @mousedown.prevent="isEditing ? null : handleTagRemove(option, $event)"
            v-bind="removeTagIconElement"
        /> -->
    </template>
</template>

<script>
export default {
    props: {
        content: { type: Object, required: true },
        option: { type: Object, required: true },
        layoutType: { type: String, required: true },
        tagElement: { type: Object, required: true },
        selectedFlexboxElement: { type: Object, required: true },
        removeTagIconElement: { type: Object, required: true },
        handleTagRemove: { type: Object, required: true },
        isReadOnly: { type: Boolean, required: true },
        isEditing: { type: Boolean, required: true },
    },
    data() {
        return {
            observer: null,
            optionStates: [],
        };
    },
    mounted() {
        const optionNode = this.$el.parentElement;
        if (!optionNode) return;
        this.observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                const classes = m.target.getAttribute(m.attributeName);
                this.$nextTick(() => {
                    this.handleOptionState(classes);
                });
            }
        });
        this.observer.observe(optionNode, {
            attributes: true,
            attributeOldValue: true,
            attributeFilter: ['class'],
        });
    },
    methods: {
        handleOptionState(classes) {
            if (!classes || typeof classes !== 'string') return;
            if (classes.includes('is-pointed') && !classes.includes('is-selected')) {
                this.optionStates = [':hover'];
            } else if (!classes.includes('is-pointed') && classes.includes('is-selected')) {
                this.optionStates = ['Selected'];
            } else if (classes.includes('is-pointed') && classes.includes('is-selected')) {
                this.optionStates = ['Selected:hover'];
            } else {
                this.optionStates = [];
            }
        },
    },
    beforeUnmount() {
        if (this.observer) this.observer.disconnect();
    },
};
</script>

<style></style>
