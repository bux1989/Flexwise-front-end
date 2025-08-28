// Shared utility functions

export const formatUserName = (firstName?: string, lastName?: string) => {
  if (!firstName && !lastName) return 'Unknown User'
  return [firstName, lastName].filter(Boolean).join(' ')
}

export const generateAvatarUrl = (name: string) => {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=40`
}

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}