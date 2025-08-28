import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Feature definitions - what features exist in the system
export interface Feature {
  id: string;
  name: string;
  description: string;
  category: 'attendance' | 'scheduling' | 'communication' | 'analytics' | 'grading' | 'admin';
  tier_required: 'basic' | 'premium' | 'enterprise';
  roles_access: ('teacher' | 'parent' | 'admin' | 'student')[];
}

// Available features in the system
export const AVAILABLE_FEATURES: Feature[] = [
  // Basic tier features
  {
    id: 'basic_dashboard',
    name: 'Basic Dashboard',
    description: 'Essential dashboard functionality',
    category: 'admin',
    tier_required: 'basic',
    roles_access: ['teacher', 'parent', 'admin', 'student']
  },
  {
    id: 'basic_attendance',
    name: 'Basic Attendance',
    description: 'Simple attendance tracking',
    category: 'attendance',
    tier_required: 'basic',
    roles_access: ['teacher', 'admin']
  },
  {
    id: 'task_management',
    name: 'Task Management',
    description: 'Create and manage tasks',
    category: 'scheduling',
    tier_required: 'basic',
    roles_access: ['teacher', 'admin']
  },

  // Premium tier features
  {
    id: 'advanced_attendance',
    name: 'Advanced Attendance',
    description: 'Detailed attendance analytics and reporting',
    category: 'attendance',
    tier_required: 'premium',
    roles_access: ['teacher', 'admin']
  },
  {
    id: 'parent_messaging',
    name: 'Parent Messaging',
    description: 'Direct communication with parents',
    category: 'communication',
    tier_required: 'premium',
    roles_access: ['teacher', 'parent', 'admin']
  },
  {
    id: 'event_scheduling',
    name: 'Event Scheduling',
    description: 'Schedule and manage school events',
    category: 'scheduling',
    tier_required: 'premium',
    roles_access: ['teacher', 'admin']
  },

  // Enterprise tier features
  {
    id: 'analytics_dashboard',
    name: 'Analytics Dashboard',
    description: 'Advanced analytics and insights',
    category: 'analytics',
    tier_required: 'enterprise',
    roles_access: ['admin']
  },
  {
    id: 'gradebook_advanced',
    name: 'Advanced Gradebook',
    description: 'Comprehensive grading system',
    category: 'grading',
    tier_required: 'enterprise',
    roles_access: ['teacher', 'admin']
  },
  {
    id: 'multi_school_admin',
    name: 'Multi-School Administration',
    description: 'Manage multiple school instances',
    category: 'admin',
    tier_required: 'enterprise',
    roles_access: ['admin']
  }
];

// School subscription information
export interface SchoolSubscription {
  id: string;
  school_id: string;
  tier: 'basic' | 'premium' | 'enterprise';
  enabled_features: string[];
  expires_at: string;
  is_active: boolean;
}

// Context value type
interface FeatureLicensingContextValue {
  subscription: SchoolSubscription | null;
  hasFeature: (featureId: string, userRole?: string) => boolean;
  getAvailableFeatures: (userRole?: string) => Feature[];
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
}

const FeatureLicensingContext = createContext<FeatureLicensingContextValue | undefined>(undefined);

interface FeatureLicensingProviderProps {
  children: React.ReactNode;
  schoolId?: string;
  userRole?: string;
}

export function FeatureLicensingProvider({ 
  children, 
  schoolId, 
  userRole 
}: FeatureLicensingProviderProps) {
  const [subscription, setSubscription] = useState<SchoolSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!schoolId) {
      console.log('🏫 No school ID provided, using basic tier');
      // Default to basic tier if no school ID
      setSubscription({
        id: 'default',
        school_id: 'default',
        tier: 'basic',
        enabled_features: AVAILABLE_FEATURES
          .filter(f => f.tier_required === 'basic')
          .map(f => f.id),
        expires_at: '2099-12-31',
        is_active: true
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch school subscription from your backend
      const { data, error: supabaseError } = await supabase
        .from('school_subscriptions')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .single();

      if (supabaseError) {
        console.error('❌ Error fetching subscription:', supabaseError);
        // Fallback to basic tier on error
        setSubscription({
          id: 'fallback',
          school_id: schoolId,
          tier: 'basic',
          enabled_features: AVAILABLE_FEATURES
            .filter(f => f.tier_required === 'basic')
            .map(f => f.id),
          expires_at: '2099-12-31',
          is_active: true
        });
      } else {
        console.log('✅ School subscription loaded:', data);
        setSubscription(data);
      }
    } catch (err) {
      console.error('💥 Error in fetchSubscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback to basic tier
      setSubscription({
        id: 'error-fallback',
        school_id: schoolId,
        tier: 'basic',
        enabled_features: ['basic_dashboard', 'basic_attendance', 'task_management'],
        expires_at: '2099-12-31',
        is_active: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [schoolId]);

  const hasFeature = (featureId: string, checkUserRole?: string): boolean => {
    if (!subscription || !subscription.is_active) return false;

    // Check if feature is enabled in subscription
    if (!subscription.enabled_features.includes(featureId)) return false;

    // Check if user role has access to this feature
    const feature = AVAILABLE_FEATURES.find(f => f.id === featureId);
    if (!feature) return false;

    if (checkUserRole && !feature.roles_access.includes(checkUserRole as any)) {
      return false;
    }

    // Check subscription tier
    const tierOrder = ['basic', 'premium', 'enterprise'];
    const requiredTierIndex = tierOrder.indexOf(feature.tier_required);
    const currentTierIndex = tierOrder.indexOf(subscription.tier);

    return currentTierIndex >= requiredTierIndex;
  };

  const getAvailableFeatures = (checkUserRole?: string): Feature[] => {
    if (!subscription) return [];

    return AVAILABLE_FEATURES.filter(feature => {
      // Check role access
      if (checkUserRole && !feature.roles_access.includes(checkUserRole as any)) {
        return false;
      }

      // Check if enabled and accessible
      return hasFeature(feature.id, checkUserRole);
    });
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  const value: FeatureLicensingContextValue = {
    subscription,
    hasFeature,
    getAvailableFeatures,
    isLoading,
    error,
    refreshSubscription
  };

  return (
    <FeatureLicensingContext.Provider value={value}>
      {children}
    </FeatureLicensingContext.Provider>
  );
}

// Hook to use feature licensing
export function useFeatureLicensing() {
  const context = useContext(FeatureLicensingContext);
  if (context === undefined) {
    throw new Error('useFeatureLicensing must be used within a FeatureLicensingProvider');
  }
  return context;
}

// Hook to check specific feature access
export function useFeatureAccess(featureId: string, userRole?: string) {
  const { hasFeature, isLoading } = useFeatureLicensing();
  return {
    hasAccess: hasFeature(featureId, userRole),
    isLoading
  };
}

// Hook to get features for current user
export function useUserFeatures(userRole?: string) {
  const { getAvailableFeatures, isLoading } = useFeatureLicensing();
  return {
    features: getAvailableFeatures(userRole),
    isLoading
  };
}
