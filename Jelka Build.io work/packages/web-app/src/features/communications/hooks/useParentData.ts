import { useState, useEffect } from 'react';
import { Parent, Student } from '../../user-management/types/user';

export function useParentData(user: any) {
  const [parentData, setParentData] = useState<Parent | null>(null);
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParentData();
  }, []);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demo - replace with actual Supabase queries
      setParentData({
        id: 1,
        first_name: 'Maria',
        last_name: 'Schmidt',
        email: user?.email || 'maria.schmidt@email.de',
        role: 'parent',
        created_at: new Date().toISOString(),
        active: true,
        children: []
      });

      setChildren([
        { id: 1, name: 'Emma Schmidt', class: '3A', parent_ids: [1] },
        { id: 2, name: 'Max Schmidt', class: '5B', parent_ids: [1] }
      ]);
      
    } catch (error) {
      console.error('Error fetching parent data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    parentData,
    children,
    loading,
    refetch: fetchParentData
  };
}
