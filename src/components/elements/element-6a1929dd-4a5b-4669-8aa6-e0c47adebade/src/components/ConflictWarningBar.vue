<template>
  <div v-if="conflictCount > 0" class="conflict-warning-bar" @click="$emit('toggle')">
    <div class="warning-content">
      <span class="warning-icon"></span>
      <span class="warning-text">
        {{ conflictMessage }}
      </span>
      <span class="click-hint">{{ t('clickForMoreInfo') }}</span>
    </div>
    <div class="warning-chevron">
      <span :class="{ 'rotated': showPanel }">▼</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'ConflictWarningBar',
  props: {
    conflictCount: { type: Number, default: 0 },
    blockingCount: { type: Number, default: 0 },
    language: { type: String, default: 'de' },
    showPanel: { type: Boolean, default: false }
  },
  emits: ['toggle'],
  setup(props) {
    // Translations
    const translations = {
      de: {
        conflictsFound: (count) => `${count} Konflikt${count !== 1 ? 'e' : ''} gefunden`,
        needsResolution: 'muss vor Veröffentlichung gelöst werden',
        needResolution: 'müssen vor Veröffentlichung gelöst werden',
        clickForMoreInfo: 'Klicken für weitere Infos.',
        blocking: 'blockierend'
      },
      en: {
        conflictsFound: (count) => `${count} conflict${count !== 1 ? 's' : ''} found`,
        needsResolution: 'needs to be resolved before publishing',
        needResolution: 'need to be resolved before publishing',
        clickForMoreInfo: 'Click for more info.',
        blocking: 'blocking'
      }
    };

    const t = (key, ...args) => {
      const value = translations[props.language]?.[key];
      return typeof value === 'function' ? value(...args) : (value || key);
    };

    // Computed message based on conflict counts
    const conflictMessage = computed(() => {
      const conflictText = t('conflictsFound', props.conflictCount);
      
      if (props.blockingCount > 0) {
        const resolutionText = props.blockingCount === 1 
          ? t('needsResolution')
          : t('needResolution');
        
        if (props.blockingCount === props.conflictCount) {
          return `${conflictText} – ${resolutionText}`;
        } else {
          return `${conflictText} (${props.blockingCount} ${t('blocking')}) – ${resolutionText}`;
        }
      }
      
      return conflictText;
    });

    return {
      t,
      conflictMessage
    };
  }
};
</script>

<style lang="scss" scoped>
.conflict-warning-bar {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: linear-gradient(135deg, #fff0b8, #fdcb6e);
    border-color: #f39c12;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .warning-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;

    .warning-icon {
      font-size: 16px;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
    }

    .warning-text {
      font-weight: 500;
      color: #856404;
      font-size: 13px;
    }

    .click-hint {
      color: #6c5ce7;
      font-size: 12px;
      font-style: italic;
      margin-left: 4px;
    }
  }

  .warning-chevron {
    color: #856404;
    font-size: 12px;
    transition: transform 0.15s ease;

    .rotated {
      transform: rotate(180deg);
      display: inline-block;
    }
  }
}

/* Animation for when the bar appears */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.conflict-warning-bar {
  animation: slideIn 0.3s ease-out;
}
</style>