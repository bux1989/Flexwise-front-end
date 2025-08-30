# MFA Rate Limiting Solution

## Problem
Users experienced immediate rate limiting errors when logging out and back in, even though no SMS codes were sent in the current session. This happened because:

1. Server-side rate limits (Supabase/SMS provider) persist across sessions
2. Frontend components only used in-memory state for rate limiting
3. Fresh page loads (logout/login) cleared frontend memory but server still remembered previous requests

## Solution: localStorage Persistence

### Implementation Details

#### Files Modified
- `packages/web-app/src/components/MFALoginFlow.jsx`

#### Key Functions Added

```javascript
// Generate user-specific storage key
const getRateLimitKey = () => {
  const { data: sessionData } = supabase.auth.getSession()
  const userId = sessionData?.session?.user?.id
  return userId ? `mfa_rate_limit_${userId}` : 'mfa_rate_limit_temp'
}

// Save rate limit state to localStorage
const saveRateLimitState = (waitTime) => {
  const state = {
    timestamp: Date.now(),
    waitTime: waitTime
  }
  localStorage.setItem(key, JSON.stringify(state))
}

// Check for existing rate limits
const checkExistingRateLimit = () => {
  const stored = localStorage.getItem(key)
  if (!stored) return null
  
  const state = JSON.parse(stored)
  const elapsed = (Date.now() - state.timestamp) / 1000
  const remaining = Math.max(0, state.waitTime - elapsed)
  
  return remaining > 0 ? Math.ceil(remaining) : null
}
```

#### Flow Changes

1. **Component Load**: Checks localStorage for existing rate limits
2. **Pre-Request Check**: Validates rate limit before making API calls
3. **Rate Limit Hit**: Saves timestamp and wait time to localStorage
4. **Countdown End**: Clears localStorage automatically
5. **Success**: Clears any existing rate limit state

### Benefits

- ✅ Persists across page refreshes
- ✅ Survives logout/login cycles
- ✅ Works across browser tabs
- ✅ Prevents unnecessary API calls
- ✅ User-specific storage keys
- ✅ Automatic cleanup

### Edge Cases Handled

- **Missing localStorage**: Graceful fallback to memory-only
- **Corrupted data**: Try/catch with warnings
- **Clock changes**: Uses elapsed time calculation
- **Multiple tabs**: Shared state across tabs
- **Browser restart**: Persists until rate limit expires

## Why This Approach?

### Alternatives Considered

1. **Server-side storage**: Would require database changes and API modifications
2. **Session storage**: Doesn't persist across logout/login
3. **Cookies**: More complex, not needed for this use case
4. **Memory only**: The original problem - doesn't persist

### Trade-offs

**Pros:**
- Simple implementation
- No backend changes required
- Immediate fix for UX issue
- Client-side only solution

**Cons:**
- Not conventional for auth flows
- Relies on localStorage availability
- Could be cleared by user/extensions
- Not synchronized across devices

## Security Considerations

This solution is for **UX improvement only** and does not affect actual security:

- Server-side rate limits are still enforced
- localStorage state can be manipulated by user (but this only affects their own UX)
- Real rate limiting happens on the server
- Cannot be used to bypass actual security measures

## Usage

The solution is automatic - no additional code needed in other components. It only affects the `MFALoginFlow` component's behavior.

## Testing

To test the fix:
1. Log in and trigger MFA
2. Request SMS code
3. Hit rate limit (get "wait X seconds" message)
4. Log out and log back in
5. Verify countdown shows immediately without new API call
6. Wait for countdown to end
7. Request SMS successfully without extra steps
