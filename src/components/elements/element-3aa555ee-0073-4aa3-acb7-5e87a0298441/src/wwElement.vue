<template>
    <div class="go-home-settings">
        <!-- Semester Badge (Read-only) -->
        <div class="semester-badge" v-if="activeSemester">
            <span>Sie konfigurieren für: {{ activeSemester.label }} ({{ activeSemester.startDate }} – {{ activeSemester.endDate }})</span>
        </div>

        <!-- Global Settings -->
        <div class="settings-section">
            <div class="form-group">
                <label :for="`${uid}-method`">{{ labels.method }}</label>
                <select 
                    :id="`${uid}-method`" 
                    v-model="formData.method" 
                    :disabled="readOnly"
                    class="form-control"
                    @change="validateForm"
                >
                    <option value="none">{{ labels.selectValue }}</option>
                    <option 
                        v-for="method in methods" 
                        :key="method.id" 
                        :value="method.id"
                    >
                        {{ method.label }}
                    </option>
                </select>
                <div class="error-message" v-if="errors.method">{{ errors.method }}</div>
            </div>

            <div class="form-group" v-if="formData.method && formData.method !== 'none'">
                <label :for="`${uid}-notes`">{{ labels.notes }}</label>
                <textarea 
                    :id="`${uid}-notes`" 
                    v-model="formData.notes" 
                    :placeholder="labels.notesPlaceholder"
                    :disabled="readOnly"
                    class="form-control"
                ></textarea>
            </div>
        </div>

        <!-- Per-Day Settings (when varies_daily is selected) -->
        <div class="daily-settings" v-if="formData.method === 'varies_daily'">
            <div class="days-grid">
                <div 
                    v-for="day in schoolDays" 
                    :key="day" 
                    class="day-card"
                >
                    <h3>{{ day }}</h3>
                    <div class="form-group">
                        <label :for="`${uid}-${day}-method`">{{ labels.method }}</label>
                        <select 
                            :id="`${uid}-${day}-method`" 
                            v-model="dayMethods[day]" 
                            :disabled="readOnly"
                            class="form-control"
                            @change="validateForm"
                        >
                            <option value="none">{{ labels.selectValue }}</option>
                            <option 
                                v-for="method in methodsWithoutVariesDaily" 
                                :key="method.id" 
                                :value="method.id"
                            >
                                {{ method.label }}
                            </option>
                        </select>
                        <div class="error-message" v-if="dayErrors[day]?.method">{{ dayErrors[day].method }}</div>
                    </div>

                    <div class="form-group" v-if="dayMethods[day] && dayMethods[day] !== 'none'">
                        <label :for="`${uid}-${day}-notes`">{{ labels.notes }}</label>
                        <textarea 
                            :id="`${uid}-${day}-notes`" 
                            v-model="dayNotes[day]" 
                            :placeholder="labels.dayNotesPlaceholder"
                            :disabled="readOnly"
                            class="form-control"
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contacts Section (only if authorized pickup is relevant) -->
        <div class="contacts-section" v-if="shouldShowAuthorizedSection">
            <h3>{{ labels.authorized }}</h3>
            
            <!-- Existing Contacts -->
            <div class="contacts-list">
                <div 
                    v-for="contact in mappedContacts" 
                    :key="contact.id" 
                    class="contact-item"
                >
                    <div class="contact-info">
                        <div class="contact-name">{{ contact.firstName }} {{ contact.lastName }}</div>
                        <div class="contact-details">
                            <span v-if="contact.phone">{{ contact.phone }}</span>
                            <span v-if="contact.relation">{{ contact.relation }}</span>
                        </div>
                    </div>
                    <div class="contact-controls">
                        <div class="form-check">
                            <input 
                                type="checkbox" 
                                :id="`${uid}-auth-${contact.id}`" 
                                :checked="isAuthorized(contact.id)"
                                @change="toggleAuthorized(contact.id)"
                                :disabled="readOnly"
                                class="form-check-input"
                            >
                            <label :for="`${uid}-auth-${contact.id}`" class="form-check-label">{{ labels.authorized }}</label>
                        </div>
                        <div class="form-check" v-if="isAuthorized(contact.id)">
                            <input 
                                type="radio" 
                                :id="`${uid}-primary-${contact.id}`" 
                                :checked="isPrimary(contact.id)"
                                @change="setPrimary(contact.id)"
                                :disabled="readOnly"
                                name="primaryContact"
                                class="form-check-input"
                            >
                            <label :for="`${uid}-primary-${contact.id}`" class="form-check-label">{{ labels.setPrimary }}</label>
                        </div>
                    </div>
                </div>
            </div>

            <div class="error-message" v-if="errors.authorized">{{ errors.authorized }}</div>
            <div class="error-message" v-if="errors.primary">{{ errors.primary }}</div>

            <!-- Trigger to show add-contact form -->
            <div class="add-contact-trigger" v-if="ui.allowAddContact && !readOnly && !addMode">
                <button class="btn btn-secondary" @click="openAdd">
                    {{ labels.addContactButton }}
                </button>
            </div>

            <!-- Add New Contact (shown only when user clicks the button) -->
            <div class="add-contact" v-if="ui.allowAddContact && !readOnly && addMode">
                <h4>{{ labels.add }}</h4>
                <div class="add-contact-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label :for="`${uid}-new-firstname`">{{ labels.firstName }}</label>
                            <input 
                                type="text" 
                                :id="`${uid}-new-firstname`" 
                                v-model="newContact.firstName"
                                class="form-control"
                            >
                        </div>
                        <div class="form-group">
                            <label :for="`${uid}-new-lastname`">{{ labels.lastName }}</label>
                            <input 
                                type="text" 
                                :id="`${uid}-new-lastname`" 
                                v-model="newContact.lastName"
                                class="form-control"
                            >
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label :for="`${uid}-new-phone`">{{ labels.phone }}</label>
                            <input 
                                type="text" 
                                :id="`${uid}-new-phone`" 
                                v-model="newContact.phone"
                                class="form-control"
                            >
                        </div>
                        <div class="form-group">
                            <label :for="`${uid}-new-relation`">{{ labels.relation }}</label>
                            <input 
                                type="text" 
                                :id="`${uid}-new-relation`" 
                                v-model="newContact.relation"
                                class="form-control"
                            >
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-check">
                            <input 
                                type="checkbox" 
                                :id="`${uid}-new-authorized`" 
                                v-model="newContact.authorized"
                                class="form-check-input"
                            >
                            <label :for="`${uid}-new-authorized`" class="form-check-label">{{ labels.authorized }}</label>
                        </div>
                        <div class="actions">
                            <button 
                                class="btn btn-secondary" 
                                @click="addContact"
                                :disabled="!canAddContact"
                            >
                                {{ labels.add }}
                            </button>
                            <button 
                                class="btn"
                                @click="cancelAdd"
                            >
                                {{ labels.cancel }}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="error-message" v-if="errors.newContact">{{ errors.newContact }}</div>
            </div>
        </div>

        <!-- Submit Button -->
        <div class="submit-section" :class="{ 'sticky': ui.stickySubmit }">
            <button 
                class="btn btn-primary" 
                @click="handleSubmit"
                :disabled="readOnly"
            >
                {{ labels.submit }}
            </button>
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { debounce } from 'lodash';

