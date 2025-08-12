/**
 * Utility functions for the Schedule Table component
 */

/**
 * Calculate the position for the info box or modal
 * @param {Event} event - The click event
 * @param {Number} width - The width of the box
 * @param {Number} height - The height of the box
 * @returns {Object} Position object with top and left CSS values
 */
export const calculateBoxPosition = (event, width = 300, height = 200) => {
  if (!event || !event.target) return { top: '0px', left: '0px' };

  // Get the container and document dimensions
  const container = event.target.closest('.schedule-table-container');
  if (!container) return { top: '0px', left: '0px' };

  const cellRect = event.target.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  // Calculate position relative to container
  let relativeTop = cellRect.top - containerRect.top;
  let relativeLeft = cellRect.left - containerRect.left;

  // Initial position (to the right of the cell)
  let left = relativeLeft + cellRect.width + 10;
  let top = relativeTop;

  // Check if box would go outside viewport to the right
  if (cellRect.left + cellRect.width + width + 10 > viewportWidth) {
    // Try positioning to the left of the cell
    left = relativeLeft - width - 10;

    // If that would go outside viewport to the left, position below or above
    if (cellRect.left - width - 10 < 0) {
      left = relativeLeft;
      // Try below
      top = relativeTop + cellRect.height + 10;

      // If that would go outside viewport at bottom, position above
      if (cellRect.top + cellRect.height + height + 10 > viewportHeight) {
        top = relativeTop - height - 10;
        // If that would go outside viewport at top, position at top of container
        if (top < 0) top = 0;
      }
    }
  }

  // Ensure box stays within container bounds
  if (top < 0) top = 0;
  if (left < 0) left = 0;

  // Ensure box doesn't extend beyond container width
  if (left + width > containerRect.width) {
    left = Math.max(0, containerRect.width - width);
  }

  return { top: `${top}px`, left: `${left}px` };
};

/**
 * Find a teacher object by full name
 * @param {Array} teachers - Array of teacher objects
 * @param {String} name - Full name of the teacher
 * @returns {Object|null} Teacher object or null if not found
 */
export const getTeacherByName = (teachers, name) => {
  return teachers.find(t => `${t.first_name || ''} ${t.last_name || ''}`.trim() === name) || null;
};

/**
 * Find a class object by name
 * @param {Array} classes - Array of class objects
 * @param {String} name - Name of the class
 * @returns {Object|null} Class object or null if not found
 */
export const getClassByName = (classes, name) => {
  return classes.find(c => c.name === name) || null;
};

/**
 * Find a day object by name
 * @param {Array} days - Array of day objects
 * @param {String} name - Name of the day (name_de)
 * @returns {Object|null} Day object or null if not found
 */
export const getDayByName = (days, name) => {
  return days.find(d => d.name_de === name) || null;
};

/**
 * Find a period object by block number
 * @param {Array} periods - Array of period objects
 * @param {Number} blockNumber - Block number of the period
 * @returns {Object|null} Period object or null if not found
 */
export const getPeriodByNumber = (periods, blockNumber) => {
  return periods.find(p => Number(p.block_number) === Number(blockNumber)) || null;
};

/**
 * Find a lesson for a specific cell (supports both axes)
 * @param {Array} lessons - Array of lesson objects
 * @param {String} rowItem - Name of the teacher or class
 * @param {String} dayName - Name of the day
 * @param {Number} blockNumber - Block number of the period
 * @param {'teacher'|'class'} viewMode - Current axis mode
 * @returns {Object|null} Lesson object or null if not found
 */
export const getLessonForCell = (lessons, rowItem, dayName, blockNumber, viewMode = 'teacher') => {
  if (viewMode === 'class') {
    return lessons.find(
      l =>
        l.class_name === rowItem &&
        l.day_name_de === dayName &&
        l.block_number === blockNumber
    ) || null;
  } else {
    return lessons.find(
      l =>
        l.teacher_names?.includes(rowItem) &&
        l.day_name_de === dayName &&
        l.block_number === blockNumber
    ) || null;
  }
};

/**
 * Check if a lesson is team taught (has multiple teachers)
 * @param {Array} lessons - Array of lesson objects
 * @param {String} rowItem - Name of the teacher or class
 * @param {String} dayName - Name of the day
 * @param {Number} blockNumber - Block number of the period
 * @param {'teacher'|'class'} viewMode - Current axis mode
 * @returns {Boolean} True if the lesson is team taught
 */
export const isTeamTaught = (lessons, rowItem, dayName, blockNumber, viewMode = 'teacher') => {
  const lesson = getLessonForCell(lessons, rowItem, dayName, blockNumber, viewMode);
  return lesson && Array.isArray(lesson.teacher_names) && lesson.teacher_names.length >= 2;
};

/**
 * Generate an abbreviation for a teacher's name (e.g. "Josephine E" => "JEb").
 * @param {String} name - Full name of teacher
 * @returns {String} Abbreviation
 */
export const getTeacherAbbreviation = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length-1].slice(0,2)}`;
  }
  return name.slice(0, 3);
};

/**
 * Get abbreviations for an array of teacher names
 * @param {Array} names - Array of teacher full names
 * @returns {Array} Array of abbreviations
 */
export const getTeacherAbbreviations = (names = []) => {
  return names.map(getTeacherAbbreviation);
};