import { useState } from 'react';
import { Bell, Calendar, FileText, Menu, Plus, User, Users, X, ChevronRight, Edit, LogOut } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';

import { ChildDetailView } from './ChildDetailView';
import { AddChildModal } from './AddChildModal';
import { SickReportModal } from './SickReportModal';
import { PickupRequestModal } from './PickupRequestModal';
import { ParentProfileModal } from './ParentProfileModal';

// Import mock data from shared package
import { PARENT_CHILDREN, PARENT_NEWS, PARENT_APPOINTMENTS } from '../../../../../shared/data/mockData';

interface PendingRequest {
  id: number;
  name: string;
  relationship: string;
  requestDate: string;
}

interface ParentDashboardProps {
  user: any;
}

export function ComprehensiveParentDashboard({ user }: ParentDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState<typeof PARENT_CHILDREN[0] | null>(null);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [sickReportModalOpen, setSickReportModalOpen] = useState(false);
  const [pickupRequestModalOpen, setPickupRequestModalOpen] = useState(false);
  const [parentProfileModalOpen, setParentProfileModalOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [expandedNews, setExpandedNews] = useState<Set<number>>(new Set());
  const [zeugnisSubmitted, setZeugnisSubmitted] = useState(false);
  const [zeugnisDecisionMode, setZeugnisDecisionMode] = useState<'global' | 'individual'>('global');
  const [zeugnisGlobalDecision, setZeugnisGlobalDecision] = useState<'early' | 'normal' | null>(null);
  const [zeugnisGlobalPickupMethod, setZeugnisGlobalPickupMethod] = useState<'pickup' | 'alone' | null>(null);
  const [zeugnisIndividualDecisions, setZeugnisIndividualDecisions] = useState<Record<number, {
    decision: 'early' | 'normal';
    pickupMethod?: 'pickup' | 'alone';
  }>>({});
  const [expandedAppointments, setExpandedAppointments] = useState<Set<number>>(new Set());

  const children = PARENT_CHILDREN;
  const news = PARENT_NEWS;
  const appointments = PARENT_APPOINTMENTS;

  const handleAddPendingRequest = (name: string, relationship: string) => {
    const newRequest: PendingRequest = {
      id: Date.now(), // Simple ID generation
      name,
      relationship,
      requestDate: new Date().toLocaleDateString('de-DE')
    };
    setPendingRequests(prev => [...prev, newRequest]);
  };

  const toggleNewsExpansion = (newsId: number) => {
    setExpandedNews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(newsId)) {
        newSet.delete(newsId);
      } else {
        newSet.add(newsId);
      }
      return newSet;
    });
  };

  const handleZeugnisGlobalDecision = (decision: 'early' | 'normal') => {
    setZeugnisGlobalDecision(decision);
    if (decision === 'normal') {
      setZeugnisGlobalPickupMethod(null);
    }
  };

  const handleZeugnisGlobalPickupMethod = (method: 'pickup' | 'alone') => {
    setZeugnisGlobalPickupMethod(method);
  };

  const handleZeugnisIndividualDecision = (childId: number, decision: 'early' | 'normal', pickupMethod?: 'pickup' | 'alone') => {
    setZeugnisIndividualDecisions(prev => ({
      ...prev,
      [childId]: {
        decision,
        pickupMethod: decision === 'early' ? pickupMethod : undefined
      }
    }));
  };

  const handleZeugnisSubmit = () => {
    let finalDecisions: Record<number, { decision: 'early' | 'normal'; pickupMethod?: 'pickup' | 'alone' }> = {};
    
    if (zeugnisDecisionMode === 'global') {
      children.forEach(child => {
        finalDecisions[child.id] = {
          decision: zeugnisGlobalDecision!,
          pickupMethod: zeugnisGlobalDecision === 'early' ? zeugnisGlobalPickupMethod! : undefined
        };
      });
    } else {
      finalDecisions = { ...zeugnisIndividualDecisions };
    }
    
    // Here you would typically send the decisions to the backend
    console.log('Submitting Zeugnis decisions:', finalDecisions);
    setZeugnisSubmitted(true);
  };

  const canSubmitZeugnis = () => {
    if (zeugnisDecisionMode === 'global') {
      return zeugnisGlobalDecision && (zeugnisGlobalDecision === 'normal' || zeugnisGlobalPickupMethod);
    } else {
      return children.every(child => {
        const decision = zeugnisIndividualDecisions[child.id];
        return decision && (decision.decision === 'normal' || decision.pickupMethod);
      });
    }
  };

  const getZeugnisSummary = () => {
    if (zeugnisDecisionMode === 'global') {
      if (zeugnisGlobalDecision === 'early') {
        const methodText = zeugnisGlobalPickupMethod === 'pickup' ? 'Abholung' : 'Alleine gehen';
        return `Alle Kinder: Frühe Entlassung um 13:00 Uhr - ${methodText}`;
      } else {
        return 'Alle Kinder: Normale Entlassung nach Stundenplan/Profil';
      }
    } else {
      return children.map(child => {
        const decision = zeugnisIndividualDecisions[child.id];
        if (decision?.decision === 'early') {
          const methodText = decision.pickupMethod === 'pickup' ? 'Abholung' : 'Alleine gehen';
          return `${child.name}: Frühe Entlassung um 13:00 Uhr - ${methodText}`;
        } else {
          return `${child.name}: Normale Entlassung nach Stundenplan/Profil`;
        }
      }).join('\n');
    }
  };

  const getSubmittedDecisions = () => {
    let decisions: Record<number, { decision: 'early' | 'normal'; pickupMethod?: 'pickup' | 'alone' }> = {};
    
    if (zeugnisDecisionMode === 'global') {
      children.forEach(child => {
        decisions[child.id] = {
          decision: zeugnisGlobalDecision!,
          pickupMethod: zeugnisGlobalDecision === 'early' ? zeugnisGlobalPickupMethod! : undefined
        };
      });
    } else {
      decisions = { ...zeugnisIndividualDecisions };
    }
    
    return decisions;
  };

  const getGroupedDecisions = () => {
    const submittedDecisions = getSubmittedDecisions();
    const groups: Record<string, {
      decision: 'early' | 'normal';
      pickupMethod?: 'pickup' | 'alone';
      children: typeof children;
    }> = {};

    children.forEach(child => {
      const decision = submittedDecisions[child.id];
      if (decision) {
        const key = `${decision.decision}_${decision.pickupMethod || 'none'}`;
        
        if (!groups[key]) {
          groups[key] = {
            decision: decision.decision,
            pickupMethod: decision.pickupMethod,
            children: []
          };
        }
        
        groups[key].children.push(child);
      }
    });

    return Object.values(groups);
  };

  const handleEditZeugnisDecision = () => {
    // Keep the current decisions when switching to edit mode
    // No need to reset them, just set submitted to false
    setZeugnisSubmitted(false);
  };

  const toggleAppointmentExpansion = (appointmentId: number) => {
    setExpandedAppointments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <button 
              onClick={() => setSelectedChild(null)}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-semibold text-2xl text-primary">FlexWise</span>
            </button>
            <div className="hidden md:block">
              <span className="text-lg text-foreground">Hallo {user?.name || 'Father Müller'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex"
              onClick={() => setSickReportModalOpen(true)}
            >
              Krankmeldung
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex"
              onClick={() => setPickupRequestModalOpen(true)}
            >
              Abholung / Sonderregelung
            </Button>
            
            {/* Header Icons */}
            <div className="flex items-center gap-2">
              {/* Person Icon */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-gray-100"
                onClick={() => setParentProfileModalOpen(true)}
                title="Mein Profil"
              >
                <User className="h-5 w-5 text-muted-foreground" />
              </Button>
              
              {/* Logout Icon */}
              <Button variant="ghost" size="sm" className="hover:bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40 w-80 bg-card border-r border-border transform transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Your Children Section */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg leading-tight text-foreground">Deine Kinder</h3>
                </div>
              </div>
              
              <div className="space-y-2 mb-3">
                {children.map((child) => {
                  const getStatusDisplay = () => {
                    switch (child.status) {
                      case 'present':
                        return { symbol: '✅', text: 'Anwesend', color: 'text-green-600' };
                      case 'dismissed':
                        return { 
                          symbol: '🏁', 
                          text: `Entlassen ${child.dismissedAt} Uhr`, 
                          color: 'text-orange-600' 
                        };
                      case 'excused':
                        return { symbol: '📝', text: 'Entschuldigt', color: 'text-blue-600' };
                      default:
                        return { symbol: '❓', text: 'Status unbekannt', color: 'text-gray-600' };
                    }
                  };

                  const statusDisplay = getStatusDisplay();

                  return (
                    <div
                      key={child.id}
                      className="p-2 rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedChild(child)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium leading-tight ${
                            selectedChild?.id === child.id
                              ? 'text-primary'
                              : 'text-foreground'
                          }`}>
                            {child.name} ({child.class})
                          </p>
                          
                          {/* Status Display */}
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-sm">{statusDisplay.symbol}</span>
                            <span className={`text-xs leading-tight ${statusDisplay.color}`}>
                              {statusDisplay.text}
                            </span>
                          </div>

                          {/* Special Rule Display */}
                          {child.specialRule && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-sm">❗</span>
                              <span className="text-xs leading-tight text-destructive">
                                <strong>Sonderregelung:</strong>{' '}
                                {child.specialRule.type === 'alone' 
                                  ? 'Allein entlassen'
                                  : `Abholung durch: ${child.specialRule.person}`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="space-y-2 mb-3">
                  <div className="text-xs text-muted-foreground px-2">Anfragen in Bearbeitung:</div>
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-2 rounded-lg border border-orange-200 bg-orange-50"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium leading-tight text-orange-800">{request.name}</p>
                          <p className="text-xs text-orange-600 leading-tight -mt-1">
                            Beantragt am {request.requestDate}
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-orange-100 border-orange-300 text-orange-700 text-xs px-2 py-1 rounded">
                        🕐 Wird von der Schule geprüft
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                variant="default"
                onClick={() => setAddChildModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Kind hinzufügen
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 bg-background">
          <div className="max-w-6xl mx-auto pb-16">
            {selectedChild ? (
              <ChildDetailView 
                child={selectedChild} 
                onClose={() => setSelectedChild(null)}
              />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* News & Info Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Bell className="h-6 w-6 text-primary" />
                      <h2 className="text-2xl font-semibold leading-tight text-foreground">Neuigkeiten & Infos</h2>
                    </div>
                    <Button variant="outline" size="sm">Alle ansehen</Button>
                  </div>
                
                <div className="grid gap-2">
                  {news.map((item) => {
                    const isExpanded = expandedNews.has(item.id);
                    const needsExpansion = item.content.length > 80;
                    
                    return (
                      <Card 
                        key={item.id} 
                        className={`hover:shadow-md transition-shadow ${!isExpanded ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          // Only expand if not already expanded
                          if (!isExpanded) {
                            toggleNewsExpansion(item.id);
                          }
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-0.5">
                            <h3 className="text-lg font-semibold leading-tight text-foreground">{item.title}</h3>
                            <div className="flex items-center gap-2">
                              {item.important && !zeugnisSubmitted && (
                                <Badge variant="destructive" className="text-xs">
                                  {item.isZeugnisPost ? 'Bitte entscheiden' : 'Wichtig'}
                                </Badge>
                              )}
                              {zeugnisSubmitted && item.isZeugnisPost && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  ✓ Entscheidung übermittelt
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {new Date(item.date).toLocaleDateString('de-DE')}
                              </span>
                            </div>
                          </div>

                          {/* Special handling for Zeugnis post */}
                          {item.isZeugnisPost ? (
                            <div>
                              <div className={`space-y-3 ${
                                !isExpanded && needsExpansion 
                                  ? 'line-clamp-1 overflow-hidden' 
                                  : ''
                              }`}>
                                <div className="text-gray-700 leading-tight space-y-2">
                                  <p><strong>Liebe Eltern,</strong></p>
                                  <p>am <strong>23. Juli 2024</strong> ist Zeugnisausgabe und der Unterricht endet für alle Kinder bereits um <strong>13:00 Uhr</strong>.</p>
                                  
                                  {isExpanded && (
                                    <>
                                      {!zeugnisSubmitted ? (
                                        <>
                                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="font-medium text-yellow-800 mb-2">⚠️ WICHTIGE ENTSCHEIDUNG ERFORDERLICH</p>
                                            <p className="text-sm text-yellow-700">
                                              Bitte entscheiden Sie bis zum <strong>20.06.</strong>, ob Ihr Kind um 13 Uhr entlassen werden soll.
                                            </p>
                                          </div>

                                          {/* Global Decision Mode */}
                                          {zeugnisDecisionMode === 'global' && (
                                            <div className="space-y-4">
                                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                <h4 className="font-medium text-blue-800 mb-3">Entscheidung für alle Kinder:</h4>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                  <Button
                                                    onClick={() => handleZeugnisGlobalDecision('early')}
                                                    variant={zeugnisGlobalDecision === 'early' ? 'default' : 'outline'}
                                                    size="sm"
                                                    className={`h-auto p-3 ${
                                                      zeugnisGlobalDecision === 'early' 
                                                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                                        : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                                                    }`}
                                                  >
                                                    <div className="text-center">
                                                      <div className="font-medium">🏃 FRÜHE ENTLASSUNG</div>
                                                      <div className="text-xs opacity-90 mt-1">
                                                        Um 13:00 Uhr
                                                      </div>
                                                    </div>
                                                  </Button>
                                                  
                                                  <Button
                                                    onClick={() => handleZeugnisGlobalDecision('normal')}
                                                    variant={zeugnisGlobalDecision === 'normal' ? 'default' : 'outline'}
                                                    size="sm"
                                                    className={`h-auto p-3 ${
                                                      zeugnisGlobalDecision === 'normal' 
                                                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                        : 'border-green-200 text-green-700 hover:bg-green-50'
                                                    }`}
                                                  >
                                                    <div className="text-center">
                                                      <div className="font-medium">🏫 NORMALE ENTLASSUNG</div>
                                                      <div className="text-xs opacity-90 mt-1">
                                                        Nach Stundenplan/Profil
                                                      </div>
                                                    </div>
                                                  </Button>
                                                </div>

                                                {/* Pickup method selection for early release */}
                                                {zeugnisGlobalDecision === 'early' && (
                                                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                    <h5 className="font-medium text-orange-800 mb-2">Wie sollen die Kinder um 13:00 Uhr entlassen werden?</h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                      <Button
                                                        onClick={() => handleZeugnisGlobalPickupMethod('pickup')}
                                                        variant={zeugnisGlobalPickupMethod === 'pickup' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className={`text-xs h-auto p-2 ${
                                                          zeugnisGlobalPickupMethod === 'pickup' 
                                                            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                                            : 'border-orange-300 text-orange-700 hover:bg-orange-100'
                                                        }`}
                                                      >
                                                        🚗 Abholung
                                                      </Button>
                                                      
                                                      <Button
                                                        onClick={() => handleZeugnisGlobalPickupMethod('alone')}
                                                        variant={zeugnisGlobalPickupMethod === 'alone' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className={`text-xs h-auto p-2 ${
                                                          zeugnisGlobalPickupMethod === 'alone' 
                                                            ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                                            : 'border-orange-300 text-orange-700 hover:bg-orange-100'
                                                        }`}
                                                      >
                                                        🚶 Alleine gehen
                                                      </Button>
                                                    </div>
                                                  </div>
                                                )}

                                                <div className="flex justify-center pt-2">
                                                  <Button
                                                    onClick={() => setZeugnisDecisionMode('individual')}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                                  >
                                                    Für jedes Kind einzeln entscheiden
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Submit Button */}
                                          {canSubmitZeugnis() && (
                                            <div className="flex justify-center pt-4">
                                              <Button
                                                onClick={handleZeugnisSubmit}
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2"
                                              >
                                                📤 Entscheidung abschicken
                                              </Button>
                                            </div>
                                          )}

                                          <div className="p-3 bg-muted/30 border border-border rounded-lg">
                                            <p className="text-sm text-muted-foreground">
                                              <strong>Hinweis:</strong> Die Anmeldung ist verbindlich. Bei fehlender Rückmeldung gehen wir davon aus, dass Ihr Kind zur gewohnten Zeit abgeholt wird.
                                            </p>
                                          </div>
                                        </>
                                      ) : (
                                        /* Summary after submission */
                                        <div className="space-y-4">
                                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-3">
                                              <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                                  <span className="text-white font-medium">✓</span>
                                                </div>
                                                <h4 className="font-medium text-green-800">Ihre Entscheidung wurde übermittelt</h4>
                                              </div>
                                              
                                              <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={handleEditZeugnisDecision}
                                                className="border-green-300 text-green-700 hover:bg-green-100 flex items-center gap-1"
                                              >
                                                <Edit className="h-3 w-3" />
                                                Ändern
                                              </Button>
                                            </div>
                                            
                                            <div className="text-sm text-green-700 space-y-3">
                                              <p><strong>Zusammenfassung Ihrer Entscheidung:</strong></p>
                                              
                                              {/* Grouped child decisions */}
                                              <div className="space-y-2">
                                                {getGroupedDecisions().map((group, groupIndex) => {
                                                  const isEarly = group.decision === 'early';
                                                  
                                                  return (
                                                    <div key={groupIndex} className="p-3 bg-white border border-green-200 rounded-lg">
                                                      <div className="space-y-3">
                                                        {/* Decision type header */}
                                                        <div className="flex items-center gap-2">
                                                          {isEarly ? (
                                                            <>
                                                              <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-sm">
                                                                ���� Frühe Entlassung
                                                              </Badge>
                                                              <span className="text-sm text-gray-600">um 13:00 Uhr</span>
                                                              {group.pickupMethod && (
                                                                <Badge variant="outline" className="text-sm border-orange-200 text-orange-700">
                                                                  {group.pickupMethod === 'pickup' ? '🚗 Abholung' : '🚶 Alleine gehen'}
                                                                </Badge>
                                                              )}
                                                            </>
                                                          ) : (
                                                            <>
                                                              <Badge variant="secondary" className="bg-green-100 text-green-800 text-sm">
                                                                🏫 Normale Entlassung
                                                              </Badge>
                                                              <span className="text-sm text-gray-600">nach Stundenplan/Profil</span>
                                                            </>
                                                          )}
                                                        </div>
                                                        
                                                        {/* Children with this decision */}
                                                        <div className="pl-2 border-l-2 border-gray-200">
                                                          <div className="flex flex-wrap gap-2">
                                                            {group.children.map((child) => (
                                                              <div key={child.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1">
                                                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                                  <span className="text-white text-xs font-medium">{child.avatar}</span>
                                                                </div>
                                                                <div className="text-sm">
                                                                  <span className="font-medium text-blue-800">{child.name}</span>
                                                                  <span className="text-xs text-blue-600 ml-1">({child.class})</span>
                                                                </div>
                                                              </div>
                                                            ))}
                                                          </div>
                                                          
                                                          {/* Count indicator */}
                                                          <div className="text-xs text-gray-500 mt-2">
                                                            {group.children.length === 1 
                                                              ? '1 Kind' 
                                                              : `${group.children.length} Kinder`
                                                            }
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                              
                                              <div className="p-3 bg-green-100 border border-green-300 rounded">
                                                <div className="flex items-start gap-2">
                                                  <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-white text-xs">ℹ</span>
                                                  </div>
                                                  <div className="text-xs space-y-1">
                                                    <p className="font-medium">
                                                      📅 Übermittelt am: {new Date().toLocaleDateString('de-DE')} um {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                                                    </p>
                                                    <p>
                                                      Sie können Ihre Entscheidung jederzeit über den "Ändern" Button anpassen.
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      <div className="text-sm text-muted-foreground">
                                        <p>Für Rückfragen stehen wir Ihnen gerne zur Verfügung.</p>
                                        <p className="mt-2">
                                          <strong>Mit freundlichen Grüßen<br />
                                          Das Muster-Grundschule Team</strong>
                                        </p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {needsExpansion && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleNewsExpansion(item.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm mt-3 transition-colors"
                                >
                                  {isExpanded ? 'weniger anzeigen' : 'mehr anzeigen'}
                                </button>
                              )}
                            </div>
                          ) : (
                            /* Regular news post */
                            <div>
                              <p className={`text-gray-700 leading-tight ${
                                !isExpanded && needsExpansion 
                                  ? 'line-clamp-1 overflow-hidden' 
                                  : ''
                              }`}>
                                {item.content}
                              </p>
                              {needsExpansion && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleNewsExpansion(item.id);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm mt-1 transition-colors"
                                >
                                  {isExpanded ? 'weniger anzeigen' : 'mehr anzeigen'}
                                </button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  </div>
                </section>

                {/* Appointments Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-primary" />
                      <h2 className="text-2xl font-semibold leading-tight text-foreground">Termine</h2>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {appointments.map((appointment) => {
                      const isExpanded = expandedAppointments.has(appointment.id);
                      
                      return (
                        <Card 
                          key={appointment.id} 
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => toggleAppointmentExpansion(appointment.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex gap-3 flex-1">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium mb-2 leading-tight">{appointment.title}</h3>
                                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 leading-tight">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(appointment.date).toLocaleDateString('de-DE')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                      </svg>
                                      {appointment.time}
                                    </span>
                                    {appointment.teacher && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {appointment.teacher}
                                      </span>
                                    )}
                                    {appointment.location && (
                                      <span className="flex items-center gap-1">
                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                        </svg>
                                        {appointment.location}
                                      </span>
                                    )}
                                  </div>

                                  {/* Expanded Details */}
                                  {isExpanded && (
                                    <div className="mt-4 space-y-3 pt-3 border-t border-gray-200">
                                      {/* Room Information */}
                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                          <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                                          </svg>
                                          <span className="font-medium text-blue-800 text-sm">Raum/Ort</span>
                                        </div>
                                        <p className="text-sm text-blue-700 leading-tight">
                                          {appointment.room}
                                        </p>
                                      </div>

                                      {/* Help Text */}
                                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                          <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                          </svg>
                                          <span className="font-medium text-gray-700 text-sm">Wichtige Hinweise</span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-tight">
                                          {appointment.helpText}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Only show Details button when not expanded */}
                              {!isExpanded && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAppointmentExpansion(appointment.id);
                                  }}
                                >
                                  Details
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Child Modal */}
      <AddChildModal 
        isOpen={addChildModalOpen} 
        onClose={() => setAddChildModalOpen(false)}
        onAddPendingRequest={handleAddPendingRequest}
      />

      {/* Sick Report Modal */}
      <SickReportModal 
        isOpen={sickReportModalOpen} 
        onClose={() => setSickReportModalOpen(false)}
        children={children}
      />

      {/* Pickup Request Modal */}
      <PickupRequestModal 
        isOpen={pickupRequestModalOpen} 
        onClose={() => setPickupRequestModalOpen(false)}
        children={children}
      />

      {/* Parent Profile Modal */}
      <ParentProfileModal 
        isOpen={parentProfileModalOpen} 
        onClose={() => setParentProfileModalOpen(false)}
        children={children}
      />

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-end">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <button className="hover:text-gray-700 transition-colors">
                Impressum
              </button>
              <span className="text-gray-300">|</span>
              <button className="hover:text-gray-700 transition-colors">
                Datenschutzerklärung
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
