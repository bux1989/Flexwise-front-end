import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, User, Save, Camera, Lock, Smartphone, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DebugOverlay } from '../debug';
import { supabase } from '../lib/supabase';

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

  // Load profile data from Supabase
  useEffect(() => {
    loadProfileData();
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

      // Load staff info
      const { data: staffData, error: staffError } = await supabase
        .from('profile_info_staff')
        .select('*')
        .eq('profile_id', profileId)
        .single();

      if (staffError && staffError.code !== 'PGRST116') { // Ignore "not found" error
        console.error('Error loading staff info:', staffError);
      }

      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('profile_id', profileId)
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

      // Set profile state with fallback mock data if needed
      setProfile({
        first_name: profileData?.first_name || 'Clarissa',
        last_name: profileData?.last_name || 'Döbel',
        date_of_birth: profileData?.date_of_birth || '1985-05-15',
        gender: profileData?.gender || 'Weiblich',
        profile_picture_url: profileData?.profile_picture_url || '',
        skills: staffData?.skills || ['Mathematik', 'Deutsch', 'Klassenleitung'],
        kurzung: staffData?.kurzung || 'CD',
        subjects_stud: staffData?.subjects_stud || ['Mathematik', 'Physik'],
        contacts: organizedContacts.emails.length > 0 ? organizedContacts : {
          emails: [
            { id: '1', type: 'Arbeit', value: 'c.doebel@flexwise-schule.de', is_primary: true }
          ],
          phones: [
            { id: '1', type: 'Mobil', value: '+49 171 123 4567', is_primary: true }
          ],
          addresses: [
            { id: '1', type: 'Wohnadresse', value: 'Musterstraße 123\n12345 Berlin', is_primary: true }
          ]
        }
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

      // Update user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          date_of_birth: profile.date_of_birth || null,
          gender: profile.gender || null,
          profile_picture_url: profile.profile_picture_url || null
        })
        .eq('id', profileId);

      if (profileError) {
        throw new Error('Failed to update profile: ' + profileError.message);
      }

      // Update or insert staff info
      const { error: staffError } = await supabase
        .from('profile_info_staff')
        .upsert({
          profile_id: profileId,
          school_id: authUser.user_metadata?.school_id,
          skills: profile.skills,
          kurzung: profile.kurzung || null,
          subjects_stud: profile.subjects_stud
        })
        .eq('profile_id', profileId);

      if (staffError) {
        throw new Error('Failed to update staff info: ' + staffError.message);
      }

      // Save contacts
      await saveContacts(profileId);

      setIsEditing(false);

      // Show success message (you might want to add a toast notification here)
      console.log('Profile saved successfully');

    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Fehler beim Speichern: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveContacts = async (profileId: string) => {
    // Delete existing contacts and re-insert (simple approach)
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('profile_id', profileId);

    if (deleteError) {
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
        school_id: null // Will be set by trigger
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
        school_id: null // Will be set by trigger
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
        school_id: null // Will be set by trigger
      });
    });

    // Insert new contacts
    if (contactsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('contacts')
        .insert(contactsToInsert);

      if (insertError) {
        throw new Error('Failed to insert contacts: ' + insertError.message);
      }
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

  const removeContact = (type: 'emails' | 'phones' | 'addresses', id: string) => {
    // Prevent deletion of primary email
    if (type === 'emails') {
      const emailToDelete = profile.contacts.emails.find(email => email.id === id);
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
                  <CardContent className="space-y-3">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                        {profile.profile_picture_url ? (
                          <img
                            src={profile.profile_picture_url}
                            alt="Profilbild"
                            className="w-20 h-20 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      {isEditing && (
                        <Button variant="outline" size="sm">
                          <Camera className="h-4 w-4 mr-2" />
                          Foto ändern
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      <div className="space-y-3">
                        {profile.contacts.addresses.map((address) => (
                          <div key={address.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg items-end">
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
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-red-600" />
                      Sicherheitseinstellungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Password Reset */}
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <h4 className="font-medium text-red-800">Passwort zurücksetzen</h4>
                        <p className="text-sm text-red-600 mt-1">
                          Senden Sie sich einen Reset-Link per E-Mail
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-700 hover:bg-red-100"
                        onClick={() => {
                          alert('Passwort-Reset-Link wurde an Ihre E-Mail-Adresse gesendet!');
                        }}
                      >
                        Link senden
                      </Button>
                    </div>

                    {/* TOTP Activation */}
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div>
                        <h4 className="font-medium text-orange-800">Zwei-Faktor-Authentifizierung</h4>
                        <p className="text-sm text-orange-600 mt-1">
                          Status: <span className="font-medium">Nicht aktiviert</span>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => {
                          alert('TOTP-Setup wird geöffnet. Scannen Sie den QR-Code mit Ihrer Authenticator-App!');
                        }}
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        Aktivieren
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Professional Information Tab */}
              <TabsContent value="professional" className="space-y-6">
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 00-2 2H8a2 2 0 00-2-2V6m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2" />
                      </svg>
                      Berufliche Informationen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="kurzung">Kürzel</Label>
                      <Input
                        id="kurzung"
                        value={profile.kurzung}
                        onChange={(e) => setProfile(prev => ({ ...prev, kurzung: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="z.B. MU, DE, EN"
                        className={`max-w-xs ${!isEditing ? "bg-gray-50 text-slate-600 font-semibold" : "text-slate-600 font-semibold"}`}
                      />
                      <p className="text-sm text-gray-500">
                        Ihr persönliches Kürzel für Stundenpläne und Listen
                      </p>
                    </div>

                    {/* Skills */}
                    <div className="space-y-3">
                      <Label>Fähigkeiten & Qualifikationen</Label>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                          <div
                            key={skill}
                            className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            {skill}
                            {isEditing && (
                              <button
                                onClick={() => removeSkill(skill)}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Neue Fähigkeit hinzufügen"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                            className="max-w-xs text-slate-600 font-semibold"
                          />
                          <Button onClick={addSkill} size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Subjects Studied */}
                    <div className="space-y-3">
                      <Label>Studierte Fächer</Label>
                      <div className="flex flex-wrap gap-2">
                        {profile.subjects_stud.map((subject) => (
                          <div
                            key={subject}
                            className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                          >
                            {subject}
                            {isEditing && (
                              <button
                                onClick={() => removeSubject(subject)}
                                className="text-green-500 hover:text-green-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Neues Fach hinzufügen"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                            className="max-w-xs text-slate-600 font-semibold"
                          />
                          <Button onClick={addSubject} size="sm" variant="outline">
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
