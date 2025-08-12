<template>
    <Multiselect
        ref="multiselect"
        v-model="internalValue"
        :key="componentKey"
        class="input-multiselect"
        :style="cssVariables"
        :class="{ editing: isEditing }"
        v-bind="multiselectProps"
        @close="checkIsOpen"
        @focus.capture="interceptFocus"
        @focusin.capture="interceptFocus"
        @click.capture="interceptClick"
        @mousedown.capture="interceptClick"
    >
        <!-- Placeholder -->
        <template v-slot:placeholder>
            <wwElement
                class="multiselect-placeholder-el"
                v-bind="content.placeholderElement"
                :wwProps="{ text: placeholder || '' }"
                @mousedown="isEditing && $event.stopPropagation()"
                @click="isEditing && $event.stopPropagation()"
            />
        </template>

        <!-- Tag selected with remove icon -->
        <template v-slot:tag="{ option, handleTagRemove }">
            <div class="multiselect-tag" :style="getOptionStyle(option)">
                <wwLayoutItemContext :index="getOptionIndex(option)" :item="{}" is-repeat :data="option">
                    <OptionItemSelected
                        :key="getOptionIndex(option)"
                        :option="option"
                        :layoutType="layoutType"
                        :selectedFlexboxElement="content.selectedFlexboxElement"
                        :tagElement="content.tagElementSelected"
                        :removeTagIconElement="content.removeTagIconElement"
                        :isReadOnly="isReadOnly"
                        :isEditing="isEditing"
                        :handleTagRemove="handleTagRemove"
                    />
                </wwLayoutItemContext>
            </div>
        </template>

        <!-- Tag unselected in list -->
        <template v-if="content.mode === 'tags'" v-slot:option="{ option }">
            <wwLayoutItemContext :index="getOptionIndex(option)" :item="{}" is-repeat :data="option">
                <OptionItem
                    :option="option"
                    :layoutType="layoutType"
                    :flexboxElement="content.flexboxElement"
                    :tagElement="content.tagElement"
                    :isReadOnly="isReadOnly"
                    :isEditing="isEditing"
                    @mousedown="isEditing && $event.stopPropagation()"
                    @click="isEditing && $event.stopPropagation()"
                />
            </wwLayoutItemContext>
        </template>

        <!-- Small triangle displayed on the right of the input -->
        <template v-slot:caret>
            <wwElement
                v-if="multiselectProps.disabled && internalValue.length && content.clearIcon"
                class="hidden"
                v-bind="content.clearIconElement"
                @mousedown="isEditing && $event.stopPropagation()"
            />
            <wwElement v-bind="content.caretIconElement" class="caret" :class="{ hidden: isReadOnly }" />
        </template>

        <!-- Clear icon shown when the input has at least one selected options -->
        <template v-slot:clear="{ clear }">
            <div @mousedown.stop :style="{ zIndex: 2 }">
                <wwElement v-bind="content.clearIconElement" @click="isEditing ? null : clear($event)" />
            </div>
        </template>
    </Multiselect>
</template>

<script>
import Multiselect from '@vueform/multiselect';
import { computed, inject } from 'vue';
import OptionItem from './OptionItem.vue';
import OptionItemSelected from './OptionItemSelected.vue';

const DEFAULT_LABEL_FIELD = 'label';
const DEFAULT_VALUE_FIELD = 'value';