export default {
    props: {
        uid: { type: String, required: true },
        content: { type: Object, required: true },
    },
    emits: ['trigger-event'],
    setup(props, { emit }) {
        // Editor state
        const isEditing = computed(() => {
            // eslint-disable-next-line no-unreachable
            return false;
        });

        // Get props with defaults
        const activeSemester = computed(() => props.content?.activeSemester);
        const schoolDays = computed(() => props.content?.schoolDays || ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"]);
        const contacts = computed(() => props.content?.contacts || []);
        const mapping = computed(() => props.content?.mapping || { 
            id: "id", 
            firstName: "first_name", 
            lastName: "last_name", 
            relation: "relation", 
            phone: "phone" 
        });
        const methods = computed(() => props.content?.methods || [
            { id: "goes_alone", label: "Allein nach Hause" },
            { id: "public_transport", label: "Öffentliche Verkehrsmittel" },
            { id: "school_bus", label: "Schulbus / Shuttle" },
            { id: "authorized_pickup", label: "Abholung durch berechtigte Person" },
            { id: "varies_daily", label: "Tägliche Auswahl (unterschiedlich)" }
        ]);
        const methodsWithoutVariesDaily = computed(() => methods.value.filter(m => m.id !== 'varies_daily'));
        const initialValue = computed(() => props.content?.initialValue || { 
            method: "none", 
            notes: "", 
            authorizedIds: [], 
            primaryContactId: null, 
            byDay: null 
        });
        const readOnly = computed(() => props.content?.readOnly || false);
        const ui = computed(() => props.content?.ui || { 
            compact: true, 
            stickySubmit: true, 
            allowAddContact: true, 
            autosaveLocal: true, 
            storageKey: "go-home-settings", 
            emitDebounceMs: 250 
        });
        const labels = computed(() => ({
            heading: props.content?.labels?.heading ?? "Abholinfo",
            method: props.content?.labels?.method ?? "Heimwegart",
            selectValue: props.content?.labels?.selectValue ?? "Wert auswählen",
            notes: props.content?.labels?.notes ?? "Notizen",
            notesPlaceholder: props.content?.labels?.notesPlaceholder ?? "Notizen",
            dayNotesPlaceholder: props.content?.labels?.dayNotesPlaceholder ?? "Notizen",
            authorized: props.content?.labels?.authorized ?? "Abholberechtigt",
            setPrimary: props.content?.labels?.setPrimary ?? "Primär",
            primaryLabel: props.content?.labels?.primaryLabel ?? "Primärabholer",
            firstName: props.content?.labels?.firstName ?? "Vorname",
            lastName: props.content?.labels?.lastName ?? "Nachname",
            phone: props.content?.labels?.phone ?? "Fonnummer",
            relation: props.content?.labels?.relation ?? "Beziehung zum Kind",
            add: props.content?.labels?.add ?? "Hinzufügen",
            addContactButton: props.content?.labels?.addContactButton ?? "Kontakt hinzufügen",
            cancel: props.content?.labels?.cancel ?? "Abbrechen",
            submit: props.content?.labels?.submit ?? "Speichern",
            errSelectMethod: props.content?.labels?.errSelectMethod ?? "Bitte wählen Sie eine Heimwegart.",
            errSelectAllDays: props.content?.labels?.errSelectAllDays ?? "Bitte wählen Sie für jeden Schultag eine Heimwegart.",
            errAuthorizedRequired: props.content?.labels?.errAuthorizedRequired ?? "Bitte wählen Sie mindestens eine abholberechtigte Person aus.",
            errPrimaryRequired: props.content?.labels?.errPrimaryRequired ?? "Bitte wählen Sie einen Primärabholer.",
            errNewContactRequired: props.content?.labels?.errNewContactRequired ?? "Bitte füllen Sie Vorname und Nachname aus."
        }));

        // Form data
        const formData = ref({
            method: initialValue.value.method || 'none',
            notes: initialValue.value.notes || '',
            authorizedIds: [...(initialValue.value.authorizedIds || [])],
            primaryContactId: initialValue.value.primaryContactId || null,
            byDay: initialValue.value.byDay || null,
            contacts: [] // For locally added contacts
        });

        // Day-specific data
        const dayMethods = ref({});
        const dayNotes = ref({});

        // Initialize day-specific data from initialValue
        if (initialValue.value.byDay) {
            schoolDays.value.forEach(day => {
                const dayData = initialValue.value.byDay[day];
                if (dayData) {
                    dayMethods.value[day] = dayData.method || 'none';
                    dayNotes.value[day] = dayData.notes || '';
                } else {
                    dayMethods.value[day] = 'none';
                    dayNotes.value[day] = '';
                }
            });
        } else {
            schoolDays.value.forEach(day => {
                dayMethods.value[day] = 'none';
                dayNotes.value[day] = '';
            });
        }

        // New contact form + show/hide state
        const addMode = ref(false);
        const newContact = ref({
            firstName: '',
            lastName: '',
            phone: '',
            relation: '',
            authorized: false
        });

        const openAdd = () => {
            addMode.value = true;
            // keep whatever the user may have typed previously
        };
        const resetNewContact = () => {
            newContact.value = { firstName: '', lastName: '', phone: '', relation: '', authorized: false };
        };
        const cancelAdd = () => {
            resetNewContact();
            addMode.value = false;
            errors.value.newContact = null;
        };

        // Validation errors
        const errors = ref({
            method: null,
            authorized: null,
            primary: null,
            newContact: null
        });
        const dayErrors = ref({});

        // Initialize day errors
        schoolDays.value.forEach(day => {
            dayErrors.value[day] = { method: null };
        });

        // Map contacts using the mapping prop
        const mappedContacts = computed(() => {
            const result = [];
            
            // Map existing contacts
            contacts.value.forEach(contact => {
                result.push({
                    id: contact[mapping.value.id],
                    firstName: contact[mapping.value.firstName],
                    lastName: contact[mapping.value.lastName],
                    relation: contact[mapping.value.relation],
                    phone: contact[mapping.value.phone]
                });
            });
            
            // Add locally created contacts
            formData.value.contacts.forEach(contact => {
                result.push(contact);
            });
            
            return result;
        });

        // Show contacts section only when authorized pickup is relevant
        const shouldShowAuthorizedSection = computed(() => {
            if (formData.value.method === 'authorized_pickup') return true;
            if (formData.value.method === 'varies_daily') {
                return Object.values(dayMethods.value || {}).some(v => v === 'authorized_pickup');
            }
            return false;
        });

        // Component variable for external access
        const { value, setValue } = wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'value',
            type: 'object',
            defaultValue: computed(() => getPayload()),
        });

        // Helpers
        const isAuthorized = (contactId) => formData.value.authorizedIds.includes(contactId);
        const isPrimary = (contactId) => formData.value.primaryContactId === contactId;

        const toggleAuthorized = (contactId) => {
            if (isAuthorized(contactId)) {
                formData.value.authorizedIds = formData.value.authorizedIds.filter(id => id !== contactId);
                if (formData.value.primaryContactId === contactId) {
                    formData.value.primaryContactId = null;
                }
            } else {
                formData.value.authorizedIds.push(contactId);
            }
            validateForm();
            emitChange();
        };

        const setPrimary = (contactId) => {
            if (!isAuthorized(contactId)) {
                formData.value.authorizedIds.push(contactId);
            }
            formData.value.primaryContactId = contactId;
            validateForm();
            emitChange();
        };

        const canAddContact = computed(() => newContact.value.firstName.trim() && newContact.value.lastName.trim());

        const addContact = () => {
            if (!canAddContact.value) {
                errors.value.newContact = labels.value.errNewContactRequired;
                return;
            }
            errors.value.newContact = null;
            
            // Create a new contact with local ID
            const localId = `local-${Date.now()}`;
            const contact = {
                id: localId,
                firstName: newContact.value.firstName.trim(),
                lastName: newContact.value.lastName.trim(),
                phone: newContact.value.phone.trim(),
                relation: newContact.value.relation.trim()
            };
            
            // Add to local contacts
            formData.value.contacts.push(contact);
            
            // If authorized is checked, add to authorized IDs
            if (newContact.value.authorized) {
                formData.value.authorizedIds.push(localId);
            }
            
            // Reset and hide the form
            resetNewContact();
            addMode.value = false;

            validateForm();
            emitChange();
        };

        // Validation
        const validateForm = () => {
            // Reset errors
            errors.value = {
                method: null,
                authorized: null,
                primary: null,
                newContact: null
            };
            
            schoolDays.value.forEach(day => {
                dayErrors.value[day] = { method: null };
            });
            
            // Validate global method
            if (formData.value.method === 'none') {
                errors.value.method = labels.value.errSelectMethod;
            }
            
            // Validate day methods if varies_daily is selected
            if (formData.value.method === 'varies_daily') {
                let allDaysValid = true;
                
                schoolDays.value.forEach(day => {
                    if (dayMethods.value[day] === 'none') {
                        dayErrors.value[day].method = labels.value.errSelectMethod;
                        allDaysValid = false;
                    }
                });
                
                if (!allDaysValid) {
                    errors.value.method = labels.value.errSelectAllDays;
                }
            }
            
            // Check if authorized pickup is used
            const needsAuthorized = formData.value.method === 'authorized_pickup' || 
                (formData.value.method === 'varies_daily' && 
                 Object.values(dayMethods.value).some(method => method === 'authorized_pickup'));
            
            // Validate authorized contacts if needed
            if (needsAuthorized) {
                if (!formData.value.authorizedIds.length) {
                    errors.value.authorized = labels.value.errAuthorizedRequired;
                }
                
                if (!formData.value.primaryContactId) {
                    errors.value.primary = labels.value.errPrimaryRequired;
                }
            }
            
            return !Object.values(errors.value).some(error => error) && 
                   !Object.values(dayErrors.value).some(dayError => dayError.method);
        };

        // Get the complete payload
        const getPayload = () => {
            // Build byDay data if varies_daily is selected
            let byDay = null;
            
            if (formData.value.method === 'varies_daily') {
                byDay = {};
                schoolDays.value.forEach(day => {
                    byDay[day] = {
                        method: dayMethods.value[day],
                        notes: dayNotes.value[day] || ''
                    };
                });
            }
            
            // Map local contacts back to the original format
            const mappedLocalContacts = formData.value.contacts.map(contact => {
                const originalFormat = {};
                originalFormat[mapping.value.id] = contact.id;
                originalFormat[mapping.value.firstName] = contact.firstName;
                originalFormat[mapping.value.lastName] = contact.lastName;
                originalFormat[mapping.value.relation] = contact.relation;
                originalFormat[mapping.value.phone] = contact.phone;
                return originalFormat;
            });
            
            return {
                method: formData.value.method,
                notes: formData.value.notes,
                authorizedIds: formData.value.authorizedIds,
                primaryContactId: formData.value.primaryContactId,
                byDay,
                contacts: mappedLocalContacts
            };
        };

        // Emit change event (debounced)
        const emitChange = debounce(() => {
            const payload = getPayload();
            setValue(payload);
            
            if (!isEditing.value) {
                emit('trigger-event', {
                    name: 'change',
                    event: { value: payload }
                });
                
                // Save to localStorage if enabled
                if (ui.value.autosaveLocal) {
                    localStorage.setItem(ui.value.storageKey, JSON.stringify(payload));
                }
            }
        }, ui.value.emitDebounceMs);

        // Handle form submission
        const handleSubmit = () => {
            if (validateForm()) {
                const payload = getPayload();
                
                if (!isEditing.value) {
                    emit('trigger-event', {
                        name: 'submit',
                        event: { value: payload }
                    });
                }
            }
        };

        // Watch for changes in method to reset byDay when not varies_daily
        watch(() => formData.value.method, (newMethod) => {
            if (newMethod !== 'varies_daily') {
                formData.value.byDay = null;
            } else if (!formData.value.byDay) {
                // Initialize byDay if switching to varies_daily
                formData.value.byDay = {};
                schoolDays.value.forEach(day => {
                    formData.value.byDay[day] = {
                        method: dayMethods.value[day],
                        notes: dayNotes.value[day] || ''
                    };
                });
            }
            validateForm();
            emitChange();
        });

        // Watch for changes in day methods and notes
        watch(dayMethods, () => {
            validateForm();
            emitChange();
        }, { deep: true });

        watch(dayNotes, () => {
            emitChange();
        }, { deep: true });

        // Watch for changes in form data
        watch(() => [formData.value.notes], () => {
            emitChange();
        });

        // Load from localStorage on mount
        onMounted(() => {
            if (!isEditing.value && ui.value.autosaveLocal) {
                try {
                    const savedData = localStorage.getItem(ui.value.storageKey);
                    if (savedData) {
                        const parsed = JSON.parse(savedData);
                        
                        // Update form data
                        formData.value.method = parsed.method || 'none';
                        formData.value.notes = parsed.notes || '';
                        formData.value.authorizedIds = parsed.authorizedIds || [];
                        formData.value.primaryContactId = parsed.primaryContactId || null;
                        
                        // Update day-specific data if varies_daily
                        if (parsed.method === 'varies_daily' && parsed.byDay) {
                            schoolDays.value.forEach(day => {
                                const dayData = parsed.byDay[day];
                                if (dayData) {
                                    dayMethods.value[day] = dayData.method || 'none';
                                    dayNotes.value[day] = dayData.notes || '';
                                }
                            });
                        }
                        
                        // Add any local contacts
                        if (parsed.contacts && Array.isArray(parsed.contacts)) {
                            const localContacts = parsed.contacts.filter(c => 
                                c[mapping.value.id] && c[mapping.value.id].toString().startsWith('local-')
                            ).map(c => ({
                                id: c[mapping.value.id],
                                firstName: c[mapping.value.firstName],
                                lastName: c[mapping.value.lastName],
                                relation: c[mapping.value.relation],
                                phone: c[mapping.value.phone]
                            }));
                            
                            formData.value.contacts = localContacts;
                        }
                        
                        validateForm();
                    }
                } catch (error) {
                    console.error('Error loading saved data:', error);
                }
            }
        });

        return {
            // Props and computed
            activeSemester,
            schoolDays,
            methods,
            methodsWithoutVariesDaily,
            readOnly,
            ui,
            labels,
            mappedContacts,
            shouldShowAuthorizedSection,
            
            // Form data
            formData,
            dayMethods,
            dayNotes,
            newContact,
            addMode,
            errors,
            dayErrors,
            
            // Methods
            isAuthorized,
            isPrimary,
            toggleAuthorized,
            setPrimary,
            canAddContact,
            addContact,
            openAdd,
            cancelAdd,
            validateForm,
            handleSubmit,
            
            // Component variable
            value
        };
    }
};
</script>

