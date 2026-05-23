import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

// ── Config ────────────────────────────────────────────────────────────────────
// Values are loaded from environment variables (VITE_ prefix exposes them to
// the browser bundle). Set these in a local .env file — never commit secrets.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const app = initializeApp(firebaseConfig);

// ── Services ──────────────────────────────────────────────────────────────────
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ──────────────────────────────────────────────────────────────

/** Register with email/password and create a Firestore player profile. */
export async function registerWithEmail(
  username: string,
  email: string,
  password: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: username });
  await createPlayerProfile(credential.user.uid, username, credential.user.photoURL ?? "");
  return credential.user;
}

/** Sign in with email/password. */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/** Sign in with Google popup. Creates a profile on first login. */
export async function loginWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = credential.user;

  // Only create profile if it doesn't exist yet
  const profileSnap = await getDoc(doc(db, "players", user.uid));
  if (!profileSnap.exists()) {
    await createPlayerProfile(
      user.uid,
      user.displayName ?? `Player_${user.uid.slice(0, 5)}`,
      user.photoURL ?? ""
    );
  }
  return user;
}

/** Sign out the current user. */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

export interface PlayerProfile {
  uid: string;
  username: string;
  avatar: string;
  xp: number;
  wins: number;
  losses: number;
  gamesPlayed: number;
  createdAt: unknown; // Firestore Timestamp
}

/** Create a new player document in Firestore. */
async function createPlayerProfile(
  uid: string,
  username: string,
  avatar: string
): Promise<void> {
  await setDoc(doc(db, "players", uid), {
    uid,
    username,
    avatar,
    xp: 0,
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    createdAt: serverTimestamp(),
  } satisfies Omit<PlayerProfile, "createdAt"> & { createdAt: unknown });
}

/** Fetch a player's profile from Firestore. */
export async function getPlayerProfile(uid: string): Promise<PlayerProfile | null> {
  const snap = await getDoc(doc(db, "players", uid));
  return snap.exists() ? (snap.data() as PlayerProfile) : null;
}

/** Record a game result — increments wins/losses/xp/gamesPlayed. */
export async function recordGameResult(
  uid: string,
  won: boolean
): Promise<void> {
  const xpGained = won ? 50 : 10;
  await updateDoc(doc(db, "players", uid), {
    wins: won ? increment(1) : increment(0),
    losses: won ? increment(0) : increment(1),
    gamesPlayed: increment(1),
    xp: increment(xpGained),
  });
}

/** Fetch the top-N players by XP for the leaderboard. */
export async function getLeaderboard(topN = 20): Promise<PlayerProfile[]> {
  const q = query(
    collection(db, "players"),
    orderBy("xp", "desc"),
    limit(topN)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PlayerProfile);
}
