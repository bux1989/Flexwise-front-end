import React, { useState } from 'react';
import { Button } from './ui/button';
import { DebugOverlay } from '../debug';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Badge } from './ui/badge';
import {
  Menu,
  Calendar,
  UserCheck,
  Clock,
  Edit,
  BookOpen,
  Settings,
  Boxes,
  DoorClosed,
  LogOut
} from 'lucide-react';

interface NavigationProps {
  onNavigate: (view: string) => void;
  currentView: string;
  onShowSettings: () => void;
  onLogout: () => void;
}

// Custom Soccer Ball Icon Component
const SoccerBallIcon = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a9.8 9.8 0 0 0-5.6 7.8L12 14l5.6-4.2A9.8 9.8 0 0 0 12 2"/>
    <path d="M12 22a9.8 9.8 0 0 0 5.6-7.8L12 10l-5.6 4.2A9.8 9.8 0 0 0 12 22"/>
    <path d="M2 12a9.8 9.8 0 0 1 7.8-5.6L14 12l-4.2 5.6A9.8 9.8 0 0 1 2 12"/>
    <path d="M22 12a9.8 9.8 0 0 1-7.8 5.6L10 12l4.2-5.6A9.8 9.8 0 0 1 22 12"/>
  </svg>
);

export function Navigation({ onNavigate, currentView, onShowSettings, onLogout }: NavigationProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mainNavItems = [
    { id: 'home', label: 'Flex', icon: SoccerBallIcon },
    { id: 'planung', label: 'Planung', icon: Calendar },
    { id: 'fehlzeiten', label: 'Fehlzeiten', icon: UserCheck },
    { id: 'checkinout', label: 'Check In/Out', icon: Clock },
    { id: 'schnelleingabe', label: 'Schnelleingabe', icon: Edit }
  ];

  const utilityItems = [
    { id: 'berichte', label: 'Berichte', icon: BookOpen },
    { id: 'einstellungen', label: 'Einstellungen', icon: Settings }
  ];

  const sidebarItems = [
    ...mainNavItems,
    { id: 'ressourcen-raeume', label: 'Räume', icon: DoorClosed },
    { id: 'ressourcen-allgemein', label: 'Ressourcen', icon: Boxes },
    ...utilityItems
  ];

  const handleNavigationClick = (id: string) => {
    if (id === 'einstellungen') {
      onShowSettings();
    } else {
      onNavigate(id);
    }
  };

  return (
    <DebugOverlay name="Navigation">
      {/* Top Navigation */}
      <nav className="bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo and Sidebar Toggle */}
            <div className="flex items-center gap-3">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="py-4">
                    <div className="mb-6">
                      <h2 className="font-medium">FlexWise</h2>
                      <p className="text-sm text-muted-foreground">Admin Dashboard</p>
                    </div>
                    <nav className="space-y-2">
                      {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.id}
                            variant={currentView === item.id ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            onClick={() => {
                              handleNavigationClick(item.id);
                              setSidebarOpen(false);
                            }}
                          >
                            <Icon className="h-4 w-4 mr-3" />
                            {item.label}
                          </Button>
                        );
                      })}

                      {/* Logout Button in Sidebar */}
                      <div className="pt-4 border-t border-border">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            onLogout();
                            setSidebarOpen(false);
                          }}
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Abmelden
                        </Button>
                      </div>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              
              <button 
                onClick={() => onNavigate('home')}
                className="font-medium text-lg hover:text-primary/80 transition-colors"
              >
                FlexWise
              </button>
            </div>

            {/* Main Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentView === item.id ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleNavigationClick(item.id)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Utility Navigation */}
          <div className="flex items-center gap-2">
            {utilityItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavigationClick(item.id)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              );
            })}

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          </div>
        </div>
      </nav>
    </DebugOverlay>
  );
}
