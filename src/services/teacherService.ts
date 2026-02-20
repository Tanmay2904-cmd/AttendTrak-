import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/Firebase";

export interface TeacherConfig {
    sheetUrl: string;
    apiKey: string;
    className: string;
    adminName: string;
    adminEmail: string;
    role: "admin" | "super_admin";
}

export async function saveTeacherSheetMapping(
    adminId: string,
    config: TeacherConfig
) {
    await setDoc(
        doc(db, "users", adminId),
        config,
        { merge: true }
    );
}

export async function getTeacherConfig(adminId: string): Promise<TeacherConfig | null> {
    const snap = await getDoc(doc(db, "users", adminId));
    if (snap.exists()) {
        return snap.data() as TeacherConfig;
    }
    return null;
}
