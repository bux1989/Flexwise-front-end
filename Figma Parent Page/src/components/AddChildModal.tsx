import { useState } from 'react';
import { X, Key, UserPlus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPendingRequest: (name: string, relationship: string) => void;
}

export function AddChildModal({ isOpen, onClose, onAddPendingRequest }: AddChildModalProps) {
  const [activeTab, setActiveTab] = useState('access-code');
  
  // Access Code Form State
  const [accessCode, setAccessCode] = useState('');
  const [birthday, setBirthday] = useState('');
  const [relationship, setRelationship] = useState('');
  const [customRelationship, setCustomRelationship] = useState('');
  
  // Request Permission Form State
  const [childName, setChildName] = useState('');
  const [requestBirthday, setRequestBirthday] = useState('');
  const [requestRelationship, setRequestRelationship] = useState('');
  const [requestCustomRelationship, setRequestCustomRelationship] = useState('');

  const relationshipOptions = [
    { value: 'mutter', label: 'Mutter' },
    { value: 'vater', label: 'Vater' },
    { value: 'oma', label: 'Oma' },
    { value: 'opa', label: 'Opa' },
    { value: 'tante', label: 'Tante' },
    { value: 'onkel', label: 'Onkel' },
    { value: 'geschwister', label: 'Geschwister' },
    { value: 'vormund', label: 'Vormund/Sorgeberechtigter' },
    { value: 'andere', label: 'Andere' }
  ];

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle access code submission
    console.log('Access code submission:', {
      accessCode,
      birthday,
      relationship: relationship === 'andere' ? customRelationship : relationship
    });
    // Reset form and close modal
    resetForms();
    onClose();
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalRelationship = requestRelationship === 'andere' 
      ? requestCustomRelationship 
      : relationshipOptions.find(opt => opt.value === requestRelationship)?.label || requestRelationship;
    
    // Handle permission request submission
    console.log('Permission request submission:', {
      childName,
      birthday: requestBirthday,
      relationship: finalRelationship
    });
    
    // Add to pending requests
    onAddPendingRequest(childName, finalRelationship);
    
    // Reset form and close modal
    resetForms();
    onClose();
  };

  const resetForms = () => {
    setAccessCode('');
    setBirthday('');
    setRelationship('');
    setCustomRelationship('');
    setChildName('');
    setRequestBirthday('');
    setRequestRelationship('');
    setRequestCustomRelationship('');
    setActiveTab('access-code');
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold leading-tight">Kind hinzufügen</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="access-code" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Mit Zugangscode
              </TabsTrigger>
              <TabsTrigger value="request-permission" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Berechtigung anfragen
              </TabsTrigger>
            </TabsList>

            {/* Access Code Tab */}
            <TabsContent value="access-code" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-blue-600" />
                    Kind mit Zugangscode hinzufügen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="access-code">Zugangscode</Label>
                      <Input
                        id="access-code"
                        type="text"
                        placeholder="Z.B. ABC123XYZ"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        required
                        className="uppercase"
                      />
                      <p className="text-sm text-gray-500">
                        Den Zugangscode haben Sie von der Schule erhalten.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthday">Geburtstag des Kindes</Label>
                      <Input
                        id="birthday"
                        type="text"
                        placeholder="TT.MM.JJJJ"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        required
                        pattern="\d{2}\.\d{2}\.\d{4}"
                      />
                      <p className="text-sm text-gray-500">
                        Bitte geben Sie das Geburtsdatum im Format TT.MM.JJJJ ein (z.B. 15.03.2015)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="relationship">Verwandtschaftsverhältnis</Label>
                      <Select value={relationship} onValueChange={setRelationship} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Bitte wählen Sie Ihr Verhältnis zum Kind" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {relationship === 'andere' && (
                      <div className="space-y-2">
                        <Label htmlFor="custom-relationship">Bitte spezifizieren</Label>
                        <Input
                          id="custom-relationship"
                          type="text"
                          placeholder="Z.B. Tagesmutter, Nachbar, etc."
                          value={customRelationship}
                          onChange={(e) => setCustomRelationship(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                        Abbrechen
                      </Button>
                      <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Kind hinzufügen
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Request Permission Tab */}
            <TabsContent value="request-permission" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    Berechtigung für Kind anfragen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Hinweis:</strong> Diese Anfrage muss von der Schule genehmigt werden, bevor Sie Zugang zu den Informationen des Kindes erhalten.
                    </p>
                  </div>

                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="child-name">Name des Kindes</Label>
                      <Input
                        id="child-name"
                        type="text"
                        placeholder="Vor- und Nachname"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="request-birthday">Geburtstag des Kindes</Label>
                      <Input
                        id="request-birthday"
                        type="text"
                        placeholder="TT.MM.JJJJ"
                        value={requestBirthday}
                        onChange={(e) => setRequestBirthday(e.target.value)}
                        required
                        pattern="\d{2}\.\d{2}\.\d{4}"
                      />
                      <p className="text-sm text-gray-500">
                        Bitte geben Sie das Geburtsdatum im Format TT.MM.JJJJ ein (z.B. 15.03.2015)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="request-relationship">Verwandtschaftsverhältnis</Label>
                      <Select value={requestRelationship} onValueChange={setRequestRelationship} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Bitte wählen Sie Ihr Verhältnis zum Kind" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {requestRelationship === 'andere' && (
                      <div className="space-y-2">
                        <Label htmlFor="request-custom-relationship">Bitte spezifizieren</Label>
                        <Textarea
                          id="request-custom-relationship"
                          placeholder="Beschreiben Sie Ihr Verhältnis zum Kind (z.B. Tagesmutter, Nachbar, etc.)"
                          value={requestCustomRelationship}
                          onChange={(e) => setRequestCustomRelationship(e.target.value)}
                          required
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                        Abbrechen
                      </Button>
                      <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Anfrage senden
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}