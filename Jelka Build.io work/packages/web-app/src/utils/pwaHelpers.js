/**
 * Utility functions for PWA detection and management
 */

/**
 * Detects if the app is running as a PWA (Progressive Web App)
 * @returns {boolean} - True if running as PWA, false if running in browser
 */
export function isPWA() {
  // Check if running in standalone mode (installed PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check for iOS Safari PWA
  if (window.navigator.standalone === true) {
    return true;
  }
  
  // Check for Android Chrome PWA using document referrer
  if (document.referrer.includes('android-app://')) {
    return true;
  }
  
  // Check for PWA manifest display mode
  if (window.matchMedia('(display-mode: fullscreen)').matches || 
      window.matchMedia('(display-mode: minimal-ui)').matches) {
    return true;
  }
  
  return false;
}

/**
 * Checks if the device is mobile
 * @returns {boolean} - True if mobile device
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Determines if loading screen should be shown
 * @returns {boolean} - True if loading screen should be shown
 */
export function shouldShowLoadingScreen() {
  return isPWA();
}

/**
 * Debug function to log PWA detection details
 */
export function debugPWAStatus() {
  console.log('🔍 PWA Detection Debug:');
  console.log('- Display mode standalone:', window.matchMedia('(display-mode: standalone)').matches);
  console.log('- iOS standalone:', window.navigator.standalone);
  console.log('- Document referrer:', document.referrer);
  console.log('- Display mode fullscreen:', window.matchMedia('(display-mode: fullscreen)').matches);
  console.log('- Display mode minimal-ui:', window.matchMedia('(display-mode: minimal-ui)').matches);
  console.log('- Is PWA:', isPWA());
  console.log('- Is Mobile:', isMobileDevice());
  console.log('- Should show loading screen:', shouldShowLoadingScreen());
}
