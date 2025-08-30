import { supabase } from './supabase'

/**
 * Secure login implementation using Supabase's built-in MFA
 * This prevents session creation until MFA is completed server-side
 */
export async function secureLoginWithMFA(email, password) {
  try {
    console.log('🔐 Starting secure MFA login for:', email)

    // Step 1: Attempt login - Supabase handles MFA enforcement server-side
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('❌ Login error:', error)
      throw error
    }

    // Step 2: Check if we have a complete session or if MFA is required
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (sessionData.session) {
      console.log('✅ Login complete - no MFA required or already verified')
      return {
        loginComplete: true,
        user: data.user,
        session: sessionData.session
      }
    }

    // Step 3: If no session, check for MFA factors that might need verification
    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
    
    if (factorError) {
      console.error('❌ Error checking MFA factors:', factorError)
      throw factorError
    }

    // Find verified factors that could be used for challenge
    const verifiedFactors = factors.all.filter(factor => factor.status === 'verified')
    
    if (verifiedFactors.length === 0) {
      console.log('⚠️ No verified MFA factors found')
      return {
        loginComplete: true,
        user: data.user,
        needsSetup: true
      }
    }

    console.log('🔒 MFA verification required - found verified factors:', verifiedFactors.length)
    
    return {
      needsVerification: true,
      user: data.user,
      factors: verifiedFactors,
      loginComplete: false
    }

  } catch (error) {
    console.error('💥 Secure login error:', error)
    throw error
  }
}

/**
 * Create MFA challenge for a specific factor
 */
export async function createMFAChallenge(factorId) {
  try {
    console.log('🔐 Creating MFA challenge for factor:', factorId)

    const { data, error } = await supabase.auth.mfa.challenge({ factorId })

    if (error) {
      console.error('❌ Error creating MFA challenge:', error)
      throw error
    }

    console.log('✅ MFA challenge created successfully')
    return data

  } catch (error) {
    console.error('💥 MFA challenge creation error:', error)
    throw error
  }
}

/**
 * Verify MFA challenge with user's code
 */
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

    console.log('✅ MFA verification successful - session established')
    return {
      success: true,
      user: data.user,
      session: data.session
    }

  } catch (error) {
    console.error('💥 MFA verification error:', error)
    throw error
  }
}

/**
 * Get user's MFA factors
 */
export async function getUserMFAFactors() {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors()
    
    if (error) {
      console.error('❌ Error listing MFA factors:', error)
      return { factors: [], error }
    }

    return { 
      factors: data.all,
      totpFactors: data.totp,
      phoneFactors: data.phone || [],
      error: null 
    }
  } catch (error) {
    console.error('💥 Error getting MFA factors:', error)
    return { factors: [], error }
  }
}

/**
 * Enroll a new TOTP factor
 */
export async function enrollTOTPFactor(friendlyName = 'Authenticator App') {
  try {
    console.log('🔐 Enrolling new TOTP factor')

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName
    })

    if (error) {
      console.error('❌ Error enrolling TOTP factor:', error)
      throw error
    }

    console.log('✅ TOTP factor enrollment started')
    return data

  } catch (error) {
    console.error('💥 TOTP enrollment error:', error)
    throw error
  }
}

/**
 * Verify and finalize TOTP factor enrollment
 */
export async function verifyTOTPEnrollment(factorId, code) {
  try {
    console.log('🔐 Verifying TOTP enrollment')

    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code
    })

    if (error) {
      console.error('❌ TOTP enrollment verification failed:', error)
      throw error
    }

    console.log('✅ TOTP factor verified and enrolled successfully')
    return data

  } catch (error) {
    console.error('💥 TOTP enrollment verification error:', error)
    throw error
  }
}

/**
 * Unenroll (remove) an MFA factor
 */
export async function unenrollMFAFactor(factorId) {
  try {
    console.log('🔐 Unenrolling MFA factor:', factorId)

    const { data, error } = await supabase.auth.mfa.unenroll({ factorId })

    if (error) {
      console.error('❌ Error unenrolling MFA factor:', error)
      throw error
    }

    console.log('✅ MFA factor unenrolled successfully')
    return data

  } catch (error) {
    console.error('💥 MFA unenrollment error:', error)
    throw error
  }
}
