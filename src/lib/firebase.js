// Firebase config placeholder.
//
// Not initialized yet — the app currently runs entirely on mock data
// (see lib/mockData.js). Once shells are working end-to-end, install the
// `firebase` package and call `initializeApp(firebaseConfig)` here, then
// export `auth`, `db`, and `storage` for the rest of the app to use.
// Auth should be restricted to .edu email domains at that point.

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const ALLOWED_EMAIL_DOMAIN = "campus.edu"; // TODO: set to the real campus domain
