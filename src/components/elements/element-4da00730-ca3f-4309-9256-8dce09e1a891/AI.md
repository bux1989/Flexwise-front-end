---
name: alert-box
description: A customizable alert box component that appears in the bottom right corner with title and message
keywords: alert, modal, popup, notification, message, toast
---

#### alert-box
***Purpose:***
A flexible alert box component that displays a notification in the bottom right corner with customizable title and message that can be triggered and updated externally.

***Features:***
- Show/hide alert via actions
- Dynamically update title and message via actions
- Customizable button text
- Smooth animations for showing/hiding
- Bottom-right corner positioning for non-intrusive notifications

***Properties:***
- initialTitle: string - Sets the initial title of the alert box
- initialMessage: string - Sets the initial message content of the alert box
- buttonText: string - Sets the text displayed on the alert button (default: "OK")

***Events:***
- show: Triggered when the alert is displayed. Payload: { title: "Current Title", message: "Current Message" }
- hide: Triggered when the alert is closed. No payload.
- titleChange: Triggered when the title is changed. Payload: { value: "New Title" }
- messageChange: Triggered when the message is changed. Payload: { value: "New Message" }

***Exposed Actions:***
- `showAlert`: Shows the alert box. No arguments.
- `hideAlert`: Hides the alert box. No arguments.
- `updateTitle`: Updates the alert title. Args: title (string)
- `updateMessage`: Updates the alert message. Args: message (string)

***Exposed Variables:***
- title: The current alert title. (path: variables['current_element_uid-title'])
- message: The current alert message. (path: variables['current_element_uid-message'])

***Notes:***
- The alert is initially hidden and must be shown using the showAlert action
- Title and message can be updated even when the alert is not visible
- The component appears in the bottom right corner of the screen with a slide-up animation
- Useful for non-intrusive notifications and alerts that don't require blocking the entire UI