export default {
    components: { Multiselect, OptionItem, OptionItemSelected },
    emits: ['trigger-event', 'update:content:effect', 'add-state', 'remove-state'],
    props: {
        uid: { type: String, required: true },
        content: { type: Object, required: true },

        wwElementState: { type: Object, required: true },
    },
    setup(props, { emit }) {
        const { value: currentSelection, setValue: setCurrentSelection } = wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'currentSelection',
            type: 'array',
            defaultValue: computed(() => (Array.isArray(props.content.initialValue) ? props.content.initialValue : [])),
        });

        const styles = inject('componentStyle');

        const cursor = computed(() => styles.cursor);

        return { currentSelection, setCurrentSelection, cursor };
    },
    data: () => ({
        options: [],
        componentKey: 0,
    }),
    created() {
        this.init();
    },
    computed: {
        currentLang() {
            return wwLib.wwLang.lang;
        },
        isEditing() {

            // eslint-disable-next-line no-unreachable
            return false;
        },
        layoutType() {
            return this.content.layoutType ? this.content.layoutType : 'text';
        },
        uniqueOptions() {
            const uniqueOptionsMap = new Map();

            [...this.options, ...this.currentSelection].forEach(item => {
                if (item && typeof item === 'object' && 'value' in item) {
                    uniqueOptionsMap.set(item.value, item);
                } else if (item !== undefined && item !== null) {
                    const fullOption = this.options.find(opt => opt && opt.value === item);
                    if (fullOption) {
                        uniqueOptionsMap.set(fullOption.value, fullOption);
                    } else {
                        uniqueOptionsMap.set(item, item);
                    }
                }
            });

            return [...uniqueOptionsMap.values()];
        },
        multiselectProps() {
            return {
                options: this.uniqueOptions,
                closeOnSelect: this.content.closeOnSelect,
                searchable: this.content.searchable,
                mode: this.content.mode,
                multipleLabel: values =>
                    (
                        wwLib.wwLang.getText(this.content.multipleLabel) ||
                        `{count} option${values.length === 1 ? '' : 's'} selected`
                    ).replace('{count}', values.length),
                noOptionsText: this.content.noOptionsText,
                noResultsText: this.content.noResultsText,
                disabled: this.isReadOnly || this.content.disabled,
                required: this.content.required,
                hideSelected: this.content.hideSelected,
                placeholder: 'placeholder',
                createOption: this.content.allowCreation,
                canClear: this.content.clearIcon,
                caret: this.content.caretIcon,
                name: this.wwElementState.name,
                infinite: this.content.infiniteScroll,
                limit: this.content.limitedOptions ? this.content.limit : -1,
                max: this.content.maxSelection ? this.content.max : -1,
                resolveOnLoad: false,
                locale: this.currentLang,
            };
        },
        internalValue: {
            get() {
                return Array.isArray(this.currentSelection) ? this.currentSelection : [];
            },
            set(newValue) {
                this.setCurrentSelection(newValue);
                this.$emit('trigger-event', { name: 'change', event: { domEvent: {}, value: newValue } });
            },
        },
        placeholder() {
            return wwLib.wwLang.getText(this.content.placeholder);
        },
        defaultTagStyle() {
            return this.layoutType === 'text'
                ? {
                      backgroundColor: this.content.tagsDefaultBgColor,
                      color: this.content.tagsDefaultTextColor,
                  }
                : {
                      backgroundColor: 'transparent',
                  };
        },
        cssVariables() {
            return {
                '--ms-dropdown-bg': this.content.dropdownBackgroundColor,
                '--ms-dropdown-border-width': this.content.dropdownBorderWidth || '0px',
                '--ms-dropdown-border-color': this.content.dropdownBorderColor,
                '--ms-dropdown-radius': this.content.dropdownBorderRadius || '0px',
                '--ms-max-height': this.content.dropdownMaxHeight || '10rem',
                '--ms-option-bg-pointed': this.content.optionBackgroundPointed,
                '--ms-option-bg-selected': this.content.optionBackgroundSelected,
                '--ms-option-bg-selected-pointed': this.content.optionBackgroundSelectedPointed,
                '--ms-bg-disabled': this.isReadOnly ? 'transparent' : null,
                '--ms-bg': 'transparent',
                '--ms-radius': '0',
                '--ms-spinner-color': this.content.loadingRingColor,
                '--search-font-size': this.content.searchFontSize || 'inherit',
                '--search-font-family': this.content.searchFontFamily || 'inherit',
                '--search-font-color': this.content.searchFontColor || 'inherit',
                '--component-cursor': this.cursor || 'pointer',
                '--padding-tag': this.content.layoutType === 'text' ? '4px' : '0',
            };
        },
        isReadOnly() {

            return this.wwElementState.props.readonly === undefined
                ? this.content.readonly
                : this.wwElementState.props.readonly;
        },
    },
    watch: {

        'content.initialValue'() {
            if (JSON.stringify(this.content.initialValue) !== JSON.stringify(this.internalValue)) {
                this.refreshInitialValue();
                this.$emit('trigger-event', { name: 'initValueChange', event: { value: this.content.initialValue } });
            }
        },
        uniqueOptions: {
            deep: true,
            handler() {
                if (!this.$refs.multiselect?.isOpen) this.componentKey++;
            },
        },
        'content.options': {
            deep: true,
            handler() {
                this.componentKey++;
                this.refreshOptions();
            },
        },
        internalValue() {
            this.refreshOptions();
        },
        'content.labelField'() {
            this.componentKey++;
            this.refreshOptions();
        },
        'content.valueField'() {
            this.componentKey++;
            this.refreshOptions();
        },
        'content.layoutType'() {
            this.componentKey++;
            this.refreshOptions();
        },
        isReadOnly: {
            immediate: true,
            handler(value) {
                if (value) {
                    this.$emit('add-state', 'readonly');
                } else {
                    this.$emit('remove-state', 'readonly');
                }
            },
        },

        'content.limit'() {
            this.componentKey += 1;
            this.$nextTick(() => {
                this.init();
            });
        },
        currentLang() {
            this.options = this.options.map(option => this.formatOption(option.data));
            this.componentKey++;
            this.refreshOptions();
        },
    },
    methods: {
        init() {
            const initialOptions = Array.isArray(this.content.options) ? [...this.content.options] : [];
            this.options.push(...initialOptions.map(option => this.formatOption(option)));

            if (this.content.initialValue !== undefined) {
                // add initial values as custom options if not already included
                const initialValue = Array.isArray(this.content.initialValue) ? [...this.content.initialValue] : [];
                this.options.push(
                    ...initialValue.filter(selection => !this.options.map(option => option.value).includes(selection))
                );
                // We set internalValue after the options to avoid mismatch
                this.setCurrentSelection(initialValue);
            }
        },
        /**
         * We need to avoid to have a value not present in options
         * So here we take care of not removing an used option
         */
        refreshOptions() {
            // Check if this.options and this.internalValue are defined and are arrays
            if (
                !this.options ||
                !Array.isArray(this.options) ||
                !this.internalValue ||
                !Array.isArray(this.internalValue)
            ) {
                throw new Error('options or internalValue is not an array');
            }

            // Filter options that are in internalValue
            this.options = this.options.filter(option => option && this.internalValue.includes(option.value));

            // Check if this.content and this.content.options are defined and is an array
            let initialOptions = [];
            if (this.content && Array.isArray(this.content.options)) {
                initialOptions = [...this.content.options];
            }

            // Add initial options avoiding duplicates
            const newOptions = initialOptions.filter(
                option => option && !this.options.some(currentOpt => currentOpt.value === option.value)
            );
            this.options.push(...newOptions.map(option => this.formatOption(option)));

            // Add current selection as custom options if not already included
            this.options.push(
                ...this.internalValue.filter(
                    selection => selection && !this.options.some(option => option.value === selection)
                )
            );
        },
        refreshInitialValue() {
            const initialValue = Array.isArray(this.content.initialValue) ? [...this.content.initialValue] : [];

            this.options.push(
                ...initialValue.filter(
                    selection =>
                        !this.options.map(option => option.value).includes(selection) &&
                        !this.currentSelection.includes(selection)
                )
            );

            this.setCurrentSelection(initialValue);
        },
        formatOption(option) {
            let labelField = this.content.labelField || DEFAULT_LABEL_FIELD;
            const valueField = this.content.valueField || DEFAULT_VALUE_FIELD;

            const label = `${wwLib.wwLang.getText(
                wwLib.resolveObjectPropertyPath(option, wwLib.wwLang.getText(labelField))
            )}`;
            const value = wwLib.resolveObjectPropertyPath(option, valueField);

            if (this.layoutType === 'free')
                return {
                    label,
                    value,
                    data: option,
                };

            return typeof option === 'object'
                ? {
                      label,
                      value,
                      data: option,
                  }
                : {
                      // to allow flat array / option
                      label: option,
                      value: option,
                      data: option,
                  };
        },
        getOptionStyle(option) {
            return this.layoutType === 'text' ? this.defaultTagStyle : null;
        },
        handleOpening(value) {
            if (!this.$refs.multiselect) return;
            if (value) this.$refs.multiselect.open();
            else this.$refs.multiselect.close();
        },
        onTagSelected(isSelected) {
            if (isSelected) this.$refs.multiselect.open();
        },
        getOptionIndex(option) {
            return this.options.indexOf(option);
        },
        checkIsOpen() {

        },
        getLabel(option, label) {
            return `${wwLib.wwLang.getText(wwLib.resolveObjectPropertyPath(option, wwLib.wwLang.getText(label)))}`;
        },
        interceptFocus(event) {
            if (!this.isEditing) return;
            if (
                event.target.classList.contains('multiselect-wrapper') ||
                event.target.classList.contains('multiselect-tags-search')
            ) {
                event.stopPropagation();
                event.preventDefault();
            }
        },
        interceptClick(event) {
            if (!this.isEditing) return;
            if (
                event.target.classList.contains('multiselect-option') ||
                event.target.classList.contains('multiselect-wrapper') ||
                event.target.classList.contains('multiselect-tags-search')
            ) {
                event.stopPropagation();
                event.preventDefault();
            }
        },
    },
};
</script>

