import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import { supabase, api } from './utils/supabase/client';

export type UserRole = 'admin' | 'manager' | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string;
  companyName?: string;
  tempPassword?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    loading: true
  });

  useEffect(() => {
    // Check for existing session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await loadUserProfile(session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          accessToken: null,
          loading: false
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await loadUserProfile(session.access_token);
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Session check error:', error);
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadUserProfile = async (accessToken: string) => {
    try {
      const response = await api.getProfile(accessToken);
      if (response.profile) {
        setAuthState({
          user: response.profile,
          accessToken,
          loading: false
        });
      } else {
        setAuthState({
          user: null,
          accessToken: null,
          loading: false
        });
      }
    } catch (error) {
      console.error('Profile load error:', error);
      setAuthState({
        user: null,
        accessToken: null,
        loading: false
      });
    }
  };

  const handleLogin = async (user: User, accessToken: string) => {
    setAuthState({
      user,
      accessToken,
      loading: false
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthState({
      user: null,
      accessToken: null,
      loading: false
    });
  };

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authState.user || !authState.accessToken) {
    return <LoginPage onLogin={handleLogin} />;
  }
console.log('authState.user:', authState.user);
  switch (authState.user.role) {
    case 'admin':
      return <AdminDashboard 
        user={authState.user} 
        accessToken={authState.accessToken}
        onLogout={handleLogout} 
      />;
    case 'manager':
      return <ManagerDashboard 
        user={authState.user} 
        accessToken={authState.accessToken}
        onLogout={handleLogout} 
      />;
    case 'Employee':
      return <EmployeeDashboard 
        user={authState.user} 
        accessToken={authState.accessToken}
        onLogout={handleLogout} 
      />;
    default:
      return <LoginPage onLogin={handleLogin} />;
  }
}