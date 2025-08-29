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
      {/* Background with gradient animation */}
      <div className="loading-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

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
          
          {/* Animated icon overlay */}
          <div className="icon-overlay">
            <div className="laptop-icon">
              <div className="laptop-screen">
                <div className="checkmark">
                  <div className="checkmark-stem"></div>
                  <div className="checkmark-kick"></div>
                </div>
              </div>
              <div className="laptop-base"></div>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="loading-text">
          <h2 className="app-title">FlexWise</h2>
          <p className="app-subtitle">Flexible Tools for Smart Schools</p>
        </div>


        {/* Loading dots */}
        <div className="loading-dots">
          <div className="dot dot-1"></div>
          <div className="dot dot-2"></div>
          <div className="dot dot-3"></div>
        </div>

        {/* Floating school icons */}
        <div className="floating-icons">
          <div className="floating-icon icon-book">📚</div>
          <div className="floating-icon icon-pencil">✏️</div>
          <div className="floating-icon icon-calc">🧮</div>
          <div className="floating-icon icon-globe">🌍</div>
          <div className="floating-icon icon-graduate">🎓</div>
          <div className="floating-icon icon-apple">🍎</div>
        </div>
      </div>

      {/* Version info */}
      <div className="version-info">
        <span>Made with ❤️ in Berlin</span>
      </div>
    </div>
  )
}
