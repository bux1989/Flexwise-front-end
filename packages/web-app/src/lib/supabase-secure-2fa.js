import { supabase } from './supabase'

// Secure 2FA implementation using Supabase's built-in MFA
export async function secureLoginWithMFA(email, password) {
  try {
    console.log('🔐 Starting secure MFA login for:', email)

    // Step 1: Attempt login - Supabase will handle MFA enforcement
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      // Check if error is due to MFA requirement
      if (error.message?.includes('MFA') || error.code === 'mfa_required') {
        console.log('🔒 MFA verification required by Supabase')
        return {
          mfaRequired: true,
          error: error,
          needsVerification: true
        }
      }
      throw error
    }

    // Step 2: Check if session is complete or if MFA challenge is pending
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('🔒 No session established - MFA challenge likely pending')
      return {
        mfaRequired: true,
        needsVerification: true
      }
    }

    // Step 3: Full authentication successful
    console.log('✅ Secure authentication complete')
    return {
      user: data.user,
      session: session,
      loginComplete: true
    }

  } catch (error) {
    console.error('💥 Secure login error:', error)
    throw error
  }
}

// Verify MFA challenge
export async function verifyMFAChallenge(factorId, challengeId, code) {
  try {
    console.log('🔐 Verifying MFA challenge')

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code
    })

    if (error) {
      console.error('❌ MFA verification failed:', error)
      throw error
    }

    console.log('✅ MFA verification successful')
    return data

  } catch (error) {
    console.error('💥 MFA verification error:', error)
    throw error
  }
}

// List user's MFA factors
export async function getMFAFactors() {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors()
    
    if (error) {
      console.error('❌ Error listing MFA factors:', error)
      return { factors: [], error }
    }

    return { factors: data, error: null }
  } catch (error) {
    console.error('💥 Error getting MFA factors:', error)
    return { factors: [], error }
  }
}

// Create MFA challenge
export async function createMFAChallenge(factorId) {
  try {
    console.log('🔐 Creating MFA challenge for factor:', factorId)

    const { data, error } = await supabase.auth.mfa.challenge({
      factorId
    })

    if (error) {
      console.error('❌ Error creating MFA challenge:', error)
      throw error
    }

    console.log('✅ MFA challenge created')
    return data

  } catch (error) {
    console.error('💥 MFA challenge creation error:', error)
    throw error
  }
}
