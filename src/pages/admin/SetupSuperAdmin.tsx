
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Rocket } from 'lucide-react';

export default function SetupSuperAdmin() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // Specific credentials requested by user
    const [formData, setFormData] = useState({
        name: 'Super Admin',
        email: 'super@school.com',
        password: 'super123'
    });

    const handleCreateSuperAdmin = async () => {
        setIsLoading(true);
        try {
            // 1. Dynamic imports for Firebase
            const { initializeApp, getApps } = await import("firebase/app");
            const { getAuth, createUserWithEmailAndPassword, signOut } = await import("firebase/auth");
            const { getFirestore, doc, setDoc } = await import("firebase/firestore"); // Import getFirestore
            const { db, firebaseConfig } = await import("@/Firebase");

            // 2. Use secondary app to avoid interfering with current session (if any)
            const secondaryAppName = "superAdminSetupApp";
            let secondaryApp = getApps().find(app => app.name === secondaryAppName);
            if (!secondaryApp) {
                secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
            }
            const secondaryAuth = getAuth(secondaryApp);
            const secondaryDb = getFirestore(secondaryApp); // Initialize Firestore for secondary app

            // 3. Create User or Sign In if exists
            let userCred;
            const { signInWithEmailAndPassword } = await import("firebase/auth");

            try {
                userCred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
            } catch (createError: any) {
                if (createError.code === 'auth/email-already-in-use') {
                    // If user exists (from previous failed attempt), try logging in to update Firestore
                    userCred = await signInWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
                } else {
                    throw createError;
                }
            }

            const uid = userCred.user.uid;

            // 4. Set Firestore Data directly as Super Admin (Using secondaryDb)
            await setDoc(doc(secondaryDb, "users", uid), {
                uid,
                name: formData.name,
                adminName: formData.name, // Compatibility
                email: formData.email,
                role: "super_admin",
                isApproved: true,
                createdAt: new Date().toISOString(),
                schoolName: "Main School",
                sheetUrl: "",
                apiKey: ""
            });

            // 5. Cleanup
            await signOut(secondaryAuth);

            toast({
                title: "Super Admin Created! 🚀",
                description: `Login with ${formData.email}`,
            });

        } catch (error: any) {
            console.error("Setup error:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-orange-500">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-orange-100 p-3 rounded-full w-fit mb-4">
                        <Rocket className="w-8 h-8 text-orange-600" />
                    </div>
                    <CardTitle className="text-2xl">Create Super Admin</CardTitle>
                    <CardDescription>
                        Create the master account for AttendTrak.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <Button
                        onClick={handleCreateSuperAdmin}
                        disabled={isLoading}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3"
                    >
                        {isLoading ? "Creating..." : "Create Account"}
                    </Button>

                    <div className="text-center text-sm text-gray-500 pt-4">
                        After success, <a href="/auth" className="text-blue-600 hover:underline">Go to Login</a>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
