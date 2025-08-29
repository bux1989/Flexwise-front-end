import { useAuth } from '../contexts/AuthContext'

export function AuthStatus() {
  const { user, session, loading } = useAuth()

  // Only show in development or for debugging
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50">
      <div>Auth Context Status:</div>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.email : 'None'}</div>
      <div>Session: {session ? 'Active' : 'None'}</div>
    </div>
  )
}
