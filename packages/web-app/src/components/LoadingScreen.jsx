import { useState, useEffect } from 'react'
import './LoadingScreen.css'

export default function LoadingScreen({ onComplete, minDisplayTime = 2000 }) {
  const [isVisible, setIsVisible] = useState(true)
  const [animationPhase, setAnimationPhase] = useState('intro') // intro, main, outro

  useEffect(() => {
    // Sequence the animations
    const timer1 = setTimeout(() => {
      setAnimationPhase('main')
    }, 800)

    const timer2 = setTimeout(() => {
      setAnimationPhase('outro')
    }, minDisplayTime - 600)

    const timer3 = setTimeout(() => {
      setIsVisible(false)
      onComplete?.()
    }, minDisplayTime)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [minDisplayTime, onComplete])

  if (!isVisible) return null

  return (
    <div className={`flexwise-loading-screen ${animationPhase}`}>


      {/* Main content */}
      <div className="loading-content">
        {/* Logo container */}
        <div className="logo-container">
          <div className="logo-wrapper">
            <img
              src="/logo.png"
              alt="FlexWise"
              className="main-logo"
            />
          </div>

        </div>

        {/* Loading dots */}
        <div className="loading-dots">
          <div className="dot dot-1"></div>
          <div className="dot dot-2"></div>
          <div className="dot dot-3"></div>
        </div>
      </div>

      {/* Version info */}
      <div className="version-info">
        <span>Made with ❤️ in Berlin</span>
      </div>
    </div>
  )
}
