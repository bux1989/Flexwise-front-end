<template>
  <div>
    <div class="date-navigation-bar">
      <button class="heute-btn" @click="goToToday">Heute</button>
      <button class="nav-arrow left" @click="goToPreviousDay">
        <slot name="left-arrow">
          <!-- Default left arrow SVG -->
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </slot>
      </button>
      <div class="date-input-box">
        <DatePicker
          ref="wwDatePicker"
          class="ww-date-time-picker"
          :class="[
            { 'calendar-only': content.enableCalendarOnly },
            content.enableCalendarOnly && content.calendarOnlyFit,
          ]"
          :day-names="customDayNames"
          :model-value="formatedValue"
          @update:model-value="handleSelection"
          :format-locale="formatLocale"
          :format="previewFormat"
          :clearable="false"
          :locale="locale"
          :time-picker="content.dateMode === 'time'"
          :month-picker="content.dateMode === 'month'"
          :year-picker="content.dateMode === 'year'"
          :week-picker="content.dateMode === 'week'"
          :range="content.selectionMode === 'range'"
          :multi-dates="content.selectionMode === 'multi'"
          :multi-dates-limit="content.multiDatesLimit ? content.multiDatesLimit : null"
          :auto-range="content.rangeMode === 'auto' ? content.autoRange : null"
          :partial-range="
            content.enableCalendarOnly && content.rangeMode === 'free'
              ? true
              : content.rangeMode === 'free'
              ? content.enablePartialRange
              : null
          "
          :min-range="content.rangeMode === 'minmax' ? content.minRange : null"
          :max-range="content.rangeMode === 'minmax' ? content.maxRange : null"
          :multi-calendars="content.enableMultiCalendars ? content.multiCalendars : false"
          :multi-calendars-solo="content.multiCalendarsSolo"
          :inline="content.enableCalendarOnly"
          :vertical="content.orientation === 'vertical'"
          :enable-time-picker="content.dateMode === 'datetime' || content.dateMode === 'time'"
          :enable-seconds="content.enableSeconds"
          :is-24="content.use24"
          :autoApply="content.autoApply"
          :close-on-auto-apply="content.closeOnAutoApply"
          :flow="content.enableFlow ? content.flowSteps : null"
          :timezone="timezone"
          :week-numbers="content.weekNumbers === 'none' ? null : content.weekNumbers"
          :hide-offset-dates="content.hideOffsetDates"
          :min-date="content.minDate"
          :max-date="content.maxDate"
          :prevent-min-max-navigation="content.preventMinMaxNavigation"
          :start-date="content.startDate"
          :week-start="content.weekStart"
          :ignore-time-validation="content.ignoreTimeValidation"
          :disable-month-year-select="content.disableMonthYearSelect"
          :allowed-dates="content.allowedDates"
          :disabled-dates="content.disabledDates"
          :disabled-week-days="content.disabledWeekDays"
          :no-disabled-range="content.noDisabledRange"
          :model-type="modelType"
          :position="content.menuPosition || 'center'"
          :teleport=" (content.enableCalendarOnly || content.stickedDatePicker) ? null : body"
          :dpStyle="{ ...themeStyle }"
          :readonly="isReadOnly || isEditing"
          :key="dpKey"
        >
          <template #dp-input="{ value }">
            <div class="input-with-icon">
              <wwLayoutItemContext
                :index="0"
                :item="null"
                :data="{ preview: value, value: formatOutputValue(formatedValue) }"
                is-repeat
              >
                <wwLayout path="triggerZone" />
              </wwLayoutItemContext>
              <span class="calendar-icon-bg">
                <slot name="calendar-icon">
                  <!-- Default calendar SVG -->
                  <svg width="20" height="20" fill="none" viewBox="0 0 32 32">
                    <rect x="4" y="8" width="24" height="18" rx="2" fill="#BDBDBD"/>
                    <rect x="9" y="2" width="2" height="6" rx="1" fill="#757575"/>
                    <rect x="21" y="2" width="2" height="6" rx="1" fill="#757575"/>
                    <rect x="4" y="14" width="24" height="2" fill="#757575"/>
                  </svg>
                </slot>
              </span>
            </div>
          </template>
          <template #action-select>
            <wwElement v-bind="content.actionSelectElement" @click="selectDate" />
          </template>
          <template #left-sidebar v-if="content.enableLeftSidebar">
            <wwLayout path="leftSidebarZone" />
          </template>
          <template #right-sidebar v-if="content.enableRightSidebar">
            <wwLayout path="rightSidebarZone" />
          </template>
        </DatePicker>
      </div>
      <button class="nav-arrow right" @click="goToNextDay">
        <slot name="right-arrow">
          <!-- Default right arrow SVG -->
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M8 5L13 10L8 15" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </slot>
      </button>
    </div>
    <div v-if="!isToday" class="warning-message">
      Nicht heute Vertretung
    </div>
    <input class="required-handler" type="text" :required="content.required" :value="formatedValue" />
  </div>
