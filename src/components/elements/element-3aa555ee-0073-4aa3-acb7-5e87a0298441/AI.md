---
name: go-home-settings
description: A component for parents to configure how their child goes home from school, with support for daily variations and authorized pickup contacts.
keywords:
- school
- pickup
- dismissal
- contacts
- schedule
---

#### GoHomeSettings

***Purpose:***
Allows parents to configure how their child goes home from school, with options for consistent methods or day-by-day variations, and management of authorized pickup contacts.

***Features:***
- Multiple dismissal methods (goes alone, public transport, school bus, authorized pickup)
- Day-specific configuration when "varies daily" is selected
- Contact management with authorized pickup designation and primary contact selection
- Local contact addition with temporary IDs for later backend persistence
- Form validation with specific rules for authorized pickup scenarios
- LocalStorage persistence for work-in-progress configurations
- Read-only mode for viewing configurations

***Properties:***
- activeSemester: object - Current semester information displayed as read-only (shape: { id, label, startDate, endDate })
- schoolDays: string[] - List of school days to configure (default: ["Montag","Dienstag","Mittwoch","Donnerstag","Freitag"])
- contacts: array - List of available contacts for authorized pickup (shape: { id, first_name, last_name, relation, phone })
- mapping: object - Maps component field names to data field names (default: { id: "id", firstName: "first_name", lastName: "last_name", relation: "relation", phone: "phone" })
- methods: array - Available dismissal methods (shape: { id, label })
- initialValue: object - Initial configuration values (shape: { method, notes, authorizedIds, primaryContactId, byDay })
- readOnly: boolean - When true, all inputs are disabled
- ui: object - UI configuration options (shape: { compact, stickySubmit, allowAddContact, autosaveLocal, storageKey, emitDebounceMs })
- labels: object - Customizable text labels and error messages

***Events:***
- change: Triggered when any form value changes (debounced). Payload: complete form data object
- submit: Triggered when the form is submitted and passes validation. Payload: complete form data object

***Exposed Variables:***
- value: The current form data (path: variables['current_element_uid-value'])

***Notes:***
- When "varies_daily" is selected, each day requires its own dismissal method
- When "authorized_pickup" is used (globally or on any day), at least one authorized contact and a primary contact are required
- Locally added contacts are included in the emitted payload with IDs like "local-1234567890"
- The component does not handle time selection, only dismissal methods