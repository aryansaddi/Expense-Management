import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { Users, Settings, FileText, BarChart3, Plus, Edit, Trash2, Copy } from 'lucide-react';
import type { User } from '../App';
import { api } from '../utils/supabase/client';

interface AdminDashboardProps {
  user: User;
  accessToken: string;
  onLogout: () => void;
}

// Mock data
const companyData = {
  name: 'Acme Corporation',
  currency: 'USD',
  country: 'United States'
};

const mockUsers = [
  { id: '1', name: 'John Admin', role: 'Admin', manager: '-', email: 'admin@acme.com' },
  { id: '2', name: 'Sarah Manager', role: 'Manager', manager: 'John Admin', email: 'sarah@acme.com' },
  { id: '3', name: 'Mike Employee', role: 'Employee', manager: 'Sarah Manager', email: 'mike@acme.com' },
  { id: '4', name: 'Lisa Employee', role: 'Employee', manager: 'Sarah Manager', email: 'lisa@acme.com' }
];

const mockExpenses = [
  { id: '1', employee: 'Purushoath', category: 'Travel', amount: 450, status: 'Pending', approver: 'Harsh Manager', date: '2024-01-15' },
 // { id: '2', employee: 'Lisa Employee', category: 'Meals', amount: 85, status: 'Approved', approver: 'Sarah Manager', date: '2024-01-14' },
  //{ id: '3', employee: 'Mike Employee', category: 'Office Supplies', amount: 120, status: 'Rejected', approver: 'Sarah Manager', date: '2024-01-13' }
];

const approvalRules = [
  { id: '1', name: 'Standard Approval', condition: 'Amount < $500', approver: 'Direct Manager' },
  { id: '2', name: 'Executive Approval', condition: 'Amount >= $500', approver: 'CFO' },
  { id: '3', name: 'Travel Expenses', condition: 'Category = Travel', approver: 'Travel Manager' }
];

export default function AdminDashboard({ user, accessToken, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    role: 'employee' as 'manager' | 'employee',
    managerId: ''
  });
  const [createdUser, setCreatedUser] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.getUsers(accessToken);
      if (response.users) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    // Make sure we have the required data
    if (!newUserForm.name.trim()) {
      toast.error('Employee name is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Capitalize the role if needed
      const formattedRole = newUserForm.role.charAt(0).toUpperCase() + newUserForm.role.slice(1);
      
      // Log the data being sent for debugging
      console.log('Creating user with data:', {
        name: newUserForm.name,
        role: formattedRole,
        managerId: newUserForm.managerId || undefined
      });
      
      const response = await api.createEmployee(
        newUserForm.name,
        formattedRole,
        newUserForm.managerId || undefined,
        accessToken
      );
      
      if (response.error) {
        toast.error(response.error);
        setLoading(false);
        return;
      }
      
      setCreatedUser(response.user);
      toast.success('Employee created successfully!');
      setNewUserForm({ name: '', role: 'employee', managerId: '' });
      loadUsers(); // Refresh the users list
      setShowCreateUser(false); // Close the dialog
    } catch (error) {
      console.error('Failed to create user:', error);
      toast.error(
        'Failed to create user: ' +
        (typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Fix the managers filter to handle case-insensitive role comparison
  const managers = users.filter(u => u.role.toLowerCase() === 'manager');

  const sidebar = (
    <nav className="p-4 space-y-2">
      {[
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'approval-rules', label: 'Approval Rules', icon: Settings },
        { id: 'all-expenses', label: 'All Expenses', icon: FileText }
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            activeTab === item.id 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </button>
      ))}
    </nav>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Overview</CardTitle>
                <CardDescription>Basic company information and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Company Name</label>
                    <Input value={user.companyName || 'N/A'} readOnly />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Currency</label>
                    <Input value="USD" readOnly />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Country</label>
                    <Input value="United States" readOnly />
                  </div>
                </div>
                <Button>Update Company Info</Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{users.length}</p>
                  <p className="text-sm text-gray-600">Registered users</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Managers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {users.filter(u => u.role.toLowerCase() === 'manager').length}
                  </p>
                  <p className="text-sm text-gray-600">Active managers</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    {users.filter(u => u.role.toLowerCase() === 'employee').length}
                  </p>
                  <p className="text-sm text-gray-600">Active employees</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">User Management</h3>
                <p className="text-gray-600">Manage users and their roles</p>
              </div>
              <Button onClick={() => setShowCreateUser(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>

            {createdUser && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Employee created successfully!</strong></p>
                    <div className="flex items-center gap-2">
                      <span>Email: {createdUser.email}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(createdUser.email)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Temporary Password: {createdUser.tempPassword}</span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(createdUser.tempPassword)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Share these credentials with the employee. They can change their password after first login.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell>{userData.name}</TableCell>
                          <TableCell>
                            <Badge variant={userData.role.toLowerCase() === 'admin' ? 'default' : 'secondary'}>
                              {userData.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{userData.email}</TableCell>
                          <TableCell>
                            {userData.managerId 
                              ? users.find(u => u.id === userData.managerId)?.name || 'Unknown'
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {userData.role.toLowerCase() !== 'admin' && (
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Employee</DialogTitle>
                  <DialogDescription>
                    Create a new employee account. An email will be generated automatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee-name">Employee Name</Label>
                    <Input
                      id="employee-name"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employee-role">Role</Label>
                    <Select 
                      value={newUserForm.role} 
                      onValueChange={(value: 'manager' | 'employee') => 
                        setNewUserForm(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {newUserForm.role === 'employee' && managers.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="manager">Manager (Optional)</Label>
                      <Select
                        value={newUserForm.managerId || "none"}
                        onValueChange={(value: string) =>
                          setNewUserForm(prev => ({
                            ...prev,
                            managerId: value === "none" ? "" : value
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No manager</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {manager.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateUser(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Employee'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );

      case 'approval-rules':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Approval Flow Setup</h3>
                <p className="text-gray-600">Configure approval rules and workflows</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Approver</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvalRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>{rule.name}</TableCell>
                        <TableCell>{rule.condition}</TableCell>
                        <TableCell>{rule.approver}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      case 'all-expenses':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">All Expenses</h3>
                <p className="text-gray-600">View and manage all expense reports</p>
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Search employee..." className="w-48" />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approver</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell>{expense.employee}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>${expense.amount}</TableCell>
                        <TableCell>
                          <Badge variant={
                            expense.status === 'Approved' ? 'default' :
                            expense.status === 'Pending' ? 'secondary' : 'destructive'
                          }>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{expense.approver}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout user={user} onLogout={onLogout} sidebar={sidebar}>
      {renderContent()}
    </DashboardLayout>
  );
}