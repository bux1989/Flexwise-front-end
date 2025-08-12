export default {
  options: {
    sizable: true,
  },
  editor: {
    label: { en: 'Schedule Table' },
    icon: 'table',
  },
  properties: {
    teachers: {
      label: { en: 'Teachers' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [
        { id: 't1', first_name: 'John', last_name: 'Doe', hours_account: 28, age_reduction: 0 },
        { id: 't2', first_name: 'Jane', last_name: 'Smith', hours_account: 28, age_reduction: 2 }
      ],
      options: {
        expandable: true,
        getItemLabel(_, index) { return `Teacher ${index + 1}`; },
        item: {
          type: 'Object',
          defaultValue: { id: '', first_name: '', last_name: '', hours_account: 28, age_reduction: 0 },
          options: {
            item: {
              id: { label: 'ID', type: 'Text', options: { placeholder: 'Teacher ID' } },
              first_name: { label: 'First Name', type: 'Text', options: { placeholder: 'First Name' } },
              last_name: { label: 'Last Name', type: 'Text', options: { placeholder: 'Last Name' } },
              hours_account: { label: 'Hours Account', type: 'Number', options: { min: 0, max: 40 } },
              age_reduction: { label: 'Age Reduction', type: 'Number', options: { min: 0, max: 10 } }
            }
          }
        }
      },
    },
    classes: {
      label: { en: 'Classes' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [
        { id: 'c1', name: '1A' },
        { id: 'c2', name: '2B' }
      ],
      options: {
        expandable: true,
        getItemLabel(_, index) { return `Class ${index + 1}`; },
        item: {
          type: 'Object',
          defaultValue: { id: '', name: '' },
          options: {
            item: {
              id: { label: 'ID', type: 'Text', options: { placeholder: 'Class ID' } },
              name: { label: 'Class Name', type: 'Text', options: { placeholder: 'Class Name' } }
            }
          }
        }
      }
    },
    days: {
      label: { en: 'Days' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [
        { name_de: 'Montag', day_number: 1 },
        { name_de: 'Dienstag', day_number: 2 },
        { name_de: 'Mittwoch', day_number: 3 }
      ],
      options: {
        expandable: true,
        getItemLabel(_, index) { return `Day ${index + 1}`; },
        item: {
          type: 'Object',
          defaultValue: { name_de: '', day_number: 0 },
          options: {
            item: {
              name_de: { label: 'Day Name', type: 'Text', options: { placeholder: 'Day Name' } },
              day_number: { label: 'Day Number', type: 'Number', options: { min: 1, max: 7 } }
            }
          }
        }
      }
    },
    periods: {
      label: { en: 'Periods' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [
        { block_number: 1 },
        { block_number: 2 },
        { block_number: 3 }
      ],
      options: {
        expandable: true,
        getItemLabel(_, index) { return `Period ${index + 1}`; },
        item: {
          type: 'Object',
          defaultValue: { block_number: 0 },
          options: {
            item: {
              block_number: { label: 'Block Number', type: 'Number', options: { min: 1, max: 12 } }
            }
          }
        }
      }
    },
    lessons: {
      label: { en: 'Lessons' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: true,
        getItemLabel(_, index) { return `Lesson ${index + 1}`; },
        item: {
          type: 'Object',
          defaultValue: {
            id: '',
            schedule_id: '',
            teacher_names: [],
            teacher_ids: [],
            day_name_de: '',
            block_number: 0,
            class_name: '',
            class_id: '',
            subject_name: '',
            subject_id: '',
            course_name: '',
            scheduled_room_name: '',
            room_id: '',
            enrolled_students_names: [],
            meeting_name: '',
            notes: '',
          },
          options: {
            item: {
              id: { label: 'ID', type: 'Text', options: { placeholder: 'Lesson ID' } },
              schedule_id: { label: 'Schedule ID', type: 'Text', options: { placeholder: 'Schedule ID for grouping' } },
              teacher_names: {
                label: 'Teacher Names',
                type: 'Array',
                options: {
                  expandable: true,
                  getItemLabel(_, index) { return `Teacher ${index + 1}`; },
                  item: { type: 'Text', defaultValue: '' }
                }
              },
              teacher_ids: {
                label: 'Teacher IDs',
                type: 'Array',
                options: {
                  expandable: true,
                  getItemLabel(_, index) { return `Teacher ID ${index + 1}`; },
                  item: { type: 'Text', defaultValue: '' }
                }
              },
              day_name_de: { label: 'Day Name', type: 'Text', options: { placeholder: 'Day Name' } },
              block_number: { label: 'Block Number', type: 'Number', options: { min: 1, max: 12 } },
              class_name: { label: 'Class Name', type: 'Text', options: { placeholder: 'Class Name' } },
              class_id: { label: 'Class ID', type: 'Text', options: { placeholder: 'Class ID' } },
              subject_name: { label: 'Subject Name', type: 'Text', options: { placeholder: 'Subject Name' } },
              subject_id: { label: 'Subject ID', type: 'Text', options: { placeholder: 'Subject ID' } },
              course_name: { label: 'Course Name', type: 'Text', options: { placeholder: 'Course Name' } },
              scheduled_room_name: { label: 'Room Name', type: 'Text', options: { placeholder: 'Room Name' } },
              room_id: { label: 'Room ID', type: 'Text', options: { placeholder: 'Room ID' } },
              enrolled_students_names: {
                label: 'Enrolled Students',
                type: 'Array',
                options: {
                  expandable: true,
                  getItemLabel(_, index) { return `Student ${index + 1}`; },
                  item: { type: 'Text', defaultValue: '' }
                }
              },
              meeting_name: { label: 'Meeting Title', type: 'Text', options: { placeholder: 'Meeting Title' } },
              notes: { label: 'Notes', type: 'Textarea', options: { placeholder: 'Meeting Notes' } },
            }
          }
        }
      }
    },
    headerBackgroundColor: {
      label: { en: 'Header Background' },
      type: 'Color',
      section: 'style',
      bindable: true,
      defaultValue: '#f0f0f0'
    },
    borderColor: {
      label: { en: 'Border Color' },
      type: 'Color',
      section: 'style',
      bindable: true,
      defaultValue: '#dddddd'
    },
    cellPadding: {
      label: { en: 'Cell Padding' },
      type: 'Length',
      section: 'style',
      bindable: true,
      defaultValue: '8px'
    },
    // ----- PLANNING PROPS -----
    mode: {
      label: { en: 'Mode' },
      type: 'TextRadioGroup',
      section: 'settings',
      bindable: true,
      defaultValue: 'live',
      options: {
        choices: [
          { value: 'live', title: 'Live', icon: 'eye' },
          { value: 'planning', title: 'Planning', icon: 'pencil' }
        ]
      }
    },
    viewMode: {
      label: { en: 'View Mode' },
      type: 'TextRadioGroup',
      section: 'settings',
      bindable: true,
      defaultValue: 'teacher',
      options: {
        choices: [
          { value: 'teacher', title: 'Teacher View', icon: 'person' },
          { value: 'class', title: 'Class View', icon: 'school' }
        ]
      }
    },
    // --- COLOR MODE PROPERTY (for color logic toggle) ---
    colorMode: {
      label: { en: 'Color Mode' },
      type: 'TextRadioGroup',
      section: 'settings',
      bindable: true,
      defaultValue: 'subject',
      options: {
        choices: [
          { value: 'subject', title: 'By Subject', icon: 'book' },
          { value: 'teacher', title: 'By Teacher', icon: 'person' },
          { value: 'class', title: 'By Class', icon: 'school' }
        ]
      }
    },
    draftLessons: {
      label: { en: 'Draft Lessons' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: true,
        getItemLabel(_, index) { return `Draft Lesson ${index + 1}`; },
        item: {
          type: 'Object',
          defaultValue: {
            id: '',
            teacher_names: [],
            teacher_ids: [],
            day_name_de: '',
            block_number: 0,
            subject_id: '',
            class_id: '',
            room_id: '',
            meeting_name: '',
            notes: '',
          }
        }
      }
    },
    availableSubjects: {
      label: { en: 'Available Subjects' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: true,
        getItemLabel(_, index) { return `Subject ${index + 1}`; },
        item: { type: 'Object', defaultValue: { id: '', name: '' } }
      }
    },
    availableClasses: {
      label: { en: 'Available Classes' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: true,
        getItemLabel(_, index) { return `Class ${index + 1}`; },
        item: { type: 'Object', defaultValue: { id: '', name: '' } }
      }
    },
    availableRooms: {
      label: { en: 'Available Rooms' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: true,
        getItemLabel(_, index) { return `Room ${index + 1}`; },
        item: { type: 'Object', defaultValue: { id: '', name: '' } }
      }
    },
    selectedSubject: {
      label: { en: 'Selected Subject' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: null
    },
    selectedClass: {
      label: { en: 'Selected Class' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: null
    },
    selectedRoom: {
      label: { en: 'Selected Room' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: null
    },
    selectedTeacherIds: {
      label: { en: 'Selected Teacher IDs' },
      type: 'Array',
      section: 'settings',
      bindable: true,
      defaultValue: [],
      options: {
        expandable: true,
        getItemLabel(_, index) { return `Teacher ID ${index + 1}`; },
        item: { type: 'Text', defaultValue: '' }
      }
    },
    language: {
      label: { en: 'Language' },
      type: 'TextRadioGroup',
      section: 'settings',
      bindable: true,
      defaultValue: 'de',
      options: {
        choices: [
          { value: 'de', title: 'Deutsch', icon: 'globe' },
          { value: 'en', title: 'English', icon: 'globe' }
        ]
      }
    },
    enableCrossHair: {
      label: { en: 'Enable Cross-Hair Hover', de: 'Fadenkreuz-Hover aktivieren' },
      type: 'OnOff',
      section: 'settings',
      bindable: true,
      defaultValue: true
    }
    // ----- END PLANNING PROPS -----
  },
  triggerEvents: [
    {
      name: 'lessonSelected',
      label: { en: 'On lesson selected' },
      event: { value: null }
    },
    {
      name: 'assignDraftLesson',
      label: { en: 'On draft lesson assigned' },
      event: { value: null }
    },
    {
      name: 'updateLesson',
      label: { en: 'On lesson updated' },
      event: { value: null }
    },
    {
      name: 'deleteDraftLesson',
      label: { en: 'On draft lesson deleted' },
      event: { value: null }
    },
    {
      name: 'selectedTeacherIdsChange',
      label: { en: 'On teacher selection changed' },
      event: { value: null }
    },
    {
      name: 'teacherProfileClicked',
      label: { en: 'On teacher profile clicked' },
      event: { value: null }
    }
  ]
};