<style lang="scss" scoped>
.go-home-settings {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #333;
    max-width: 100%;
    
    .semester-badge {
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 8px 12px;
        margin-bottom: 16px;
        font-size: 14px;
        color: #495057;
    }
    
    .settings-section,
    .daily-settings,
    .contacts-section {
        margin-bottom: 24px;
    }
    
    h3 {
        font-size: 18px;
        margin-bottom: 12px;
        font-weight: 500;
    }
    
    h4 {
        font-size: 16px;
        margin-bottom: 10px;
        font-weight: 500;
    }
    
    .form-group {
        margin-bottom: 16px;
        
        label {
            display: block;
            margin-bottom: 6px;
            font-size: 14px;
            font-weight: 500;
        }
    }
    
    .form-control {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ced4da;
        border-radius: 6px;
        font-size: 14px;
        transition: border-color 0.15s ease-in-out;
        
        &:focus {
            border-color: #80bdff;
            outline: 0;
            box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }
    }
    
    textarea.form-control {
        resize: vertical;
        min-height: 38px;
    }
    
    .days-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
        
        @media (max-width: 1200px) {
            grid-template-columns: repeat(3, 1fr);
        }
        
        @media (max-width: 992px) {
            grid-template-columns: repeat(2, 1fr);
        }
        
        @media (max-width: 576px) {
            grid-template-columns: 1fr;
        }
    }
    
    .day-card {
        background-color: #fff;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 16px;
        
        h3 {
            margin-top: 0;
            margin-bottom: 12px;
            font-size: 16px;
        }
    }
    
    .contacts-list {
        margin-bottom: 16px;
    }
    
    .contact-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        margin-bottom: 8px;
        background-color: #fff;
    }
    
    .contact-info {
        flex: 1;
    }
    
    .contact-name {
        font-weight: 500;
        margin-bottom: 4px;
    }
    
    .contact-details {
        font-size: 13px;
        color: #6c757d;
        
        span {
            margin-right: 8px;
            
            &:last-child {
                margin-right: 0;
            }
        }
    }
    
    .contact-controls {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
    }
    
    .form-check {
        display: flex;
        align-items: center;
        margin-bottom: 6px;
        
        &:last-child {
            margin-bottom: 0;
        }
        
        input {
            margin-right: 6px;
        }
        
        label {
            margin-bottom: 0;
            font-size: 13px;
        }
    }

    .add-contact-trigger {
        margin-top: 12px;
    }
    
    .add-contact {
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 16px;
        margin-top: 12px;
    }
    
    .add-contact-form {
        .form-row {
            display: flex;
            flex-wrap: wrap;
            margin-right: -8px;
            margin-left: -8px;
            margin-bottom: 12px;
            
            &:last-child {
                margin-bottom: 0;
                align-items: center;
                justify-content: space-between;
            }
            
            .form-group {
                flex: 1 0 calc(50% - 16px);
                margin: 0 8px;
                
                @media (max-width: 576px) {
                    flex: 1 0 calc(100% - 16px);
                    margin-bottom: 12px;
                }
            }
            
            .form-check {
                margin-left: 8px;
                margin-right: auto;
            }
            
            .actions {
                display: flex;
                gap: 8px;
            }
        }
    }
    
    .error-message {
        color: #dc3545;
        font-size: 13px;
        margin-top: 4px;
    }
    
    .btn {
        display: inline-block;
        font-weight: 400;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        user-select: none;
        border: 1px solid transparent;
        padding: 8px 16px;
        font-size: 14px;
        line-height: 1.5;
        border-radius: 6px;
        transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
        cursor: pointer;

        &:disabled {
            opacity: 0.65;
            cursor: not-allowed;
        }
    }
    
    .btn-primary {
        color: #fff;
        background-color: #007bff;
        border-color: #007bff;
    
        &:hover:not(:disabled) {
            background-color: #0069d9;
            border-color: #0062cc;
        }
    }
    
    .btn-secondary {
        color: #fff;
        background-color: #6c757d;
        border-color: #6c757d;
    
        &:hover:not(:disabled) {
            background-color: #5a6268;
            border-color: #545b62;
        }
    }
    
    .submit-section {
        text-align: center;
        margin-top: 24px;
        padding: 16px 0;
    
        &.sticky {
            position: sticky;
            bottom: 0;
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 20%);
            padding-top: 32px;
            margin-top: 0;
            z-index: 10;
        }
    }
}
</style>