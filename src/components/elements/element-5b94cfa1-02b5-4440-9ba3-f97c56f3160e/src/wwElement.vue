<template>
    <div>
        <DatePicker
            ref="wwTimePicker"
            class="ww-time-picker"

            :model-value="formatedValue"
            @update:model-value="handleSelection"
            :format-locale="formatLocale"
            :format="previewFormat"
            :clearable="false"
            :locale="locale"
            :time-picker="true"

            :enable-time-picker="true"
            :enable-seconds="content.enableSeconds"
            :is-24="content.use24"
            :autoApply="content.autoApply"
            :close-on-auto-apply="content.closeOnAutoApply"
            :keep-action-row="true"
            :min-time="minTime"
            :max-time="maxTime"
            :position="content.menuPosition || 'center'"
            :teleport="content.stickedTimePicker ? null : body"
            :dpStyle="{ ...themeStyle }"
            :readonly="isReadOnly || isEditing"
            :key="tpKey"
        >
            <template #dp-input="{ value }">
                <wwLayoutItemContext
                    :index="0"
                    :item="null"
                    :data="{ preview: value || placeholder, value: formatOutputValue(formatedValue) }"
                    is-repeat
                >
                    <wwLayout path="triggerZone" />
                </wwLayoutItemContext>
            </template>
            <template #action-select>
              <button class="ww-ok-button" @click="selectTime">OK</button>
            </template>
        </DatePicker>
        <input class="required-handler" type="text" :required="content.required" :value="formatedValue" />
    </div>
</template>

<script>
import DatePicker from "./vue-datepicker.js";
import * as DateFnsLocal from 'date-fns/locale';
import "./main.css";
import { computed, ref } from "vue";

export default {
    components: {
        DatePicker,
    },
    emits: ["update:content", "add-state", "remove-state", "trigger-event"],
    props: {
        content: { type: Object, required: true },
        uid: { type: String, required: true },
        wwElementState: { type: Object, required: true },
    },
    setup(props) {
        const initValue = computed(() => props.content.initValueSingle || null);
        const { value: variableValue, setValue } = wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: "value",
            defaultValue: initValue,
        });

        const body = wwLib.getFrontDocument().body;

        const wwTimePicker = ref(null);
        const selectTime = () => {
            wwTimePicker.value.selectDate();
        };

        return {
            variableValue,
            setValue,
            body,
            initValue,
            wwTimePicker,
            selectTime,
        };
    },
    watch: {
        initValue: {
            immediate: true,
            handler(newValue, oldValue) {
                // Always set the value if there's a valid initValue, especially on first load
                if (newValue !== null && newValue !== undefined) {
                    this.setValue(newValue);
                }
                // Only emit change event if this is not the initial setup
                if (oldValue !== undefined && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
                    this.$emit("trigger-event", {
                        name: "initValueChange",
                        event: { value: newValue },
                    });
                }
            },
        },
        isReadOnly: {
            immediate: true,
            handler(value) {
                if (value) {
                    this.$emit("add-state", "readonly");
                } else {
                    this.$emit("remove-state", "readonly");
                }
            },
        },
    },
    computed: {
        isEditing() {
            // eslint-disable-next-line no-unreachable
            return false;
        },
        /* https://github.com/date-fns/date-fns/blob/main/docs/unicodeTokens.md */
        previewFormat() {
            const format = this.content.format === "custom" ? this.content.customFormat : this.content.format;
            if (!format) return null;
            return format.replace(/Y/g, "y").replace(/D/g, "d").replace(/A/g, "a");
        },
        formatedValue() {
            return this.formatInputValue(this.variableValue);
        },
        locale() {
            if (this.content.lang === "pageLang") {
                return wwLib.wwLang.lang;
            }
            return this.content.lang;
        },
        formatLocale() {
            try {
                return DateFnsLocal[this.locale];
            } catch (e) {
                return "en";
            }
        },
        minTime() {
            return { hours: 7, minutes: 0, seconds: 0 };
        },
        maxTime() {
            return { hours: 17, minutes: 0, seconds: 0 };
        },
        placeholder() {
            if (this.locale === 'de') {
                return 'Zeit auswählen';
            }
            return 'Select time';
        },
        tpKey() {
            return "time-picker-" + (this.content.menuPosition || "center");
        },
        isReadOnly() {
            return this.wwElementState.props.readonly === undefined
                ? this.content.readonly
                : this.wwElementState.props.readonly;
        },

        themeStyle() {
            return {
                // COLORS
                "--dp-background-color": this.content.themeBackgroundColor,
                "--dp-text-color": this.content.themeTextColor,
                "--dp-hover-color": this.content.themeHoverColor,
                "--dp-hover-text-color": this.content.themeHoverTextColor,
                "--dp-hover-icon-color": this.content.themeHoverIconColor,
                "--dp-primary-color": this.content.themePrimaryColor,
                "--dp-primary-text-color": this.content.themePrimaryTextColor,
                "--dp-secondary-color": this.content.themeSecondaryColor,
                "--dp-border-color": this.content.themeBorderColor,
                "--dp-menu-border-color": this.content.themeMenuBorderColor,
                "--dp-border-color-hover": this.content.themeBorderHoverColor,
                "--dp-disabled-color": this.content.themeDisabledColor,
                "--dp-scroll-bar-background": this.content.themeScrollBarBackgroundColor,
                "--dp-scroll-bar-color": this.content.themeMScrollBarColor,
                "--dp-success-color": this.content.themeSuccessColor,
                "--dp-success-color-disabled": this.content.themeSuccessDisabledColor,
                "--dp-icon-color": this.content.themeIconColor,
                "--dp-danger-color": this.content.themeDangerColor,
                "--dp-highlight-color": this.content.themeHighlightColor,
                // GENERAL
                "--dp-font-family": this.content.themeFontFamily || "unset",
                "--dp-border-radius": this.content.themeBorderRadius,
                "--dp-cell-border-radius": this.content.themeCellBorderRadius,
                "--dp-font-size": this.content.themeFontSize,
                "--dp-preview-font-size": this.content.themePreviewFontSize,
                "--dp-time-font-size": this.content.themeTimeFontSize,
                "--dp-cell-size": this.content.themeCellSize,
                "--dp-cell-padding": this.content.themeCellPadding,
                "--dp-menu-min-width": this.content.themeMenuMinWidth,
            };
        },
    },
    methods: {
        handleSelection(value) {
            const newValue = value || null;
            if (JSON.stringify(this.variableValue) === JSON.stringify(newValue)) return;
            this.setValue(newValue);
            this.$emit("trigger-event", {
                name: "change",
                event: { value: newValue },
            });
        },
        formatInputValue(value) {
            return value || null;
        },
        formatOutputValue(value) {
            return value || null;
        },
        clearValue() {
            this.setValue(null);
        },
    },
};
</script>

<style>
.dp__action_row {
    width: 100% !important;
}
</style>

<style lang="scss" scoped>
.required-handler {
    opacity: 0;
    width: 100%;
    height: 0;
    position: absolute;
    pointer-events: none;
}
</style>
