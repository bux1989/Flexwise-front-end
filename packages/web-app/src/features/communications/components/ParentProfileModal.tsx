import { useState } from 'react';
import { X, Edit, Plus, Trash2, User } from 'lucide-react';
import { DebugOverlay } from '../../../debug';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

interface Child {
  id: number;
  name: string;
  class: string;
  avatar: string;
}

interface ParentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: Child[];
}

interface PhoneNumber {
  id: number;
  number: string;
  label: string;
}

interface ChildRelationship {
  childId: number;
  relationship: string;
}

export function ParentProfileModal({ isOpen, onClose, children }: ParentProfileModalProps) {
  // Parent information
  const [parentName] = useState('Father Müller'); // Can't edit
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([
    { id: 1, number: '+49 173 1234567', label: 'Privat' },
    { id: 2, number: '+49 40 9876543', label: 'Arbeit' }
  ]);
  
  // Child relationships
  const [childRelationships, setChildRelationships] = useState<ChildRelationship[]>([
    { childId: 1, relationship: 'Vater' },
    { childId: 2, relationship: 'Vater' },
    { childId: 3, relationship: 'Vater' },
    { childId: 4, relationship: 'Vater' }
  ]);

  const [isEditing, setIsEditing] = useState(false);

  const relationshipOptions = [
    'Vater',
    'Mutter', 
    'Stiefvater',
    'Stiefmutter',
    'Großvater',
    'Großmutter',
    'Vormund',
    'Sonstiges'
  ];

  if (!isOpen) return null;

  const handleAddPhoneNumber = () => {
    const newId = Math.max(...phoneNumbers.map(p => p.id)) + 1;
    setPhoneNumbers([...phoneNumbers, { id: newId, number: '', label: 'Privat' }]);
  };

  const handleRemovePhoneNumber = (id: number) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(phoneNumbers.filter(p => p.id !== id));
    }
  };

  const handlePhoneNumberChange = (id: number, field: 'number' | 'label', value: string) => {
    setPhoneNumbers(phoneNumbers.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleRelationshipChange = (childId: number, relationship: string) => {
    setChildRelationships(childRelationships.map(cr =>
      cr.childId === childId ? { ...cr, relationship } : cr
    ));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving parent profile:', {
      phoneNumbers,
      childRelationships
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset to original values if needed
    setIsEditing(false);
  };

  return (
    <DebugOverlay name="ParentProfileModal">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Mein Profil</h2>
                <p className="text-sm text-gray-500">Persönliche Informationen</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Bearbeiten
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Speichern
                  </Button>
                </div>
              )}
              <Button onClick={onClose} variant="ghost" size="sm">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Personal Information */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Persönliche Daten</h3>
            
            {/* Full Name (Read-only) */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="fullName">Vollständiger Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="fullName"
                  value={parentName}
                  disabled
                  className="bg-gray-50 cursor-not-allowed"
                />
                <span className="text-xs text-gray-500">Nicht bearbeitbar</span>
              </div>
            </div>

            {/* Phone Numbers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Telefonnummern</Label>
                {isEditing && phoneNumbers.length < 3 && (
                  <Button
                    onClick={handleAddPhoneNumber}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nummer hinzufügen
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {phoneNumbers.map((phone, index) => (
                  <div key={phone.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        value={phone.number}
                        onChange={(e) => handlePhoneNumberChange(phone.id, 'number', e.target.value)}
                        placeholder="Telefonnummer"
                        disabled={!isEditing}
                        className={!isEditing ? "bg-gray-50" : ""}
                      />
                    </div>
                    <div className="w-32">
                      <Select
                        value={phone.label}
                        onValueChange={(value) => handlePhoneNumberChange(phone.id, 'label', value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Privat">Privat</SelectItem>
                          <SelectItem value="Arbeit">Arbeit</SelectItem>
                          <SelectItem value="Mobil">Mobil</SelectItem>
                          <SelectItem value="Notfall">Notfall</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {isEditing && phoneNumbers.length > 1 && (
                      <Button
                        onClick={() => handleRemovePhoneNumber(phone.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Relationship Status with Children */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Verhältnis zu den Kindern</h3>
            
            <div className="space-y-4">
              {children.map((child) => {
                const relationship = childRelationships.find(cr => cr.childId === child.id);
                
                return (
                  <div key={child.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium">{child.name}</div>
                      <div className="text-sm text-gray-500">Klasse {child.class}</div>
                    </div>
                    
                    <div className="w-40">
                      <Select
                        value={relationship?.relationship || 'Vater'}
                        onValueChange={(value) => handleRelationshipChange(child.id, value)}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className={!isEditing ? "bg-gray-50" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Additional Information */}
          <section className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 space-y-2">
              <p><strong>Letzte Aktualisierung:</strong> 28. Juni 2024, 14:30 Uhr</p>
              <p><strong>Hinweis:</strong> Änderungen an den Kontaktdaten werden automatisch an die Schule weitergeleitet.</p>
            </div>
          </section>
        </div>
      </div>
      </div>
    </DebugOverlay>
  );
}
