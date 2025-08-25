<template>
  <div class="student-schedule-overview" :class="{ 'is-mobile': isMobile }">
    <!-- Header -->
    <div class="header">
      <h3 class="title">
        {{ lang === 'de' ? 'Modulwünsche von ' : 'Module wishes for ' }}{{ studentName }}
      </h3>
      <div v-if="actions" class="actions">
        <button v-if="actions.canEditWishes" class="action-button" @click="onEditWishes">
          {{ lang === 'de' ? 'Modulwünsche bearbeiten' : 'Edit module wishes' }}
        </button>
        <button v-if="actions.canEditHeimweg" class="action-button" @click="onEditHeimweg">
          {{ lang === 'de' ? 'Abholinfos bearbeiten' : 'Edit pickup info' }}
        </button>
      </div>
    </div>

    <!-- DESKTOP/TABLET: unified table (wishes + Heimweg row) -->
    <div v-if="!isMobile" class="table-container">
      <table>
        <thead>
          <tr>
            <th class="rank-header"></th>
            <th v-for="day in days" :key="day.id">{{ day.label }}</th>
          </tr>
        </thead>
        <tbody>
          <!-- Wishes rows -->
          <tr v-for="rank in maxWishesRows" :key="'wish-' + rank">
            <td class="rank-cell">
              {{ rank }}. {{ lang === 'de' ? 'Wunsch' : 'Wish' }}
            </td>
            <td v-for="day in days" :key="`${day.key}-${rank}`">
              <!-- Show fallback label first so it is not masked -->
              <template v-if="isFallbackAt(day.key, rank)">
                <span class="fallback-label">
                  {{ fallbackLabelFor(day.key) }}
                </span>
              </template>
              <template v-else-if="wishesByDay[day.key] && wishesByDay[day.key][rank - 1]">
                <span :class="{ 'no-module': isNoModuleTitle(wishesByDay[day.key][rank - 1]?.title) }">
                  {{ wishesByDay[day.key][rank - 1]?.title || '—' }}
                </span>
              </template>
              <template v-else>
                <span>&nbsp;</span>
              </template>
            </td>
          </tr>

          <!-- Separator -->
          <tr class="separator-row"><td :colspan="days.length + 1"></td></tr>

          <!-- Heimweg row in same grid -->
          <tr class="heimweg-row">
            <td class="row-header">
              {{ lang === 'de' ? 'Heimweg' : 'Way home' }}
            </td>
            <td v-for="day in days" :key="`heimweg-${day.key}`" class="pickup-cell">
              <div v-if="pickupByDay[day.key]">
                <div class="pickup-time">
                  {{ pickupByDay[day.key].time }} {{ lang === 'de' ? 'Uhr' : '' }}
                </div>
                <div class="pickup-method">
                  {{ methodLabel(pickupByDay[day.key].method) }}
                </div>
                <div v-if="pickupByDay[day.key].note" class="pickup-note">
                  {{ pickupByDay[day.key].note }}
                </div>
                <!-- Conditional note when fallback is selected for this day -->
                <div v-if="fallbackByDay[day.key]" class="pickup-note pickup-note--conditional">
                  {{ lang === 'de' ? 'abhängig von Modulzusage' : 'depending on module acceptance' }}
                </div>
              </div>
              <div v-else>—</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- PHONE: stacked day cards -->
    <div v-else class="mobile-cards" role="list" aria-label="Schedule summary by day">
      <div v-for="day in days" :key="day.id" class="day-card" role="listitem">
        <div class="day-card__header">
          <div class="day-card__title">{{ day.label }}</div>
        </div>

        <!-- Wishes as a compact list -->
        <ol class="wishes-list" aria-label="Wishes">
          <li v-for="rank in maxWishesRows" :key="`m-${day.key}-${rank}`" class="wishes-list__item">
            <span class="wishes-list__rank">{{ rank }}.</span>
            <span
              class="wishes-list__title"
              :class="{
                'no-module': isNoModuleTitle(wishesByDay[day.key]?.[rank - 1]?.title),
                'fallback-label': isFallbackAt(day.key, rank)
              }"
            >
              {{
                isFallbackAt(day.key, rank)
                  ? fallbackLabelFor(day.key)
                  : (wishesByDay[day.key]?.[rank - 1]?.title || '—')
              }}
            </span>
          </li>
        </ol>

        <!-- Heimweg block -->
        <div class="heimweg-block" aria-label="Way home">
          <div class="heimweg-block__label">
            {{ lang === 'de' ? 'Heimweg' : 'Way home' }}
          </div>
          <div class="heimweg-block__content" v-if="pickupByDay[day.key]">
            <div class="heimweg-block__time">
              {{ pickupByDay[day.key].time }} {{ lang === 'de' ? 'Uhr' : '' }}
            </div>
            <div class="heimweg-block__method">
              {{ methodLabel(pickupByDay[day.key].method) }}
            </div>
            <div v-if="pickupByDay[day.key].note" class="heimweg-block__note">
              {{ pickupByDay[day.key].note }}
            </div>
            <!-- Conditional note on mobile -->
            <div v-if="fallbackByDay[day.key]" class="heimweg-block__note heimweg-block__note--conditional">
              {{ lang === 'de' ? 'abhängig von Modulzusage' : 'depending on module acceptance' }}
            </div>
          </div>
          <div v-else>—</div>
        </div>
      </div>
    </div>

    <!-- Authorized Contacts -->
    <div class="authorized-contacts">
      <div class="section-title">
        {{ lang === 'de' ? 'Abholberechtigte Personen' : 'Authorized pickup contacts' }}
      </div>

      <!-- Desktop/Tablet list -->
      <template v-if="!isMobile">
        <template v-if="authorizedContacts?.rows?.length">
          <ul class="contacts-list">
            <li v-for="c in authorizedContacts.rows" :key="c.id">
              <span class="name">{{ c.name }}</span>
              <span v-if="c.isPrimary" class="primary">({{ lang === 'de' ? 'Primär' : 'Primary' }})</span>
            </li>
          </ul>
        </template>
        <div v-else class="pickup-warning">
          {{ authorizedContacts?.warning || (lang === 'de' ? 'Keine abholberechtigten Kontakte gesetzt' : 'No authorized contacts set') }}
        </div>
      </template>

      <!-- Phone chips -->
      <template v-else>
        <template v-if="authorizedContacts?.rows?.length">
          <div class="chips">
            <span v-for="c in authorizedContacts.rows" :key="c.id" class="chip">
              {{ c.name }}
              <span v-if="c.isPrimary" class="chip__badge">{{ lang === 'de' ? 'Primär' : 'Primary' }}</span>
            </span>
          </div>
        </template>
        <div v-else class="pickup-warning">
          {{ authorizedContacts?.warning || (lang === 'de' ? 'Keine abholberechtigten Kontakte gesetzt' : 'No authorized contacts set') }}
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';

