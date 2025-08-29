import { useState, useEffect } from 'react'
import { BookOpen, GraduationCap, PenTool, Backpack, Apple, Calculator, Globe, Palette } from 'lucide-react'
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
      {/* Background icons matching login screen */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top left area */}
        <BookOpen className="absolute top-16 left-16 w-16 h-16 text-gray-300/60 rotate-12 animate-float-slow" />
        <PenTool className="absolute top-32 left-32 w-12 h-12 text-gray-400/50 -rotate-6 animate-fall-gentle" />
        <Calculator className="absolute top-24 left-64 w-14 h-14 text-gray-300/60 rotate-45 animate-float-medium" />

        {/* Top right area */}
        <GraduationCap className="absolute top-20 right-20 w-20 h-20 text-gray-300/70 -rotate-12 animate-fall-slow" />
        <Globe className="absolute top-40 right-32 w-16 h-16 text-gray-400/60 rotate-30 animate-float-gentle" />
        <Apple className="absolute top-60 right-16 w-12 h-12 text-gray-400/50 rotate-15 animate-fall-medium" />

        {/* Bottom left area */}
        <Backpack className="absolute bottom-32 left-20 w-18 h-18 text-gray-300/60 rotate-6 animate-float-slow" />
        <Palette className="absolute bottom-16 left-40 w-14 h-14 text-gray-400/50 -rotate-20 animate-fall-gentle" />

        {/* Bottom right area */}
        <BookOpen className="absolute bottom-28 right-28 w-16 h-16 text-gray-300/60 -rotate-30 animate-float-medium" />
        <PenTool className="absolute bottom-12 right-12 w-12 h-12 text-gray-400/50 rotate-45 animate-fall-slow" />

        {/* Center scattered - very subtle */}
        <Calculator className="absolute top-1/3 left-8 w-10 h-10 text-gray-400/40 rotate-12 animate-float-gentle" />
        <Globe className="absolute bottom-1/3 right-8 w-12 h-12 text-gray-400/40 -rotate-12 animate-fall-medium" />
        <Apple className="absolute top-2/3 left-12 w-8 h-8 text-gray-400/40 rotate-30 animate-float-slow" />
        <GraduationCap className="absolute bottom-2/3 right-6 w-10 h-10 text-gray-400/40 -rotate-15 animate-fall-gentle" />
      </div>


      {/* Main content */}
      <div className="loading-content">
        {/* Logo container */}
        <div className="logo-container">
          <div className="logo-wrapper">
            <img
              src="/flexwise-logo-with-tagline.png"
              alt="FlexWise - Flexible Tools for Smart Schools"
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
