import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, User, Save, Camera, Lock, Smartphone, Shield, Mail, MessageSquare, Monitor, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DebugOverlay } from '../debug';
import { supabase, getCurrentUserProfile, userRequires2FA, userHas2FAEnabled } from '../lib/supabase';
import { SensitiveAction2FA } from './SensitiveAction2FA';

interface EditProfileProps {
  onClose: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

interface StaffProfile {
  // Personal Information
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  profile_picture_url: string;
  
  // Professional Information
  skills: string[];
  kurzung: string; // Teacher abbreviation
  subjects_stud: string[]; // Subjects studied/qualified
  
  // Contact Information
  contacts: {
    emails: Array<{ id: string; type: string; value: string; is_primary: boolean }>;
    phones: Array<{ id: string; type: string; value: string; is_primary: boolean }>;
    addresses: Array<{ id: string; type: string; value: string; is_primary: boolean }>;
  };
}

export function EditProfile({ onClose, user }: EditProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Form state
  const [profile, setProfile] = useState<StaffProfile>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    profile_picture_url: '',
    skills: [],
    kurzung: '',
    subjects_stud: [],
    contacts: {
      emails: [],
      phones: [],
      addresses: []
    }
  });

  // Temporary skill/subject inputs
  const [newSkill, setNewSkill] = useState('');
  const [newSubject, setNewSubject] = useState('');

  // OTP state
  const [showOtpSetup, setShowOtpSetup] = useState(false);
  const [otpMethod, setOtpMethod] = useState<'email' | 'sms' | 'totp' | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpPhone, setOtpPhone] = useState('');
  const [isOtpEnabled, setIsOtpEnabled] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrCode, setTotpQrCode] = useState('');
  const [isEnrollingTotp, setIsEnrollingTotp] = useState(false);

  // Store school_id from profile data (for security)
  const [userSchoolId, setUserSchoolId] = useState<string | null>(null);

  // Store auth user email to protect it from deletion
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null);

  // Track if we're currently creating contact to prevent race conditions
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  // Trusted devices state
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Sensitive action 2FA state
  const [showSensitive2FA, setShowSensitive2FA] = useState(false);
  const [pendingSensitiveAction, setPendingSensitiveAction] = useState(null);

  // Global contact creation tracker to prevent multiple instances from creating duplicates
  const getContactCreationKey = (profileId: string, email: string) => `creating_${profileId}_${email}`;

  const isGloballyCreatingContact = (profileId: string, email: string) => {
    const key = getContactCreationKey(profileId, email);
    return localStorage.getItem(key) === 'true';
  };

  const setGloballyCreatingContact = (profileId: string, email: string, isCreating: boolean) => {
    const key = getContactCreationKey(profileId, email);
    if (isCreating) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  };

  // Load profile data from Supabase
  useEffect(() => {
    loadProfileData();
    checkOtpStatus();
  }, [user]);

  // Helper function to map database contact types to German display labels
  const getContactTypeLabel = (type: string, contactCategory: 'emails' | 'phones' | 'addresses') => {
    if (contactCategory === 'emails') {
      switch (type.toLowerCase()) {
        case 'email':
        case 'work':
        case 'arbeit': return 'Arbeit';
        case 'private':
        case 'privat': return 'Privat';
        default: return 'Privat';
      }
    } else if (contactCategory === 'phones') {
      switch (type.toLowerCase()) {
        case 'phone':
        case 'mobile':
        case 'mobil': return 'Mobil';
        case 'landline':
        case 'festnetz': return 'Festnetz';
        case 'work':
        case 'arbeit': return 'Arbeit';
        default: return 'Mobil';
      }
    } else if (contactCategory === 'addresses') {
      switch (type.toLowerCase()) {
        case 'address':
        case 'home':
        case 'wohnadresse': return 'Wohnadresse';
        case 'work':
        case 'arbeitsadresse': return 'Arbeitsadresse';
        case 'emergency':
        case 'notfallkontakt': return 'Notfallkontakt';
        default: return 'Wohnadresse';
      }
    }
    return type;
  };

  const loadProfileData = async () => {
    try {
      // Get current user auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get profile ID from user metadata
      const profileId = authUser.user_metadata?.profile_id;
      if (!profileId) return;

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      // Store school_id from profile data for security
      setUserSchoolId(profileData?.school_id || null);

      // Load staff info
      const { data: staffData, error: staffError } = await supabase
        .from('profile_info_staff')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (staffError && staffError.code !== 'PGRST116') { // Ignore "not found" error
        console.error('Error loading staff info:', staffError);
      }

      // Load contacts (include school_id for RLS compliance)
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('profile_id', profileId)
        .eq('school_id', profileData?.school_id)
        .order('created_at', { ascending: true });

      if (contactsError) {
        console.error('Error loading contacts:', contactsError);
      }

      // Organize contacts by type
      const organizedContacts = {
        emails: [],
        phones: [],
        addresses: []
      };

      contactsData?.forEach(contact => {
        let contactCategory: 'emails' | 'phones' | 'addresses';
        if (contact.type === 'email') {
          contactCategory = 'emails';
        } else if (contact.type === 'phone') {
          contactCategory = 'phones';
        } else if (contact.type === 'address') {
          contactCategory = 'addresses';
        } else {
          return; // Skip unknown types
        }

        const contactItem = {
          id: contact.id,
          type: getContactTypeLabel(contact.label || contact.type, contactCategory),
          value: contact.value,
          is_primary: contact.is_primary
        };

        organizedContacts[contactCategory].push(contactItem);
      });

      // Auto-create contact record from auth email if it doesn't exist (with duplicate prevention)
      const authEmailExists = contactsData?.some(contact =>
        contact.type === 'email' && contact.value === authUser.email
      );

      if (!authEmailExists && authUser.email && !isCreatingContact && !isGloballyCreatingContact(profileId, authUser.email)) {
        setIsCreatingContact(true);
        setGloballyCreatingContact(profileId, authUser.email, true);

        try {
          // Double-check for duplicates before inserting
          const { data: existingContacts, error: checkError } = await supabase
            .from('contacts')
            .select('*')
            .eq('profile_id', profileId)
            .eq('type', 'email')
            .eq('value', authUser.email);

          if (checkError) {
            console.error('Error checking existing contacts:', checkError);
            setIsCreatingContact(false);
            setGloballyCreatingContact(profileId, authUser.email, false);
            return;
          }

          if (existingContacts && existingContacts.length > 0) {
            setIsCreatingContact(false);
            setGloballyCreatingContact(profileId, authUser.email, false);
            return;
          }

          const { error: insertError } = await supabase
            .from('contacts')
            .insert({
              profile_id: profileId,
              profile_type: 'staff',
              type: 'email',
              label: 'Arbeit',
              value: authUser.email,
              is_primary: true,
              is_linked_to_user_login: true,
              school_id: profileData?.school_id
            });

          if (insertError) {
            console.error('Error creating contact from auth email:', insertError);
            setIsCreatingContact(false);
            setGloballyCreatingContact(profileId, authUser.email, false);
          } else {
            // Reload contacts after creating
            const { data: newContactsData } = await supabase
              .from('contacts')
              .select('*')
              .eq('profile_id', profileId)
              .eq('school_id', profileData?.school_id)
              .order('created_at', { ascending: true });

            // Re-organize contacts with new data
            if (newContactsData) {
              organizedContacts.emails = [];
              organizedContacts.phones = [];
              organizedContacts.addresses = [];

              newContactsData.forEach(contact => {
                let contactCategory: 'emails' | 'phones' | 'addresses';
                if (contact.type === 'email') {
                  contactCategory = 'emails';
                } else if (contact.type === 'phone') {
                  contactCategory = 'phones';
                } else if (contact.type === 'address') {
                  contactCategory = 'addresses';
                } else {
                  return;
                }

                const contactItem = {
                  id: contact.id,
                  type: getContactTypeLabel(contact.label || contact.type, contactCategory),
                  value: contact.value,
                  is_primary: contact.is_primary
                };

                organizedContacts[contactCategory].push(contactItem);
              });
            }
            setIsCreatingContact(false);
            setGloballyCreatingContact(profileId, authUser.email, false);
          }
        } catch (error) {
          console.error('Error auto-creating contact:', error);
          setIsCreatingContact(false);
          setGloballyCreatingContact(profileId, authUser.email, false);
        }
      }

      // Set profile state with real or fallback data
      setProfile({
        first_name: profileData?.first_name || 'Clarissa',
        last_name: profileData?.last_name || 'Döbel',
        date_of_birth: profileData?.date_of_birth || '1985-05-15',
        gender: profileData?.gender || 'Weiblich',
        profile_picture_url: profileData?.profile_picture_url || '',
        skills: staffData?.skills || ['Mathematik', 'Deutsch', 'Klassenleitung'],
        kurzung: staffData?.kurzung || 'CD',
        subjects_stud: staffData?.subjects_stud || ['Mathematik', 'Physik'],
        contacts: organizedContacts
      });

    } catch (error) {
      console.error('Error loading profile data:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const profileId = authUser.user_metadata?.profile_id;
      if (!profileId) return;

      // Save everything using PostgreSQL function (profile, staff, and contacts)
      await saveProfileWithFunction(profileId);

      setIsEditing(false);

      // Show success message (you might want to add a toast notification here)

    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Fehler beim Speichern: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfileWithFunction = async (profileId: string) => {
    try {
      // Get auth user email to preserve login connection
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const authEmail = authUser?.email;

      // Prepare profile data
      const profileData = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender || null,
        profile_picture_url: profile.profile_picture_url || null
      };

      // Prepare staff data
      const staffData = {
        skills: profile.skills,
        kurzung: profile.kurzung || null,
        subjects_stud: profile.subjects_stud
      };

      // Find primary phone number for auth user sync
      const primaryPhone = profile.contacts.phones.find(phone => phone.is_primary);

      // Prepare contacts data with IDs and proper format
      const contactsData = [];

      profile.contacts.emails.forEach(email => {
        contactsData.push({
          id: email.id,
          type: 'email',
          label: email.type,
          value: email.value,
          is_primary: email.is_primary,
          is_linked_to_user_login: email.value === authEmail
        });
      });

      profile.contacts.phones.forEach(phone => {
        contactsData.push({
          id: phone.id,
          type: 'phone',
          label: phone.type,
          value: phone.value,
          is_primary: phone.is_primary,
          is_linked_to_user_login: false
        });
      });

      profile.contacts.addresses.forEach(address => {
        contactsData.push({
          id: address.id,
          type: 'address',
          label: address.type,
          value: address.value,
          is_primary: address.is_primary,
          is_linked_to_user_login: false
        });
      });

      // Step 1: Update auth user's phone number if there's a primary phone
      if (primaryPhone?.value) {
        const formattedPhone = formatPhoneNumber(primaryPhone.value);
        console.log('Syncing auth user phone number:', formattedPhone);

        const { error: phoneUpdateError } = await supabase.auth.updateUser({
          phone: formattedPhone
        });

        if (phoneUpdateError) {
          console.warn('Warning: Could not update auth user phone number:', phoneUpdateError);
          // Don't fail the entire save operation, just warn
        } else {
          console.log('✅ Auth user phone number synced successfully');
        }
      }

      // Step 2: Call the PostgreSQL function to save profile and contacts
      const { data, error } = await supabase.rpc('save_user_profile_complete_react', {
        p_profile_id: profileId,
        p_profile_data: profileData,
        p_staff_data: staffData,
        p_contacts: contactsData
      });

      if (error) {
        console.error('PostgreSQL function error:', error);
        throw new Error('Failed to save profile: ' + error.message);
      }

      return data;

    } catch (error) {
      console.error('Error in saveProfileWithFunction:', error);
      throw error;
    }
  };

  const saveContacts = async (profileId: string) => {
    try {
      // Use school_id from profile data (secure)

      if (!userSchoolId) {
        throw new Error('School ID not found in user profile data');
      }

      // Delete existing contacts and re-insert (simple approach)
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .eq('profile_id', profileId);

      if (deleteError) {
        console.error('Error deleting contacts:', deleteError);
        throw new Error('Failed to delete old contacts: ' + deleteError.message);
      }

      // Prepare new contacts
      const contactsToInsert = [];

      profile.contacts.emails.forEach(email => {
        contactsToInsert.push({
          profile_id: profileId,
          profile_type: 'staff',
          type: 'email',
          label: email.type,
          value: email.value,
          is_primary: email.is_primary,
          school_id: userSchoolId // Use actual school_id from profile data
        });
      });

      profile.contacts.phones.forEach(phone => {
        contactsToInsert.push({
          profile_id: profileId,
          profile_type: 'staff',
          type: 'phone',
          label: phone.type,
          value: phone.value,
          is_primary: phone.is_primary,
          school_id: userSchoolId // Use actual school_id from profile data
        });
      });

      profile.contacts.addresses.forEach(address => {
        contactsToInsert.push({
          profile_id: profileId,
          profile_type: 'staff',
          type: 'address',
          label: address.type,
          value: address.value,
          is_primary: address.is_primary,
          school_id: userSchoolId // Use actual school_id from profile data
        });
      });

      // Insert new contacts
      if (contactsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('contacts')
          .insert(contactsToInsert);

        if (insertError) {
          console.error('Error inserting contacts:', insertError);
          throw new Error('Failed to insert contacts: ' + insertError.message);
        }
      }
    } catch (error) {
      console.error('Error in saveContacts:', error);
      throw error;
    }
  };

  // Check if user has OTP/MFA enabled
  const checkOtpStatus = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Check if user has any MFA factors enrolled
      const { data: factors, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        console.error('Error checking MFA status:', error);
        return;
      }

      // Check for any verified MFA factors (TOTP or phone/SMS)
      const hasVerifiedFactors = factors.totp.some(factor => factor.status === 'verified') ||
                                factors.phone?.some(factor => factor.status === 'verified') ||
                                (authUser.phone_confirmed_at && authUser.phone);

      setIsOtpEnabled(hasVerifiedFactors);
    } catch (error) {
      console.error('Error checking OTP status:', error);
    }
  };

  // Setup TOTP (authenticator app)
  const setupTotp = async () => {
    setIsEnrollingTotp(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        alert('Kein authentifizierter Benutzer gefunden. Bitte melden Sie sich erneut an.');
        return;
      }

      console.log('Setting up TOTP for user:', authUser.email);

      // Generate TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Flexwise 2FA - ${authUser.email}`
      });

      console.log('TOTP enrollment result:', { data, error });

      if (error) {
        console.error('Error enrolling TOTP:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusCode: error.statusCode
        });

        if (error.message.includes('already enrolled') || error.message.includes('factor already exists')) {
          alert('Sie haben bereits eine Authenticator-App eingerichtet. Deaktivieren Sie zuerst die bestehende 2FA und versuchen Sie es erneut.');
        } else if (error.message.includes('not allowed') || error.message.includes('disabled')) {
          alert('2FA ist für dieses Konto nicht verfügbar. Kontaktieren Sie den Administrator.');
        } else {
          alert('Fehler beim Einrichten der Authenticator-App: ' + error.message);
        }
        return;
      }

      if (!data || !data.totp) {
        console.error('No TOTP data received:', data);
        alert('Keine TOTP-Daten erhalten. Bitte versuchen Sie es erneut.');
        return;
      }

      console.log('TOTP data received:', {
        hasSecret: !!data.totp.secret,
        hasQrCode: !!data.totp.qr_code,
        secretLength: data.totp.secret?.length
      });

      setTotpSecret(data.totp.secret);
      setTotpQrCode(data.totp.qr_code);
      setOtpMethod('totp');

      alert('QR-Code generiert! Scannen Sie ihn mit Ihrer Authenticator-App (Google Authenticator, Authy, etc.) und geben Sie dann den 6-stelligen Code ein.');

    } catch (error) {
      console.error('Error setting up TOTP:', error);
      alert('Unerwarteter Fehler beim Einrichten der Authenticator-App. Bitte versuchen Sie es erneut.');
    } finally {
      setIsEnrollingTotp(false);
    }
  };

  // Send OTP code via email
  const sendEmailOtp = async () => {
    setIsSendingOtp(true);
    try {
      const email = otpEmail || profile.contacts.emails.find(e => e.is_primary)?.value;
      if (!email) {
        alert('Keine E-Mail-Adresse gefunden. Bitte geben Sie eine E-Mail-Adresse ein.');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Ungültiges E-Mail-Format. Bitte geben Sie eine gültige E-Mail-Adresse ein.');
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false // Don't create new user, just send OTP
        }
      });

      if (error) {
        console.error('Error sending email OTP:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusCode: error.statusCode
        });

        // Provide more specific error messages
        if (error.message.includes('Signups not allowed for otp') || error.message.includes('422')) {
          alert('E-Mail-OTP ist nicht verfügbar. Bitte verwenden Sie stattdessen die Authenticator-App.');
        } else if (error.message.includes('rate limit')) {
          alert('Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.');
        } else if (error.message.includes('invalid')) {
          alert('Ungültige E-Mail-Adresse. Bitte überprüfen Sie Ihre Eingabe.');
        } else {
          alert('E-Mail-OTP ist nicht verfügbar. Bitte verwenden Sie die Authenticator-App.');
        }
      } else {
        alert(`OTP-Code wurde an ${email} gesendet!`);
        setOtpMethod('email');
      }
    } catch (error) {
      console.error('Error sending email OTP:', error);
      alert('Fehler beim Senden der E-Mail: ' + error.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Helper function to format phone number to E.164 format
  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // If it starts with 00, replace with +
    if (cleaned.startsWith('00')) {
      return '+' + cleaned.substring(2);
    }

    // If it starts with 0 (German format), add German country code
    if (cleaned.startsWith('0') && cleaned.length >= 10) {
      return '+49' + cleaned.substring(1);
    }

    // If it doesn't start with +, assume German number and add country code
    if (!phone.startsWith('+')) {
      return '+49' + cleaned;
    }

    return phone;
  };

  // Send OTP code via SMS
  const sendSmsOtp = async () => {
    setIsSendingOtp(true);
    try {
      const rawPhone = otpPhone || profile.contacts.phones.find(p => p.is_primary)?.value;
      if (!rawPhone) {
        alert('Keine Telefonnummer gefunden. Bitte geben Sie eine Telefonnummer ein.');
        return;
      }

      // Format phone number to E.164 format
      const formattedPhone = formatPhoneNumber(rawPhone);

      console.log('Debug SMS OTP:', {
        rawPhone,
        formattedPhone,
        isValidFormat: /^\+[1-9]\d{1,14}$/.test(formattedPhone)
      });

      // Validate phone number format
      if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
        alert('Ungültiges Telefonnummer-Format. Bitte verwenden Sie das internationale Format (z.B. +49123456789).');
        return;
      }

      // Step 1: First update the user's phone number in their auth profile
      console.log('Step 1: Updating user phone number in auth profile...');
      const { error: updateError } = await supabase.auth.updateUser({
        phone: formattedPhone
      });

      if (updateError) {
        console.error('Error updating user phone:', updateError);
        alert(`Fehler beim Aktualisieren der Telefonnummer: ${updateError.message}`);
        return;
      }

      console.log('✅ Phone number updated in auth profile');

      // Step 2: Now send OTP to the updated phone number
      console.log('Step 2: Sending SMS OTP to updated phone number...');
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone
      });

      if (error) {
        console.error('Error sending SMS OTP:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusCode: error.statusCode
        });

        // Provide specific error messages based on the actual error
        if (error.message.includes('Unable to get SMS provider')) {
          alert(`🔧 TWILIO KONFIGURATION PROBLEM:

Ihre Twilio-Konfiguration ist unvollständig!

PROBLEM: GOTRUE_SMS_TWILIO_MESSAGE_SERVICE_SID ist leer

LÖSUNG - Option 1 (Empfohlen): Message Service verwenden
1. Gehe zu Twilio Console → Messaging → Services
2. Erstelle einen neuen Message Service
3. Kopiere die Message Service SID
4. Setze: GOTRUE_SMS_TWILIO_MESSAGE_SERVICE_SID="MGxxxxxxxxxxxx"

LÖSUNG - Option 2: Twilio Phone Number verwenden
1. Kaufe eine Twilio Telefonnummer
2. Setze: GOTRUE_SMS_TWILIO_PHONE="+1234567890"
3. Lasse GOTRUE_SMS_TWILIO_MESSAGE_SERVICE_SID=""

NACH DER KONFIGURATION:
1. Restart GoTrue Service
2. Test SMS OTP erneut

Status: Telefonnummer (${formattedPhone}) ist mit dem Benutzer verknüpft ✅
Fehler: Twilio Message Service SID oder Phone Number fehlt ❌

Aktuelle Config zeigt: MESSAGE_SERVICE_SID ist leer`);
        } else if (error.message.includes('Signups not allowed for otp')) {
          alert('SMS OTP ist in der Supabase-Konfiguration deaktiviert. Der Administrator muss in den Supabase Auth-Einstellungen "Enable phone signup" aktivieren.');
        } else if (error.message.includes('Phone number is invalid') || error.message.includes('422')) {
          alert(`Ungültiges Telefonnummer-Format: ${formattedPhone}\nBitte verwenden Sie das internationale Format (z.B. +4915912345678)`);
        } else if (error.message.includes('rate limit')) {
          alert('Zu viele SMS-Anfragen. Bitte warten Sie 60 Sekunden und versuchen Sie es erneut.');
        } else if (error.message.includes('SMS provider') || error.message.includes('Twilio')) {
          alert('SMS-Provider ist nicht konfiguriert. Der Administrator muss Twilio oder einen anderen SMS-Service in Supabase einrichten.');
        } else {
          alert(`SMS-OTP Fehler: ${error.message}\n\nBitte kontaktieren Sie den Administrator oder prüfen Sie die Twilio-Konfiguration in Supabase.`);
        }
      } else {
        console.log('✅ SMS OTP sent successfully');
        alert(`✅ SMS OTP-Code wurde an ${formattedPhone} gesendet!`);
        setOtpMethod('sms');
      }
    } catch (error) {
      console.error('Error in SMS OTP process:', error);
      alert(`Unerwarteter Fehler: ${error.message}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP code
  const verifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert('Bitte geben Sie einen gültigen 6-stelligen Code ein.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      if (otpMethod === 'email') {
        const email = otpEmail || profile.contacts.emails.find(e => e.is_primary)?.value;
        const { error } = await supabase.auth.verifyOtp({
          email: email,
          token: otpCode,
          type: 'email'
        });

        if (error) {
          console.error('Error verifying email OTP:', error);
          alert('Ung��ltiger Code. Bitte versuchen Sie es erneut.');
        } else {
          alert('E-Mail-OTP erfolgreich aktiviert!');
          setIsOtpEnabled(true);
          setShowOtpSetup(false);
          setOtpCode('');
        }
      } else if (otpMethod === 'sms') {
        const rawPhone = otpPhone || profile.contacts.phones.find(p => p.is_primary)?.value;
        const formattedPhone = formatPhoneNumber(rawPhone);

        console.log('Verifying SMS OTP:', {
          rawPhone,
          formattedPhone,
          code: otpCode
        });

        const { error } = await supabase.auth.verifyOtp({
          phone: formattedPhone,
          token: otpCode,
          type: 'sms'
        });

        if (error) {
          console.error('Error verifying SMS OTP:', error);
          console.error('SMS verification error details:', {
            message: error.message,
            status: error.status,
            statusCode: error.statusCode
          });

          if (error.message.includes('expired')) {
            alert('Der SMS-Code ist abgelaufen. Bitte fordern Sie einen neuen Code an.');
          } else if (error.message.includes('invalid') || error.message.includes('Invalid')) {
            alert('Ungültiger SMS-Code. Bitte überprüfen Sie:\n• Den 6-stelligen Code korrekt eingegeben\n• Der Code ist noch gültig (nicht älter als 10 Minuten)');
          } else if (error.message.includes('too many')) {
            alert('Zu viele Versuche. Bitte warten Sie und fordern Sie einen neuen Code an.');
          } else {
            alert(`SMS-Verifizierung fehlgeschlagen: ${error.message}`);
          }
        } else {
          console.log('SMS OTP verification successful');
          alert('🎉 SMS-OTP erfolgreich aktiviert! Zwei-Faktor-Authentifizierung ist jetzt über SMS aktiv.');
          setIsOtpEnabled(true);
          setShowOtpSetup(false);
          setOtpCode('');
        }
      } else if (otpMethod === 'totp') {
        // Verify TOTP enrollment
        console.log('Verifying TOTP with code:', otpCode);

        const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();

        if (factorsError) {
          console.error('Error listing factors:', factorsError);
          alert('Fehler beim Abrufen der 2FA-Faktoren: ' + factorsError.message);
          return;
        }

        console.log('Available factors:', factors);
        const totpFactor = factors?.totp.find(factor => factor.status === 'unverified');

        if (!totpFactor) {
          console.error('No unverified TOTP factor found. Available factors:', factors?.totp);
          alert('Kein TOTP-Faktor zum Verifizieren gefunden. Bitte starten Sie den Einrichtungsprozess erneut.');
          return;
        }

        console.log('Verifying factor:', totpFactor.id);

        const { error } = await supabase.auth.mfa.verify({
          factorId: totpFactor.id,
          code: otpCode
        });

        if (error) {
          console.error('Error verifying TOTP:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            statusCode: error.statusCode
          });

          if (error.message.includes('expired')) {
            alert('Der Code ist abgelaufen. Generieren Sie einen neuen Code in Ihrer Authenticator-App.');
          } else if (error.message.includes('invalid') || error.message.includes('Invalid code')) {
            alert('Ungültiger Code. Stellen Sie sicher, dass:\n• Die Uhrzeit auf Ihrem Gerät korrekt ist\n• Sie den aktuellsten 6-stelligen Code verwenden\n• Die App korrekt eingerichtet wurde');
          } else {
            alert('Fehler bei der Verifizierung: ' + error.message);
          }
        } else {
          console.log('TOTP verification successful');
          alert('🎉 Authenticator-App erfolgreich eingerichtet! Ihre Zwei-Faktor-Authentifizierung ist jetzt aktiv.');
          setIsOtpEnabled(true);
          setShowOtpSetup(false);
          setOtpCode('');
          setTotpSecret('');
          setTotpQrCode('');
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Fehler bei der Verifizierung: ' + error.message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Disable OTP
  const disableOtp = async () => {
    if (!confirm('Möchten Sie die Zwei-Faktor-Authentifizierung wirklich deaktivieren?')) {
      return;
    }

    try {
      // List and unenroll all MFA factors
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      for (const factor of factors.totp) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factor.id
        });
        if (error) throw error;
      }

      setIsOtpEnabled(false);
      alert('Zwei-Faktor-Authentifizierung wurde deaktiviert.');
    } catch (error) {
      console.error('Error disabling OTP:', error);
      alert('Fehler beim Deaktivieren: ' + error.message);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addSubject = () => {
    if (newSubject.trim() && !profile.subjects_stud.includes(newSubject.trim())) {
      setProfile(prev => ({
        ...prev,
        subjects_stud: [...prev.subjects_stud, newSubject.trim()]
      }));
      setNewSubject('');
    }
  };

  const removeSubject = (subjectToRemove: string) => {
    setProfile(prev => ({
      ...prev,
      subjects_stud: prev.subjects_stud.filter(subject => subject !== subjectToRemove)
    }));
  };

  const addContact = (type: 'emails' | 'phones' | 'addresses') => {
    const newContact = {
      id: `temp_${Date.now()}`, // Temporary ID for new contacts
      type: type === 'emails' ? 'Privat' : type === 'phones' ? 'Mobil' : 'Wohnadresse',
      value: '',
      is_primary: profile.contacts[type].length === 0 // First contact is primary by default
    };

    setProfile(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [type]: [...prev.contacts[type], newContact]
      }
    }));
  };

  const updateContact = (type: 'emails' | 'phones' | 'addresses', id: string, field: string, value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [type]: prev.contacts[type].map(contact => {
          // If setting this contact as primary, unset all others as primary
          if (field === 'is_primary' && value === true) {
            return contact.id === id
              ? { ...contact, [field]: value }
              : { ...contact, is_primary: false };
          }
          return contact.id === id ? { ...contact, [field]: value } : contact;
        })
      }
    }));
  };

  const removeContact = async (type: 'emails' | 'phones' | 'addresses', id: string) => {
    // Enhanced 2FA-integrated email protection
    if (type === 'emails') {
      const emailToDelete = profile.contacts.emails.find(email => email.id === id);

      // Get current auth user email to protect it
      const { data: { user: authUser } } = await supabase.auth.getUser();

      // Prevent deletion of auth user's login email
      if (emailToDelete?.value === authUser?.email) {
        alert('Diese E-Mail-Adresse kann nicht gelöscht werden, da sie für die Anmeldung verwendet wird.');
        return;
      }

      // Check 2FA status for additional protection
      if (isOtpEnabled && emailToDelete?.is_primary) {
        const confirmMessage = `Achtung: Sie haben Zwei-Faktor-Authentifizierung aktiviert.\n\nDas Löschen der primären E-Mail-Adresse kann Ihre 2FA-Einstellungen beeinträchtigen.\n\nSind Sie sicher, dass Sie fortfahren möchten?`;
        if (!confirm(confirmMessage)) {
          return;
        }

        // Log the security event for audit purposes
        console.warn('User deleted primary email while 2FA is enabled:', {
          deletedEmail: emailToDelete.value,
          authEmail: authUser?.email,
          mfaEnabled: isOtpEnabled,
          timestamp: new Date().toISOString()
        });
      }

      // Prevent deletion of primary email
      if (emailToDelete?.is_primary) {
        alert('Die primäre E-Mail-Adresse kann nicht gelöscht werden. Setzen Sie zunächst eine andere E-Mail als primär.');
        return;
      }

      // Also prevent deletion if it's the only email
      if (profile.contacts.emails.length <= 1) {
        alert('Sie müssen mindestens eine E-Mail-Adresse haben.');
        return;
      }
    }

    setProfile(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [type]: prev.contacts[type].filter(contact => contact.id !== id)
      }
    }));
  };

  // Trusted devices management functions
  const loadTrustedDevices = async () => {
    try {
      setLoadingDevices(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const profileId = authUser.user_metadata?.profile_id;
      if (!profileId) return;

      const { data: devices, error } = await supabase
        .from('user_trusted_devices')
        .select('*')
        .eq('user_profile_id', profileId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading trusted devices:', error);
        return;
      }

      setTrustedDevices(devices || []);
    } catch (error) {
      console.error('Error in loadTrustedDevices:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const removeTrustedDevice = async (deviceId) => {
    if (!confirm('Möchten Sie dieses vertrauenswürdige Gerät wirklich entfernen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_trusted_devices')
        .update({ is_active: false })
        .eq('id', deviceId);

      if (error) {
        console.error('Error removing trusted device:', error);
        alert('Fehler beim Entfernen des Geräts: ' + error.message);
        return;
      }

      // Reload devices list
      await loadTrustedDevices();
      alert('Gerät erfolgreich entfernt.');
    } catch (error) {
      console.error('Error in removeTrustedDevice:', error);
      alert('Fehler beim Entfernen des Geräts.');
    }
  };

  const removeAllTrustedDevices = async () => {
    if (!confirm('Möchten Sie wirklich alle vertrauenswürdigen Geräte entfernen? Sie müssen sich dann auf allen Geräten erneut mit 2FA anmelden.')) {
      return;
    }

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const profileId = authUser.user_metadata?.profile_id;
      if (!profileId) return;

      const { error } = await supabase
        .from('user_trusted_devices')
        .update({ is_active: false })
        .eq('user_profile_id', profileId);

      if (error) {
        console.error('Error removing all trusted devices:', error);
        alert('Fehler beim Entfernen der Geräte: ' + error.message);
        return;
      }

      // Reload devices list
      await loadTrustedDevices();
      alert('Alle Geräte erfolgreich entfernt.');
    } catch (error) {
      console.error('Error in removeAllTrustedDevices:', error);
      alert('Fehler beim Entfernen der Geräte.');
    }
  };

  // Load trusted devices when component mounts and when 2FA status changes
  useEffect(() => {
    if (isOtpEnabled) {
      loadTrustedDevices();
    }
  }, [isOtpEnabled]);

  const formatDeviceDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDeviceExpired = (trustedUntil) => {
    return new Date(trustedUntil) < new Date();
  };

  // Helper function to handle sensitive actions with 2FA
  const handleSensitiveAction = async (actionTitle, actionDescription, actionFunction) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Check if user has 2FA enabled and requires verification
      const userProfile = await getCurrentUserProfile();
      const requires2FA = await userRequires2FA(userProfile);
      const has2FA = await userHas2FAEnabled(authUser);

      if (requires2FA && has2FA) {
        // Show 2FA verification for sensitive action
        setPendingSensitiveAction({
          title: actionTitle,
          description: actionDescription,
          action: actionFunction,
          user: authUser
        });
        setShowSensitive2FA(true);
      } else {
        // Execute action directly if no 2FA required
        await actionFunction();
      }
    } catch (error) {
      console.error('Error in handleSensitiveAction:', error);
      alert('Fehler beim Überprüfen der Sicherheitsanforderungen.');
    }
  };

  const handleSensitive2FASuccess = async () => {
    setShowSensitive2FA(false);
    if (pendingSensitiveAction?.action) {
      try {
        await pendingSensitiveAction.action();
      } catch (error) {
        console.error('Error executing sensitive action:', error);
        alert('Fehler beim Ausführen der Aktion.');
      }
    }
    setPendingSensitiveAction(null);
  };

  const handleSensitive2FACancel = () => {
    setShowSensitive2FA(false);
    setPendingSensitiveAction(null);
  };

  // Modified password reset function with 2FA protection
  const handlePasswordReset = async () => {
    await handleSensitiveAction(
      'Passwort zurücksetzen',
      'Sie sind dabei, einen Passwort-Reset-Link anzufordern. Diese Aktion kann Ihr Konto betreffen.',
      async () => {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();

          if (!authUser?.email) {
            alert('Keine E-Mail-Adresse gefunden.');
            return;
          }

          // Get user's full name from current profile state
          const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();

          const { error } = await supabase.auth.resetPasswordForEmail(authUser.email, {
            redirectTo: `https://flexwise.io/auth/reset-password`,
            data: {
              USER_NAME: fullName || authUser.email  // Fallback to email if no name
            }
          });

          if (error) {
            console.error('Reset email error:', error);
            alert('Fehler beim Senden des Reset-Links: ' + error.message);
          } else {
            alert('Passwort-Reset-Link wurde an Ihre E-Mail-Adresse gesendet!');
          }
        } catch (error) {
          console.error('Password reset error:', error);
          alert('Fehler beim Senden des Reset-Links: ' + error.message);
        }
      }
    );
  };

  // Modified 2FA disable function with additional 2FA protection
  const handleDisable2FA = async () => {
    await handleSensitiveAction(
      'Zwei-Faktor-Authentifizierung deaktivieren',
      'Sie sind dabei, die Zwei-Faktor-Authentifizierung zu deaktivieren. Dies reduziert die Sicherheit Ihres Kontos erheblich.',
      async () => {
        try {
          // List and unenroll all MFA factors
          const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
          if (listError) throw listError;

          for (const factor of factors.totp) {
            const { error } = await supabase.auth.mfa.unenroll({
              factorId: factor.id
            });
            if (error) throw error;
          }

          setIsOtpEnabled(false);
          alert('Zwei-Faktor-Authentifizierung wurde deaktiviert.');
        } catch (error) {
          console.error('Error disabling OTP:', error);
          alert('Fehler beim Deaktivieren: ' + error.message);
        }
      }
    );
  };

  return (
    <DebugOverlay name="EditProfile">
      <div className="p-1 lg:p-6 min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-blue-600 text-white border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-white hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  {isEditing ? 'Profil bearbeiten' : 'Mein Profil'}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="border-white text-white hover:bg-blue-700"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-white text-blue-600 hover:bg-gray-100"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Speichern...' : 'Speichern'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Bearbeiten
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 h-12 bg-gray-100 p-1 rounded-lg border">
                <TabsTrigger
                  value="personal"
                  className="h-10 font-semibold text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:hover:bg-gray-200"
                >
                  Persönliche Daten
                </TabsTrigger>
                <TabsTrigger
                  value="professional"
                  className="h-10 font-semibold text-base data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800 data-[state=inactive]:hover:bg-gray-200"
                >
                  Berufliche Daten
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      Persönliche Informationen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Profile Picture and Inputs - Combined Flex Layout */}
                    <div className="flex flex-col lg:flex-row items-start gap-4 mb-4">
                      <div className="flex flex-col items-center justify-start my-auto">
                        <div className="w-[119px] h-[117px] bg-gray-100 rounded-full flex items-center justify-center">
                          {profile.profile_picture_url ? (
                            <img
                              src={profile.profile_picture_url}
                              alt="Profilbild"
                              className="w-[119px] h-[117px] rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        {isEditing && (
                          <Button variant="outline" size="sm" className="w-full lg:w-auto mt-3">
                            <Camera className="h-4 w-4 mr-2" />
                            Foto ändern
                          </Button>
                        )}
                      </div>

                      {/* All Input Fields in Aligned Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-grow w-auto -mr-[3px]">
                        <div className="space-y-2">
                          <Label htmlFor="first_name">Vorname</Label>
                          <Input
                            id="first_name"
                            value={profile.first_name}
                            onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50 text-slate-600 font-semibold" : "text-slate-600 font-semibold"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="last_name">Nachname</Label>
                          <Input
                            id="last_name"
                            value={profile.last_name}
                            onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50 text-slate-600 font-semibold" : "text-slate-600 font-semibold"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date_of_birth">Geburtsdatum</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={profile.date_of_birth}
                            onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50 text-slate-600 font-semibold" : "text-slate-600 font-semibold"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gender">Geschlecht</Label>
                          {isEditing ? (
                            <Select
                              value={profile.gender}
                              onValueChange={(value) => setProfile(prev => ({ ...prev, gender: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Geschlecht auswählen" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Männlich">Männlich</SelectItem>
                                <SelectItem value="Weiblich">Weiblich</SelectItem>
                                <SelectItem value="Divers">Divers</SelectItem>
                                <SelectItem value="Keine Angabe">Keine Angabe</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={profile.gender}
                              disabled
                              className="bg-gray-50 text-slate-600 font-semibold"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information - Compact Layout */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Kontaktinformationen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Email Addresses Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">E-Mail-Adressen</Label>
                        {isEditing && (
                          <Button onClick={() => addContact('emails')} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            E-Mail hinzufügen
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {profile.contacts.emails.map((email) => (
                          <div key={email.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-gray-50 rounded-lg items-end">
                            <div className="space-y-2">
                              <Label className="text-sm">Typ</Label>
                              {isEditing ? (
                                <Select
                                  value={email.type}
                                  onValueChange={(value) => updateContact('emails', email.id, 'type', value)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Arbeit">Arbeit</SelectItem>
                                    <SelectItem value="Privat">Privat</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={email.type}
                                  disabled
                                  className="h-9 bg-gray-50 text-slate-600 font-semibold"
                                />
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">E-Mail-Adresse</Label>
                              <Input
                                type="email"
                                value={email.value}
                                onChange={(e) => updateContact('emails', email.id, 'value', e.target.value)}
                                disabled={!isEditing}
                                className={`h-9 ${!isEditing ? "bg-gray-50 text-slate-600 font-semibold" : "text-slate-600 font-semibold"}`}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <Button
                                    onClick={() => updateContact('emails', email.id, 'is_primary', !email.is_primary)}
                                    size="sm"
                                    variant={email.is_primary ? "default" : "outline"}
                                    className="h-7 text-xs"
                                  >
                                    {email.is_primary ? 'Primär' : 'Als Primär setzen'}
                                  </Button>
                                ) : (
                                  email.is_primary && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">Primär</span>
                                  )
                                )}
                              </div>
                              {isEditing && (
                                email.is_primary || profile.contacts.emails.length <= 1 ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-400 h-8 w-8 p-0 cursor-not-allowed"
                                    disabled
                                    title={email.is_primary ? "Primäre E-Mail kann nicht gelöscht werden" : "Mindestens eine E-Mail ist erforderlich"}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => removeContact('emails', email.id)}
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Phone Numbers Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Telefonnummern</Label>
                        {isEditing && (
                          <Button onClick={() => addContact('phones')} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Telefon hinzufügen
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {profile.contacts.phones.map((phone) => (
                          <div key={phone.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-gray-50 rounded-lg items-end">
                            <div className="space-y-2">
                              <Label className="text-sm">Typ</Label>
                              {isEditing ? (
                                <Select
                                  value={phone.type}
                                  onValueChange={(value) => updateContact('phones', phone.id, 'type', value)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Mobil">Mobil</SelectItem>
                                    <SelectItem value="Festnetz">Festnetz</SelectItem>
                                    <SelectItem value="Arbeit">Arbeit</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={phone.type}
                                  disabled
                                  className="h-9 bg-gray-50 text-slate-600 font-semibold"
                                />
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Telefonnummer</Label>
                              <Input
                                type="tel"
                                value={phone.value}
                                onChange={(e) => updateContact('phones', phone.id, 'value', e.target.value)}
                                disabled={!isEditing}
                                className={`h-9 ${!isEditing ? "bg-gray-50 text-slate-600 font-semibold" : "text-slate-600 font-semibold"}`}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <Button
                                    onClick={() => updateContact('phones', phone.id, 'is_primary', !phone.is_primary)}
                                    size="sm"
                                    variant={phone.is_primary ? "default" : "outline"}
                                    className="h-7 text-xs"
                                  >
                                    {phone.is_primary ? 'Primär' : 'Als Primär setzen'}
                                  </Button>
                                ) : (
                                  phone.is_primary && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Primär</span>
                                  )
                                )}
                              </div>
                              {isEditing && (
                                <Button
                                  onClick={() => removeContact('phones', phone.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Addresses Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Adressen</Label>
                        {isEditing && (
                          <Button onClick={() => addContact('addresses')} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Adresse hinzufügen
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {profile.contacts.addresses.map((address) => (
                          <div key={address.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-gray-50 rounded-lg items-end">
                            <div className="space-y-2">
                              <Label className="text-sm">Typ</Label>
                              {isEditing ? (
                                <Select
                                  value={address.type}
                                  onValueChange={(value) => updateContact('addresses', address.id, 'type', value)}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Wohnadresse">Wohnadresse</SelectItem>
                                    <SelectItem value="Arbeitsadresse">Arbeitsadresse</SelectItem>
                                    <SelectItem value="Notfallkontakt">Notfallkontakt</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={address.type}
                                  disabled
                                  className="h-9 bg-gray-50 text-slate-600 font-semibold"
                                />
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">Adresse</Label>
                              <Textarea
                                value={address.value}
                                onChange={(e) => updateContact('addresses', address.id, 'value', e.target.value)}
                                disabled={!isEditing}
                                rows={2}
                                className={`min-h-[70px] ${!isEditing ? "bg-gray-50 text-slate-600 font-semibold" : "text-slate-600 font-semibold"}`}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <Button
                                    onClick={() => updateContact('addresses', address.id, 'is_primary', !address.is_primary)}
                                    size="sm"
                                    variant={address.is_primary ? "default" : "outline"}
                                    className="h-7 text-xs"
                                  >
                                    {address.is_primary ? 'Primär' : 'Als Primär setzen'}
                                  </Button>
                                ) : (
                                  address.is_primary && (
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">Primär</span>
                                  )
                                )}
                              </div>
                              {isEditing && (
                                <Button
                                  onClick={() => removeContact('addresses', address.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings - Compact Section */}
                <Card className="border-l-4 border-l-gray-400">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-gray-600" />
                      Sicherheitseinstellungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Password Reset */}
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h4 className="font-medium text-gray-800">Passwort zurücksetzen</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Senden Sie sich einen Reset-Link per E-Mail
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-100"
                        onClick={handlePasswordReset}
                      >
                        Link senden
                      </Button>
                    </div>

                    {/* OTP Setup */}
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between p-2 rounded-lg border ${
                        isOtpEnabled
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div>
                          <h4 className={`font-medium ${
                            isOtpEnabled ? 'text-green-800' : 'text-gray-800'
                          }`}>Zwei-Faktor-Authentifizierung</h4>
                          <p className={`text-sm mt-1 ${
                            isOtpEnabled ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            Status: <span className="font-medium">
                              {isOtpEnabled ? 'Aktiviert' : 'Nicht aktiviert'}
                            </span>
                          </p>
                        </div>
                        {isOtpEnabled ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 text-gray-700 hover:bg-gray-100"
                            onClick={handleDisable2FA}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Deaktivieren
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setShowOtpSetup(true)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Aktivieren
                          </Button>
                        )}
                      </div>

                      {/* OTP Setup Modal/Section */}
                      {showOtpSetup && (
                        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-900">OTP-Methode wählen</h5>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setShowOtpSetup(false);
                                setOtpMethod(null);
                                setOtpCode('');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {!otpMethod ? (
                            <div className="space-y-4">
                              <p className="text-sm text-gray-600">
                                Wählen Sie eine Methode für die Zwei-Faktor-Authentifizierung:
                              </p>

                              {/* TOTP/Authenticator App Option - Recommended */}
                              <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-5 w-5 text-blue-600" />
                                  <Label className="font-medium text-blue-900">Authenticator-App (Empfohlen)</Label>
                                </div>
                                <p className="text-sm text-blue-700 mb-2">
                                  Verwenden Sie Google Authenticator, Authy oder eine ähnliche App
                                </p>
                                <Button
                                  onClick={setupTotp}
                                  disabled={isEnrollingTotp}
                                  className="bg-blue-600 hover:bg-blue-700 w-full"
                                >
                                  <Smartphone className="h-4 w-4 mr-2" />
                                  {isEnrollingTotp ? 'Einrichten...' : 'Authenticator-App einrichten'}
                                </Button>
                              </div>

                              <div className="border-t pt-3 mt-3">
                                <p className="text-sm text-gray-600 mb-3">
                                  Alternative Methoden:
                                </p>

                                {/* Email OTP Option */}
                                <div className="space-y-2 opacity-75">
                                  <Label htmlFor="otp-email">E-Mail OTP</Label>
                                  <p className="text-xs text-orange-600 mb-1">
                                    ⚠��� Möglicherweise nicht verfügbar (Konfigurationsproblem)
                                  </p>
                                  <div className="flex gap-2">
                                    <Input
                                      id="otp-email"
                                      type="email"
                                      placeholder={profile.contacts.emails.find(e => e.is_primary)?.value || 'E-Mail-Adresse'}
                                      value={otpEmail}
                                      onChange={(e) => setOtpEmail(e.target.value)}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={sendEmailOtp}
                                      disabled={isSendingOtp}
                                      variant="outline"
                                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                    >
                                      <Mail className="h-4 w-4 mr-2" />
                                      {isSendingOtp ? 'Senden...' : 'Versuchen'}
                                    </Button>
                                  </div>
                                </div>

                                {/* SMS OTP Option */}
                                <div className="space-y-2 mt-3">
                                  <Label htmlFor="otp-phone">SMS OTP</Label>
                                  <p className="text-xs text-blue-600 mb-1">
                                    📱 SMS wird an Ihre primäre Telefonnummer gesendet
                                  </p>
                                  <div className="flex gap-2">
                                    <Input
                                      id="otp-phone"
                                      type="tel"
                                      placeholder={profile.contacts.phones.find(p => p.is_primary)?.value || 'Telefonnummer'}
                                      value={otpPhone}
                                      onChange={(e) => setOtpPhone(e.target.value)}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={sendSmsOtp}
                                      disabled={isSendingOtp}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <MessageSquare className="h-4 w-4 mr-2" />
                                      {isSendingOtp ? 'Senden...' : 'SMS senden'}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {otpMethod === 'totp' ? (
                                <>
                                  <div className="text-center space-y-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      Scannen Sie den QR-Code mit Ihrer Authenticator-App:
                                    </p>

                                    {totpQrCode && (
                                      <div className="flex justify-center p-4 bg-white border rounded-lg">
                                        <img
                                          src={totpQrCode}
                                          alt="QR Code für Authenticator-App"
                                          className="w-48 h-48"
                                        />
                                      </div>
                                    )}

                                    <div className="text-xs text-gray-600 space-y-1">
                                      <p>Empfohlene Apps:</p>
                                      <p>• Google Authenticator</p>
                                      <p>• Microsoft Authenticator</p>
                                      <p>• Authy</p>
                                    </div>

                                    {totpSecret && (
                                      <details className="text-xs">
                                        <summary className="cursor-pointer text-gray-600">Manueller Schlüssel (falls QR-Code nicht funktioniert)</summary>
                                        <div className="mt-2 p-2 bg-gray-100 rounded font-mono break-all">
                                          {totpSecret}
                                        </div>
                                      </details>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Geben Sie den 6-stelligen Code aus Ihrer App ein:</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        type="text"
                                        placeholder="123456"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        className="text-center text-lg font-mono tracking-widest"
                                      />
                                      <Button
                                        onClick={verifyOtp}
                                        disabled={isVerifyingOtp || otpCode.length !== 6}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        {isVerifyingOtp ? 'Verifizieren...' : 'Verifizieren'}
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm text-gray-600">
                                    Geben Sie den 6-stelligen Code ein, den Sie per{' '}
                                    {otpMethod === 'email' ? 'E-Mail' : 'SMS'} erhalten haben:
                                  </p>

                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder="123456"
                                      value={otpCode}
                                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                      maxLength={6}
                                      className="text-center text-lg font-mono tracking-widest"
                                    />
                                    <Button
                                      onClick={verifyOtp}
                                      disabled={isVerifyingOtp || otpCode.length !== 6}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {isVerifyingOtp ? 'Verifizieren...' : 'Verifizieren'}
                                    </Button>
                                  </div>
                                </>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setOtpMethod(null);
                                  setOtpCode('');
                                  setTotpSecret('');
                                  setTotpQrCode('');
                                }}
                              >
                                Zurück zur Methodenauswahl
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Trusted Devices Section - Only show if 2FA is enabled */}
                      {isOtpEnabled && (
                        <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                Vertrauenswürdige Geräte
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Geräte, auf denen Sie 2FA für 30 Tage umgehen können
                              </p>
                            </div>
                            {trustedDevices.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={removeAllTrustedDevices}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Alle entfernen
                              </Button>
                            )}
                          </div>

                          {loadingDevices ? (
                            <div className="p-4 text-center text-gray-500">
                              Lade vertrauenswürdige Geräte...
                            </div>
                          ) : trustedDevices.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                              <Monitor className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">Keine vertrauenswürdigen Geräte</p>
                              <p className="text-xs mt-1">
                                Aktivieren Sie "Gerät vertrauen" beim nächsten Login, um Geräte hier zu sehen
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {trustedDevices.map((device) => (
                                <div
                                  key={device.id}
                                  className={`flex items-center justify-between p-3 rounded-lg border ${
                                    isDeviceExpired(device.trusted_until)
                                      ? 'bg-red-50 border-red-200'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Monitor className={`h-5 w-5 ${
                                      isDeviceExpired(device.trusted_until)
                                        ? 'text-red-500'
                                        : 'text-green-600'
                                    }`} />
                                    <div>
                                      <p className="font-medium text-sm">
                                        {device.device_name || 'Unbekanntes Gerät'}
                                      </p>
                                      <div className="text-xs text-gray-500 space-y-1">
                                        <p>Hinzugefügt: {formatDeviceDate(device.created_at)}</p>
                                        <p>Zuletzt verwendet: {formatDeviceDate(device.last_used_at)}</p>
                                        <p className={
                                          isDeviceExpired(device.trusted_until)
                                            ? 'text-red-600 font-medium'
                                            : 'text-gray-500'
                                        }>
                                          {isDeviceExpired(device.trusted_until)
                                            ? 'Abgelaufen'
                                            : `Gültig bis: ${formatDeviceDate(device.trusted_until)}`
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTrustedDevice(device.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                            <p className="flex items-start gap-2">
                              <Shield className="h-4 w-4 mt-0.5 text-blue-600" />
                              <span>
                                <strong>Sicherheitshinweis:</strong> Vertrauenswürdige Geräte umgehen die
                                Zwei-Faktor-Authentifizierung für den angegebenen Zeitraum. Entfernen Sie
                                Geräte, die Sie nicht mehr verwenden oder die möglicherweise kompromittiert wurden.
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Professional Information Tab */}
              <TabsContent value="professional" className="space-y-4">
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H8a2 2 0 00-2-2V6m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2" />
                      </svg>
                      Berufliche Informationen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Teacher Abbreviation */}
                    <div className="space-y-2">
                      <Label htmlFor="kurzung">Kürzel</Label>
                      <Input
                        id="kurzung"
                        value={profile.kurzung}
                        onChange={(e) => setProfile(prev => ({ ...prev, kurzung: e.target.value }))}
                        disabled={!isEditing}
                        className={!isEditing ? "bg-gray-50 text-slate-600 font-semibold" : "text-slate-600 font-semibold"}
                        placeholder="z.B. CD"
                      />
                    </div>

                    {/* Skills */}
                    <div className="space-y-3">
                      <Label>Fähigkeiten</Label>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            <span className="text-sm font-medium">{skill}</span>
                            {isEditing && (
                              <Button
                                onClick={() => removeSkill(skill)}
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 hover:bg-blue-200 text-blue-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Input
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            placeholder="Neue Fähigkeit hinzufügen"
                            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                          />
                          <Button onClick={addSkill} variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Subjects */}
                    <div className="space-y-3">
                      <Label>Fächer (studiert)</Label>
                      <div className="flex flex-wrap gap-2">
                        {profile.subjects_stud.map((subject, index) => (
                          <div key={index} className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                            <span className="text-sm font-medium">{subject}</span>
                            {isEditing && (
                              <Button
                                onClick={() => removeSubject(subject)}
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0 hover:bg-green-200 text-green-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Input
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            placeholder="Neues Fach hinzufügen"
                            onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                          />
                          <Button onClick={addSubject} variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DebugOverlay>
  );
}
