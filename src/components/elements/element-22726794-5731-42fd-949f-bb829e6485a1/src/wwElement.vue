<template>
  <div class="wish-ranker-by-day" :style="rootStyles">
    <!-- Day tabs navigation -->
    <div v-if="ui.showDayTabs" class="day-tabs" :class="{ 'sticky-summary': ui.stickySummary }">
      <button
        v-for="day in sortedDays"
        :key="day"
        class="day-tab"
        :class="{ active: activeDay === day }"
        @click="scrollToDay(day)"
      >
        {{ day }}
      </button>
    </div>

    <!-- Optional heading -->
    <div v-if="labels.heading" class="heading">
      <h2>{{ labels.heading }}</h2>
      <p v-if="labels.note" class="note">{{ labels.note }}</p>
    </div>

    <!-- Days sections -->
    <div v-for="day in sortedDays" :key="day" :id="`day-${day}`" class="day-section"
      :class="{ 'needs-selection': validationTriggered && dayNeedsAction(day) }">
      <div class="day-header" @click="ui.collapsedDays ? (activeDay = day) : null">
        <h3>{{ day }}</h3>
        <div class="day-actions">
          <!-- Kein Angebot: only visible when no wishes are selected for the day -->
          <label v-if="ui.enableNoOffer && selectedCount(day) === 0" class="no-offer">
            <input
              type="checkbox"
              :checked="noOfferActive(day)"
              :disabled="isDisabled"
              @change="toggleNoOffer(day)"
            />
            <span>{{ labels.noOfferToggle }}</span>
          </label>

          <!-- Removed header-level fallback toggle on request -->

          <button
            class="reset-button"
            @click.stop="resetDay(day)"
            :disabled="isDisabled || !hasDaySelections(day)"
          >
            {{ labels.resetDay }}
          </button>
        </div>
      </div>

      <!-- Per-day validation hint (only after submit attempt) -->
      <div v-if="validationTriggered && dayNeedsAction(day)" class="day-warning" role="status" aria-live="polite">
        {{ dayRequirementMessage(day) }}
      </div>

      <!-- Per-day summary chips -->
      <div v-if="ui.showPerDaySummary && (noOfferActive(day) || selectedFor(day).length)" class="day-summary"
        :class="{ 'sticky-summary': ui.stickySummary }">
        <!-- No offer chip -->
        <div v-if="noOfferActive(day)" class="summary-chip special" @click="toggleNoOffer(day)">
          <span class="chip-title">{{ labels.noOfferChip }}</span>
          <button v-if="!isDisabled" class="clear-chip" @click.stop="toggleNoOffer(day)" aria-label="Clear no offer">×</button>
        </div>

        <!-- Selected wishes chips -->
        <template v-else>
          <div v-for="item in selectedFor(day)" :key="`${day}-${item.window_id}`" class="summary-chip"
            @click="scrollToCourse(day, item.rank)" :title="`${item.rank}. ${item.title}`">
            <span class="rank-label">{{ item.rank }}.</span>
            <span class="chip-title">{{ item.title }}</span>
            <button
              v-if="!isDisabled"
              class="clear-chip"
              @click.stop="clearRank(day, item.rank)"
              :aria-label="`Clear ${item.rank}. ${rankWord} in ${day}`"
              title="Clear"
            >
              ×
            </button>
          </div>
        </template>
      </div>

      <!-- Course rows (hidden if 'no offer') -->
      <div v-if="(!ui.collapsedDays || activeDay === day) && !noOfferActive(day)" class="courses-container">
        <div v-for="module in getModulesByDay(day)" :key="module.window_id" class="course-block">
          <div class="course-row" :id="`course-${module.window_id}`"
            :class="{ selected: getModuleRank(day, module.window_id) }" tabindex="0"
            @keydown="handleKeyDown($event, day, module.window_id)">
            <div class="course-info">
              <div class="course-titleline">
                <span class="course-title">{{ module.title }}</span>
                <span v-if="module.meta" class="dot">•</span>
                <span v-if="module.meta" class="course-meta-inline">{{ module.meta }}</span>
              </div>
            </div>
            <div class="course-controls">
              <button
                v-if="hasModuleInfo(module)"
                class="info-toggle"
                :class="{ active: isInfoOpen(module.window_id) }"
                @click.stop="toggleInfo(module.window_id)"
                :aria-expanded="isInfoOpen(module.window_id) ? 'true' : 'false'"
                :aria-controls="`more-${module.window_id}`"
              >
                {{ isInfoOpen(module.window_id) ? labels.lessInfo : labels.moreInfo }}
              </button>

              <button
                v-if="ui.showQuickAdd"
                class="quick-add"
                :class="{ active: getModuleRank(day, module.window_id) }"
                @click="handleQuickAdd(day, module.window_id)"
                :disabled="isDisabled"
                :title="labels.quickAddTooltip"
                :aria-pressed="!!getModuleRank(day, module.window_id)"
              >
                {{ getQuickAddLabel(day, module.window_id) }}
              </button>

              <div v-if="ui.showSelect" class="rank-select-container">
                <label :for="`rank-${module.window_id}`" class="sr-only">
                  {{ labels.wishLabel }}: {{ module.title }} ({{ day }})
                </label>
                <select
                  :id="`rank-${module.window_id}`"
                  class="rank-select"
                  :value="getModuleRank(day, module.window_id) || ''"
                  @change="handleRankChange($event, day, module.window_id)"
                  :disabled="isDisabled"
                  :aria-label="`${labels.wishLabel}: ${module.title} (${day})`"
                >
                  <option value="">{{ labels.none }}</option>
                  <option v-for="rank in getRanksArrayFor(day)" :key="rank" :value="rank">
                    {{ rank }}. {{ rankWord }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Expanded info -->
          <div v-if="isInfoOpen(module.window_id) && hasModuleInfo(module)" class="course-more"
            :id="`more-${module.window_id}`">
            <div class="more-body">
              <div v-if="getModulePicture(module)" class="more-image">
                <img :src="getModulePicture(module)" :alt="module.title" />
              </div>
              <div class="more-text">
                <p v-if="getModuleDescription(module)">
                  {{ getModuleDescription(module) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Inline fallback under the last selected wish when still missing wishes -->
          <div v-if="showInlinePickupFallback(day) && module.window_id === lastSelectedWindowId(day)"
            class="inline-fallback">
            <label class="pickup-fallback-inline">
              <input
                type="checkbox"
                :checked="pickupFallbackActive(day)"
                :disabled="isDisabled"
                @change="togglePickupFallback(day)"
              />
              <span>{{ labels.pickupFallback }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Global validation message (after first submit attempt) -->
    <div v-if="validationTriggered && invalidDays.length" class="alert" role="alert" aria-live="polite">
      {{ labels.globalIncomplete }}
      <span class="invalid-days-list">
        — {{ invalidDays.map(d => `${d} (${selectedCount(d)}/${ranksLimitForDay(d)})`).join(', ') }}
      </span>
    </div>

    <!-- Submit -->
    <div v-if="!isDisabled" class="submit-container">
      <button class="submit-button" @click="submit">
        {{ labels.submit || 'Submit' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue';

export default {
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    // Editor state
    const isEditing = computed(() => {
      return false;
    });

    // Normalize modules
    const normalizedModules = computed(() => {
      const modules = props.content?.modules || [];
      const mapping = props.content?.mapping || {};

      const idField = mapping.idField || 'window_id';
      const dayField = mapping.dayField || 'day';
      const titleField = mapping.titleField || 'title';
      const metaField = mapping.metaField || 'meta';

      return modules.map(module => ({
        window_id: module?.[idField],
        day: module?.[dayField],
        title: module?.[titleField],
        meta: module?.[metaField],
        // extra info
        course_id: module?.course_id,
        registration_period_id: module?.registration_period_id,
        school_id: module?.school_id,
        semester_id: module?.semester_id,
        course_code: module?.course_code,
        description_visible_to_parents: !!module?.description_visible_to_parents,
        description_for_parents: module?.description_for_parents,
        pictures: Array.isArray(module?.pictures) ? module.pictures : (module?.pictures ? [module?.pictures] : []),
        picture_first: module?.picture_first
      }));
    });

    // UI configuration
    const ui = computed(() => {
      const defaults = {
        ranksPerDay: 3,
        showQuickAdd: true,
        showSelect: true,
        showPerDaySummary: true,
        stickySummary: true,
        showDayTabs: true,
        collapsedDays: false,
        scrollOffsetPx: 72,
        enableNoOffer: true,
        enablePickupFallback: true,
        blockSubmitOnInvalid: true
      };
      return { ...defaults, ...(props.content?.ui || {}) };
    });

    // Labels
    const labels = computed(() => {
      const defaults = {
        heading: '',
        note: '',
        wishLabel: 'Wunsch',
        none: '—',
        resetDay: 'Zurücksetzen',
        chipEmpty: 'Leer',
        quickAddTooltip: 'Klicken: + → 1 → 2 → 3 → —',
        submit: 'Speichern',
        moreInfo: 'Mehr Info',
        lessInfo: 'Weniger Info',
        noOfferToggle: 'Kein Angebot (geht nach Hause 14:30)',
        noOfferChip: 'Kein Angebot gewählt',
        pickupFallback: 'Falls nicht möglich: Abgang 14:30',
        dayMustFillOrPickup: 'Bitte wähle {n} Wünsche oder aktiviere "Falls nicht möglich: Abgang 14:30".',
        dayMustChooseOrNoOffer: 'Bitte wähle mindestens ein Angebot, aktiviere "Kein Angebot" oder aktiviere "Falls nicht möglich: Abgang 14:30".',
        globalIncomplete: 'Einige Tage sind noch unvollständig. Bitte überprüfe deine Auswahl.'
      };
      return { ...defaults, ...(props.content?.labels || {}) };
    });

    const rankWord = computed(() => {
      const raw = props.content?.labels?.wishLabel;
      const val = String(raw ?? '').trim();
      return val || 'Wunsch';
    });

    // Theme
    const theme = computed(() => {
      const defaults = {
        accentColor: '#3b82f6',
        borderColor: '#e5e7eb',
        chipBg: '#f3f4f6',
        fontSizePx: 14
      };
      return { ...defaults, ...(props.content?.theme || {}) };
    });

    // Storage
    const storage = computed(() => {
      const defaults = {
        autosaveLocal: true,
        storageKey: 'wish-per-day',
        emitDebounceMs: 200
      };
      return { ...defaults, ...(props.content?.storage || {}) };
    });

    // Disabled
    const isDisabled = computed(() => {
      if (props.content?.readOnly) return true;
      const period = props.content?.period || { isOpen: true };
      return !period.isOpen;
    });

    // Days
    const sortedDays = computed(() => {
      const explicit = props.content?.daysOrder;
      if (Array.isArray(explicit) && explicit.length) return explicit;
      const uniqueDays = [...new Set(normalizedModules.value.map(m => m.day).filter(Boolean))];
      return uniqueDays.sort((a, b) => {
        try { return String(a).localeCompare(String(b), 'de-DE'); }
        catch { return String(a).localeCompare(String(b)); }
      });
    });

    // Limits
    const ranksPerDay = computed(() => {
      const p = props.content?.period?.maxWishesPerDay;
      const n = Number(p);
      if (Number.isFinite(n) && n > 0) return Math.min(10, Math.max(1, n));
      return Math.min(10, Math.max(1, Number(ui.value.ranksPerDay || 1)));
    });
    const getModulesByDay = (day) => normalizedModules.value.filter(m => m.day === day);
    const ranksLimitForDay = (day) =>
      Math.max(1, Math.min(ranksPerDay.value, getModulesByDay(day).length || ranksPerDay.value));
    const getRanksArrayFor = (day) => Array.from({ length: ranksLimitForDay(day) }, (_, i) => i + 1);

    // Root styles
    const rootStyles = computed(() => ({
      '--accent-color': theme.value.accentColor,
      '--border-color': theme.value.borderColor,
      '--chip-bg': theme.value.chipBg,
      '--font-size': `${theme.value.fontSizePx}px`
    }));

    // State
    const selections = ref({});
    const pickupFallback = ref({});
    const expandedInfo = ref({});
    const activeDay = ref('');
    theValidationTriggered:  // avoid accidental global var if renamed
    0;
    const validationTriggered = ref(false);
    let emitTimeout = null;

    // Constants and helpers
    const NO_OFFER = '__NO_OFFER__';
    const noOfferActive = (day) => selections.value?.[day]?.[0] === NO_OFFER;

    const toggleNoOffer = (day) => {
      if (isDisabled.value) return;
      if (noOfferActive(day)) {
        selections.value[day] = [];
      } else {
        selections.value[day] = [NO_OFFER];
        if (pickupFallback.value[day]) delete pickupFallback.value[day];
      }
      emitChange();
    };

    // Show fallback whenever the effective required wishes is more than 1 (i.e., at least 2 offers that day)
    const canUsePickupFallback = (day) => ranksLimitForDay(day) > 1;

    const pickupFallbackActive = (day) => !!pickupFallback.value?.[day];
    const togglePickupFallback = (day) => {
      if (isDisabled.value) return;
      if (!canUsePickupFallback(day) || noOfferActive(day)) return;
      pickupFallback.value[day] = !pickupFallback.value[day];
      emitChange();
    };

    const hasDaySelections = (day) => {
      const arr = selections.value[day] || [];
      return arr.length > 0;
    };

    const getModuleRank = (day, windowId) => {
      if (noOfferActive(day)) return null;
      if (!selections.value[day]) return null;
      const index = selections.value[day].indexOf(windowId);
      return index >= 0 ? index + 1 : null;
    };

    const selectedFor = (day) => {
      if (noOfferActive(day)) return [];
      const ids = selections.value[day] || [];
      return ids
        .filter((id) => id && id !== NO_OFFER)
        .map((id, idx) => {
          const mod = normalizedModules.value.find(m => m.window_id === id);
          return { rank: idx + 1, title: mod?.title || '', window_id: id };
        })
        .filter((it) => it.title);
    };

    const getQuickAddLabel = (day, windowId) => {
      const rank = getModuleRank(day, windowId);
      return rank ? String(rank) : '+';
    };

    // Info helpers
    const getModulePicture = (module) =>
      module?.picture_first || (Array.isArray(module?.pictures) && module.pictures[0]) || '';
    const getModuleDescription = (module) =>
      module?.description_visible_to_parents && module?.description_for_parents
        ? module.description_for_parents
        : '';
    const hasModuleInfo = (module) => !!(getModulePicture(module) || getModuleDescription(module));
    const isInfoOpen = (windowId) => !!expandedInfo.value[windowId];
    const toggleInfo = (windowId) => { expandedInfo.value[windowId] = !expandedInfo.value[windowId]; };

    // Selection helpers
    const selectedCount = (day) =>
      (selections.value[day] || []).filter((id) => id && id !== NO_OFFER).length;

    const lastSelectedWindowId = (day) => {
      const arr = (selections.value[day] || []).filter((id) => id && id !== NO_OFFER);
      return arr.length ? arr[arr.length - 1] : null;
    };

    // Inline fallback under last selected wish when still missing wishes
    const showInlinePickupFallback = (day) =>
      canUsePickupFallback(day) &&
      !noOfferActive(day) &&
      selectedCount(day) >= 1 &&
      selectedCount(day) < ranksLimitForDay(day);

    // Mutations
    const setRank = (day, windowId, rank) => {
      if (isDisabled.value || noOfferActive(day)) return;
      if (!selections.value[day]) selections.value[day] = [];

      if (rank === null) {
        const index = selections.value[day].indexOf(windowId);
        if (index >= 0) {
          selections.value[day].splice(index, 1);
          emitChange();
        }
        return;
      }

      const currentIndex = selections.value[day].indexOf(windowId);
      if (currentIndex >= 0) selections.value[day].splice(currentIndex, 1);

      const limit = ranksLimitForDay(day);
      const insertIndex = Math.max(0, Math.min(rank - 1, limit - 1));

      selections.value[day].splice(insertIndex, 0, windowId);

      selections.value[day] = selections.value[day]
        .filter((id, idx, arr) => id != null && id !== NO_OFFER && arr.indexOf(id) === idx)
        .slice(0, limit);

      emitChange();
    };

    const clearRank = (day, rank) => {
      if (isDisabled.value || noOfferActive(day)) return;
      if (!selections.value[day] || rank > selections.value[day].length) return;
      selections.value[day].splice(rank - 1, 1);
      emitChange();
    };

    const resetDay = (day) => {
      if (isDisabled.value) return;
      if (selections.value[day]) selections.value[day] = [];
      if (pickupFallback.value[day]) delete pickupFallback.value[day];
      emitChange();
    };

    const clearAll = () => {
      if (isDisabled.value) return;
      selections.value = {};
      pickupFallback.value = {};
      emitChange();
    };

    // Interactions
    const handleQuickAdd = (day, windowId) => {
      if (isDisabled.value || noOfferActive(day)) return;
      const currentRank = getModuleRank(day, windowId);
      const limit = ranksLimitForDay(day);
      if (!currentRank) {
        const len = (selections.value[day] || []).length;
        setRank(day, windowId, Math.min(len + 1, limit));
      } else if (currentRank < limit) {
        setRank(day, windowId, currentRank + 1);
      } else {
        setRank(day, windowId, null);
      }
    };

    const handleRankChange = (event, day, windowId) => {
      if (isDisabled.value || noOfferActive(day)) return;
      const value = event.target.value;
      if (value === '') setRank(day, windowId, null);
      else setRank(day, windowId, parseInt(value, 10));
    };

    const handleKeyDown = (event, day, windowId) => {
      if (isDisabled.value || noOfferActive(day)) return;
      const limit = ranksLimitForDay(day);
      const key = event.key;
      if (['1','2','3','4','5','6','7','8','9'].includes(key) && parseInt(key, 10) <= limit) {
        setRank(day, windowId, parseInt(key, 10));
        focusNextCourse(event.target);
        event.preventDefault();
      } else if (['Backspace','Delete','0'].includes(key)) {
        setRank(day, windowId, null);
        event.preventDefault();
      } else if (['Enter',' '].includes(key) && ui.value.showQuickAdd) {
        handleQuickAdd(day, windowId);
        event.preventDefault();
      } else if (['ArrowUp','ArrowDown'].includes(key)) {
        const direction = key === 'ArrowUp' ? -1 : 1;
        focusCourseOffset(event.target, direction);
        event.preventDefault();
      }
    };

    // Focus helpers
    const focusNextCourse = (currentElement) => {
      const currentRow = currentElement.closest('.course-row');
      const nextRow = currentRow?.nextElementSibling;
      if (nextRow && nextRow.classList.contains('course-row')) nextRow.focus();
    };
    const focusCourseOffset = (currentElement, offset) => {
      const currentRow = currentElement.closest('.course-row');
      const rows = Array.from(document.querySelectorAll('.course-row'));
      const currentIndex = rows.indexOf(currentRow);
      const targetIndex = currentIndex + offset;
      if (targetIndex >= 0 && targetIndex < rows.length) rows[targetIndex].focus();
    };

    // Scroll helpers
    const scrollToDay = (day) => {
      activeDay.value = day;
      nextTick(() => {
        const element = document.getElementById(`day-${day}`);
        if (element) {
          const offset = ui.value.scrollOffsetPx || 0;
          const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    };
    const scrollToCourse = (day, rank) => {
      if (!selections.value[day] || rank > selections.value[day].length) return;
      const windowId = selections.value[day][rank - 1];
      if (!windowId) return;
      nextTick(() => {
        const element = document.getElementById(`course-${windowId}`);
        if (element) {
          const offset = ui.value.scrollOffsetPx || 0;
          const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
          element.focus();
        }
      });
    };

    // Validation
    const dayValid = (day) => {
      if (noOfferActive(day)) return true;
      const req = ranksLimitForDay(day);
      const cnt = selectedCount(day);
      if (cnt >= req) return true;
      if (canUsePickupFallback(day) && cnt >= 1 && pickupFallbackActive(day)) return true;
      return false;
    };
    const dayNeedsAction = (day) => !isDisabled.value && !dayValid(day);
    const dayRequirementMessage = (day) => {
      if (noOfferActive(day)) return '';
      const cnt = selectedCount(day);
      const req = ranksLimitForDay(day);
      if (cnt === 0) return labels.value.dayMustChooseOrNoOffer;
      return (labels.value.dayMustFillOrPickup || '').replace('{n}', String(req));
    };
    const invalidDays = computed(() => sortedDays.value.filter((d) => !dayValid(d)));

    // Import selection
    const normalizeSelectionInput = (selection) => {
      let sel = selection;
      if (sel && typeof sel === 'object' && Array.isArray(sel.course_choices)) {
        sel = sel.course_choices;
      }
      return sel;
    };

    // UPDATED: importer now reads pickup_fallback rows from the array shape
    const importSelection = (selection) => {
      if (!selection) return;
      const src = normalizeSelectionInput(selection);
      const next = {};
      const nextPickup = {};

      if (Array.isArray(src)) {
        src
          .filter(item =>
            item &&
            item.day &&
            (item.window_id !== undefined || item.no_offer || item.pickup_fallback)
          )
          .sort((a, b) => (a.rank || 0) - (b.rank || 0))
          .forEach(item => {
            const day = item.day;
            const limit = ranksLimitForDay(day);
            if (!next[day]) next[day] = [];

            // No offer supersedes everything for that day
            if (item.no_offer) {
              next[day] = [NO_OFFER];
              delete nextPickup[day];
              return;
            }

            // pickup_fallback flag (window_id may be null)
            if (item.pickup_fallback) {
              nextPickup[day] = true;
              return;
            }

            // Ranked window choice
            if (item.rank && item.window_id) {
              const idx = Math.max(0, Math.min(item.rank - 1, limit - 1));
              next[day][idx] = item.window_id;
            }
          });
      } else if (typeof src === 'object') {
        // Legacy by-day object shape (no fallback support here)
        Object.entries(src).forEach(([day, arr]) => {
          if (!Array.isArray(arr)) return;
          const limit = ranksLimitForDay(day);
          if (arr.includes(NO_OFFER)) {
            next[day] = [NO_OFFER];
          } else {
            next[day] = [...arr].filter(Boolean).slice(0, limit);
          }
        });
      }

      // Clean up: remove holes and NO_OFFER days that aren't actually no_offer
      Object.keys(next).forEach(day => {
        if (next[day]?.[0] !== NO_OFFER) next[day] = (next[day] || []).filter(Boolean);
      });

      selections.value = next;
      // apply imported pickup fallback flags
      pickupFallback.value = nextPickup;
      emitChange();
    };

    // Output (fallback row uses last required rank; no pickupFallbackDays in payload)
    const setSelectionValue = wwLib?.wwVariable?.useComponentVariable({
      uid: props.uid,
      name: 'value',
      type: 'object',
      defaultValue: { byDay: {}, flat: [], json: '[]', noOfferDays: [] }
    }).setValue;

    const formatSelections = () => {
      const byDayRaw = JSON.parse(JSON.stringify(selections.value || {}));
      const byDay = {};
      const flat = [];
      const noOfferDays = [];

      Object.entries(byDayRaw).forEach(([day, ids]) => {
        const limit = ranksLimitForDay(day);
        const arr = ids || [];

        if (arr[0] === NO_OFFER) {
          byDay[day] = [NO_OFFER];
          noOfferDays.push(day);
          // Keep a no_offer marker in flat for compatibility
          flat.push({ window_id: null, day, rank: 0, no_offer: true });
          return;
        }

        const cleaned = arr.filter(Boolean).slice(0, limit);
        byDay[day] = cleaned;

        // Real selections with their ranks
        cleaned.forEach((windowId, idx) => {
          flat.push({ window_id: windowId, day, rank: idx + 1 });
        });

        // Fallback as the last required rank (e.g., rank 3)
        const cnt = cleaned.length;
        if (
          pickupFallbackActive(day) &&
          canUsePickupFallback(day) &&
          cnt >= 1 &&
          cnt < limit
        ) {
          flat.push({
            window_id: null,
            day,
            rank: limit,
            pickup_fallback: true
          });
        }
      });

      return { byDay, flat, json: JSON.stringify(flat), noOfferDays };
    };

    // Persist/emit
    const persistLocal = () => {
      if (storage.value.autosaveLocal && !isEditing.value) {
        const toStore = { selections: selections.value, pickupFallback: pickupFallback.value };
        try { localStorage.setItem(storage.value.storageKey, JSON.stringify(toStore)); }
        catch (e) { console.error('Failed to save to localStorage:', e); }
      }
    };

    const emitChange = () => {
      try { setSelectionValue?.(formatSelections()); } catch {}
      persistLocal();

      if (emitTimeout) clearTimeout(emitTimeout);
      emitTimeout = setTimeout(() => {
        if (!isEditing.value) emit('trigger-event', { name: 'change', event: formatSelections() });
      }, storage.value.emitDebounceMs);
    };

    // Submit
    const submit = () => {
      if (isDisabled.value) return;
      validationTriggered.value = true;

      const details = invalidDays.value.map((d) => ({
        day: d,
        selected: selectedCount(d),
        required: ranksLimitForDay(d),
        canUseFallback: canUsePickupFallback(d),
        pickupFallback: pickupFallbackActive(d),
        noOffer: noOfferActive(d)
      }));

      if (details.length) {
        scrollToDay(details[0].day);
        if (!isEditing.value) {
          emit('trigger-event', { name: 'validation-warning', event: { invalidDays: details } });
        }
        if (ui.value.blockSubmitOnInvalid) return;
      }

      if (!isEditing.value) {
        emit('trigger-event', { name: 'submit', event: formatSelections() });
      }
    };

    // Reset
    const resetToInitial = (clearLocal = true) => {
      if (clearLocal && storage.value.autosaveLocal && !isEditing.value) {
        try { localStorage.removeItem(storage.value.storageKey); } catch {}
      }
      const init = props.content?.initialSelection;
      if (init && Object.keys(init).length) {
        importSelection(init);
      } else {
        selections.value = {};
      }
      if (props.content?.initialPickupFallback && typeof props.content.initialPickupFallback === 'object') {
        pickupFallback.value = { ...props.content.initialPickupFallback };
      } else {
        // keep whatever importSelection set or reset if none
        pickupFallback.value = pickupFallback.value && Object.keys(pickupFallback.value).length ? pickupFallback.value : {};
      }
      validationTriggered.value = false;
      emitChange();
    };

    // Mount
    onMounted(() => {
      if (props.content?.initialSelection) {
        importSelection(props.content.initialSelection);
      } else if (storage.value.autosaveLocal && !isEditing.value) {
        try {
          const raw = localStorage.getItem(storage.value.storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              if (parsed.selections) {
                selections.value = parsed.selections || {};
                pickupFallback.value = parsed.pickupFallback || {};
              } else {
                selections.value = parsed; // back-compat
                pickupFallback.value = {};
              }
              emitChange();
            }
          }
        } catch (e) { console.error('Failed to load from localStorage:', e); }
      }
      if (Object.keys(pickupFallback.value).length === 0 && props.content?.initialPickupFallback) {
        pickupFallback.value = { ...props.content.initialPickupFallback };
      }
      if (sortedDays.value.length > 0) activeDay.value = sortedDays.value[0];
    });

    // Watch
    watch(() => props.content?.initialSelection, (v) => { if (v) importSelection(v); }, { deep: true });
    watch(() => props.content?.initialPickupFallback, (v) => {
      if (v && typeof v === 'object') { pickupFallback.value = { ...v }; emitChange(); }
    }, { deep: true });

    return {
      // State
      selections,
      pickupFallback,
      expandedInfo,
      activeDay,
      validationTriggered,

      // Computed
      ui,
      labels,
      theme,
      isDisabled,
      sortedDays,
      rootStyles,
      rankWord,
      invalidDays,

      // Methods
      getModulesByDay,
      getRanksArrayFor,
      ranksLimitForDay,
      hasDaySelections,
      getModuleRank,
      selectedFor,
      getQuickAddLabel,
      setRank,
      clearRank,
      resetDay,
      clearAll,
      handleQuickAdd,
      handleRankChange,
      handleKeyDown,
      scrollToDay,
      scrollToCourse,
      importSelection,
      resetToInitial,
      submit,
      hasModuleInfo,
      isInfoOpen,
      toggleInfo,
      getModulePicture,
      getModuleDescription,
      noOfferActive,
      toggleNoOffer,
      // Fallback helpers
      canUsePickupFallback,
      pickupFallbackActive,
      togglePickupFallback,
      selectedCount,
      lastSelectedWindowId,
      showInlinePickupFallback,
      // Validation helpers
      dayNeedsAction,
      dayRequirementMessage
    };
  }
};
</script>

<style scoped>
  /* Base */
  .wish-ranker-by-day {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: var(--font-size, 14px);
    color: #333;
    width: 100%;
    max-width: 100%;
  }

  .heading {
    margin-bottom: 1.5rem;
  }

  .heading h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }

  .heading .note {
    font-size: 0.875rem;
    color: #666;
    margin: 0;
  }

  .day-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    overflow-x: auto;
    padding: 0.5rem 0;
    background-color: #fff;
    z-index: 10;
  }

  .day-tabs.sticky-summary {
    position: sticky;
    top: 0;
  }

  .day-tabs .day-tab {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 0.25rem;
    background: none;
    cursor: pointer;
    white-space: nowrap;
    font-weight: 500;
  }

  .day-tabs .day-tab:hover {
    background-color: #f9fafb;
  }

  .day-tabs .day-tab.active {
    background-color: var(--accent-color, #3b82f6);
    color: #fff;
    border-color: var(--accent-color, #3b82f6);
  }

  .day-section {
    margin-bottom: 2rem;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 0.5rem;
    overflow: hidden;
    background: #fff;
  }

  .day-section.needs-selection {
    border-color: #fca5a5;
    box-shadow: 0 0 0 1px #fca5a5 inset;
  }

  .day-header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #fbfbfd;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
  }

  .day-header h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  .day-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .no-offer {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.85rem;
    color: #444;
  }

  .no-offer input {
    accent-color: var(--accent-color, #3b82f6);
  }

  .reset-button {
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 0.25rem;
    background-color: white;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .reset-button:hover:not(:disabled) {
    background-color: #f3f4f6;
  }

  .reset-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .day-warning {
    padding: 8px 12px;
    background: #fffbeb;
    color: #92400e;
    border-bottom: 1px solid #fde68a;
    font-size: 0.875rem;
  }

  /* Summary chips */
  .day-summary {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background-color: white;
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    z-index: 5;
  }

  .day-summary.sticky-summary {
    position: sticky;
    top: 40px;
  }

  .summary-chip {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    background-color: var(--chip-bg, #f3f4f6);
    border-radius: 999px;
    min-width: 120px;
    cursor: pointer;
    border: 1px solid var(--border-color, #e5e7eb);
  }

  .summary-chip:hover {
    background-color: #e5e7eb;
  }

  .summary-chip .rank-label {
    font-weight: 700;
    margin-right: 0.5rem;
    color: var(--accent-color, #3b82f6);
  }

  .summary-chip .chip-title {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .summary-chip .clear-chip {
    background: none;
    border: none;
    color: #666;
    font-size: 1rem;
    cursor: pointer;
    padding: 0 0.25rem;
    margin-left: 0.25rem;
  }

  .summary-chip .clear-chip:hover {
    color: #ef4444;
  }

  .summary-chip.special {
    background: #eef2ff;
    color: #1e40af;
    border: 1px solid #c7d2fe;
  }

  /* Courses */
  .courses-container .course-block {
    border-bottom: 1px solid var(--border-color, #e5e7eb);
    background-color: white;
  }

  .courses-container .course-block:last-child {
    border-bottom: none;
  }

  .course-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: white;
  }

  .course-row:hover {
    background-color: #f9fafb;
  }

  .course-row:focus {
    outline: 2px solid var(--accent-color, #3b82f6);
    outline-offset: -2px;
  }

  .course-row.selected {
    background-color: #f0f9ff;
  }

  .course-info {
    flex: 1;
    min-width: 0;
  }

  .course-titleline {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    flex-wrap: nowrap;
  }

  .course-title {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .course-meta-inline {
    font-size: 0.85em;
    color: #666;
  }

  .dot {
    color: #999;
  }

  .course-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 1rem;
  }

  .info-toggle {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 0.25rem;
    background: white;
    font-size: 0.75rem;
    cursor: pointer;
    white-space: nowrap;
  }

  .info-toggle.active {
    background-color: #eef2ff;
    border-color: #c7d2fe;
  }

  .quick-add {
    width: 1.75rem;
    height: 1.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid var(--border-color, #e5e7eb);
    background-color: white;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
  }

  .quick-add:hover:not(:disabled) {
    background-color: #f3f4f6;
  }

  .quick-add.active {
    background-color: var(--accent-color, #3b82f6);
    color: white;
    border-color: var(--accent-color, #3b82f6);
  }

  .quick-add:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .rank-select {
    padding: 0.375rem 2rem 0.375rem 0.75rem;
    border: 1px solid var(--border-color, #e5e7eb);
    border-radius: 0.25rem;
    background-color: white;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.25rem;
    min-width: 120px;
  }

  .rank-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Expanded info */
  .course-more {
    padding: 0.75rem 1rem 1rem;
    background-color: #fff;
    border-top: 1px dashed var(--border-color, #e5e7eb);
  }

  .course-more .more-body {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .course-more .more-image {
    flex: 0 1 160px;
    min-width: 120px;
    max-width: 200px;
  }

  .course-more .more-image img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 0.25rem;
    border: 1px solid var(--border-color, #e5e7eb);
    background: #fafafa;
  }

  .course-more .more-text {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.9375rem;
    color: #333;
    line-height: 1.4;
    white-space: pre-line;
  }

  /* Inline fallback under last selected wish */
  .inline-fallback {
    padding: 0.5rem 1rem 0.9rem;
    background: #fff;
    border-top: 1px dashed var(--border-color, #e5e7eb);
  }

  .pickup-fallback-inline {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.92rem;
    color: #374151;
  }

  .pickup-fallback-inline input {
    accent-color: var(--accent-color, #3b82f6);
  }

  /* Alerts */
  .alert {
    margin-top: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.9375rem;
    background: #fffbeb;
    color: #92400e;
    border: 1px solid #fde68a;
  }

  .invalid-days-list {
    font-weight: 500;
  }

  /* Submit */
  .submit-container {
    display: flex;
    justify-content: center;
    margin-top: 1.5rem;
  }

  .submit-button {
    padding: 0.5rem 1.5rem;
    background-color: var(--accent-color, #3b82f6);
    color: white;
    border: none;
    border-radius: 0.25rem;
    font-weight: 500;
    cursor: pointer;
  }

  .submit-button:hover {
    opacity: 0.9;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .course-more .more-body {
      display: block;
    }

    .course-more .more-image {
      max-width: 100%;
      min-width: 0;
      margin-bottom: 0.5rem;
    }
  }

  @media (max-width: 560px) {
    .day-header {
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 8px 10px;
    }

    .day-actions {
      justify-content: flex-start;
      gap: 8px;
    }

    .no-offer {
      font-size: 0.88rem;
    }

    .reset-button {
      padding: 3px 9px;
      font-size: 0.82rem;
    }

    .day-summary {
      padding: 6px 10px;
    }
  }

  @media (max-width: 480px) {
    .wish-ranker-by-day {
      --font-size: 13px;
    }

    .day-tabs {
      gap: 6px;
      padding: 4px 6px;
      margin-bottom: 6px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .day-tabs .day-tab {
      padding: 6px 10px;
      font-weight: 600;
      border-radius: 8px;
      flex: 0 0 auto;
    }

    .day-header {
      padding: 8px 10px;
    }

    .day-header h3 {
      font-size: 0.95rem;
    }

    .day-actions {
      gap: 6px;
    }

    .no-offer {
      font-size: 12px;
    }

    .reset-button {
      padding: 3px 8px;
      font-size: 12px;
    }

    .day-summary {
      padding: 6px 8px;
      overflow-x: auto;
      white-space: nowrap;
      gap: 6px;
    }

    .summary-chip {
      display: inline-flex;
      padding: 6px 8px;
      min-width: auto;
      border-radius: 12px;
      font-size: 12px;
    }

    .summary-chip .rank-label {
      margin-right: 4px;
    }

    .summary-chip .clear-chip {
      font-size: 16px;
      padding: 0 4px;
    }

    .courses-container .course-row {
      flex-direction: column;
      align-items: stretch;
      padding: 8px 10px;
      gap: 6px;
    }

    .course-titleline {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 4px;
    }

    .course-title {
      font-weight: 600;
      max-width: 100%;
    }

    .course-meta-inline {
      font-size: 12px;
      color: #666;
    }

    .course-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-left: 0;
    }

    .info-toggle {
      padding: 4px 8px;
      font-size: 12px;
      border-radius: 6px;
    }

    .quick-add {
      width: 28px;
      height: 28px;
      font-size: 14px;
    }

    .rank-select {
      min-width: 110px;
      height: 30px;
      padding: 4px 24px 4px 8px;
      background-size: 1rem;
      background-position: right 6px center;
      font-size: 13px;
    }

    .course-more {
      padding: 8px 10px 10px;
    }

    .day-section {
      margin-bottom: 10px;
      border-radius: 8px;
    }

    .submit-container {
      position: sticky;
      bottom: 8px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0, #fff 12px);
      padding-top: 6px;
      margin-top: 10px;
    }

    .submit-button {
      padding: 8px 16px;
      font-size: 14px;
      border-radius: 8px;
    }
  }
</style>