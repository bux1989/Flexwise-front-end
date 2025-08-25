/**
 * Robust array normalizer for WeWeb collections and Vue reactive data
 * Handles all known WeWeb collection formats that cause "grid disappears" issues
 *
 * @param {*} input - The value that might be an array, proxy, or collection object
 * @returns {Array} - The normalized array or empty array as fallback
 */
export function toArray(input) {
    // Handle null/undefined early
    if (!input) return [];

    // Already an array - return as-is
    if (Array.isArray(input)) return input;

    // Vue ref/unref case - check for reactive refs with .value
    if (input?.value !== undefined) {
        if (Array.isArray(input.value)) return input.value;
        // Recursive call in case .value is also a wrapped object
        return toArray(input.value);
    }

    // Handle objects (including WeWeb collections and Maps)
    if (typeof input === 'object') {
        // Get all object keys
        const keys = Object.keys(input);

        // Check for numeric-key objects like {"0": {...}, "1": {...}}
        const numericKeys = keys.filter(k => /^\d+$/.test(k));
        if (numericKeys.length > 0) {
            return numericKeys
                .sort((a, b) => Number(a) - Number(b))
                .map(k => input[k])
                .filter(item => item !== null && item !== undefined);
        }

        // Check for Map-like objects with values() method
        if (typeof input.values === 'function') {
            try {
                return Array.from(input.values());
            } catch (e) {
                // Silent fallback if values() fails
            }
        }

        // Check for objects that might have array data in common properties
        const arrayPropNames = ['data', 'items', 'list', 'array', 'results', 'collection'];
        for (const prop of arrayPropNames) {
            if (input[prop] && Array.isArray(input[prop])) {
                return input[prop];
            }
        }

        // As last resort, if object has enumerable properties, convert to array of values
        // Only if the object looks like a collection (has multiple similar properties)
        const values = Object.values(input).filter(v => v !== null && v !== undefined);
        if (values.length > 0 && keys.length > 2) {
            // Check if values look uniform (all objects with similar structure)
            const firstVal = values[0];
            if (typeof firstVal === 'object' && firstVal !== null) {
                const hasUniformStructure = values.every(
                    v => typeof v === 'object' && v !== null && Object.keys(v).length > 0
                );
                if (hasUniformStructure) {
                    return values;
                }
            }
        }
    }

    return [];
}

/**
 * Safe length helper that works with arrays and array-like objects
 * @param {*} a - The value to get length from
 * @returns {number} - Length or 0
 */
export function len(a) {
    return Array.isArray(a) ? a.length : 0;
}

/**
 * Check if array/collection is non-empty
 * @param {*} a - The value to check
 * @returns {boolean} - True if non-empty
 */
export function nonEmpty(a) {
    return len(a) > 0;
}

/**
 * Normalize period data to unified shape, handling various WeWeb collection formats
 *
 * CRITICAL FIX: Preserves original database UUIDs as primary IDs to prevent assignment matching failures.
 * The root cause of "no schedules showing" was period ID mismatch between normalized periods (period-N)
 * and schedule assignments (database UUIDs).
 *
 * @param {*} periodsData - Raw periods data from WeWeb (array or numeric-key object)
 * @returns {Array} - Normalized periods array with canonical UUID IDs for proper assignment matching
 */
