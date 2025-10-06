import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CheckCircle, XCircle, MessageSquare, Clock, FileText, BarChart3, RefreshCw } from 'lucide-react';
import { User } from '../App';
import { toast } from 'sonner';

interface Expense {
  id: string;
  employee: string;
  employeeId: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  receipt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  managerComment?: string;
}

interface ManagerDashboardProps {
  user: User;
  accessToken: string;
  onLogout: () => void;
}

export default function ManagerDashboard({ user, accessToken, onLogout }: ManagerDashboardProps) {
  const [pendingApprovals, setPendingApprovals] = useState<Expense[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch expenses from the API
  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in a real app, this would come from your API
      const mockPendingExpenses: Expense[] = [
        {
          id: '1',
          employee: 'Purushoath',
          employeeId: 'emp001',
          category: 'Travel',
          amount: 450,
          date: '2024-01-15',
          description: 'Flight ticket',
          receipt: 'receipt_001.pdf',
          status: 'Pending'
        },
      ];
      
      const mockApprovalHistory: Expense[] = [
        {
          id: '4',
          employee: 'Mike Employee',
          employeeId: 'emp001',
          category: 'Travel',
          amount: 320,
          date: '2024-01-10',
          description: 'Hotel accommodation',
          receipt: 'receipt_004.pdf',
          status: 'Approved',
          managerComment: 'Valid business travel expense'
        },
        {
          id: '5',
          employee: 'Lisa Employee',
          employeeId: 'emp002',
          category: 'Meals',
          amount: 65,
          date: '2024-01-09',
          description: 'Client lunch',
          receipt: 'receipt_005.pdf',
          status: 'Approved',
          managerComment: 'Client entertainment within policy'
        },
        {
          id: '6',
          employee: 'Mike Employee',
          employeeId: 'emp001',
          category: 'Misc',
          amount: 200,
          date: '2024-01-08',
          description: 'Personal laptop',
          receipt: 'receipt_006.pdf',
          status: 'Rejected',
          managerComment: 'Not a valid business expense'
        }
      ];
      
      setPendingApprovals(mockPendingExpenses);
      setApprovalHistory(mockApprovalHistory);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to fetch expenses. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchExpenses();
    
    // Set up polling to check for new expenses every 30 seconds
    const intervalId = setInterval(() => {
      fetchExpenses();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [accessToken]);

  const sidebar = (
    <nav className="p-4 space-y-2">
      {[
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'pending', label: 'Pending Approvals', icon: Clock },
        { id: 'history', label: 'History', icon: FileText }
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

  const handleApproval = async (expenseId: string, action: 'approve' | 'reject') => {
    try {
      // In a real application, you would make an API call here
      // const response = await fetch(`/api/expenses/${expenseId}`, {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${accessToken}`
      //   },
      //   body: JSON.stringify({
      //     status: action === 'approve' ? 'Approved' : 'Rejected',
      //     managerComment: comment || (action === 'approve' ? 'Approved' : 'Rejected')
      //   })
      // });
      
      // For demonstration, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find the expense to approve/reject
      const expense = pendingApprovals.find(exp => exp.id === expenseId);
      
      if (expense) {
        // Create a new history entry
        const newHistoryEntry: Expense = {
          ...expense,
          status: action === 'approve' ? 'Approved' : 'Rejected',
          managerComment: comment || (action === 'approve' ? 'Approved' : 'Rejected')
        };
        
        // Add to history
        setApprovalHistory(prev => [newHistoryEntry, ...prev]);
        
        // Remove from pending
        setPendingApprovals(prev => prev.filter(exp => exp.id !== expenseId));
        
        // Show success message
        toast.success(`Expense ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      }
    } catch (error) {
      console.error(`Error ${action}ing expense:`, error);
      toast.error(`Failed to ${action} expense. Please try again.`);
    }
    
    setSelectedExpense(null);
    setComment('');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchExpenses();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Dashboard Overview</h2>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">{pendingApprovals.length}</p>
                  <p className="text-sm text-gray-600">Require your attention</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    ${approvalHistory.filter(h => h.status === 'Approved').reduce((sum, h) => sum + h.amount, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Approved expenses</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Team Size</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    {[...new Set(pendingApprovals.concat(approvalHistory).map(e => e.employeeId))].length}
                  </p>
                  <p className="text-sm text-gray-600">Direct reports</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest expense submissions and approvals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingApprovals.slice(0, 3).map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{expense.employee}</p>
                        <p className="text-sm text-gray-600">{expense.category} - ${expense.amount}</p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  ))}
                  {pendingApprovals.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No pending expenses</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'pending':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Pending Approvals</h3>
                <p className="text-gray-600">Review and approve expense submissions</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {pendingApprovals.length} pending
                </Badge>
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold">{expense.employee}</h4>
                          <p className="text-sm text-gray-600">{expense.date}</p>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Category</label>
                          <p>{expense.category}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Amount</label>
                          <p className="text-lg font-semibold">${expense.amount}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Receipt</label>
                          <Button variant="outline" size="sm">
                            View Receipt
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="mt-1 text-gray-900">{expense.description}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => setSelectedExpense(expense)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Expense</DialogTitle>
                              <DialogDescription>
                                You are about to approve {expense.employee}'s expense of ${expense.amount}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Add a comment (optional)"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedExpense(null)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleApproval(expense.id, 'approve')}>
                                Approve
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              onClick={() => setSelectedExpense(expense)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Expense</DialogTitle>
                              <DialogDescription>
                                You are about to reject {expense.employee}'s expense of ${expense.amount}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Please provide a reason for rejection"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                              />
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedExpense(null)}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={() => handleApproval(expense.id, 'reject')}>
                                Reject
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Comment
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">No pending expenses to review</p>
                    <Button variant="outline" className="mt-4" onClick={handleRefresh} disabled={isRefreshing}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Approval History</h3>
                <p className="text-gray-600">View past approval decisions</p>
              </div>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
                      <TableHead>Comment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvalHistory.length > 0 ? (
                      approvalHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>{item.employee}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>${item.amount}</TableCell>
                          <TableCell>
                            <Badge variant={item.status === 'Approved' ? 'default' : 'destructive'}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{item.managerComment || '-'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                          No approval history available
                        </TableCell>
                      </TableRow>
                    )}
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