<style src="@vueform/multiselect/themes/default.css"></style>

<style type="scss" scoped>
.input-multiselect {
    cursor: var(--component-cursor);
    --ms-border-width: 0px;
    position: relative;
    /* min-height: calc(var(--font-size) + 20px); */
    width: initial; /* to avoid the width 100% from the library */

    &.is-active {
        box-shadow: unset;
    }
}
.input-multiselect:deep(.multiselect-wrapper) {
    cursor: var(--component-cursor);
    height: inherit;
    min-height: unset;
}
.input-multiselect:deep(.multiselect-dropdown) {
    overflow-y: auto;
}
.input-multiselect:deep(.multiselect-tag) {
    background: transparent;
    padding: var(--padding-tag);
    border-radius: 4px;
}
.input-multiselect:deep(.multiselect-tags-search) {
    background-color: transparent;
    font-size: var(--search-font-size);
    font-family: var(--search-font-family);
    color: var(--search-font-color);
}
.input-multiselect:deep(.multiselect-caret) {
    margin-top: 10px;
    margin-bottom: 10px;
}
.input-multiselect:deep(.caret) {
    transition: none;
}

.input-multiselect:deep(.hidden) {
    opacity: 0;
    pointer-events: none;
    transition: none;
}
.ww-input-select:deep(.multiselect-tag-el) {
    width: inherit;
}
.ww-input-select:deep(.multiselect-option) {
    padding: 0px !important;
    width: 100%;
}
.input-multiselect:deep(.multiselect-placeholder-el) {
    position: absolute !important;
    top: 50% !important;
    left: 0px !important;
    transform: translateY(-50%);
}


/* wwFront:start */
.input-multiselect:deep(.multiselect-placeholder-el) {
    pointer-events: none;
}
/* wwFront:end */
</style>