export default {
  props: {
    content: { type: Object, required: true },
    uid: { type: String, required: true },
  },
  emits: ['trigger-event'],
  setup(props, { emit }) {
    // In-editor safe flag (WeWeb injects wwEditorState in editor; not in runtime)
    const isEditing = computed(() => {
      return false;
    });

    // Runtime breakpoint detection (prevents mobile UI showing on desktop)
    const DEFAULT_BREAKPOINT = 768;
    const breakpoint = computed(() => props.content?.mobileBreakpoint || DEFAULT_BREAKPOINT);

    const getWindow = () => {
      try {
        return typeof wwLib !== 'undefined' && wwLib.getFrontWindow ? wwLib.getFrontWindow() : window;
      } catch {
        return typeof window !== 'undefined' ? window : undefined;
      }
    };

    const vw = ref(1024);
    const updateWidth = () => {
      const w = getWindow();
      if (w) vw.value = w.innerWidth || 1024;
    };

    onMounted(() => {
      const w = getWindow();
      updateWidth();
      w?.addEventListener('resize', updateWidth, { passive: true });
    });
    onBeforeUnmount(() => {
      const w = getWindow();
      w?.removeEventListener('resize', updateWidth);
    });

    const isMobile = computed(() => vw.value <= breakpoint.value);

    const lang = computed(() => props.content?.lang || 'de');
    const studentName = computed(() => props.content?.studentName || '—');
    const studentFirstName = computed(() => {
      const fullName = props.content?.studentName || '';
      return fullName.split(' ')[0] || '—';
    });

    const days = computed(() => props.content?.days || []);
    const maxWishesRows = computed(() => props.content?.maxWishesRows || 1);
    const wishesByDay = computed(() => props.content?.wishesByDay || {});
    const pickupByDay = computed(() => props.content?.pickupByDay || {});
    const authorizedContacts = computed(() => props.content?.authorizedContacts || { rows: [], names: '', warning: '' });
    const actions = computed(() => props.content?.actions || null);

    const isNoModuleTitle = (t) => t === 'Kein Modul' || t === 'No module';

    // Fallback (Falls nicht möglich: Abgang HH:MM) support
    // The component can read fallback from either:
    // - content.fallbackByDay: { [dayKey]: true } and optional content.fallbackRankByDay: { [dayKey]: number }
    // - OR from an array in content.courseChoices or content.flat entries with { day, pickup_fallback: true, rank? }
    const getChoicesArray = () => {
      const arr = props.content?.courseChoices || props.content?.flat || [];
      return Array.isArray(arr) ? arr : [];
    };

    const derivedFallbackFromChoices = computed(() => {
      const map = {};
      const rankMap = {};
      getChoicesArray().forEach((it) => {
        if (it && it.day && it.pickup_fallback) {
          map[it.day] = true;
          if (typeof it.rank === 'number' && it.rank > 0) {
            rankMap[it.day] = it.rank;
          }
        }
      });
      return { active: map, rank: rankMap };
    });

    const fallbackByDay = computed(() => {
      return props.content?.fallbackByDay || derivedFallbackFromChoices.value.active || {};
    });
    const fallbackRankByDay = computed(() => {
      // prefer explicit rank, then rank from choices, then default to maxWishesRows
      const explicit = props.content?.fallbackRankByDay || {};
      const fromChoices = derivedFallbackFromChoices.value.rank || {};
      const result = {};
      const dayKeys = (props.content?.days || []).map(d => d.key);
      dayKeys.forEach((k) => {
        result[k] = explicit[k] || fromChoices[k] || maxWishesRows.value;
      });
      return result;
    });

    // Always render fallback with 14:30 for the red label
    const fallbackLabelFor = (dayKey) => {
      const fallbackTime = props.content?.fallbackTime || '14:30';
      if (lang.value === 'de') return `Falls nicht möglich: Abgang ${fallbackTime}`;
      return `If not possible: leaves at ${fallbackTime}`;
    };

    const isFallbackAt = (dayKey, rank) => {
      if (!fallbackByDay.value?.[dayKey]) return false;
      const expectedRank = fallbackRankByDay.value?.[dayKey] || maxWishesRows.value;
      return rank === expectedRank;
    };

    // Generic method labels (no names)
    const methodLabel = (methodId) => {
      const de = {
        goes_alone: 'geht allein nach Hause',
        authorized_pickup: 'wird abgeholt',
        public_transport: 'fährt mit öffentlichen Verkehrsmitteln nach Hause',
        school_bus: 'fährt mit dem Schulbus / Shuttle nach Hause',
        none: '—'
      };
      const en = {
        goes_alone: 'goes home alone',
        authorized_pickup: 'is picked up',
        public_transport: 'takes public transport home',
        school_bus: 'takes the school bus/shuttle home',
        none: '—'
      };
      const dict = (lang.value === 'de') ? de : en;
      return dict[methodId] || dict.none;
    };

    const onEditWishes = () => {
      if (isEditing.value) return;
      if (actions.value?.editWishesLink) {
        const w = getWindow();
        if (w) w.location.href = actions.value.editWishesLink;
      } else {
        emit('trigger-event', {
          name: 'edit-wishes',
          event: { studentId: props.content?.studentId }
        });
      }
    };

    const onEditHeimweg = () => {
      if (isEditing.value) return;
      if (actions.value?.editHeimwegLink) {
        const w = getWindow();
        if (w) w.location.href = actions.value.editHeimwegLink;
      } else {
        emit('trigger-event', {
          name: 'edit-heimweg',
          event: { studentId: props.content?.studentId }
        });
      }
    };

    return {
      // responsive
      isMobile,
      // content
      lang,
      studentName,
      studentFirstName,
      days,
      maxWishesRows,
      wishesByDay,
      pickupByDay,
      authorizedContacts,
      actions,
      // helpers
      isNoModuleTitle,
      methodLabel,
      onEditWishes,
      onEditHeimweg,
      // fallback
      isFallbackAt,
      fallbackLabelFor,
      fallbackByDay
    };
  }
};
</script>

