// FlexWise Service Worker for PWA Notifications

const CACHE_NAME = 'flexwise-cache-v1'
const urlsToCache = [
  '/',
  '/icon-192.png',
  '/favicon.png',
  '/apple-touch-icon.png'
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('FlexWise Service Worker: Cache opened')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log('FlexWise Service Worker: Installed successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('FlexWise Service Worker: Install failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('FlexWise Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('FlexWise Service Worker: Activated successfully')
      return self.clients.claim()
    })
  )
})

// Fetch event - serve cached resources when offline
self.addEventListener('fetch', (event) => {
  // Skip HMR and dev server requests
  if (event.request.url.includes('@vite/client') ||
      event.request.url.includes('__vite_ping') ||
      event.request.url.includes('/@fs/') ||
      event.request.url.includes('/@id/') ||
      event.request.url.includes('/@react-refresh') ||
      event.request.url.includes('.hot-update.')) {
    return
  }

  // Skip WebSocket upgrade requests
  if (event.request.headers.get('upgrade') === 'websocket') {
    return
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip dev server localhost requests in development
  if (event.request.url.includes('localhost:') ||
      event.request.url.includes('127.0.0.1:') ||
      event.request.url.includes('.fly.dev')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // Return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/')
        }
      })
  )
})

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('FlexWise Service Worker: Push event received', event)

  let notificationData = {
    title: 'FlexWise Notification',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/favicon.png',
    tag: 'flexwise-push',
    requireInteraction: false,
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
      url: '/'
    }
  }

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json()
      notificationData = { ...notificationData, ...pushData }
    } catch (error) {
      console.error('FlexWise Service Worker: Error parsing push data', error)
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('FlexWise Service Worker: Notification shown successfully')
      })
      .catch((error) => {
        console.error('FlexWise Service Worker: Error showing notification', error)
      })
  )
})

// Notification click event - handle notification interactions
self.addEventListener('notificationclick', (event) => {
  console.log('FlexWise Service Worker: Notification clicked', event)

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  // Close the notification
  notification.close()

  // Handle different actions
  if (action === 'dismiss') {
    // Just close the notification
    return
  }

  // Determine URL to open based on action and data
  let urlToOpen = data.url || '/'

  if (action === 'mark-attendance') {
    urlToOpen = '/dashboard/teacher#attendance'
  } else if (action === 'view-task') {
    urlToOpen = '/dashboard/teacher#tasks'
  } else if (action === 'view-schedule') {
    urlToOpen = '/dashboard/teacher#schedule'
  } else if (action === 'view') {
    urlToOpen = data.url || '/'
  }

  // Open/focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Focus existing window and navigate to URL
            client.postMessage({
              type: 'NAVIGATE',
              url: urlToOpen,
              action: action,
              notificationData: data
            })
            return client.focus()
          }
        }

        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
      .catch((error) => {
        console.error('FlexWise Service Worker: Error handling notification click', error)
      })
  )
})

// Background sync event (for future use)
self.addEventListener('sync', (event) => {
  console.log('FlexWise Service Worker: Background sync event', event.tag)

  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      Promise.resolve()
        .then(() => {
          console.log('FlexWise Service Worker: Background sync completed')
        })
        .catch((error) => {
          console.error('FlexWise Service Worker: Background sync failed', error)
        })
    )
  }
})

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('FlexWise Service Worker: Message received', event.data)

  const { type, payload } = event.data || {}

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    case 'SHOW_NOTIFICATION':
      if (payload) {
        self.registration.showNotification(payload.title, payload.options)
      }
      break

    case 'CACHE_URLS':
      if (payload && payload.urls) {
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(payload.urls))
        )
      }
      break

    default:
      console.log('FlexWise Service Worker: Unknown message type', type)
  }
})

// Error event - handle service worker errors
self.addEventListener('error', (event) => {
  console.error('FlexWise Service Worker: Error occurred', event.error)
})

// Unhandled rejection event
self.addEventListener('unhandledrejection', (event) => {
  console.error('FlexWise Service Worker: Unhandled promise rejection', event.reason)
})

console.log('FlexWise Service Worker: Loaded successfully')
