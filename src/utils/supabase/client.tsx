import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

// API helper functions
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0c780f05`;

export const api = {
  // Admin creates first account with company
  adminSignup: async (email: string, password: string, companyName: string) => {
    const response = await fetch(`${API_BASE}/admin-signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password, companyName })
    });
    return response.json();
  },

  // Admin creates employee
  createEmployee: async (name: string, role: string, managerId?: string, accessToken?: string) => {
    const response = await fetch(`${API_BASE}/create-employee`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ name, role, managerId })
    });
    return response.json();
  },

  // Get user profile
  getProfile: async (accessToken: string) => {
    const response = await fetch(`${API_BASE}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.json();
  },

  // Get all users (admin only)
  getUsers: async (accessToken: string) => {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.json();
  },

  // Update password
  updatePassword: async (newPassword: string, accessToken: string) => {
    const response = await fetch(`${API_BASE}/update-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ newPassword })
    });
    return response.json();
  }
};