<style lang="scss" scoped>
/* Base */
.student-schedule-overview {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  width: 100%;
  max-width: 100%;
  color: #111;
  -webkit-tap-highlight-color: transparent;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
  flex-wrap: wrap;
}

.title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.2;
}

.actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.action-button {
  padding: 8px 12px;
  background-color: #f5f5f7;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1.1;
  transition: background-color 0.2s, border-color 0.2s;
  touch-action: manipulation;
}
.action-button:active { transform: translateY(0.5px); }
.action-button:hover { background-color: #efefef; }

/* Desktop table */
.table-container {
  margin-bottom: 10px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  table {
    width: 100%;
    min-width: 720px;
    border-collapse: collapse;

    th, td {
      border: 1px solid #e6e6e6;
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
      word-break: break-word;
    }

    th {
      background-color: #fafafa;
      font-weight: 700;
    }
  }
}

.rank-header { width: 140px; }
.rank-cell { font-weight: 600; }
.row-header { font-weight: 700; }

.separator-row td {
  padding: 0;
  border: none;
  height: 8px;
}

.no-module { font-style: italic; color: #666; }
.fallback-label { font-style: italic; color: #444; }

.pickup-cell { vertical-align: top; }
.pickup-time { font-weight: 700; margin-bottom: 2px; }
.pickup-method { margin-bottom: 2px; }
.pickup-note { font-size: 0.9rem; color: #666; font-style: italic; }
.pickup-note--conditional { color: #444; }

 /* Mobile stacked cards */
.is-mobile .mobile-cards {
  display: grid;
  gap: 8px;
}

.is-mobile .day-card {
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
  box-shadow: 0 1px 0 rgba(0,0,0,0.02);
}

.is-mobile .day-card__header { margin-bottom: 4px; }
.is-mobile .day-card__title {
  font-weight: 800;
  font-size: 1.02rem;
  line-height: 1.2;
}

.is-mobile .wishes-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.is-mobile .wishes-list__item {
  display: flex;
  gap: 6px;
  padding: 4px 0;
  border-top: 1px dashed #eee;
}
.is-mobile .wishes-list__item:first-child { border-top: 0; }
.is-mobile .wishes-list__rank {
  width: 18px;
  color: #666;
  font-weight: 700;
}
.is-mobile .wishes-list__title {
  flex: 1;
  min-width: 0;
  line-height: 1.25;
  word-break: break-word;
}

.is-mobile .heimweg-block {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
}
.is-mobile .heimweg-block__label {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 2px;
  color: #333;
}
.is-mobile .heimweg-block__time { font-weight: 700; }
.is-mobile .heimweg-block__method { margin-top: 1px; }
.is-mobile .heimweg-block__note { font-size: 0.9rem; color: #666; font-style: italic; margin-top: 2px; }
.is-mobile .heimweg-block__note--conditional { color: #444; }

/* Authorized contacts */
.authorized-contacts { margin-top: 8px; }
.section-title { font-weight: 800; margin-bottom: 6px; }

.contacts-list {
  list-style: disc;
  padding-left: 1.25rem;
  margin: 0;
}
.contacts-list .primary {
  color: #444;
  font-style: italic;
  margin-left: 0.25rem;
}

/* Mobile chips */
.is-mobile .chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.is-mobile .chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid #e6e6e6;
  border-radius: 999px;
  background: #fafafa;
  font-size: 0.92rem;
}
.is-mobile .chip__badge {
  background: #e8eefc;
  color: #1f4ed1;
  border-radius: 999px;
  padding: 2px 6px;
  font-size: 0.78rem;
  font-weight: 700;
}
</style>