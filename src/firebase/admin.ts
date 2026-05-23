// ── Firebase Admin SDK — singleton initialization ─────────────────────────
// Uses Application Default Credentials OR service account from env.
// Never import this in client-side code.

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth }      from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

function getAdminApp(): App {
  if (app) return app;
  if (getApps().length > 0) { app = getApps()[0]; return app; }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    // Production: full service account JSON in env var
    const serviceAccount = JSON.parse(serviceAccountJson);
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Development: use FIREBASE_PROJECT_ID + emulator or ADC
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error(
        "Missing Firebase config. Set FIREBASE_SERVICE_ACCOUNT_JSON or VITE_FIREBASE_PROJECT_ID in .env"
      );
    }
    app = initializeApp({ projectId });
  }

  console.log("[Firebase Admin] Initialized");
  return app;
}

export const adminAuth      = getAuth(getAdminApp());
export const adminFirestore = getFirestore(getAdminApp());

// ── Token verification ─────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<{ uid: string; email?: string }> {
  const decoded = await adminAuth.verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email };
}
