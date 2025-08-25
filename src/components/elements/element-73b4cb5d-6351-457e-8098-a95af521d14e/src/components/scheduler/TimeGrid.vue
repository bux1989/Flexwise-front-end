<template>
    <div class="time-grid-container">
        <div class="time-grid" ref="timeGridRef" role="grid" aria-label="Weekly schedule by time">
            <!-- Header row with days -->
            <div class="time-grid-header" role="row">
                <div class="time-header-cell time-label-cell" role="columnheader">Time</div>
                <div
                    v-for="(day, index) in days"
                    :key="day.id"
                    class="time-header-cell"
                    role="columnheader"
                    :aria-colindex="index + 1"
                >
                    {{ day.name }}
                </div>
            </div>

            <!-- Grid content -->
            <div class="time-grid-content">
                <!-- Time labels column -->
                <div class="time-labels">
                    <div
                        v-for="(time, index) in timeLabels"
                        :key="index"
                        class="time-label"
                        :style="{ top: `${index * timeSlotHeight}px` }"
                    >
                        {{ time }}
                    </div>
                </div>

                <!-- Days columns -->
                <div class="time-grid-days">
                    <div
                        v-for="day in days"
                        :key="day.id"
                        class="day-column"
                        @mousedown="startDrag($event, day.id)"
                        @mousemove="onDrag($event, day.id)"
                        @mouseup="endDrag"
                        @mouseleave="endDrag"
                    >
                        <!-- Time slots background -->
                        <div
                            v-for="(time, index) in timeLabels"
                            :key="`slot-${day.id}-${index}`"
                            class="time-slot"
                            :style="{ top: `${index * timeSlotHeight}px`, height: `${timeSlotHeight}px` }"
                        ></div>

                        <!-- Existing entries -->
                        <div
                            v-for="(entry, entryIndex) in getDayEntries(day.id)"
                            :key="`entry-${day.id}-${entryIndex}`"
                            class="time-entry"
                            :style="getEntryStyle(entry)"
                            @click.stop="editEntry(entry)"
                        >
                            <div class="entry-content">
                                <div class="entry-title">
                                    {{ getEntryTitle(entry) }}
                                </div>
                                <div class="entry-time">
                                    {{ formatTime(entry.start_time) }} - {{ formatTime(entry.end_time) }}
                                </div>
                                <div class="entry-details">
                                    <span v-if="entry.room_id">{{ getEntryRoomName(entry) }}</span>
                                    <span v-if="entry.teacher_ids && entry.teacher_ids.length">
                                        {{ getEntryTeacherNames(entry) }}
                                    </span>
                                </div>
                                <button class="remove-entry" @click.stop="removeEntry(entry)" aria-label="Remove entry">
                                    ×
                                </button>
                            </div>
                        </div>

                        <!-- Selection overlay when dragging -->
                        <div
                            v-if="isDragging && currentDayId === day.id"
                            class="selection-overlay"
                            :style="selectionStyle"
                        ></div>
                    </div>
                </div>
            </div>

            <!-- Keyboard navigation instructions -->
            <div class="keyboard-instructions" aria-live="polite">
                <p v-if="isKeyboardMode">Use arrow keys to adjust selection. Press Enter to place, Escape to cancel.</p>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGridLogic } from '../../composables/useGridLogic';
import { useSchedulerState } from '../../composables/useSchedulerState';

