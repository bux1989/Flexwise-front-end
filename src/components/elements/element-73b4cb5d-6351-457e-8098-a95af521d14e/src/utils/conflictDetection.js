/**
 * Pure conflict detection utilities for scheduler
 * Centralizes all conflict detection logic
 */
import { safeLength } from './arrayUtils';

/**
 * Detect conflicts in schedule entries
 * @param {Array} schedules - Array of schedule entries
 * @returns {Array} Array of conflict objects
 */
export function detectConflicts(schedules) {
    const conflicts = [];
    const conflictId = Date.now();

    // Group by day and period
    const slotMap = new Map();
    schedules.forEach((assignment, index) => {
        const key = `${assignment.day_id}-${assignment.period_id}`;
        if (!slotMap.has(key)) {
            slotMap.set(key, []);
        }
        slotMap.get(key).push({ ...assignment, index });
    });

    // Check each slot for conflicts
    slotMap.forEach((assignments, slotKey) => {
        if (safeLength(assignments) < 2) return;

        const [dayId, periodId] = slotKey.split('-').map(Number);

        // Detect teacher conflicts
        const teacherConflicts = detectTeacherConflicts(assignments, conflictId, slotKey, dayId, periodId);
        conflicts.push(...teacherConflicts);

        // Detect room conflicts
        const roomConflicts = detectRoomConflicts(assignments, conflictId, slotKey, dayId, periodId);
        conflicts.push(...roomConflicts);

        // Detect class conflicts
        const classConflicts = detectClassConflicts(assignments, conflictId, slotKey, dayId, periodId);
        conflicts.push(...classConflicts);
    });

    return conflicts;
}

/**
 * Detect teacher conflicts within a time slot
 */
function detectTeacherConflicts(assignments, conflictId, slotKey, dayId, periodId) {
    const conflicts = [];
    const teacherMap = new Map();

    assignments.forEach(assignment => {
        assignment.teacher_ids?.forEach(teacherId => {
            if (!teacherMap.has(teacherId)) {
                teacherMap.set(teacherId, []);
            }
            teacherMap.get(teacherId).push(assignment);
        });
    });

    teacherMap.forEach((teacherAssignments, teacherId) => {
        if (safeLength(teacherAssignments) > 1) {
            conflicts.push({
                id: `${conflictId}-teacher-${teacherId}-${slotKey}`,
                type: 'teacher',
                severity: 'high',
                day_id: dayId,
                period_id: periodId,
                affected_teachers: [teacherId],
                affected_courses: teacherAssignments.map(a => a.course_id),
                message: `Teacher is assigned to ${safeLength(teacherAssignments)} courses at the same time`,
                auto_resolvable: false,
            });
        }
    });

    return conflicts;
}

/**
 * Detect room conflicts within a time slot
 */
function detectRoomConflicts(assignments, conflictId, slotKey, dayId, periodId) {
    const conflicts = [];
    const roomMap = new Map();

    assignments.forEach(assignment => {
        if (assignment.room_id) {
            if (!roomMap.has(assignment.room_id)) {
                roomMap.set(assignment.room_id, []);
            }
            roomMap.get(assignment.room_id).push(assignment);
        }
    });

    roomMap.forEach((roomAssignments, roomId) => {
        if (safeLength(roomAssignments) > 1) {
            conflicts.push({
                id: `${conflictId}-room-${roomId}-${slotKey}`,
                type: 'room',
                severity: 'high',
                day_id: dayId,
                period_id: periodId,
                affected_rooms: [roomId],
                affected_courses: roomAssignments.map(a => a.course_id),
                message: `Room is booked for ${safeLength(roomAssignments)} courses at the same time`,
                auto_resolvable: true,
            });
        }
    });

    return conflicts;
}

/**
 * Detect class conflicts within a time slot
 */
function detectClassConflicts(assignments, conflictId, slotKey, dayId, periodId) {
    const conflicts = [];
    const classMap = new Map();

    assignments.forEach(assignment => {
        if (assignment.class_id) {
            if (!classMap.has(assignment.class_id)) {
                classMap.set(assignment.class_id, []);
            }
            classMap.get(assignment.class_id).push(assignment);
        }
    });

    classMap.forEach((classAssignments, classId) => {
        if (safeLength(classAssignments) > 1) {
            conflicts.push({
                id: `${conflictId}-class-${classId}-${slotKey}`,
                type: 'class',
                severity: 'medium',
                day_id: dayId,
                period_id: periodId,
                affected_classes: [classId],
                affected_courses: classAssignments.map(a => a.course_id),
                message: `Class has ${safeLength(classAssignments)} overlapping assignments`,
                auto_resolvable: false,
            });
        }
    });

    return conflicts;
}

/**
 * Check if a specific entry would cause conflicts
 * @param {Object} newEntry - The entry to check
 * @param {Array} existingEntries - Existing schedule entries
 * @returns {Array} Array of potential conflicts
 */
export function checkEntryConflicts(newEntry, existingEntries) {
    // Create a temporary schedule with the new entry
    const tempSchedules = [...existingEntries, newEntry];

    // Detect all conflicts
    const allConflicts = detectConflicts(tempSchedules);

    // Return only conflicts that involve the new entry
    return allConflicts.filter(
        conflict => conflict.day_id === newEntry.day_id && conflict.period_id === newEntry.period_id
    );
}

/**
 * Get conflicts for a specific slot
 * @param {Array} conflicts - All conflicts
 * @param {number|string} dayId - Day ID
 * @param {number|string} periodId - Period ID
 * @returns {Array} Conflicts for the specific slot
 */
export function getSlotConflicts(conflicts, dayId, periodId) {
    return conflicts.filter(conflict => conflict.day_id === dayId && conflict.period_id === periodId);
}

/**
 * Group conflicts by type
 * @param {Array} conflicts - Array of conflicts
 * @returns {Object} Conflicts grouped by type
 */
export function groupConflictsByType(conflicts) {
    return conflicts.reduce((groups, conflict) => {
        const type = conflict.type;
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(conflict);
        return groups;
    }, {});
}

/**
 * Get auto-resolvable conflicts
 * @param {Array} conflicts - Array of conflicts
 * @returns {Array} Auto-resolvable conflicts
 */
export function getAutoResolvableConflicts(conflicts) {
    return conflicts.filter(conflict => conflict.auto_resolvable);
}
