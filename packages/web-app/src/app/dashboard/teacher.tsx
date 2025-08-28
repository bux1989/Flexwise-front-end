import { AdminDashboard as AdminDashboardFeature } from '../../features/user-management/components/AdminDashboard'

export default function TeacherDashboard({ user }) {
  console.log('🎭 TeacherDashboard: Temporary placeholder - redirecting to admin features');
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Teacher Dashboard - Under Construction
          </h1>
          <p className="text-gray-600 mb-4">
            The teacher dashboard is being restructured. Temporarily using admin features.
          </p>
        </div>
        
        <AdminDashboardFeature user={user} />
      </div>
    </div>
  )
}
