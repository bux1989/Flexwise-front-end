import { X, Clock, Home, Users as UsersIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

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

interface ChildDetailModalProps {
  child: Child;
  isOpen: boolean;
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
      monday: { rule: 'Geht allein nach Hause', icon: '🚶' },
      tuesday: { rule: 'Geht allein nach Hause', icon: '🚶' },
      wednesday: { rule: 'Schulbus', icon: '🚌' },
      thursday: { rule: 'noch nicht festgelegt!', icon: '❓' },
      friday: { rule: 'Abholung', icon: '🚗' }
    },
    authorizedPickup: ['Father Müller', 'Mother Müller', 'Oma Müller', 'Opa Müller', 'Uncle Müller', 'Jonas Müller']
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
      monday: { rule: 'Schulbus', icon: '🚌' },
      tuesday: { rule: 'Abholung', icon: '🚗' },
      wednesday: { rule: 'Geht allein nach Hause', icon: '🚶' },
      thursday: { rule: 'Abholung', icon: '🚗' },
      friday: { rule: 'Schulbus', icon: '🚌' }
    },
    authorizedPickup: ['Tom Koch', 'Vater Koch', 'Mutter Koch', 'Oma Koch']
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
      monday: { rule: 'Abholung', icon: '🚗' },
      tuesday: { rule: 'Geht allein nach Hause', icon: '🚶' },
      wednesday: { rule: 'Schulbus', icon: '🚌' },
      thursday: { rule: 'Geht allein nach Hause', icon: '🚶' },
      friday: { rule: 'Abholung', icon: '🚗' }
    },
    authorizedPickup: ['Vater Peters', 'Mutter Peters', 'Tim Peters']
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
      monday: { rule: 'Abholung', icon: '🚗' },
      tuesday: { rule: 'Abholung', icon: '🚗' },
      wednesday: { rule: 'Schulbus', icon: '🚌' },
      thursday: { rule: 'Abholung', icon: '🚗' },
      friday: { rule: 'Geht allein nach Hause', icon: '🚶' }
    },
    authorizedPickup: ['Vater Lang', 'Mutter Lang', 'Opa Lang', 'Nina Lang']
  }
};

const dayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

export function ChildDetailModal({ child, isOpen, onClose }: ChildDetailModalProps) {
  if (!isOpen) return null;

  const childData = scheduleData[child.id as keyof typeof scheduleData];

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold leading-tight">Aktuelle Informationen: {child.name}</h2>
              <p className="text-sm text-gray-500 leading-tight -mt-1">Klasse {child.class}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-3 space-y-4">
          {/* Schedule Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold leading-tight">Stundenplan</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left border-r border-gray-200 font-medium">Zeit</th>
                    {dayNames.map((day) => (
                      <th key={day} className="p-2 text-center border-r border-gray-200 font-medium last:border-r-0">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {childData.schedule.map((row, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="p-2 border-r border-gray-200 font-medium bg-gray-50">
                        {row.time}
                      </td>
                      {dayKeys.map((dayKey) => (
                        <td key={dayKey} className="p-1 border-r border-gray-200 text-center last:border-r-0">
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

          <Separator />

          {/* Pickup Rules Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold leading-tight">Regelung zur Heimgehzeit</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {dayNames.map((day, index) => {
                const dayKey = dayKeys[index];
                const rule = childData.pickupRules[dayKey];
                return (
                  <Card key={day} className="text-center">
                    <CardContent className="p-2">
                      <h4 className="text-sm font-medium mb-1 leading-tight">{day}</h4>
                      <div className="text-xl mb-0.5 leading-none">{rule.icon}</div>
                      <p className="text-xs leading-tight">{rule.rule}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Authorized Pickup Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <UsersIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold leading-tight">Abholberechtigt</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {childData.authorizedPickup.map((person, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="p-2 justify-center text-center bg-blue-50 border-blue-200 text-blue-700"
                >
                  {person}
                </Badge>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}