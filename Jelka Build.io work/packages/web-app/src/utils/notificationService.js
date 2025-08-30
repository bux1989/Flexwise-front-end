// Notification Service for PWA
class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator
    this.permission = this.isSupported ? Notification.permission : 'denied'
  }

  // Check if notifications are supported
  isNotificationSupported() {
    return this.isSupported
  }

  // Get current permission status
  getPermission() {
    return this.permission
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Notifications are not supported in this browser')
    }

    if (this.permission === 'denied') {
      throw new Error('Notifications are blocked. Please enable them in browser settings.')
    }

    if (this.permission === 'granted') {
      return 'granted'
    }

    const result = await Notification.requestPermission()
    this.permission = result
    return result
  }

  // Show a simple notification
  async showNotification(title, options = {}) {
    if (!this.isSupported) {
      console.warn('Notifications are not supported')
      return
    }

    // Ensure permission is granted
    if (this.permission !== 'granted') {
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }
    }

    const defaultOptions = {
      icon: '/icon-192.png',
      badge: '/favicon.png',
      tag: 'flexwise-notification',
      renotify: true,
      requireInteraction: false,
      ...options
    }

    // If service worker is available, use it to show the notification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      return registration.showNotification(title, defaultOptions)
    }

    // Fallback to regular notification
    return new Notification(title, defaultOptions)
  }

  // Show notification with predefined FlexWise styling
  async showFlexWiseNotification(title, body, options = {}) {
    const flexwiseOptions = {
      body,
      icon: '/icon-192.png',
      badge: '/favicon.png',
      tag: 'flexwise-app',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      data: {
        timestamp: Date.now(),
        url: window.location.origin
      },
      ...options
    }

    return this.showNotification(title, flexwiseOptions)
  }

  // Show attendance reminder notification
  async showAttendanceReminder(className, time) {
    return this.showFlexWiseNotification(
      'Attendance Reminder',
      `Don't forget to mark attendance for ${className} at ${time}`,
      {
        tag: 'attendance-reminder',
        icon: '/icon-192.png',
        actions: [
          {
            action: 'mark-attendance',
            title: 'Mark Attendance'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      }
    )
  }

  // Show task reminder notification
  async showTaskReminder(taskTitle, dueDate) {
    return this.showFlexWiseNotification(
      'Task Reminder',
      `Task "${taskTitle}" is due on ${dueDate}`,
      {
        tag: 'task-reminder',
        icon: '/icon-192.png',
        actions: [
          {
            action: 'view-task',
            title: 'View Task'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      }
    )
  }

  // Show lesson schedule notification
  async showLessonNotification(subject, room, time) {
    return this.showFlexWiseNotification(
      'Upcoming Lesson',
      `${subject} in ${room} at ${time}`,
      {
        tag: 'lesson-notification',
        icon: '/icon-192.png',
        actions: [
          {
            action: 'view-schedule',
            title: 'View Schedule'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      }
    )
  }

  // Subscribe to push notifications (requires backend setup)
  async subscribeToPushNotifications() {
    if (!this.isSupported || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported')
    }

    const registration = await navigator.serviceWorker.ready
    
    // You would need to provide your VAPID public key here
    // This is just a placeholder - replace with your actual VAPID key
    const vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY_HERE'
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
    })

    return subscription
  }

  // Helper function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Schedule a notification for later (using setTimeout)
  scheduleNotification(title, options, delayMs) {
    setTimeout(() => {
      this.showNotification(title, options)
    }, delayMs)
  }

  // Test notification function
  async testNotification() {
    try {
      await this.showFlexWiseNotification(
        'FlexWise Test Notification',
        'This is a test notification to verify PWA notifications are working correctly.',
        {
          tag: 'test-notification',
          requireInteraction: false
        }
      )
      return true
    } catch (error) {
      console.error('Test notification failed:', error)
      return false
    }
  }
}

// Create and export a singleton instance
const notificationService = new NotificationService()
export default notificationService
