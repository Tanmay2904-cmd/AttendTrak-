import * as React from "react";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole, AuthState } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/Firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { fetchUsersFromSheet } from "@/lib/sheetService";

interface AuthContextType extends Omit<AuthState, "user"> {
  user?: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, studentId?: string) => Promise<boolean>;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const { toast } = useToast();

  // 🔹 Firebase session restore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        const studentSessionStr = localStorage.getItem("student_auth_session");
        if (studentSessionStr) {
          try {
            const studentSession = JSON.parse(studentSessionStr);
            setAuthState({
              user: studentSession,
              token: studentSession.uid,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch (e) {
            console.error("Failed to parse student session", e);
            localStorage.removeItem("student_auth_session");
          }
        }

        setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      let role: UserRole = "admin";
      let userData: any = {};

      if (snap.exists()) {
        userData = snap.data();
        role = userData.role || "admin";
      }



      setAuthState({
        user: {
          uid: firebaseUser.uid,
          name: userData.adminName || firebaseUser.email?.split("@")[0] || "Admin",
          email: firebaseUser.email || "",
          role,
          createdAt: new Date().toISOString(),
          sheetUrl: userData.sheetUrl,
          apiKey: userData.apiKey,
          className: userData.className,
        },
        token: firebaseUser.uid,
        isAuthenticated: true,
        isLoading: false,
      });
    });

    return () => unsubscribe();
  }, []);

  // 🔹 HYBRID LOGIN
  const login = async (email: string, password: string): Promise<boolean> => {
    toast({ title: "Authenticating...", description: "Checking credentials..." });
    try {
      // ===== ADMIN → Firebase =====
      try {
        console.log("Attempting Firebase login...");
        const cred = await signInWithEmailAndPassword(auth, email, password);
        console.log("Firebase login successful. Fetching user data...");

        // Fetch config from separate service or direct Firestore
        let userData: any = {};
        let role: UserRole = "admin";

        try {
          const snap = await getDoc(doc(db, "users", cred.user.uid));
          if (snap.exists()) {
            userData = snap.data();
            role = userData.role || "admin";
            console.log("User data fetched from Firestore.");

            // CHECK APPROVAL STATUS
            if (role === 'admin' && userData.isApproved === false) {
              console.warn("Account pending approval.");
              await signOut(auth);
              throw new Error("Your account is pending approval by Super Admin.");
            }
          } else {
            console.warn("User document not found in Firestore. Using default admin defaults.");
            // If doc doesn't exist but Auth does, we assume it's an admin who needs to sync.
          }
        } catch (firestoreError: any) {
          if (firestoreError.message === "Your account is pending approval by Super Admin.") {
            throw firestoreError;
          }
          console.error("Firestore fetch failed (ignoring to allow login):", firestoreError.code, firestoreError.message);
          toast({
            variant: "default",
            title: "Firestore Unavailable",
            description: "Logged in, but could not load saved settings. Please check your internet or Sync settings."
          });
          // Proceed with defaults
        }

        setAuthState({
          user: {
            uid: cred.user.uid,
            name: userData.adminName || email.split("@")[0],
            email,
            role,
            createdAt: new Date().toISOString(),
            sheetUrl: userData.sheetUrl || "",
            apiKey: userData.apiKey || "",
            className: userData.className,
          },
          token: cred.user.uid,
          isAuthenticated: true,
          isLoading: false,
        });

        toast({ title: "Admin login success" });
        return true;
      } catch (e: any) {
        // If Firebase login fails with specific error (wrong password), don't fallback silently if we want to debug
        console.error("Firebase login failed:", e.code, e.message);

        if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
          // These are valid failures for Admin, so we proceed to check Student.
          console.log("Not a valid Firebase user, falling back to Sheet login...");
        } else {
          // Other errors (network, api key blocked, etc) should be shown
          toast({ variant: "destructive", title: "Firebase Error", description: e.message });
          // We still try sheet, just in case.
        }
      }

      // ===== STUDENT → Google Sheet =====
      console.log("Attempting student login via Google Sheets...");
      try {
        const sheetUsers = await fetchUsersFromSheet();
        console.log(`Fetched ${sheetUsers.length} users from sheet.`);

        const matched = sheetUsers.find(
          (u) =>
            u.email.toLowerCase().trim() === email.toLowerCase().trim() &&
            u.password === password
        );

        if (!matched) {
          console.warn("No matching student found.");
          throw new Error("Invalid credentials");
        }

        const sessionUser = {
          uid: `sheet-${matched.rollNo}`,
          name: matched.name,
          email: matched.email,
          role: "user" as UserRole,
          rollNo: matched.rollNo,
          createdAt: new Date().toISOString(),
          sheetUrl: matched.sheetId || "",
        };

        localStorage.setItem("student_auth_session", JSON.stringify(sessionUser));

        setAuthState({
          user: sessionUser,
          token: `sheet-${matched.rollNo}`,
          isAuthenticated: true,
          isLoading: false,
        });

        toast({ title: "Student login success" });
        return true;
      } catch (sheetError: any) {
        console.error("Sheet login error:", sheetError);
        throw sheetError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error("Login process failed:", error);

      let errorMessage = "An unexpected error occurred.";
      if (error.message === "Invalid credentials") {
        errorMessage = "Invalid email or password";
      } else if (error.message.includes("Network error") || error.message.includes("Failed to fetch")) {
        errorMessage = "Network error: Please check your internet connection and try again.";
      } else if (error.message) {
        errorMessage = `Login failed: ${error.message}`;
      }

      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
      return false;
    }
  };

  // 🔹 Register
  const register = async (name: string, email: string, password: string, role: UserRole, studentId?: string): Promise<boolean> => {
    try {
      console.log(`Registering ${role}: ${email}`);
      const userCred = await import("firebase/auth").then(m => m.createUserWithEmailAndPassword(auth, email, password));
      const uid = userCred.user.uid;

      // Prepare user data
      const newUser: any = {
        uid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      };

      if (role === 'admin') {
        // Add default admin fields
        newUser.adminName = name;
        // Optionally add schoolName if passed or default
        // Check if super admin calling this (we can check context but here we assume self-reg if not passed)
        // If registered via SuperAdminDashboard, we might want isApproved=true.
        // But for generic `register` called from Auth.tsx, it's self-registration.
        newUser.schoolName = "School";
        newUser.sheetUrl = "";
        newUser.apiKey = "";
        newUser.isApproved = false; // Require approval
      } else {
        // Student
        newUser.rollNo = studentId;
      }

      // Save to Firestore
      await setDoc(doc(db, "users", uid), newUser);

      toast({ title: "Registration successful" });
      return true;

    } catch (error: any) {
      console.error("Registration failed:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
      return false;
    }
  };

  // 🔹 Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
    localStorage.removeItem("student_auth_session");
    setAuthState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  };

  // Derive isSuperAdmin from user role to avoid state sync issues
  const isSuperAdmin = authState.user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, register, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

