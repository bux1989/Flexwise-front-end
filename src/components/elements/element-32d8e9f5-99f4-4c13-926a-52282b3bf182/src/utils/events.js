// src/utils/events.js
// Lightweight event emitter utility for WeWeb element events with fallback to window CustomEvent

/**
 * Emit a WeWeb trigger event for workflow integration
 * @param {Vue instance|emit function} vmOrEmit - Vue component instance or emit function
 * @param {string} name - Event name (e.g., 'scheduler:drop')
 * @param {Object} data - Event payload data
 * @param {Object} options - Additional options
 * @param {boolean} options.bubbles - Whether the event should bubble (default: true)
 * @param {boolean} options.cancelable - Whether the event can be cancelled (default: true)
 */
export function emitElementEvent(vmOrEmit, name, data, options = {}) {
    try {
        console.log(`🚀 [WeWeb Event] Attempting to emit trigger-event: ${name}`);

        // WeWeb element events must be emitted using the main component's emit function
        // Try the parent emit function first (most reliable for WeWeb workflows)
        if (typeof vmOrEmit === 'function') {
            console.log(`📡 [WeWeb Event] Using parent emit function for: ${name}`);

            try {
                // Emit proper WeWeb trigger-event format
                // Based on user feedback, WeWeb expects: emit('trigger-event', { name: 'event-name', event: data })
                vmOrEmit('trigger-event', {
                    name,
                    event: data,
                });
                console.log(`✅ [WeWeb Event] ${name} emitted successfully via parent emit`);
                return true;
            } catch (error) {
                console.error(`❌ [WeWeb Event] ${name} failed via parent emit:`, error);
                return false;
            }
        }

        // Fallback: Vue 2 Options API ($emit)
        if (vmOrEmit && typeof vmOrEmit.$emit === 'function') {
            console.log(`📡 [WeWeb Event] Fallback: Using Vue 2 $emit for: ${name}`);
            try {
                vmOrEmit.$emit('trigger-event', {
                    name,
                    event: data,
                });
                console.log(`✅ [WeWeb Event] ${name} emitted successfully via $emit`);
                return true;
            } catch (error) {
                console.error(`❌ [WeWeb Event] ${name} failed via $emit:`, error);
                return false;
            }
        }

        // If no valid emit function found, this is a failure for WeWeb workflows
        console.error(`❌ [WeWeb Event] No valid emit function found for: ${name}`);
        return false;
    } catch (error) {
        console.error(`❌ [WeWeb Event] Fatal error emitting ${name}:`, error);
        return false;
    }
}

/**
 * Emit scheduler:drop event when a course is successfully assigned
 * @param {Function|Vue instance} emitOrVm - Emit function or Vue component instance
 * @param {Object} payload - Drop event data
 * @param {number} payload.dayId - Backend day ID
 * @param {string} payload.periodId - Period UUID
 * @param {string} payload.courseId - Course ID
 * @param {string} payload.courseName - Course name
 * @param {string} payload.courseCode - Course code
 * @param {Array} payload.teacherIds - Array of teacher IDs
 * @param {string|null} payload.primaryTeacherId - Primary teacher ID
 * @param {string|null} payload.roomId - Room ID
 * @param {string} payload.source - Event source ('drag-drop')
 */
export function emitSchedulerDropEvent(emitOrVm, payload) {
    const eventData = {
        dayId: Number(payload.dayId), // Ensure it's a number (backend dayId)
        periodId: String(payload.periodId), // Ensure it's a string (period UUID)
        courseId: String(payload.courseId),
        courseName: String(payload.courseName || ''),
        courseCode: String(payload.courseCode || ''), // Add courseCode to the payload
        teacherIds: Array.isArray(payload.teacherIds) ? payload.teacherIds : [],
        primaryTeacherId: payload.primaryTeacherId || null,
        roomId: payload.roomId || null,
        source: payload.source || 'drag-drop',
        timestamp: new Date().toISOString(),
    };

    return emitElementEvent(emitOrVm, 'scheduler:drop', eventData);
}

/**
 * Emit scheduler:drag-start event when dragging begins
 * @param {Function|Vue instance} emitOrVm - Emit function or Vue component instance
 * @param {Object} payload - Drag start event data
 */
export function emitSchedulerDragStartEvent(emitOrVm, payload) {
    const eventData = {
        courseId: String(payload.courseId),
        courseName: String(payload.courseName || ''),
        source: 'drag-start',
        timestamp: new Date().toISOString(),
    };

    return emitElementEvent(emitOrVm, 'scheduler:drag-start', eventData);
}

/**
 * Emit scheduler:drag-end event when dragging ends
 * @param {Function|Vue instance} emitOrVm - Emit function or Vue component instance
 * @param {Object} payload - Drag end event data
 */
export function emitSchedulerDragEndEvent(emitOrVm, payload) {
    const eventData = {
        courseId: payload.courseId ? String(payload.courseId) : null,
        courseName: payload.courseName ? String(payload.courseName) : null,
        success: Boolean(payload.success),
        source: 'drag-end',
        timestamp: new Date().toISOString(),
    };

    return emitElementEvent(emitOrVm, 'scheduler:drag-end', eventData);
}

/**
 * Emit scheduler:remove event when an assignment is deleted
 * @param {Function|Vue instance} emitOrVm - Emit function or Vue component instance
 * @param {Object} payload - Remove event data
 */
export function emitSchedulerRemoveEvent(emitOrVm, payload) {
    const eventData = {
        dayId: Number(payload.dayId),
        periodId: String(payload.periodId),
        assignmentId: String(payload.assignmentId),
        courseId: payload.courseId ? String(payload.courseId) : null,
        courseName: payload.courseName ? String(payload.courseName) : null,
        source: 'remove',
        timestamp: new Date().toISOString(),
    };

    return emitElementEvent(emitOrVm, 'scheduler:remove', eventData);
}
