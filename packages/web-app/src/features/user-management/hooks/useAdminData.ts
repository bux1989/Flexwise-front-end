import { useState, useEffect } from 'react';
import { SystemStats, User } from '../types/user';

export function useAdminData(user: any) {
  const [adminData, setAdminData] = useState<User | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    total_students: 0,
    total_teachers: 0,
    total_parents: 0,
    active_sessions: 0,
    system_health: 'unknown'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demo - replace with actual Supabase queries
      setAdminData({
        id: 1,
        first_name: 'Admin',
        last_name: 'User',
        email: user?.email || 'admin@school.de',
        role: 'admin',
        created_at: new Date().toISOString(),
        active: true
      });

      setSystemStats({
        total_students: 345,
        total_teachers: 28,
        total_parents: 298,
        active_sessions: 45,
        system_health: 'Excellent'
      });
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    adminData,
    systemStats,
    loading,
    refetch: fetchAdminData
  };
}