export function normalizePeriods(periodsData) {
    const periodsArray = toArray(periodsData);

    if (!nonEmpty(periodsArray)) {
        return [];
    }

    return periodsArray
        .map((period, index) => {
            // Normalize field names to unified shape
            const blockNumber = period.block_number || period.blocknumber || index + 1;

            // Build unified label - prefer label, fallback to name_de/name
            let label = period.label || period.name_de || period.name || `Period ${blockNumber}`;

            // Build time string from start_time/end_time if present, otherwise use existing time
            let time = period.time;
            if (period.start_time && period.end_time) {
                time = `${period.start_time} - ${period.end_time}`;
            } else if (period.start_time || period.end_time) {
                time = period.start_time || period.end_time;
            }

            // Determine if instructional based on various indicators
            let isInstructional = true;
            if (period.block_type) {
                const nonInstructionalTypes = [
                    'break',
                    'pause',
                    'lunch',
                    'recess',
                    'assembly',
                    'flexband',
                    'frühdienst',
                    'hofpause',
                    'before_school',
                ];
                isInstructional = !nonInstructionalTypes.includes(period.block_type.toLowerCase());
            } else if (period.attendance_requirement === 'optional') {
                isInstructional = false;
            } else if (label && typeof label === 'string') {
                const labelLower = label.toLowerCase();
                const nonInstructionalKeywords = ['break', 'pause', 'lunch', 'flexband', 'frühdienst', 'hofpause'];
                isInstructional = !nonInstructionalKeywords.some(keyword => labelLower.includes(keyword));
            }

            // CRITICAL: Use original database UUID as primary ID for assignment matching
            // Fallback to generated ID only if no original ID exists
            const canonicalId = period.id || `period-${blockNumber}`;

            return {
                // Preserve original data
                ...period,
                // Use canonical UUID ID for proper assignment matching
                id: canonicalId, // PRIMARY: Use database UUID so assignments can match
                blockNumber: Number(blockNumber), // Separate display field (not part of ID)
                label: label,
                name: label, // Alias for compatibility
                time: time || `${blockNumber}. Period`,
                is_instructional: period.is_instructional !== undefined ? period.is_instructional : isInstructional,
                type: period.block_type || period.type || (isInstructional ? 'lesson' : 'break'),
                // Keep block_number for backward compatibility but prefer blockNumber
                block_number: Number(blockNumber),
            };
        })
        .sort((a, b) => a.blockNumber - b.blockNumber);
}

/**
 * Legacy unwrapArray function for backward compatibility
 * Now uses the enhanced toArray function internally
 *
 * @param {*} possibleArray - The value that might be an array or wrapped array
 * @returns {Array} - The unwrapped array or empty array as fallback
 */
export function unwrapArray(possibleArray) {
    // Handle null/undefined
    if (!possibleArray) {
        return [];
    }

    // Use the enhanced toArray function first
    const arrayResult = toArray(possibleArray);
    if (nonEmpty(arrayResult)) {
        return arrayResult;
    }

    // Handle array-like objects (has length and forEach)
    if (
        possibleArray &&
        typeof possibleArray === 'object' &&
        typeof possibleArray.length === 'number' &&
        typeof possibleArray.forEach === 'function'
    ) {
        return Array.from(possibleArray);
    }

    // Handle objects with array properties (search common property names)
    if (possibleArray && typeof possibleArray === 'object') {
        // Check for common array property names
        const arrayKeys = ['data', 'items', 'list', 'array', 'results'];
        for (const key of arrayKeys) {
            if (Array.isArray(possibleArray[key])) {
                return possibleArray[key];
            }
        }

        // Search all properties for arrays
        for (const key in possibleArray) {
            if (Array.isArray(possibleArray[key])) {
                return possibleArray[key];
            }
        }
    }

    // Fallback to empty array
    return [];
}

/**
 * Enhanced validation that logs useful debugging information
 * Now uses the improved toArray function for better WeWeb compatibility
 * @param {*} data - The data to validate
 * @param {string} propName - Name of the prop for logging
 * @returns {Array} - The validated array
 */
