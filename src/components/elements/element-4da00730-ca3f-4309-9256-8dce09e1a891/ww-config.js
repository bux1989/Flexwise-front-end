export default {
    editor: {
        label: {
            en: 'Alert Box',
        },
        icon: 'warning',
    },
    properties: {
        initialTitle: {
            label: { en: 'Initial Title' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: 'Alert Title',
        },
        initialMessage: {
            label: { en: 'Initial Message' },
            type: 'Textarea',
            section: 'settings',
            bindable: true,
            defaultValue: 'Alert message content goes here.',
        },
        buttonText: {
            label: { en: 'Button Text' },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: 'OK',
        }
    },
    triggerEvents: [
        {
            name: 'show',
            label: { en: 'On show' },
            event: { title: '', message: '' }
        },
        {
            name: 'hide',
            label: { en: 'On hide' },
            event: {}
        },
        {
            name: 'titleChange',
            label: { en: 'On title change' },
            event: { value: '' }
        },
        {
            name: 'messageChange',
            label: { en: 'On message change' },
            event: { value: '' }
        }
    ],
    actions: [
        {
            label: { en: 'Show alert' },
            action: 'showAlert',
        },
        {
            label: { en: 'Hide alert' },
            action: 'hideAlert',
        },
        {
            label: { en: 'Set title' },
            action: 'updateTitle',
            args: [
                {
                    name: 'title',
                    type: 'string',
                    label: { en: 'Title' }
                }
            ]
        },
        {
            label: { en: 'Set message' },
            action: 'updateMessage',
            args: [
                {
                    name: 'message',
                    type: 'string',
                    label: { en: 'Message' }
                }
            ]
        }
    ]
};