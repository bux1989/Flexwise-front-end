export default {
  editor: {
    label: { en: 'Alert Box' },
    icon: 'warning',
  },
  properties: {
    initialTitle: {
      label: { en: 'Initial Title' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: 'Warnung',
    },
    initialMessage: {
      label: { en: 'Initial Message' },
      type: 'Textarea',
      section: 'settings',
      bindable: true,
      defaultValue: 'Es ist ein Konflikt aufgetreten.',
    },
    buttonText: {
      label: { en: 'Button Text' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: 'OK',
    },
    variant: {
      label: { en: 'Variant' },
      type: 'Text', // keep simple: string prop that accepts warning|error|info|success
      section: 'settings',
      bindable: true,
      defaultValue: 'warning',
    },
  },
  triggerEvents: [
    { name: 'show', label: { en: 'On show' }, event: { title: '', message: '' } },
    { name: 'hide', label: { en: 'On hide' }, event: {} },
    { name: 'titleChange', label: { en: 'On title change' }, event: { value: '' } },
    { name: 'messageChange', label: { en: 'On message change' }, event: { value: '' } },
  ],
  actions: [
    { label: { en: 'Show alert' }, action: 'showAlert' },
    { label: { en: 'Hide alert' }, action: 'hideAlert' },
    {
      label: { en: 'Set title' },
      action: 'updateTitle',
      args: [{ name: 'title', type: 'string', label: { en: 'Title' } }],
    },
    {
      label: { en: 'Set message' },
      action: 'updateMessage',
      args: [{ name: 'message', type: 'string', label: { en: 'Message' } }],
    },
  ],
};
