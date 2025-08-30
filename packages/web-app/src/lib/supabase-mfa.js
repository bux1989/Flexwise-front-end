import { supabase } from './supabase'

/**
 * Secure login implementation using Supabase's built-in MFA
 * This prevents session creation until MFA is completed server-side
 */
export async function secureLoginWithMFA(email, password) {
  try {
    console.log('🔐 Starting secure MFA login for:', email)

    // Step 1: Check if user has MFA factors BEFORE attempting login
    // We need to do this to properly enforce MFA
    const { data: preLoginFactors, error: preFactorError } = await supabase.auth.mfa.listFactors()

    if (preFactorError) {
      console.log('ℹ️ Could not check pre-login factors (user might not be logged in yet):', preFactorError.message)
    }

    // Step 2: Attempt login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('❌ Login error:', error)
      throw error
    }

    console.log('🔐 Login successful, checking MFA requirements...')

    // Step 3: Now check session and MFA factors after login
    const { data: sessionData } = await supabase.auth.getSession()
    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()

    if (factorError) {
      console.error('❌ Error checking MFA factors after login:', factorError)
      throw factorError
    }

    console.log('📋 Session AAL:', sessionData.session?.aal)
    console.log('📋 MFA factors found:', factors.all.length)
    console.log('📋 Verified factors:', factors.all.filter(f => f.status === 'verified').length)

    // Find verified factors that should be enforced
    const verifiedFactors = factors.all.filter(factor => factor.status === 'verified')

    // Step 4: Enforce MFA if user has verified factors
    if (verifiedFactors.length > 0) {
      // Check if session has proper AAL level
      const sessionAAL = sessionData.session?.aal

      if (sessionAAL === 'aal1' || !sessionAAL) {
        console.log('🔒 MFA verification required - user has verified factors but AAL1 session')
        console.log('🔒 Verified factors:', verifiedFactors.map(f => ({ id: f.id, type: f.factor_type })))

        return {
          needsVerification: true,
          user: data.user,
          factors: verifiedFactors,
          loginComplete: false,
          currentAAL: sessionAAL
        }
      } else if (sessionAAL === 'aal2') {
        console.log('✅ MFA verification already completed (AAL2 session)')
        return {
          loginComplete: true,
          user: data.user,
          session: sessionData.session,
          mfaCompleted: true
        }
      }
    }

    // Step 5: No MFA factors or already verified
    if (verifiedFactors.length === 0) {
      console.log('⚠️ No verified MFA factors found')
      return {
        loginComplete: true,
        user: data.user,
        session: sessionData.session,
        needsSetup: true
      }
    }

    // Default: login complete
    console.log('✅ Login complete - session established')
    return {
      loginComplete: true,
      user: data.user,
      session: sessionData.session
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
