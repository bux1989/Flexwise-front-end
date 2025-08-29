import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Share } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Detect device and browser capabilities
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const iOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream
    const android = /Android/.test(userAgent)
    const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches

    setIsIOS(iOS)
    setIsAndroid(android)
    setIsStandalone(standalone)

    // Check if user has previously dismissed the banner
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

    // Only show on mobile devices, if not standalone, and if not recently dismissed
    const shouldShow = (iOS || android) && !standalone && dismissedTime < oneWeekAgo

    if (shouldShow) {
      // For iOS, show immediately since there's no beforeinstallprompt
      if (iOS) {
        setShowBanner(true)
        setCanInstall(true)
      }
    }

    // Handle the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      if (shouldShow && android) {
        setShowBanner(true)
        setCanInstall(true)
      }
    }

    // Handle successful installation
    const handleAppInstalled = () => {
      setShowBanner(false)
      setDeferredPrompt(null)
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, we can't trigger installation programmatically
      // The banner will show instructions
      return
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
          setShowBanner(false)
          localStorage.setItem('pwa-install-dismissed', Date.now().toString())
        }
        
        setDeferredPrompt(null)
      } catch (error) {
        console.error('PWA installation failed:', error)
      }
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showBanner || !canInstall) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="bg-white/20 p-2 rounded-full">
              <Smartphone className="h-5 w-5" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">
                FlexWise App installieren
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                {isIOS 
                  ? 'Fügen Sie FlexWise zu Ihrem Startbildschirm hinzu für schnelleren Zugriff'
                  : 'Installieren Sie FlexWise für eine bessere Erfahrung'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {isIOS ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowIOSInstructions(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs px-3 py-1"
              >
                <Share className="h-3 w-3 mr-1" />
                Anleitung
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleInstallClick}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs px-3 py-1"
              >
                <Download className="h-3 w-3 mr-1" />
                Installieren
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 p-1 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// iOS Installation Instructions Modal
function IOSInstallInstructions({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="bg-white max-w-sm w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">FlexWise installieren</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="p-1 h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4 text-sm">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                <span className="text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Teilen-Button öffnen</p>
                <p className="text-gray-600">Tippen Sie auf das Teilen-Symbol <Share className="inline h-4 w-4" /> in der Safari-Leiste</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">"Zum Home-Bildschirm" wählen</p>
                <p className="text-gray-600">Scrollen Sie nach unten und wählen Sie "Zum Home-Bildschirm hinzufügen"</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-1 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Bestätigen</p>
                <p className="text-gray-600">Tippen Sie auf "Hinzufügen" um FlexWise zu installieren</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={onClose}
            className="w-full mt-6"
          >
            Verstanden
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Enhanced version with iOS instructions modal
export function PWAInstallBannerWithInstructions() {
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    // Detect device and browser capabilities
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    const iOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream
    const android = /Android/.test(userAgent)
    const standalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches

    setIsIOS(iOS)
    setIsAndroid(android)
    setIsStandalone(standalone)

    // Check if user has previously dismissed the banner
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    const dismissedTime = dismissed ? parseInt(dismissed) : 0
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

    // Only show on mobile devices, if not standalone, and if not recently dismissed
    const shouldShow = (iOS || android) && !standalone && dismissedTime < oneWeekAgo

    if (shouldShow) {
      // Delay showing banner by 3 seconds to not interrupt login flow
      setTimeout(() => {
        if (iOS) {
          setShowBanner(true)
          setCanInstall(true)
        }
      }, 3000)
    }

    // Handle the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      if (shouldShow && android) {
        setTimeout(() => {
          setShowBanner(true)
          setCanInstall(true)
        }, 3000)
      }
    }

    // Handle successful installation
    const handleAppInstalled = () => {
      setShowBanner(false)
      setDeferredPrompt(null)
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true)
      return
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
          setShowBanner(false)
          localStorage.setItem('pwa-install-dismissed', Date.now().toString())
        }
        
        setDeferredPrompt(null)
      } catch (error) {
        console.error('PWA installation failed:', error)
      }
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  return (
    <>
      {showBanner && canInstall && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className="bg-white/20 p-2 rounded-full">
                  <Smartphone className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">
                    FlexWise App installieren
                  </h3>
                  <p className="text-xs text-blue-100 mt-1">
                    {isIOS 
                      ? 'Fügen Sie FlexWise zu Ihrem Startbildschirm hinzu'
                      : 'Installieren Sie FlexWise für eine bessere Erfahrung'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleInstallClick}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs px-3 py-1"
                >
                  {isIOS ? (
                    <>
                      <Share className="h-3 w-3 mr-1" />
                      Anleitung
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      Installieren
                    </>
                  )}
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-white hover:bg-white/20 p-1 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <IOSInstallInstructions 
        isOpen={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
      />
    </>
  )
}
