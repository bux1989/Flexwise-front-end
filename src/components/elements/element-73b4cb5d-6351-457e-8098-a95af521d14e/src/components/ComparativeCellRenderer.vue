<template>
    <div class="comparative-cell">
        <span :class="{ 'negative': isNegative, 'positive': isPositive, 'zero': isZero }">
            {{ formattedValue }}
            <PhCaretDown v-if="isNegative && hasValue" :size="20" weight="fill" class="icon" />
            <PhCaretUp v-if="isPositive && hasValue" :size="20" weight="fill" class="icon" />
            <PhMinus v-if="isZero && hasValue" :size="20" weight="fill" class="icon" />
        </span>
    </div>
</template>

<script>
import { PhCaretUp, PhCaretDown, PhMinus } from '@phosphor-icons/vue'

export default {
    components: {
        PhCaretUp,
        PhCaretDown,
        PhMinus
    },
    name: "ComparativeCellRenderer",
    props: {
        params: {
            type: Object,
            required: true,
        },
    },
    computed: {
        hasValue() {
            return this.params.value !== null && this.params.value !== undefined;
        },
        isNegative() {
            // Parse string or number values
            const value = typeof this.params.value === 'string'
                ? parseFloat(this.params.value)
                : this.params.value;
            return this.hasValue && value < 0;
        },
        isZero() {
            // Parse string or number values
            const value = typeof this.params.value === 'string'
                ? parseFloat(this.params.value)
                : this.params.value;
            return this.hasValue && value === 0;
        },
        isPositive() {
            // Parse string or number values
            const value = typeof this.params.value === 'string'
                ? parseFloat(this.params.value)
                : this.params.value;
            return this.hasValue && value > 0;
        },
        formattedValue() {
            return this.params.valueFormatted || this.params.value;
        }
    }
};
</script>

<style scoped lang="scss">
.comparative-cell {
    height: 100%;
    display: flex;
    align-items: center;
    
    span {
        display: flex;
        align-items: center;
        
        &.negative {
            color: #F8471C;
        }
        
        &.positive {
            color: #27be52;
        }
        
        &.zero {
            color: #140F10;
        }
        
        .icon {
            padding-left: 4px;
        }
    }
}
</style>