// Firebase Configuration and Initialization
// SEE FIREBASE_SETUP.md for instructions

// TODO: User must replace these values
const firebaseConfig = {
    apiKey: "AIzaSyALrIA9yWXOWcMG0ojP2mLgYq-vdVjcZVY",
    authDomain: "dewabars-animation.firebaseapp.com",
    projectId: "dewabars-animation",
    storageBucket: "dewabars-animation.firebasestorage.app",
    messagingSenderId: "1084227743281",
    appId: "1:1084227743281:web:4b57b60e2714e44e62ef10",
    measurementId: "G-9CN0N6HKP3"
};

// Check for HTTPS on non-localhost (Required for Firebase)
// We exclude 'file:' protocol so you can still open files directly on your computer
if (location.hostname !== "localhost" && location.hostname !== "127.0.0.1" && location.hostname !== "" && location.protocol !== 'file:' && location.protocol !== 'https:') {
    console.warn("Firebase requires HTTPS. Redirecting...");
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

// Check if Firebase SDK is loaded
let db = null;
window.isFirebaseActive = false;

if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY") {
    try {
        firebase.initializeApp(firebaseConfig);
        // Initialize Firestore
        db = firebase.firestore();

        // Enable Offline Persistence (Aggressive Caching for Speed)
        db.enablePersistence()
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    console.warn("Persistence failed: Multiple tabs open.");
                } else if (err.code == 'unimplemented') {
                    console.warn("Persistence not supported by browser.");
                }
            });

        window.isFirebaseActive = true;
        console.log("Firebase initialized successfully");
    } catch (e) {
        console.error("Firebase initialization failed:", e);
    }
} else {
    console.warn("Firebase SDK not found or config not set. Using LocalStorage (Offline Mode).");
}

// --- DB ADAPTER ---
// Abstracts the difference between LocalStorage and Firestore

const DB_ADAPTER = {
    // GET Data
    async get(collectionName) {
        if (window.isFirebaseActive && db) {
            try {
                // For a simple key-value store structure in Firestore, we can use a collection 'site_data' and doc 'collectionName'
                // Or use a collection 'collectionName' if it's a list of items.
                // Approach: We'll treat each DATA_KEY as a single Document in a 'content' collection to keep it simple and atomic,
                // matching the localStorage 'key' -> 'value' model.

                const docRef = db.collection('site_data').doc(collectionName);
                const doc = await docRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    return data.items || []; // We store the array inside an 'items' field
                } else {
                    return [];
                }
            } catch (error) {
                console.error(`Error fetching ${collectionName} from Firebase:`, error);
                // Fallback to local storage if network fails? 
                // Better to return empty or cached to avoid confusion.
                return [];
            }
        } else {
            // LocalStorage Fallback (Synchronous reflected as Async)
            return new Promise((resolve) => {
                const data = localStorage.getItem(collectionName);
                resolve(data ? JSON.parse(data) : []);
            });
        }
    },

    // SAVE Data
    async save(collectionName, data) {
        if (window.isFirebaseActive && db) {
            try {
                // Ensure data is an array (our app structure)
                // We wrap it in an object { items: data } because Firestore 
                // documents must be objects, not arrays at the root.
                await db.collection('site_data').doc(collectionName).set({
                    items: data,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`Saved ${collectionName} to Firebase`);
                return true;
            } catch (error) {
                console.error(`Error saving ${collectionName} to Firebase:`, error);
                throw error;
            }
        } else {
            // LocalStorage Fallback
            return new Promise((resolve) => {
                localStorage.setItem(collectionName, JSON.stringify(data));
                resolve(true);
            });
        }
    },

    // For Content Object (Key-Value pairs, not array)
    // We treat 'dewabars_content' slightly differently or just wrap it in 'items' too?
    // 'dewabars_content' is an object in the current code (homeHeroTitle, etc).
    // The code above expects 'items' to be the value. If data is an object, that's fine.

    // However, the current code checks `if (services.length > 0)`.
    // If 'dewabars_content' is returned as `{ items: {...} }` and we return `data.items`, 
    // it returns the object `{...}`.
    // The app expects `services` to be an ARRAY, but `content` to be an OBJECT.

    // Let's refine get/save to handle both.

    async getAny(key) {
        // console.log(`[DB_ADAPTER] Requesting data for key: ${key}`);
        if (window.isFirebaseActive && db) {
            try {
                const docRef = db.collection('site_data').doc(key);
                const doc = await docRef.get();
                if (doc.exists) {
                    // console.log(`[DB_ADAPTER] Found document for ${key}`);
                    const data = doc.data();
                    // Handle both 'items' (array wrapper) and 'payload' (generic wrapper) formats
                    if (data.items) return data.items;
                    if (data.payload) return data.payload;
                    return data; // Return raw data if no wrapper
                }
                // console.warn(`[DB_ADAPTER] No document found for ${key}`);
                return null;
            } catch (e) {
                console.error(`[DB_ADAPTER] Error getting ${key}:`, e);
                return null;
            }
        } else {
            // console.warn(`[DB_ADAPTER] Firebase inactive, reading from LocalStorage: ${key}`);
            return new Promise(resolve => {
                const d = localStorage.getItem(key);
                resolve(d ? JSON.parse(d) : null);
            });
        }
    },

    async saveAny(key, data) {
        // console.log(`[DB_ADAPTER] Saving data for key: ${key}`, data);
        if (window.isFirebaseActive && db) {
            try {
                // Save using a consistent format. We'll prefer 'payload' but support reading 'items' for backward compat
                await db.collection('site_data').doc(key).set({
                    payload: data,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[DB_ADAPTER] Successfully saved ${key} to Firebase!`);
            } catch (e) {
                console.error(`[DB_ADAPTER] FATAL ERROR saving ${key}:`, e);
                alert("DATABASE SAVE FAILED: " + e.message);
                throw e;
            }
        } else {
            // console.warn(`[DB_ADAPTER] Firebase inactive, saving to LocalStorage: ${key}`);
            localStorage.setItem(key, JSON.stringify(data));
        }
    }
};
