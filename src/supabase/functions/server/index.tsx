import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to verify admin access
async function verifyAdmin(c: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }

  // Get user profile to check role
  const userProfile = await kv.get(`user_profile:${user.id}`);
  if (!userProfile || userProfile.role !== 'admin') {
    return null;
  }

  return user;
}

// Helper function to get authenticated user
async function getAuthenticatedUser(c: any) {
  const accessToken = c.req.header('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return null;
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }

  return user;
}

// Health check endpoint
app.get("/make-server-0c780f05/health", (c) => {
  return c.json({ status: "ok" });
});

// Admin login - creates the first admin user if none exists
app.post("/make-server-0c780f05/admin-signup", async (c) => {
  try {
    const { email, password, companyName } = await c.req.json();

    // Check if any admin exists
    const existingAdmins = await kv.getByPrefix("user_profile:");
    const adminExists = existingAdmins.some((profile: any) => profile.role === 'admin');

    if (adminExists) {
      return c.json({ error: "Admin already exists. Only one admin per company is allowed." }, 400);
    }

    // Create the admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        name: "Admin", 
        company_name: companyName 
      }
    });

    if (error) {
      console.log("Admin signup error:", error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile
    await kv.set(`user_profile:${data.user.id}`, {
      id: data.user.id,
      name: "Admin",
      email,
      role: 'admin',
      companyName,
      createdAt: new Date().toISOString()
    });

    // Store company info
    await kv.set(`company:${companyName}`, {
      name: companyName,
      adminId: data.user.id,
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      message: "Admin created successfully",
      user: {
        id: data.user.id,
        email,
        role: 'admin',
        name: "Admin",
        companyName
      }
    });
  } catch (error) {
    console.log("Admin signup error:", error);
    return c.json({ error: "Failed to create admin" }, 500);
  }
});

// Admin creates new employee
app.post("/make-server-0c780f05/create-employee", async (c) => {
  try {
    const admin = await verifyAdmin(c);
    if (!admin) {
      return c.json({ error: "Admin access required" }, 401);
    }

    const { name, role, managerId } = await c.req.json();

    // Get admin profile to get company info
    const adminProfile = await kv.get(`user_profile:${admin.id}`);
    if (!adminProfile) {
      return c.json({ error: "Admin profile not found" }, 400);
    }

    // Generate employee email
    const companyDomain = adminProfile.companyName.toLowerCase().replace(/\s+/g, '');
    const employeeEmail = `${name.toLowerCase().replace(/\s+/g, '.')}@${companyDomain}.com`;
    
    // Generate a temporary password (in production, you'd send this via email)
    const tempPassword = `temp${Math.random().toString(36).substring(2, 8)}`;

    // Create the employee user
    const { data, error } = await supabase.auth.admin.createUser({
      email: employeeEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { 
        name,
        company_name: adminProfile.companyName,
        temp_password: tempPassword
      }
    });

    if (error) {
      console.log("Employee creation error:", error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile
    await kv.set(`user_profile:${data.user.id}`, {
      id: data.user.id,
      name,
      email: employeeEmail,
      role,
      managerId,
      companyName: adminProfile.companyName,
      tempPassword,
      createdAt: new Date().toISOString()
    });

    return c.json({ 
      message: "Employee created successfully",
      user: {
        id: data.user.id,
        name,
        email: employeeEmail,
        role,
        managerId,
        tempPassword
      }
    });
  } catch (error) {
    console.log("Employee creation error:", error);
    return c.json({ error: "Failed to create employee" }, 500);
  }
});

// Get user profile
app.get("/make-server-0c780f05/profile", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const profile = await kv.get(`user_profile:${user.id}`);
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log("Profile fetch error:", error);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// Get all users (admin only)
app.get("/make-server-0c780f05/users", async (c) => {
  try {
    const admin = await verifyAdmin(c);
    if (!admin) {
      return c.json({ error: "Admin access required" }, 401);
    }

    const userProfiles = await kv.getByPrefix("user_profile:");
    return c.json({ users: userProfiles });
  } catch (error) {
    console.log("Users fetch error:", error);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Update user password (for employees to change from temp password)
app.post("/make-server-0c780f05/update-password", async (c) => {
  try {
    const user = await getAuthenticatedUser(c);
    if (!user) {
      return c.json({ error: "Authentication required" }, 401);
    }

    const { newPassword } = await c.req.json();

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (error) {
      console.log("Password update error:", error);
      return c.json({ error: error.message }, 400);
    }

    // Update profile to remove temp password
    const profile = await kv.get(`user_profile:${user.id}`);
    if (profile) {
      delete profile.tempPassword;
      await kv.set(`user_profile:${user.id}`, profile);
    }

    return c.json({ message: "Password updated successfully" });
  } catch (error) {
    console.log("Password update error:", error);
    return c.json({ error: "Failed to update password" }, 500);
  }
});

Deno.serve(app.fetch);