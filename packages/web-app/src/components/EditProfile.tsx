import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, User, Save, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { DebugOverlay } from '../debug';

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

  // Load profile data (mock for now)
  useEffect(() => {
    // TODO: Load actual profile data from Supabase
    setProfile({
      first_name: user?.name?.split(' ')[0] || '',
      last_name: user?.name?.split(' ')[1] || '',
      date_of_birth: '1985-05-15',
      gender: 'Weiblich',
      profile_picture_url: '',
      skills: ['Mathematik', 'Deutsch', 'Klassenleitung'],
      kurzung: 'MU',
      subjects_stud: ['Mathematik', 'Physik'],
      contacts: {
        emails: [
          { id: '1', type: 'Arbeit', value: user?.email || '', is_primary: true },
          { id: '2', type: 'Privat', value: 'privat@example.com', is_primary: false }
        ],
        phones: [
          { id: '1', type: 'Mobil', value: '+49 171 123 4567', is_primary: true },
          { id: '2', type: 'Festnetz', value: '+49 30 123 4567', is_primary: false }
        ],
        addresses: [
          { id: '1', type: 'Wohnadresse', value: 'Musterstraße 123, 12345 Berlin', is_primary: true }
        ]
      }
    });
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Save to Supabase
      console.log('Saving profile:', profile);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
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
      id: Date.now().toString(),
      type: type === 'emails' ? 'Privat' : type === 'phones' ? 'Mobil' : 'Privat',
      value: '',
      is_primary: false
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
        [type]: prev.contacts[type].map(contact => 
          contact.id === id ? { ...contact, [field]: value } : contact
        )
      }
    }));
  };

  const removeContact = (type: 'emails' | 'phones' | 'addresses', id: string) => {
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
      <div className="p-1 lg:p-6">
        <div className="bg-white rounded-lg border shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
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
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Speichern...' : 'Speichern'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                >
                  Bearbeiten
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Persönliche Daten</TabsTrigger>
                <TabsTrigger value="professional">Berufliche Daten</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Persönliche Informationen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Vorname</Label>
                        <Input
                          id="first_name"
                          value={profile.first_name}
                          onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Nachname</Label>
                        <Input
                          id="last_name"
                          value={profile.last_name}
                          onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Geburtsdatum</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={profile.date_of_birth}
                          onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))}
                          disabled={!isEditing}
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
                          <Input value={profile.gender} disabled />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Professional Information Tab */}
              <TabsContent value="professional" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Berufliche Informationen</CardTitle>
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
                        className="max-w-xs"
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
                            className="max-w-xs"
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
                            className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
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
                            className="max-w-xs"
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