</template>

<script>
import DatePicker from "./vue-datepicker.js";
import * as DateFnsLocal from 'date-fns/locale';
import "./main.css";
import { computed, ref, watch } from "vue";

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
setup(props, { emit }) {
const initValue = computed(() =>
props.content.selectionMode === "single"
? props.content.initValueSingle || null
: props.content.selectionMode === "range"
? {
start: props.content.initValueRangeStart || null,
end: props.content.initValueRangeEnd || null,
}
: Array.isArray(props.content.initValueMulti)
? props.content.initValueMulti
: []
);
const { value: variableValue, setValue } = wwLib.wwVariable.useComponentVariable({
uid: props.uid,
name: "value",
defaultValue: initValue,
});

// Expose the current date as a component variable
const { value: currentDate, setValue: setCurrentDate } = wwLib.wwVariable.useComponentVariable({
uid: props.uid,
name: "currentDate",
defaultValue: new Date().toISOString(),
});

// Check if the current date is today
const isToday = computed(() => {
if (!variableValue.value) return true;

const today = new Date();
today.setHours(0, 0, 0, 0);

const currentDateObj = new Date(variableValue.value);
currentDateObj.setHours(0, 0, 0, 0);

return today.getTime() === currentDateObj.getTime();
});

// Navigation functions
const goToNextDay = () => {
const date = variableValue.value ? new Date(variableValue.value) : new Date();
date.setDate(date.getDate() + 1);
updateDate(date);
};

const goToPreviousDay = () => {
const date = variableValue.value ? new Date(variableValue.value) : new Date();
date.setDate(date.getDate() - 1);
updateDate(date);
};

const goToToday = () => {
updateDate(new Date());
};

const updateDate = (date) => {
const isoDate = date.toISOString();
setValue(isoDate);
setCurrentDate(isoDate);
emit("trigger-event", {
name: "change",
event: { value: isoDate },
});
emit("trigger-event", {
name: "goToToday",
event: { value: isoDate },
});
};

const body = wwLib.getFrontDocument().body;

const wwDatePicker = ref(null);
const selectDate = () => {
wwDatePicker.value.selectDate();
};

return {
variableValue,
setValue,
currentDate,
setCurrentDate,
body,
initValue,
wwDatePicker,
selectDate,
isToday,
goToNextDay,
goToPreviousDay,
goToToday
};
},
watch: {
initValue(newValue, oldValue) {
if (JSON.stringify(newValue) === JSON.stringify(oldValue)) return;
this.setValue(newValue);
this.$emit("trigger-event", {
name: "initValueChange",
event: { value: newValue },
});
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
timezone() {
if (!this.content.timezone || this.content.timezone === "locale") return null;
return this.content.timezone;
},
dpKey() {
return (
this.content.selectionMode +
"-" +
this.content.dateMode +
"-" +
(this.content.menuPosition || "center") +
(this.content.enableCalendarOnly ? "-only" : "") +
(this.content.enableRightSidebar ? "-rightside" : "") +
(this.content.enableLeftSidebar ? "-leftside" : "")
);
},
modelType() {
if (this.content.dateMode === "date") return "yyyy-MM-dd";
if (this.content.dateMode === "time") return "HH:mm:SS";
if (this.content.dateMode === "month") return "yyyy-MM";
return null;
},
isReadOnly() {
return this.wwElementState.props.readonly === undefined
? this.content.readonly
: this.wwElementState.props.readonly;
},
customDayNames() {
if (this.locale == "ar") {
/*
Sun - أحد (Ahad)
Mon - إثن (Ithn)
Tue - ثلاث (Thulath)
Wed - أربع (Arba')
Thu - خمس (Khams)
Fri - جمعة (Jumu'ah)
Sat - سبت (Sabt)
*/
const arDayList = ['أحد','إثن','ثلاث','أربع','خمس','جمعة','سبت'];
const weekStartIndex = this.content.weekStart; // 0 to 6
return arDayList.slice(weekStartIndex).concat(arDayList.slice(0, weekStartIndex));
}
return null;
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
if (this.content.dateMode === "datetime" && value) {
value = Array.isArray(value)
? value.map((date) => (date ? date.toISOString() : null))
: value.toISOString();
}
const newValue = this.formatOutputValue(value);
if (JSON.stringify(this.variableValue) === JSON.stringify(newValue)) return;
this.setValue(newValue);
this.setCurrentDate(Array.isArray(newValue) ? newValue[0] : newValue);
this.$emit("trigger-event", {
name: "change",
event: { value: newValue },
});
},
formatInputValue(value) {
if (!value) return null;
else if (this.content.selectionMode === "single") return value;
else if (this.content.selectionMode === "range") {
if (!value.start && !value.end) return null;
return [value.start || null, value.end || null].filter((value) => value !== null && value !== "");
}
else if (this.content.selectionMode === "multi") return value;
},
formatOutputValue(value) {
if (!value) return null;
else if (this.content.selectionMode === "single") return value;
else if (this.content.selectionMode === "range") return { start: value[0], end: value[1] };
else if (this.content.selectionMode === "multi") return value;
},
clearValue() {
const clearValue = this.content.selectionMode === "single"
? null
: this.content.selectionMode === "range"
? {
start: null,
end: null,
}
: []
this.setValue(clearValue);
},
goToPreviousDay() {
const date = this.variableValue ? new Date(this.variableValue) : new Date();
date.setDate(date.getDate() - 1);
this.updateDate(date);
},
goToNextDay() {
const date = this.variableValue ? new Date(this.variableValue) : new Date();
date.setDate(date.getDate() + 1);
this.updateDate(date);
},
goToToday() {
this.updateDate(new Date());
},
updateDate(date) {
const isoDate = date.toISOString();
this.setValue(isoDate);
this.setCurrentDate(isoDate);
this.$emit("trigger-event", {
name: "change",
event: { value: isoDate },
});
this.$emit("trigger-event", {
name: "goToToday",
event: { value: isoDate },
});
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
:deep(.calendar-only.stretch) .dp__outer_menu_wrap {
  width: 100% !important;
}

.required-handler {
  opacity: 0;
  width: 100%;
  height: 0;
  position: absolute;
  pointer-events: none;
}

.date-navigation-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
  width: 100%;
  min-width: 320px;
}

.heute-btn {
  background: #4285f4;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  padding: 6px 20px;
  font-size: 16px;
  cursor: pointer;
  margin-right: 6px;
  box-shadow: 0 1px 2px rgba(66,133,244,0.08);
  transition: background 0.15s;
}
.heute-btn:hover, .heute-btn:focus {
  background: #3367d6;
}

.nav-arrow {
  background: #fff;
  border: 1px solid #bbb;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  cursor: pointer;
  transition: background 0.13s;
}
.nav-arrow:hover, .nav-arrow:focus {
  background: #f0f0f0;
  border-color: #888;
}
.nav-arrow.left {
  order: 1;
}
.nav-arrow.right {
  order: 3;
}

.date-input-box {
  background: #fafbfc;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0;
  height: 42px;
  min-width: 170px;
  max-width: 210px;
  order: 2;
  padding: 0 0.5rem;
  position: relative;
}

.input-with-icon {
  display: flex;
  align-items: center;
  width: 100%;
}
.input-with-icon input, .input-with-icon .dp__input {
  border: none !important;
  outline: none !important;
  background: transparent !important;
  font-size: 17px !important;
  text-align: center;
  width: 120px !important;
  padding: 0 8px 0 0 !important;
  box-shadow: none !important;
}
.input-with-icon input:focus, .input-with-icon .dp__input:focus {
  outline: none !important;
  box-shadow: none !important;
}

.calendar-icon-bg {
  background: #e0e0e0;
  border-radius: 4px;
  padding: 3px 5px 3px 5px;
  margin-left: 8px;
  display: flex;
  align-items: center;
  height: 28px;
  width: 28px;
  justify-content: center;
}

.warning-message {
  background-color: #ffecb3;
  color: #856404;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  text-align: center;
  font-weight: bold;
}
</style>