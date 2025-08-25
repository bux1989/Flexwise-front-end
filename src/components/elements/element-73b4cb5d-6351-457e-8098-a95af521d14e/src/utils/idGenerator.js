// src/utils/idGenerator.js
// Utility functions for generating unique IDs for draft assignments

/**
 * Generate a unique draft ID for new course assignments
 * @returns {string} - Unique draft ID
 */
export function generateUniqueDraftId() {
    // Use timestamp + random suffix to ensure uniqueness
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `draft-${timestamp}-${randomSuffix}`;
}

/**
 * Generate a unique assignment ID
 * @returns {string} - Unique assignment ID
 */
export function generateUniqueAssignmentId() {
    // Use timestamp + random suffix to ensure uniqueness
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `assignment-${timestamp}-${randomSuffix}`;
}

/**
 * Generate a simple unique ID with custom prefix
 * @param {string} prefix - ID prefix (default: 'id')
 * @returns {string} - Unique ID
 */
export function generateUniqueId(prefix = 'id') {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${prefix}-${timestamp}-${randomSuffix}`;
}
