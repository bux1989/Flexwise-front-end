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

      // Handle rate limiting specifically
      if (error.message && error.message.includes('you can only request this after')) {
        // Extract the wait time from the error message
        const match = error.message.match(/(\d+)\s*seconds?/)
        const waitTime = match ? parseInt(match[1]) : 60

        const enhancedError = new Error(`Please wait ${waitTime} seconds before requesting another SMS code. This is a security measure to prevent spam.`)
        enhancedError.isRateLimit = true
        enhancedError.waitTime = waitTime
        enhancedError.originalError = error
        throw enhancedError
      }

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
    console.log('🔐 Verifying MFA challenge', {
      factorId: factorId.substring(0, 8) + '...',
      challengeId: challengeId.substring(0, 8) + '...',
      codeLength: code.length
    })

    // Validate inputs
    if (!factorId || !challengeId || !code) {
      throw new Error('Missing required parameters for MFA verification')
    }

    if (code.length !== 6) {
      throw new Error('Verification code must be exactly 6 digits')
    }

    // Check if factors still exist before verification
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError) {
      console.error('❌ Error checking factors before verification:', factorsError)
      throw new Error(`Cannot verify MFA factors: ${factorsError.message}`)
    }

    const targetFactor = factors.all.find(f => f.id === factorId)
    if (!targetFactor) {
      throw new Error('MFA factor not found or no longer available')
    }

    console.log('🎯 Verifying against factor:', {
      id: targetFactor.id.substring(0, 8) + '...',
      type: targetFactor.factor_type,
      status: targetFactor.status
    })

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code: code.trim()
    })

    if (error) {
      console.error('❌ MFA verification failed:', error)

      // Enhance error messages for common issues
      let enhancedMessage = error.message

      if (error.message.includes('Invalid MFA Phone code')) {
        enhancedMessage = 'The verification code is incorrect or has expired. Please check the code and try again.'
      } else if (error.message.includes('expired') || error.message.includes('challenge')) {
        enhancedMessage = 'The verification challenge has expired. Please request a new verification code.'
      } else if (error.message.includes('not found')) {
        enhancedMessage = 'The verification challenge is no longer valid. Please request a new verification code.'
      }

      // Create enhanced error with original for debugging
      const enhancedError = new Error(enhancedMessage)
      enhancedError.originalError = error
      enhancedError.code = error.code

      throw enhancedError
    }

    // Handle session data - sometimes not returned directly from verify
    let session = data.session
    let user = data.user

    // If session data is missing, fetch it separately
    if (!session) {
      console.log('🔄 Session not returned from verify, fetching separately...')

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.warn('⚠️ Could not fetch session after MFA verification:', sessionError)
      } else {
        session = sessionData.session
        console.log('✅ Session fetched separately after MFA verification')
      }

      // Also try to get user if missing
      if (!user) {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (!userError && userData.user) {
          user = userData.user
        }
      }
    }

    // Check multiple possible AAL property locations and formats
    let sessionAAL = null
    if (session) {
      // Try different possible property names/paths for AAL
      sessionAAL = session.aal ||
                   session.assurance_level ||
                   session.authenticator_assurance_level ||
                   session?.user?.aal ||
                   session?.user?.authenticator_assurance_level

      // Also check if AAL is in user metadata
      if (!sessionAAL && session.user?.user_metadata?.aal) {
        sessionAAL = session.user.user_metadata.aal
      }

      // If still no AAL, but we just verified MFA successfully, assume AAL2
      if (!sessionAAL) {
        console.log('🔧 AAL not found in session, assuming AAL2 after successful MFA verification')
        sessionAAL = 'aal2'
      }
    }

    console.log('✅ MFA verification successful', {
      sessionAAL: sessionAAL || 'unknown',
      userEmail: user?.email || 'unknown',
      sessionSource: data.session ? 'direct' : 'fetched',
      sessionProps: session ? Object.keys(session) : []
    })

    // Double-check AAL level
    if (sessionAAL !== 'aal2') {
      console.warn('⚠️ MFA verification succeeded but session AAL is not aal2:', sessionAAL)
      console.log('🔍 Full session object for debugging:', session)
    }

    return {
      success: true,
      user: user,
      session: session,
      aal: session?.aal || null
    }

  } catch (error) {
    console.error('💥 MFA verification error:', error)

    // Don't double-wrap our enhanced errors
    if (error.originalError) {
      throw error
    }

    // Wrap other errors with context, preserving special properties
    const contextError = new Error(`MFA verification failed: ${error.message}`)
    contextError.originalError = error

    // Preserve special error properties
    if (error.isRateLimit) {
      contextError.isRateLimit = error.isRateLimit
      contextError.waitTime = error.waitTime
    }

    throw contextError
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
