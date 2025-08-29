import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Bell, BellOff, CheckCircle, AlertCircle, Clock, Users, BookOpen } from 'lucide-react'
import notificationService from '../utils/notificationService'

export default function PWANotifications() {
  const [permission, setPermission] = useState('default')
  const [isSupported, setIsSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    // Check initial state
    setIsSupported(notificationService.isNotificationSupported())
    setPermission(notificationService.getPermission())

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, url, action, notificationData } = event.data || {}
        
        if (type === 'NAVIGATE') {
          console.log('Navigation requested:', { url, action, notificationData })
          // Handle navigation based on the notification action
          setStatus(`Notification clicked: ${action || 'view'}`)
        }
      })
    }
  }, [])

  const requestPermission = async () => {
    setLoading(true)
    setStatus('Requesting permission...')
    
    try {
      const result = await notificationService.requestPermission()
      setPermission(result)
      setStatus(result === 'granted' ? 'Permission granted!' : 'Permission denied')
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testNotification = async () => {
    setLoading(true)
    setStatus('Sending test notification...')
    
    try {
      await notificationService.testNotification()
      setStatus('Test notification sent!')
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const showAttendanceReminder = async () => {
    setLoading(true)
    setStatus('Sending attendance reminder...')
    
    try {
      await notificationService.showAttendanceReminder('Class 10A Mathematics', '09:00 AM')
      setStatus('Attendance reminder sent!')
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const showTaskReminder = async () => {
    setLoading(true)
    setStatus('Sending task reminder...')
    
    try {
      await notificationService.showTaskReminder('Grade homework assignments', 'Tomorrow')
      setStatus('Task reminder sent!')
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const showLessonNotification = async () => {
    setLoading(true)
    setStatus('Sending lesson notification...')
    
    try {
      await notificationService.showLessonNotification('Physics', 'Room 205', '10:30 AM')
      setStatus('Lesson notification sent!')
    } catch (error) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const scheduleDelayedNotification = () => {
    setStatus('Notification scheduled for 5 seconds...')
    notificationService.scheduleNotification(
      'Scheduled FlexWise Notification',
      {
        body: 'This notification was scheduled 5 seconds ago!',
        icon: '/icon-192.png',
        tag: 'scheduled-test'
      },
      5000
    )
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Granted</Badge>
      case 'denied':
        return <Badge variant="destructive"><BellOff className="w-3 h-3 mr-1" />Denied</Badge>
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Not Set</Badge>
    }
  }

  if (!isSupported) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            PWA Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support PWA notifications or service workers.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          FlexWise PWA Notifications
        </CardTitle>
        <CardDescription>
          Manage and test push notifications for the FlexWise school management system.
        </CardDescription>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-medium">Permission Status:</span>
          {getPermissionBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {status && (
          <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-sm text-blue-700">{status}</p>
          </div>
        )}

        {permission !== 'granted' && (
          <div className="space-y-2">
            <Button 
              onClick={requestPermission} 
              disabled={loading}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              {loading ? 'Requesting...' : 'Request Notification Permission'}
            </Button>
          </div>
        )}

        {permission === 'granted' && (
          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={testNotification} 
              disabled={loading}
              variant="outline"
              className="justify-start"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Test Basic Notification
            </Button>

            <Button 
              onClick={showAttendanceReminder} 
              disabled={loading}
              variant="outline"
              className="justify-start"
            >
              <Users className="w-4 h-4 mr-2" />
              Test Attendance Reminder
            </Button>

            <Button 
              onClick={showTaskReminder} 
              disabled={loading}
              variant="outline"
              className="justify-start"
            >
              <Clock className="w-4 h-4 mr-2" />
              Test Task Reminder
            </Button>

            <Button 
              onClick={showLessonNotification} 
              disabled={loading}
              variant="outline"
              className="justify-start"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Test Lesson Notification
            </Button>

            <Button 
              onClick={scheduleDelayedNotification} 
              disabled={loading}
              variant="outline"
              className="justify-start"
            >
              <Clock className="w-4 h-4 mr-2" />
              Schedule Notification (5s delay)
            </Button>
          </div>
        )}

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">How it works:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• PWA notifications work even when the app is closed</li>
            <li>• Notifications can have action buttons</li>
            <li>• Clicking notifications can open specific app sections</li>
            <li>• Perfect for attendance reminders, task alerts, and lesson schedules</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
