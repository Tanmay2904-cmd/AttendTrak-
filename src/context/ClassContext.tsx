import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { ClassSheet } from '@/types';
import { db } from '@/Firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ClassContextType {
    classes: ClassSheet[];
    selectedClassId: string;
    selectedClass: ClassSheet | undefined;
    itemsLoading: boolean;
    changeClass: (classId: string) => void;
    refreshClasses: () => void;
    addClass: (newClass: ClassSheet) => Promise<void>;
    removeClass: (classId: string) => Promise<void>;
    updateClass: (updatedClass: ClassSheet) => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export function ClassProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [classes, setClasses] = useState<ClassSheet[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [itemsLoading, setItemsLoading] = useState(true);

    // 🔹 Load Classes from Firestore (Real-time)
    useEffect(() => {
        if (!user?.uid) {
            setClasses([]);
            setSelectedClassId('');
            setItemsLoading(false);
            return;
        }

        setItemsLoading(true);
        const classesRef = collection(db, 'users', user.uid, 'classes');
        const q = query(classesRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedClasses: ClassSheet[] = snapshot.docs.map(doc => ({
                ...(doc.data() as ClassSheet),
                id: doc.id // Ensure ID comes from doc ID if needed, but we store it in data too
            }));

            // Handle Migration from LocalStorage if Firestore is empty
            if (fetchedClasses.length === 0) {
                const localData = localStorage.getItem(`class_sheets_${user.uid}`);
                if (localData) {
                    try {
                        const parsed: ClassSheet[] = JSON.parse(localData);
                        if (parsed.length > 0) {
                            console.log("🚀 Migrating local classes to Firestore...");
                            migrateClasses(parsed, user.uid);
                            // Don't set classes here, let the snapshot update handle it after migration
                        }
                    } catch (e) {
                        console.error("Migration failed parsing local storage", e);
                    }
                }
            }

            setClasses(fetchedClasses);

            // Handle selection
            const saved = localStorage.getItem('current_selected_class');
            if (saved && fetchedClasses.find(c => c.id === saved)) {
                setSelectedClassId(saved);
            } else if (fetchedClasses.length > 0 && !selectedClassId) {
                // If nothing selected, select first
                setSelectedClassId(fetchedClasses[0].id);
                localStorage.setItem('current_selected_class', fetchedClasses[0].id);
            }

            setItemsLoading(false);
        }, (error) => {
            console.error("Error fetching classes:", error);
            toast({ variant: "destructive", title: "Sync Error", description: "Failed to load classes from cloud." });
            setItemsLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // 🔹 Helper: Migrate
    const migrateClasses = async (localClasses: ClassSheet[], uid: string) => {
        const batch = writeBatch(db);
        localClasses.forEach(cls => {
            const ref = doc(db, 'users', uid, 'classes', cls.id);
            batch.set(ref, cls);
        });
        await batch.commit();
        toast({ title: "Sync Complete", description: "Your classes have been migrated to the cloud." });
        // Clear local storage after successful migration to avoid re-migration issues? 
        // Better to keep it as backup or clear it? Let's keep it but maybe rename it or just ignore it.
        // For now, we leave it. The check `fetchedClasses.length === 0` prevents re-migration if cloud has data.
    };

    // 🔹 Actions
    const addClass = async (newClass: ClassSheet) => {
        if (!user?.uid) return;
        try {
            await setDoc(doc(db, 'users', user.uid, 'classes', newClass.id), newClass);
            // Auto-select if it's the first one
            if (classes.length === 0) {
                setSelectedClassId(newClass.id);
            }
        } catch (error) {
            console.error("Error adding class:", error);
            throw error;
        }
    };

    const removeClass = async (classId: string) => {
        if (!user?.uid) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'classes', classId));
            if (selectedClassId === classId) {
                setSelectedClassId('');
                localStorage.removeItem('current_selected_class');
            }
        } catch (error) {
            console.error("Error removing class:", error);
            throw error;
        }
    };

    const updateClass = async (updatedClass: ClassSheet) => {
        if (!user?.uid) return;
        try {
            await setDoc(doc(db, 'users', user.uid, 'classes', updatedClass.id), updatedClass, { merge: true });
        } catch (error) {
            console.error("Error updating class:", error);
            throw error;
        }
    };

    const changeClass = (classId: string) => {
        setSelectedClassId(classId);
        localStorage.setItem('current_selected_class', classId);
    };

    const refreshClasses = () => {
        // No-op for Firestore real-time listener, but kept for compatibility
    };

    const selectedClass = classes.find(c => c.id === selectedClassId);

    return (
        <ClassContext.Provider value={{
            classes,
            selectedClassId,
            selectedClass,
            itemsLoading,
            changeClass,
            refreshClasses,
            addClass,
            removeClass,
            updateClass
        }}>
            {children}
        </ClassContext.Provider>
    );
}

export function useClass() {
    const ctx = useContext(ClassContext);
    if (!ctx) throw new Error("useClass must be used within ClassProvider");
    return ctx;
}
