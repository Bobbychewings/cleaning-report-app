import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import AuditForm from './pages/staff/AuditForm';

// Temporary placeholder components
const Unauthorized = () => <div>Unauthorized access. <SignOutButton /></div>;

const SignOutButton = () => {
  const { signOut } = useAuth();
  return <button onClick={signOut} className="bg-red-500 text-white px-4 py-2 mt-4 rounded">Sign Out</button>;
}

function Home() {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userRole === 'admin') return <Navigate to="/admin" replace />;
  if (userRole === 'staff') return <Navigate to="/staff" replace />;

  return <Navigate to="/unauthorized" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin Routes */}
      <Route element={<RequireAuth allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* Staff Routes */}
      <Route element={<RequireAuth allowedRoles={['staff', 'admin']} />}>
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/staff/audit/:locationId" element={<AuditForm />} />
      </Route>

      {/* Default Route */}
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;