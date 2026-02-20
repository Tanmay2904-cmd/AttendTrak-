// src/pages/admin/SuperAdminDashboard.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Trash2,
  Users,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  password: string;
  schoolName: string;
  createdAt: string;
}



export default function SuperAdminDashboard() {
  const { user, isSuperAdmin, logout } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [pendingAdmins, setPendingAdmins] = useState<AdminUser[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  // Load data on mount
  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const { getDocs, query, collection, where } = await import("firebase/firestore");
      const { db } = await import("@/Firebase");

      const q = query(collection(db, "users"), where("role", "==", "admin"));
      const snapshot = await getDocs(q);

      const loadedAdmins: AdminUser[] = [];
      const loadedPending: AdminUser[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const adminUser: AdminUser = {
          id: doc.id,
          name: data.adminName || data.name || "Unknown",
          email: data.email,
          password: "***",
          schoolName: data.schoolName || "",
          createdAt: data.createdAt
        };

        if (data.isApproved === false) {
          loadedPending.push(adminUser);
        } else {
          loadedAdmins.push(adminUser);
        }
      });

      setAdmins(loadedAdmins);
      setPendingAdmins(loadedPending);
    } catch (e: any) {
      console.error("Error loading admins:", e);
      toast({
        variant: "destructive",
        title: "Error Loading Data",
        description: e.message || "Failed to fetch admins."
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteAdmin = async (adminId: string) => {
    if (!window.confirm("Are you sure you want to delete this admin? This cannot be undone.")) return;

    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("@/Firebase");

      await deleteDoc(doc(db, "users", adminId));

      setAdmins(prev => prev.filter(a => a.id !== adminId));
      setPendingAdmins(prev => prev.filter(a => a.id !== adminId));

      toast({
        title: 'Admin Deleted',
        description: 'The admin account has been permanently removed.',
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Could not delete admin from Firestore.',
      });
    }
  };

  const handleApproveAdmin = async (adminId: string, name: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/Firebase");

      await updateDoc(doc(db, "users", adminId), {
        isApproved: true
      });

      toast({ title: "Approved", description: `${name} has been approved.` });
      loadAdmins();
    } catch (e: any) {
      console.error("Approval error", e);
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-semibold">Access Denied - Super Admin Only</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in w-full">
      {/* Header */}
      {/* Header */}
      <div className="px-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
            Super Admin Dashboard
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground mt-1">
            Manage all teachers and view all attendance data
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={loadAdmins} disabled={isLoading} className="flex-1 sm:flex-none">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={logout} className="flex-1 sm:flex-none">
            Logout
          </Button>
        </div>
      </div>



      {/* Pending Approvals */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-700 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Pending Approvals ({pendingAdmins.length})
          </CardTitle>
          <CardDescription className="text-orange-600">
            Teachers waiting for approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingAdmins.length === 0 ? (
            <p className="text-orange-800/60 text-sm italic">No pending requests at the moment.</p>
          ) : (
            <div className="space-y-3">
              {pendingAdmins.map(admin => (
                <div key={admin.id} className="bg-white border p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                  <div>
                    <p className="font-semibold">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-xs text-muted-foreground">{new Date(admin.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button onClick={() => handleApproveAdmin(admin.id, admin.name)} className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto">
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Registered Teachers ({admins.length})
          </CardTitle>
          <CardDescription>All teachers in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {admins.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No admins created yet</p>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="border p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{admin.name}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-sm text-muted-foreground">{admin.schoolName}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteAdmin(admin.id)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
                    <span className="sm:hidden">Delete Admin</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>




    </div>
  );
}