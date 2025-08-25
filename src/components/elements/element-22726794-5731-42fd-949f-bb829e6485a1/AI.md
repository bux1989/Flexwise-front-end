---
name: wish-ranker-by-day
description: A component for ranking course wishes per day with automatic rank shifting and multiple UI customization options.
keywords:

- course selection

- wish ranking

- priority selection

- school courses

- after-school
---

#

### wish-ranker-by-day

***Purpose:***
Allows parents to rank up to N wishes per day for after-school courses, with automatic rank shifting and a user-friendly interface.

***Features:***

- Configurable number of ranks per day (default: 3)

- Auto-shifting ranks when a new selection is made

- Quick-add functionality for faster selection

- Per-day summary chips showing current selections

- Day tabs for easy navigation

- Keyboard navigation and accessibility support

- Local storage persistence

- Customizable labels and theming

***Properties:***

- modules: Array - Course modules to display. Each item requires window_id, day, title fields.

- daysOrder: Array - Optional explicit order of days (e.g., ["Montag", "Dienstag", ...])

- mapping: Object - Field name mapping for modules data (idField, dayField, titleField, metaField)

- initialSelection: Object/Array - Pre-fill current choices in either flat or byDay format

- period: Object - Controls if the form is editable based on registration period status

- readOnly: Boolean - Hard override to disable all inputs

- ui: Object - UI configuration options (ranksPerDay, showQuickAdd, showSelect, etc.)

- labels: Object - Customizable text labels throughout the component

- theme: Object - Visual customization options (colors, font size)

- storage: Object - Storage configuration (localStorage, debounce settings)

***Events:***

- change: Triggered when selections change. Payload: { byDay, flat, json }

- submit: Triggered when submit button is clicked. Payload: { byDay, flat, json }

***Exposed Actions:***

- `setRank`: Set a specific rank for a course. Args: day (string), windowId (string), rank (number|null)

- `resetDay`: Clear all selections for a day. Args: day (string)

- `clearAll`: Clear all selections across all days

- `importSelection`: Import selections from external data. Args: selection (object)

- `scrollToDay`: Scroll to a specific day section. Args: day (string)

- `submit`: Trigger the submit action

***Exposed Variables:***

- value: Object containing the current selections in multiple formats:

  - value.byDay: Record<day, string[]> - Day-keyed object with arrays of window_ids

  - value.flat: Array<{window_id, day, rank}> - Flat array format of selections

  - value.json: String - JSON stringified version of the flat format

***Notes:***

- The component enforces one course per rank per day

- A course can only appear once per day

- Selections are limited to the configured ranksPerDay value

- When autosaveLocal is enabled, selections are persisted to localStorage

- Keyboard shortcuts: 1/2/3 to set rank, Backspace/Delete/0 to clear, Enter/Space for quick-add
