import { useState } from 'react';
import { X, Clock, Home, Users as UsersIcon, Edit, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';

interface Child {
  id: number;
  name: string;
  class: string;
  avatar: string;
  checkInPending: boolean;
  status?: string;
  excuseInfo?: {
    reason: string;
    type: 'full' | 'partial';
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    submittedBy: string;
    submittedAt: string;
  };
  urlaubsInfo?: {
    reason: string;
    type: 'full' | 'partial';
    startDate: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    submittedBy: string;
    submittedAt: string;
    approved: boolean;
    approvedBy?: string;
    approvedAt?: string;
  };
}

interface ChildDetailViewProps {
  child: Child;
  onClose: () => void;
}

const scheduleData = {
  1: { // Jonas Müller
    schedule: [
      { time: '1. Stunde', monday: 'Mathe', tuesday: 'Deutsch', wednesday: 'Deutsch', thursday: 'Deutsch', friday: 'Sport' },
      { time: '2. Stunde', monday: 'Deutsch', tuesday: 'Naturwissenschaft', wednesday: 'Mathe', thursday: 'Deutsch', friday: 'Sport' },
      { time: '3. Stunde', monday: 'Englisch', tuesday: 'Naturwissenschaft', wednesday: 'Sport', thursday: 'Mathe', friday: 'Gesellschaftswissenschaften' },
      { time: '4. Stunde', monday: 'Englisch', tuesday: 'Gesellschaftswissenschaften', wednesday: 'Sport', thursday: 'Gesellschaftswissenschaften', friday: 'Gesellschaftswissenschaften' },
      { time: '5. Stunde', monday: 'Music', tuesday: 'Mathe', wednesday: 'Englisch', thursday: 'Music', friday: 'Kunst' },
      { time: '6. Stunde', monday: 'Lernbüro', tuesday: 'Englisch', wednesday: 'Naturwissenschaft', thursday: 'Kunst', friday: '' },
      { time: '7. Stunde', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' },
      { time: '8. Stunde', monday: '', tuesday: 'IT', wednesday: 'Lernbüro', thursday: 'Naturwissenschaft', friday: '' }
    ],
    pickupRules: {
      monday: { rule: 'Geht allein nach Hause', icon: '🚶', time: '14:30' },
      tuesday: { rule: 'Geht allein nach Hause', icon: '🚶', time: '16:00' },
      wednesday: { rule: 'Schulbus', icon: '🚌', time: '14:30' },
      thursday: { rule: 'noch nicht festgelegt!', icon: '❓', time: '14:30' },
      friday: { rule: 'Abholung', icon: '🚗', time: '16:00' }
    },
    authorizedPickup: [
      { name: 'Father Müller', relationship: 'Vater', phone: '+49 123 456789' },
      { name: 'Mother Müller', relationship: 'Mutter', phone: '+49 123 456790' },
      { name: 'Oma Müller', relationship: 'Oma' },
      { name: 'Opa Müller', relationship: 'Opa', phone: '+49 123 456791' },
      { name: 'Uncle Müller', relationship: 'Onkel' },
      'Jonas Müller' // Legacy format for backward compatibility
    ]
  },
  2: { // Tom Koch
    schedule: [
      { time: '1. Stunde', monday: 'Deutsch', tuesday: 'Mathe', wednesday: 'Mathe', thursday: 'Englisch', friday: 'Kunst' },
      { time: '2. Stunde', monday: 'Deutsch', tuesday: 'Mathe', wednesday: 'Deutsch', thursday: 'Englisch', friday: 'Kunst' },
      { time: '3. Stunde', monday: 'Mathe', tuesday: 'Deutsch', wednesday: 'Sport', thursday: 'Deutsch', friday: 'Music' },
      { time: '4. Stunde', monday: 'Sport', tuesday: 'Sport', wednesday: 'Sport', thursday: 'Mathe', friday: 'Music' },
      { time: '5. Stunde', monday: 'Englisch', tuesday: 'Englisch', wednesday: 'Englisch', thursday: 'Naturwissenschaft', friday: '' },
      { time: '6. Stunde', monday: 'Sachkunde', tuesday: 'Sachkunde', wednesday: 'Sachkunde', thursday: 'Naturwissenschaft', friday: '' }
    ],
    pickupRules: {
      monday: { rule: 'Schulbus', icon: '🚌', time: '14:30' },
      tuesday: { rule: 'Abholung', icon: '🚗', time: '16:00' },
      wednesday: { rule: 'Geht allein nach Hause', icon: '🚶', time: '14:30' },
      thursday: { rule: 'Abholung', icon: '🚗', time: '16:00' },
      friday: { rule: 'Schulbus', icon: '🚌', time: '14:30' }
    },
    authorizedPickup: [
      { name: 'Father Müller', relationship: 'Vater', phone: '+49 123 456789' },
      { name: 'Vater Koch', relationship: 'Vater', phone: '+49 987 654321' },
      { name: 'Mutter Koch', relationship: 'Mutter' },
      { name: 'Oma Koch', relationship: 'Oma', phone: '+49 111 222333' }
    ]
  },
  3: { // Tim Peters
    schedule: [
      { time: '1. Stunde', monday: 'Mathe', tuesday: 'Deutsch', wednesday: 'Englisch', thursday: 'Deutsch', friday: 'Sport' },
      { time: '2. Stunde', monday: 'Deutsch', tuesday: 'Mathe', wednesday: 'Mathe', thursday: 'Mathe', friday: 'Sport' },
      { time: '3. Stunde', monday: 'Englisch', tuesday: 'Englisch', wednesday: 'Deutsch', thursday: 'Englisch', friday: 'Sachkunde' },
      { time: '4. Stunde', monday: 'Sport', tuesday: 'Sport', wednesday: 'Sachkunde', thursday: 'Sport', friday: 'Sachkunde' },
      { time: '5. Stunde', monday: 'Sachkunde', tuesday: 'Music', wednesday: 'Music', thursday: 'Kunst', friday: 'Music' },
      { time: '6. Stunde', monday: 'Kunst', tuesday: 'Kunst', wednesday: 'Kunst', thursday: 'Music', friday: '' }
    ],
    pickupRules: {
      monday: { rule: 'Abholung', icon: '🚗', time: '16:00' },
      tuesday: { rule: 'Geht allein nach Hause', icon: '🚶', time: '14:30' },
      wednesday: { rule: 'Schulbus', icon: '🚌', time: '14:30' },
      thursday: { rule: 'Geht allein nach Hause', icon: '🚶', time: '16:00' },
      friday: { rule: 'Abholung', icon: '🚗', time: '16:00' }
    },
    authorizedPickup: [
      { name: 'Father Müller', relationship: 'Vater', phone: '+49 123 456789' },
      { name: 'Vater Peters', relationship: 'Vater' },
      { name: 'Mutter Peters', relationship: 'Mutter', phone: '+49 555 666777' }
    ]
  },
  4: { // Nina Lang
    schedule: [
      { time: '1. Stunde', monday: 'Deutsch', tuesday: 'Mathe', wednesday: 'Deutsch', thursday: 'Mathe', friday: 'Music' },
      { time: '2. Stunde', monday: 'Deutsch', tuesday: 'Mathe', wednesday: 'Deutsch', thursday: 'Mathe', friday: 'Music' },
      { time: '3. Stunde', monday: 'Mathe', tuesday: 'Deutsch', wednesday: 'Mathe', thursday: 'Deutsch', friday: 'Sport' },
      { time: '4. Stunde', monday: 'Sport', tuesday: 'Sport', wednesday: 'Sport', thursday: 'Sport', friday: 'Sport' },
      { time: '5. Stunde', monday: 'Sachkunde', tuesday: 'Sachkunde', wednesday: 'Sachkunde', thursday: 'Kunst', friday: '' },
      { time: '6. Stunde', monday: 'Music', tuesday: 'Kunst', wednesday: 'Music', thursday: 'Kunst', friday: '' }
    ],
    pickupRules: {
      monday: { rule: 'Abholung', icon: '🚗', time: '16:00' },
      tuesday: { rule: 'Abholung', icon: '🚗', time: '14:30' },
      wednesday: { rule: 'Schulbus', icon: '🚌', time: '14:30' },
      thursday: { rule: 'Abholung', icon: '🚗', time: '16:00' },
      friday: { rule: 'Geht allein nach Hause', icon: '🚶', time: '14:30' }
    },
    authorizedPickup: [
      { name: 'Father Müller', relationship: 'Vater', phone: '+49 123 456789' },
      { name: 'Vater Lang', relationship: 'Vater', phone: '+49 444 555666' },
      { name: 'Mutter Lang', relationship: 'Mutter' },
      { name: 'Opa Lang', relationship: 'Opa', phone: '+49 777 888999' }
    ]
  }
};

const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

export function ChildDetailView({ child, onClose }: ChildDetailViewProps) {
  const childData = scheduleData[child.id as keyof typeof scheduleData];
  
  // Editing states
  const [editingPickupRules, setEditingPickupRules] = useState(false);
  const [editingAuthorizedPickup, setEditingAuthorizedPickup] = useState(false);
  
  // Local state for editing
  const [localPickupRules, setLocalPickupRules] = useState(childData.pickupRules);
  const [localAuthorizedPickup, setLocalAuthorizedPickup] = useState([...childData.authorizedPickup]);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonRelationship, setNewPersonRelationship] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [customRelationship, setCustomRelationship] = useState('');
  const [showAddNewPerson, setShowAddNewPerson] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());

  // Pickup rule options (excluding "noch nicht festgelegt!" - that's only for default display)
  const pickupOptions = [
    { value: 'Geht allein nach Hause', icon: '🚶' },
    { value: 'Abholung', icon: '🚗' },
    { value: 'Schulbus', icon: '🚌' }
  ];

  // Relationship options for authorized pickup
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

  // Current parent (always authorized, cannot be removed)
  const currentParent = 'Father Müller'; // This would come from user context

  // Get all unique contacts from all children
  const getAllAvailableContacts = () => {
    const allContacts = new Map<string, any>();
    
    // Add contacts from all children in scheduleData
    Object.values(scheduleData).forEach(data => {
      data.authorizedPickup.forEach(person => {
        const personName = typeof person === 'string' ? person : person.name;
        if (!allContacts.has(personName)) {
          // Prefer object format over string format
          if (typeof person === 'object' && person.name) {
            allContacts.set(personName, person);
          } else if (typeof person === 'string' && !allContacts.has(personName)) {
            allContacts.set(personName, person);
          }
        } else {
          // If we already have this contact and current one is an object, replace
          if (typeof person === 'object' && person.name && typeof allContacts.get(personName) === 'string') {
            allContacts.set(personName, person);
          }
        }
      });
    });
    
    return Array.from(allContacts.values());
  };

  const allAvailableContacts = getAllAvailableContacts();

  // Initialize selected contacts when editing starts
  const initializeSelectedContacts = () => {
    const currentContactNames = new Set(
      childData.authorizedPickup.map(person => 
        typeof person === 'string' ? person : person.name
      )
    );
    setSelectedContacts(currentContactNames);
  };

  const getSubjectColor = (subject: string) => {
    const colors: Record<string, string> = {
      'Mathe': 'bg-blue-100 text-blue-800',
      'Deutsch': 'bg-green-100 text-green-800',
      'Englisch': 'bg-purple-100 text-purple-800',
      'Sport': 'bg-orange-100 text-orange-800',
      'Music': 'bg-pink-100 text-pink-800',
      'Kunst': 'bg-yellow-100 text-yellow-800',
      'Naturwissenschaft': 'bg-cyan-100 text-cyan-800',
      'Gesellschaftswissenschaften': 'bg-indigo-100 text-indigo-800',
      'Sachkunde': 'bg-emerald-100 text-emerald-800',
      'Lernbüro': 'bg-gray-100 text-gray-800',
      'IT': 'bg-red-100 text-red-800'
    };
    return colors[subject] || 'bg-gray-100 text-gray-800';
  };

  const handleSavePickupRules = () => {
    // Update the actual data in scheduleData
    childData.pickupRules = { ...localPickupRules };
    
    // Here you would typically send the updated rules to the backend
    console.log('Saving pickup rules:', localPickupRules);
    setEditingPickupRules(false);
  };

  const handleCancelPickupRules = () => {
    // Reset local state to original data
    setLocalPickupRules({ ...childData.pickupRules });
    setEditingPickupRules(false);
  };

  const handleStartEditingPickupRules = () => {
    // Initialize local state with current data
    setLocalPickupRules({ ...childData.pickupRules });
    setEditingPickupRules(true);
  };

  const handlePickupRuleChange = (dayKey: keyof typeof localPickupRules, newRule: string) => {
    const option = pickupOptions.find(opt => opt.value === newRule);
    setLocalPickupRules(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        rule: newRule,
        icon: option?.icon || '❓'
      }
    }));
  };

  const handleSaveAuthorizedPickup = () => {
    // Build the new authorized pickup list from selected contacts
    const newAuthorizedList = allAvailableContacts.filter(person => {
      const personName = typeof person === 'string' ? person : person.name;
      return selectedContacts.has(personName);
    });
    
    // Update the child's data (in a real app, this would update the backend)
    if (childData) {
      childData.authorizedPickup = newAuthorizedList;
    }
    
    setLocalAuthorizedPickup(newAuthorizedList);
    
    // Here you would typically send the updated list to the backend
    console.log('Saving authorized pickup list:', newAuthorizedList);
    setEditingAuthorizedPickup(false);
    setSelectedContacts(new Set()); // Clear selections
    resetAddPersonForm();
    setShowAddNewPerson(false);
  };

  const handleCancelAuthorizedPickup = () => {
    setLocalAuthorizedPickup([...childData.authorizedPickup]);
    setEditingAuthorizedPickup(false);
    setSelectedContacts(new Set()); // Clear selections
    resetAddPersonForm();
    setShowAddNewPerson(false);
  };

  const resetAddPersonForm = () => {
    setNewPersonName('');
    setNewPersonRelationship('');
    setNewPersonPhone('');
    setCustomRelationship('');
  };

  const handleStartEditing = () => {
    // Reset local state to current child's data
    setLocalAuthorizedPickup([...childData.authorizedPickup]);
    setEditingAuthorizedPickup(true);
    initializeSelectedContacts();
  };

  const handleContactToggle = (personName: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(personName)) {
      newSelected.delete(personName);
    } else {
      newSelected.add(personName);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    const allContactNames = new Set(
      allAvailableContacts.map(person => 
        typeof person === 'string' ? person : person.name
      )
    );
    setSelectedContacts(allContactNames);
  };

  const handleDeselectAll = () => {
    // Keep only the current parent selected (cannot be deselected)
    setSelectedContacts(new Set([currentParent]));
  };

  const isAllSelected = () => {
    return allAvailableContacts.every(person => {
      const personName = typeof person === 'string' ? person : person.name;
      return selectedContacts.has(personName);
    });
  };

  const handleAddPerson = () => {
    if (newPersonName.trim() && newPersonRelationship) {
      const finalRelationship = newPersonRelationship === 'andere' 
        ? customRelationship.trim() 
        : relationshipOptions.find(opt => opt.value === newPersonRelationship)?.label || newPersonRelationship;
      
      const personExists = allAvailableContacts.some(person => 
        typeof person === 'string' ? person === newPersonName.trim() : person.name === newPersonName.trim()
      );
      
      if (!personExists) {
        const newPerson = {
          name: newPersonName.trim(),
          relationship: finalRelationship,
          phone: newPersonPhone.trim() || undefined
        };
        
        // Add to the current parent's contact pool (so it becomes available for all children)
        // In a real app, this would be saved to the backend and made available globally
        // For demo purposes, we'll add it to the current child's data
        childData.authorizedPickup.push(newPerson);
        
        // Also add to local state
        setLocalAuthorizedPickup(prev => [...prev, newPerson]);
        
        // Automatically select the new person for this child
        setSelectedContacts(prev => new Set([...prev, newPerson.name]));
        resetAddPersonForm();
        setShowAddNewPerson(false);
        
        console.log(`Added new contact ${newPerson.name} to family contact pool`);
      }
    }
  };

  const handleDeleteContact = (personToDelete: any) => {
    const personName = typeof personToDelete === 'string' ? personToDelete : personToDelete.name;
    
    // Don't allow deleting the current parent
    if (personName === currentParent) return;
    
    // Remove from selected contacts
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      newSet.delete(personName);
      return newSet;
    });
    
    // Remove from all children's authorized pickup lists (global family contact pool)
    Object.values(scheduleData).forEach(data => {
      data.authorizedPickup = data.authorizedPickup.filter(person => {
        const name = typeof person === 'string' ? person : person.name;
        return name !== personName;
      });
    });
    
    // Update the current child's local state
    setLocalAuthorizedPickup(prev => prev.filter(person => {
      const name = typeof person === 'string' ? person : person.name;
      return name !== personName;
    }));
    
    console.log(`Deleted contact ${personName} from family contact pool`);
  };

  const handleRemovePerson = (personToRemove: any) => {
    const personName = typeof personToRemove === 'string' ? personToRemove : personToRemove.name;
    // Don't allow removing the current parent
    if (personName === currentParent) return;
    
    setLocalAuthorizedPickup(prev => prev.filter(person => {
      const name = typeof person === 'string' ? person : person.name;
      return name !== personName;
    }));
  };

  const canRemovePerson = (person: any) => {
    const personName = typeof person === 'string' ? person : person.name;
    return personName !== currentParent;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-lg border border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold leading-tight text-foreground">Aktuelle Informationen: {child.name}</h2>
              <p className="text-sm text-muted-foreground leading-tight -mt-1">Klasse {child.class}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Compact Excuse Information */}
        {child.status === 'excused' && child.excuseInfo && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-lg">📝</span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    Entschuldigt
                  </Badge>
                  <span className="text-sm text-blue-700">
                    {child.excuseInfo.startDate === child.excuseInfo.endDate || !child.excuseInfo.endDate
                      ? new Date(child.excuseInfo.startDate).toLocaleDateString('de-DE')
                      : `${new Date(child.excuseInfo.startDate).toLocaleDateString('de-DE')} - ${new Date(child.excuseInfo.endDate).toLocaleDateString('de-DE')}`
                    }
                  </span>
                  <span className="text-sm text-blue-700">
                    {child.excuseInfo.type === 'full'
                      ? '(Ganzer Tag)'
                      : child.excuseInfo.startTime && child.excuseInfo.endTime
                        ? `(${child.excuseInfo.startTime} - ${child.excuseInfo.endTime} Uhr)`
                        : '(Teilweise)'
                    }
                  </span>
                </div>
                <p className="text-sm text-blue-700 leading-tight">
                  <strong>Grund:</strong> {child.excuseInfo.reason}
                </p>
                <p className="text-xs text-blue-600 leading-tight">
                  Von {child.excuseInfo.submittedBy} am {new Date(child.excuseInfo.submittedAt).toLocaleDateString('de-DE')} eingereicht
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Compact Future Leave Information */}
        {child.urlaubsInfo && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-lg">🏖️</span>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className={`text-xs ${
                    child.urlaubsInfo.approved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {child.urlaubsInfo.approved ? 'Beurlaubt (genehmigt)' : 'Beurlaubt (beantragt)'}
                  </Badge>
                  <span className="text-sm text-green-700">
                    {child.urlaubsInfo.startDate === child.urlaubsInfo.endDate || !child.urlaubsInfo.endDate
                      ? new Date(child.urlaubsInfo.startDate).toLocaleDateString('de-DE')
                      : `${new Date(child.urlaubsInfo.startDate).toLocaleDateString('de-DE')} - ${new Date(child.urlaubsInfo.endDate).toLocaleDateString('de-DE')}`
                    }
                  </span>
                  <span className="text-sm text-green-700">
                    {child.urlaubsInfo.type === 'full'
                      ? '(Ganzer Tag)'
                      : child.urlaubsInfo.startTime && child.urlaubsInfo.endTime
                        ? `(${child.urlaubsInfo.startTime} - ${child.urlaubsInfo.endTime} Uhr)`
                        : '(Teilweise)'
                    }
                  </span>
                </div>
                <p className="text-sm text-green-700 leading-tight">
                  <strong>Grund:</strong> {child.urlaubsInfo.reason}
                </p>
                <div className="space-y-1">
                  <p className="text-xs text-green-600 leading-tight">
                    Von {child.urlaubsInfo.submittedBy} am {new Date(child.urlaubsInfo.submittedAt).toLocaleDateString('de-DE')} beantragt
                  </p>
                  {child.urlaubsInfo.approved && child.urlaubsInfo.approvedBy && child.urlaubsInfo.approvedAt && (
                    <p className="text-xs text-green-600 leading-tight">
                      ✅ Genehmigt von {child.urlaubsInfo.approvedBy} am {new Date(child.urlaubsInfo.approvedAt).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Schedule Section */}
        <section className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold leading-tight text-foreground">Stundenplan</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border border-border rounded-lg">
              <thead>
                <tr className="bg-muted/30">
                  <th className="p-2 text-left border-r border-border font-medium text-foreground">Zeit</th>
                  {dayNames.map((day) => (
                    <th key={day} className="p-2 text-center border-r border-border font-medium last:border-r-0 text-foreground">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {childData.schedule.map((row, index) => (
                  <tr key={index} className="border-t border-border">
                    <td className="p-2 border-r border-border font-medium bg-muted/30 text-foreground">
                      {row.time}
                    </td>
                    {dayKeys.map((dayKey) => (
                      <td key={dayKey} className="p-1 border-r border-border text-center last:border-r-0">
                        {row[dayKey] && (
                          <Badge
                            variant="secondary"
                            className={`${getSubjectColor(row[dayKey])} text-xs`}
                          >
                            {row[dayKey]}
                          </Badge>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pickup Rules Section */}
        <section className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-semibold leading-tight text-foreground">Regelung zur Heimgehzeit</h3>
            </div>
            {!editingPickupRules ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleStartEditingPickupRules}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Bearbeiten
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelPickupRules}
                >
                  Abbrechen
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSavePickupRules}
                  className="bg-primary hover:bg-primary/90 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Speichern
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {dayNames.map((day, index) => {
              const dayKey = dayKeys[index];
              const rule = editingPickupRules ? localPickupRules[dayKey] : childData.pickupRules[dayKey];
              return (
                <Card key={day} className="text-center">
                  <CardContent className="p-2">
                    <h4 className="text-sm font-medium mb-1 leading-tight text-foreground">{day}</h4>
                    {editingPickupRules ? (
                      <div className="space-y-2">
                        <div className="text-xl mb-0.5 leading-none">{rule.icon}</div>
                        <Select 
                          value={rule.rule} 
                          onValueChange={(value) => handlePickupRuleChange(dayKey, value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {pickupOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-xs">
                                {option.icon} {option.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {rule.time && (
                          <p className="text-xs leading-tight text-gray-500 mt-1">
                            🕐 {rule.time} Uhr
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="text-xl mb-0.5 leading-none">{rule.icon}</div>
                        <p className="text-xs leading-tight">{rule.rule}</p>
                        {rule.time && (
                          <p className="text-xs leading-tight text-gray-500 mt-1">
                            🕐 {rule.time} Uhr
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Authorized Pickup Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold leading-tight">Abholberechtigt</h3>
            </div>
            {!editingAuthorizedPickup ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleStartEditing}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Bearbeiten
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelAuthorizedPickup}
                >
                  Abbrechen
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleSaveAuthorizedPickup}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Speichern
                </Button>
              </div>
            )}
          </div>

          {editingAuthorizedPickup && (
            <div className="mb-4 space-y-4">
              {/* Unified Contact Management Section */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-blue-800">Verfügbare Kontakte auswählen</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isAllSelected() ? handleDeselectAll : handleSelectAll}
                      className="text-xs"
                    >
                      {isAllSelected() ? 'Alle abwählen' : 'Alle auswählen'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddNewPerson(!showAddNewPerson)}
                      className="text-xs flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Neuen Kontakt hinzufügen
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allAvailableContacts.map((person, index) => {
                    const isString = typeof person === 'string';
                    const personName = isString ? person : person.name;
                    const personRelationship = isString ? undefined : person.relationship;
                    const personPhone = isString ? undefined : person.phone;
                    const isCurrentParent = personName === currentParent;
                    const isSelected = selectedContacts.has(personName);
                    
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-3 p-3 rounded-lg border ${
                          isCurrentParent 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <Checkbox
                          id={`contact-${index}`}
                          checked={isSelected}
                          onCheckedChange={() => handleContactToggle(personName)}
                          disabled={isCurrentParent} // Current parent cannot be deselected
                          className="mt-0 flex-shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className={isCurrentParent ? 'text-green-800' : 'text-blue-800'}>
                            <p className="font-medium text-sm leading-tight">
                              {personName}
                              {isCurrentParent && ' (Sie)'}
                            </p>
                            {personRelationship && (
                              <p className="text-xs mt-1 leading-tight opacity-80">
                                {personRelationship}
                              </p>
                            )}
                            {personPhone && (
                              <p className="text-xs mt-1 leading-tight opacity-80 flex items-center gap-1">
                                <span className="text-red-500">📞</span>
                                <span>{personPhone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {!isCurrentParent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContact(person)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-600">
                    {selectedContacts.size} {selectedContacts.size === 1 ? 'Person' : 'Personen'} ausgewählt
                  </p>
                </div>
              </div>

              {/* Add New Person Section */}
              {showAddNewPerson && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <h4 className="font-medium text-green-800">Neue Person hinzufügen</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="person-name" className="text-sm">Name *</Label>
                      <Input
                        id="person-name"
                        placeholder="Vor- und Nachname"
                        value={newPersonName}
                        onChange={(e) => setNewPersonName(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="person-relationship" className="text-sm">Verwandtschaftsverhältnis *</Label>
                      <Select value={newPersonRelationship} onValueChange={setNewPersonRelationship}>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Verhältnis auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {relationshipOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-sm">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newPersonRelationship === 'andere' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-relationship" className="text-sm">Bitte spezifizieren *</Label>
                      <Input
                        id="custom-relationship"
                        placeholder="Z.B. Tagesmutter, Babysitter, etc."
                        value={customRelationship}
                        onChange={(e) => setCustomRelationship(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="person-phone" className="text-sm">Telefonnummer (optional)</Label>
                    <Input
                      id="person-phone"
                      placeholder="Z.B. +49 123 456789"
                      value={newPersonPhone}
                      onChange={(e) => setNewPersonPhone(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleAddPerson}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                      disabled={!newPersonName.trim() || !newPersonRelationship || (newPersonRelationship === 'andere' && !customRelationship.trim())}
                    >
                      <Plus className="h-4 w-4" />
                      Person hinzufügen
                    </Button>
                    <Button 
                      onClick={() => setShowAddNewPerson(false)}
                      variant="outline"
                      size="sm"
                    >
                      Abbrechen
                    </Button>
                  </div>
                  
                  <p className="text-xs text-green-600">
                    * Pflichtfelder. Diese Person wird zu Ihren verfügbaren Kontakten hinzugefügt.
                  </p>
                </div>
              )}
            </div>
          )}

          {!editingAuthorizedPickup && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {childData.authorizedPickup.map((person, index) => {
                const isString = typeof person === 'string';
                const personName = isString ? person : person.name;
                const personRelationship = isString ? undefined : person.relationship;
                const personPhone = isString ? undefined : person.phone;
                const isCurrentParent = personName === currentParent;
                
                return (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border ${
                      isCurrentParent 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                    
                    <div className="flex-1 min-w-0">
                      <div className={isCurrentParent ? 'text-green-800' : 'text-blue-800'}>
                        <p className="font-medium text-sm leading-tight">
                          {personName}
                          {isCurrentParent && ' (Sie)'}
                        </p>
                        {personRelationship && (
                          <p className="text-xs mt-1 leading-tight opacity-80">
                            {personRelationship}
                          </p>
                        )}
                        {personPhone && (
                          <p className="text-xs mt-1 leading-tight opacity-80 flex items-center gap-1">
                            <span className="text-red-500">📞</span>
                            <span>{personPhone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