export function validateAndUnwrapArray(data, propName = 'unknown') {
    // Try enhanced toArray first for WeWeb collections
    const result = toArray(data);

    // Fall back to legacy unwrapArray if needed
    if (!nonEmpty(result)) {
        const legacyResult = unwrapArray(data);
        if (nonEmpty(legacyResult)) {
            return legacyResult;
        }
    }

    if (!nonEmpty(result) && data) {
        const keys = data && typeof data === 'object' ? Object.keys(data) : null;
        const numericKeys = keys ? keys.filter(k => /^\d+$/.test(k)) : [];

        // Only log warnings if this appears to be a real data structure issue
        // Skip logging for empty collections during normal operation
        if (keys && keys.length > 0) {
            console.warn(`[${propName}] Could not extract array from collection with ${keys.length} keys`);
        }
    }

    return nonEmpty(result) ? result : [];
}

/**
 * Safe length helper - returns 0 for non-arrays or undefined values
 * Enhanced to handle WeWeb numeric-key objects
 * @param {*} value - The value to get length from
 * @returns {number} - Length or 0
 */
export function safeLength(value) {
    // Use the enhanced len function for consistency
    return len(value) || (value && typeof value === 'object' && typeof value.length === 'number' ? value.length : 0);
}

/**
 * Safe array helper - ensures value is always an array
 * Enhanced to use toArray for better WeWeb compatibility
 * @param {*} value - The value to convert to safe array
 * @returns {Array} - The safe array or empty array
 */
export function safeArray(value) {
    const result = toArray(value);
    if (nonEmpty(result)) {
        return result;
    }

    // Legacy fallback
    if (Array.isArray(value)) {
        return value;
    }
    if (Array.isArray(value?.value)) {
        return value.value;
    }
    if (value && typeof value === 'object' && typeof value.length === 'number' && typeof value.forEach === 'function') {
        return Array.from(value);
    }
    return [];
}

/**
 * Parse and normalize possible_time_slots from courses
 * CRITICAL FIX: Handle dayId vs dayNumber confusion
 *
 * Tokens like "2|5e4753c0-..." have dayId=2 (backend ID), not dayNumber=2 (UI display order)
 * This was causing courses to appear available on wrong days.
 *
 * @param {Array} slots - Raw possible_time_slots array
 * @returns {Array} - Normalized slots as [{ dayId, periodId }]
 */
export function normalizePossibleSlots(slots) {
    return toArray(slots)
        .map(s => {
            if (typeof s === 'string' && s.includes('|')) {
                const [dayIdRaw, periodId] = s.split('|');
                return {
                    dayId: Number(dayIdRaw), // canonical backend dayId
                    periodId: String(periodId), // canonical period UUID
                };
            } else if (typeof s === 'object' && s !== null) {
                return {
                    dayId: Number(s.day_id ?? s.dayId),
                    periodId: String(s.period_id ?? s.periodId),
                };
            }
            // Handle any other formats by returning invalid slot that won't match
            return { dayId: -1, periodId: '' };
        })
        .filter(slot => slot.dayId > 0 && slot.periodId);
}

/**
 * Normalize course data with proper possible_time_slots parsing
 * CRITICAL FIX: Use canonical dayId + periodId for all availability logic
 *
 * @param {Object} course - Raw course data
 * @param {number} idx - Index for fallback ID generation
 * @returns {Object} - Normalized course
 */
export function normalizeCourse(course, idx) {
    return {
        // Basic course info
        id: course.id ?? course.course_id ?? course.uuid ?? `course-fallback-${idx}`,
        name: course.name ?? course.title ?? course.course_name ?? '',
        code: course.code ?? course.short_code ?? course.course_code ?? '',
        capacity: course.capacity ?? course.max ?? course.max_students ?? null,
        subject: course.subject ?? course.subject_name ?? '',

        // Normalize year groups
        yearGroups: toArray(course.year_groups ?? course.yearGroups ?? course.is_for_year_groups ?? []),

        // CRITICAL: Parse possible_time_slots using dayId (not dayNumber)
        possibleSlots: normalizePossibleSlots(course.possible_time_slots ?? course.possibleSlots ?? []),

        // Keep original for backward compatibility if needed
        possible_time_slots: course.possible_time_slots,

        // Other fields
        ...course,
    };
}
