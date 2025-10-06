import { useState, useEffect } from "react";
import DashboardLayout from "./DashboardLayout";
import PasswordChangeDialog from "./PasswordChangeDialog";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";
import {
  Upload,
  Plus,
  FileText,
  BarChart3,
  Camera,
  DollarSign,
  Key,
} from "lucide-react";
import { User } from "../App";

interface EmployeeDashboardProps {
  user: User;
  accessToken: string;
  onLogout: () => void;
}

// Mock data
const initialExpenses = [
  {
    id: "1",
    date: "2024-01-15",
    category: "Travel",
    amount: 450,
    status: "Pending",
    description: "Flight tickets for client meeting",
    managerComment: "",
  },
  {
    id: "2",
    date: "2024-01-10",
    category: "Travel",
    amount: 320,
    status: "Approved",
    description: "Hotel accommodation",
    managerComment: "Valid business travel expense",
  },
  {
    id: "3",
    date: "2024-01-08",
    category: "Misc",
    amount: 200,
    status: "Rejected",
    description: "Personal laptop",
    managerComment: "Not a valid business expense",
  },
];

const categories = [
  "Travel",
  "Meals",
  "Office Supplies",
  "Transportation",
  "Accommodation",
  "Software",
  "Misc",
];

export default function EmployeeDashboard({
  user,
  accessToken,
  onLogout,
}: EmployeeDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  // Convert myExpenses to a state variable
  const [myExpenses, setMyExpenses] = useState(initialExpenses);
  const [expenseForm, setExpenseForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    receipt: null as File | null,
  });

  useEffect(() => {
    // Check if user has a temporary password
    if (user.tempPassword) {
      setShowPasswordChange(true);
    }
  }, [user]);

  const sidebar = (
    <nav className="p-4 space-y-2">
      {[
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "submit", label: "Submit Expense", icon: Plus },
        {
          id: "expenses",
          label: "My Expenses",
          icon: FileText,
        },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            activeTab === item.id
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "hover:bg-gray-50 text-gray-700"
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </button>
      ))}
    </nav>
  );

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !expenseForm.amount ||
      !expenseForm.category ||
      !expenseForm.description
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create a new expense object
    const newExpense = {
      id: Date.now().toString(), // Generate a unique ID
      date: expenseForm.date,
      category: expenseForm.category,
      amount: parseFloat(expenseForm.amount),
      status: "Pending", // New expenses start as pending
      description: expenseForm.description,
      managerComment: "",
    };

    // Add the new expense to the state
    setMyExpenses((prevExpenses) => [newExpense, ...prevExpenses]);
    
    console.log("Submitting expense:", newExpense);
    toast.success("Expense submitted successfully!");

    // Reset form
    setExpenseForm({
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      receipt: null,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExpenseForm((prev) => ({ ...prev, receipt: file }));
      toast.success("Receipt uploaded successfully!");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-orange-600">
                    {
                      myExpenses.filter(
                        (e) => e.status === "Pending",
                      ).length
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    Awaiting approval
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">
                    $                     {myExpenses
                      .filter((e) => e.status === "Approved")
                      .reduce((sum, e) => sum + e.amount, 0)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Approved expenses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Submitted</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">
                    $                     {myExpenses.reduce(
                      (sum, e) => sum + e.amount,
                      0,
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    All time
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>
                  Your latest expense submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myExpenses.slice(0, 3).map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {expense.category}
                        </p>
                        <p className="text-sm text-gray-600">
                          {expense.date} - ${expense.amount}
                        </p>
                      </div>
                      <Badge
                        variant={
                          expense.status === "Approved"
                            ? "default"
                            : expense.status === "Pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {expense.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setActiveTab("submit")}
                  className="h-20 flex flex-col gap-2"
                >
                  <Plus className="h-6 w-6" />
                  Submit New Expense
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("expenses")}
                  className="h-20 flex flex-col gap-2"
                >
                  <FileText className="h-6 w-6" />
                  View All Expenses
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case "submit":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">
                Submit New Expense
              </h3>
              <p className="text-gray-600">
                Fill out the form to submit your expense for
                approval
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleSubmitExpense}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-10"
                            value={expenseForm.amount}
                            onChange={(e) =>
                              setExpenseForm((prev) => ({
                                ...prev,
                                amount: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">
                          Category *
                        </Label>
                        <Select
                          value={expenseForm.category}
                          onValueChange={(value: string) =>
                            setExpenseForm((prev) => ({
                              ...prev,
                              category: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category}
                                value={category}
                              >
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) =>
                          setExpenseForm((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your expense..."
                        value={expenseForm.description}
                        onChange={(e) =>
                          setExpenseForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Submit Expense
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Receipt Upload</CardTitle>
                  <CardDescription>
                    Upload your receipt for verification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Drop receipt to auto-fill details using
                        OCR
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        Or click to upload manually
                      </p>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="receipt-upload">
                          <Button variant="outline" asChild>
                            <span>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Receipt
                            </span>
                          </Button>
                        </label>
                        <input
                          id="receipt-upload"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {expenseForm.receipt && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          Receipt uploaded:{" "}
                          {expenseForm.receipt.name}
                        </p>
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>OCR Feature:</strong> When you
                        upload a receipt, our system can
                        automatically extract amount, date, and
                        vendor information to speed up your
                        expense submission.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "expenses":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  My Expenses
                </h3>
                <p className="text-gray-600">
                  Track all your submitted expenses
                </p>
              </div>
              <Button onClick={() => setActiveTab("submit")}>
                <Plus className="mr-2 h-4 w-4" />
                New Expense
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Manager Comments</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell>
                          {expense.category}
                        </TableCell>
                        <TableCell>${expense.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              expense.status === "Approved"
                                ? "default"
                                : expense.status === "Pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {expense.managerComment || "-"}
                        </TableCell>
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
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      sidebar={sidebar}
    >
      {user.tempPassword && (
        <Alert className="mb-6">
          <Key className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Please change your temporary password to secure
              your account.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordChange(true)}
            >
              Change Password
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <PasswordChangeDialog
        open={showPasswordChange}
        onOpenChange={setShowPasswordChange}
        accessToken={accessToken}
        onPasswordChanged={() => {
          toast.success(
            "Password changed successfully! Please sign in again with your new password.",
          );
        }}
      />

      {renderContent()}
    </DashboardLayout>
  );
}