export default {
    name: 'TimeGrid',
    props: {
        days: {
            type: Array,
            default: () => [
                { id: 0, name: 'Sunday' },
                { id: 1, name: 'Monday' },
                { id: 2, name: 'Tuesday' },
                { id: 3, name: 'Wednesday' },
                { id: 4, name: 'Thursday' },
                { id: 5, name: 'Friday' },
                { id: 6, name: 'Saturday' },
            ],
        },
        startHour: {
            type: Number,
            default: 8, // 8:00 AM
        },
        endHour: {
            type: Number,
            default: 17, // 5:00 PM
        },
        timeSlotInterval: {
            type: Number,
            default: 15, // 15 minutes
        },
        courses: {
            type: Array,
            default: () => [
                { id: 'course1', name: 'Mathematics' },
                { id: 'course2', name: 'Science' },
                { id: 'course3', name: 'English' },
                { id: 'course4', name: 'History' },
            ],
        },
        rooms: {
            type: Array,
            default: () => [
                { id: 'r1', name: 'Room 101' },
                { id: 'r2', name: 'Room 102' },
                { id: 'r3', name: 'Lab 1' },
                { id: 'r4', name: 'Gym' },
            ],
        },
        teachers: {
            type: Array,
            default: () => [
                { id: 't1', name: 'Mr. Smith' },
                { id: 't2', name: 'Mrs. Johnson' },
                { id: 't3', name: 'Dr. Williams' },
                { id: 't4', name: 'Ms. Brown' },
            ],
        },
    },
    emits: ['add-entry'],
    setup(props, { emit }) {
        // Use new composables
        const { filteredEntries, removeEntry: storeRemoveEntry } = useSchedulerState();

        const { formatTime, getEntryRoomNameFromEntry, getEntryTeacherNamesFromEntry, getEntryTitleFromEntry } =
            useGridLogic(props);

        const timeGridRef = ref(null);

        // Dragging state
        const isDragging = ref(false);
        const dragStartY = ref(0);
        const dragEndY = ref(0);
        const currentDayId = ref(null);
        const timeSlotHeight = ref(40); // Height of each time slot in pixels

        // Keyboard navigation
        const isKeyboardMode = ref(false);
        const keyboardDayId = ref(null);
        const keyboardStartY = ref(0);
        const keyboardEndY = ref(0);

        // Computed properties
        const entries = computed(() => filteredEntries.value.filter(e => e.schedule_type === 'adhoc'));

        const timeLabels = computed(() => {
            const labels = [];
            const totalMinutes = (props.endHour - props.startHour) * 60;
            const intervals = totalMinutes / props.timeSlotInterval;

            for (let i = 0; i <= intervals; i++) {
                const minutes = i * props.timeSlotInterval;
                const hour = Math.floor(minutes / 60) + props.startHour;
                const minute = minutes % 60;

                labels.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
            }

            return labels;
        });

        const selectionStyle = computed(() => {
            const top = Math.min(dragStartY.value, dragEndY.value);
            const height = Math.abs(dragEndY.value - dragStartY.value);

            return {
                top: `${top}px`,
                height: `${height}px`,
            };
        });

        function getDayEntries(dayId) {
            return entries.value.filter(entry => entry.day_id === dayId);
        }

        function getEntryStyle(entry) {
            const startMinutes = timeToMinutes(entry.start_time) - props.startHour * 60;
            const endMinutes = timeToMinutes(entry.end_time) - props.startHour * 60;
            const minutesPerPixel = props.timeSlotInterval / timeSlotHeight.value;

            const top = startMinutes / minutesPerPixel;
            const height = (endMinutes - startMinutes) / minutesPerPixel;

            return {
                top: `${top}px`,
                height: `${height}px`,
            };
        }

        // Alias the composable functions for template compatibility
        const getEntryTitle = getEntryTitleFromEntry;
        const getEntryRoomName = getEntryRoomNameFromEntry;
        const getEntryTeacherNames = getEntryTeacherNamesFromEntry;

        function timeToMinutes(timeString) {
            if (!timeString) return 0;
            const [hours, minutes] = timeString.split(':').map(Number);
            return hours * 60 + minutes;
        }

        function minutesToTime(minutes) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        }

        function yToTime(y) {
            const minutesPerPixel = props.timeSlotInterval / timeSlotHeight.value;
            const minutes = Math.round((y * minutesPerPixel) / props.timeSlotInterval) * props.timeSlotInterval;
            return minutesToTime(minutes + props.startHour * 60);
        }

        function startDrag(event, dayId) {
            isDragging.value = true;
            currentDayId.value = dayId;
            const rect = event.currentTarget.getBoundingClientRect();
            dragStartY.value = event.clientY - rect.top;
            dragEndY.value = dragStartY.value;
        }

        function onDrag(event, dayId) {
            if (!isDragging.value || currentDayId.value !== dayId) return;
            const rect = event.currentTarget.getBoundingClientRect();
            dragEndY.value = event.clientY - rect.top;
        }

        async function endDrag() {
            if (!isDragging.value) return;

            const startTime = yToTime(Math.min(dragStartY.value, dragEndY.value));
            const endTime = yToTime(Math.max(dragStartY.value, dragEndY.value));

            // Only process if there's a meaningful time difference
            if (startTime !== endTime) {
                // Check slot availability
                const checkData = {
                    schedule_type: 'adhoc',
                    day_id: currentDayId.value,
                    start_time: startTime,
                    end_time: endTime,
                };

                const result = await store.checkPlacement(checkData);

                // Emit event to add new entry
                emit('add-entry', {
                    isEdit: false,
                    conflicts: result.conflicts || [],
                    dayId: currentDayId.value,
                    startTime,
                    endTime,
                });
            }

            // Reset drag state
            isDragging.value = false;
            currentDayId.value = null;
        }

        function editEntry(entry) {
            emit('add-entry', {
                isEdit: true,
                entry,
            });
        }

        function removeEntry(entry) {
            const index = entries.value.indexOf(entry);
            if (index !== -1) {
                storeRemoveEntry(index);
            }
        }

        // Keyboard navigation
        function handleKeyDown(event) {
            if (!isKeyboardMode.value) return;

            switch (event.key) {
                case 'ArrowUp':
                    keyboardStartY.value = Math.max(0, keyboardStartY.value - timeSlotHeight.value);
                    break;
                case 'ArrowDown':
                    keyboardEndY.value = Math.min(
                        (timeLabels.value.length - 1) * timeSlotHeight.value,
                        keyboardEndY.value + timeSlotHeight.value
                    );
                    break;
                case 'ArrowLeft':
                    if (keyboardDayId.value > 0) {
                        keyboardDayId.value--;
                    }
                    break;
                case 'ArrowRight':
                    if (keyboardDayId.value < props.days.length - 1) {
                        keyboardDayId.value++;
                    }
                    break;
                case 'Enter':
                    // Process selection
                    const startTime = yToTime(Math.min(keyboardStartY.value, keyboardEndY.value));
                    const endTime = yToTime(Math.max(keyboardStartY.value, keyboardEndY.value));
                    if (startTime !== endTime) {
                        emit('add-entry', {
                            isEdit: false,
                            dayId: keyboardDayId.value,
                            startTime,
                            endTime,
                        });
                    }
                    isKeyboardMode.value = false;
                    break;
                case 'Escape':
                    isKeyboardMode.value = false;
                    break;
            }

            event.preventDefault();
        }

        // Lifecycle hooks
        onMounted(() => {
            document.addEventListener('keydown', handleKeyDown);
        });

        onUnmounted(() => {
            document.removeEventListener('keydown', handleKeyDown);
        });

        return {
            timeGridRef,
            timeLabels,
            timeSlotHeight,
            isDragging,
            currentDayId,
            dragStartY,
            dragEndY,
            selectionStyle,
            isKeyboardMode,
            formatTime,
            getDayEntries,
            getEntryStyle,
            getEntryTitle,
            getEntryRoomName,
            getEntryTeacherNames,
            startDrag,
            onDrag,
            endDrag,
            editEntry,
            removeEntry,
        };
    },
};
</script>

<style scoped>
.time-grid-container {
    position: relative;
}

.time-grid {
    display: flex;
    flex-direction: column;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
}

.time-grid-header {
    display: flex;
    background-color: #f5f5f5;
    font-weight: bold;
    border-bottom: 1px solid #ddd;
}

.time-header-cell {
    flex: 1;
    padding: 12px;
    text-align: center;
    border-right: 1px solid #ddd;
}

.time-header-cell:last-child {
    border-right: none;
}

.time-grid-content {
    display: flex;
    position: relative;
    height: 600px;
    overflow-y: auto;
}

.time-labels {
    width: 60px;
    position: relative;
    background-color: #f9f9f9;
    border-right: 1px solid #ddd;
    flex-shrink: 0;
}

.time-label {
    position: absolute;
    left: 0;
    width: 100%;
    padding: 4px;
    text-align: center;
    font-size: 0.8em;
    color: #666;
    transform: translateY(-50%);
}

.time-grid-days {
    display: flex;
    flex: 1;
    position: relative;
}

.day-column {
    flex: 1;
    position: relative;
    border-right: 1px solid #ddd;
    min-height: 100%;
}

.day-column:last-child {
    border-right: none;
}

.time-slot {
    position: absolute;
    left: 0;
    right: 0;
    border-bottom: 1px dashed #eee;
    pointer-events: none;
}

.time-entry {
    position: absolute;
    left: 4px;
    right: 4px;
    background-color: #e6f7ff;
    border-left: 3px solid #1890ff;
    border-radius: 3px;
    padding: 4px;
    overflow: hidden;
    cursor: pointer;
    transition: background-color 0.2s;
}

.time-entry:hover {
    background-color: #bae7ff;
}

.entry-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
}

.entry-title {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.entry-time {
    font-size: 0.8em;
    color: #666;
    margin-top: 2px;
}

.entry-details {
    font-size: 0.8em;
    color: #666;
    margin-top: 2px;
    display: flex;
    flex-direction: column;
}

.selection-overlay {
    position: absolute;
    left: 4px;
    right: 4px;
    background-color: rgba(24, 144, 255, 0.3);
    border: 1px dashed #1890ff;
    pointer-events: none;
}

.remove-entry {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: #ff4d4f;
    color: white;
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
}

.entry-content:hover .remove-entry {
    opacity: 1;
}

.keyboard-instructions {
    margin-top: 8px;
    padding: 8px;
    background-color: #f9f9f9;
    border-radius: 4px;
    font-size: 0.9em;
    color: #666;
}
</style>
