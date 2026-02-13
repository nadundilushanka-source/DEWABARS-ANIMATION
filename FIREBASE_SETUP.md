# How to Set Up Firebase for Your Website

To make your website dynamic (so everyone can see changes you make in the admin panel), you need to connect it to a database. We will use **Google Firebase** because it is free and powerful.

## Step 1: Create a Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com/).
2. Log in with your Google account.
3. Click **"Add project"** (or "Create a project").
4. Name your project (e.g., "dewabars-animation").
5. Disable "Google Analytics" for this project (it simplifies setup).
6. Click **"Create Project"**.

## Step 2: Create a Database (Firestore)
1. In the left sidebar of your new project, click **Build** -> **Firestore Database**.
2. Click **"Create database"**.
3. Choose a location (e.g., `asia-south1` or `us-central1`).
4. **IMPORTANT**: Choose **"Start in test mode"** for now. This allows read/write access without complex rules initially.
   - *Note: In a real production app, you would secure this later.*
5. Click **Create**.

## Step 3: Get Your Configuration Keys
1. In the Project Overview page (click the gear icon ⚙️ next to "Project Overview" in the top left), select **Project settings**.
2. Scroll down to the **"Your apps"** section.
3. Click the **Web** icon (`</>`).
4. Register the app (e.g., "Dewabars Web").
5. You will see a code block with `const firebaseConfig = { ... };`.
6. Copy the values inside `firebaseConfig`.

## Step 4: Update Your Code
1. Open the file `js/firebase-init.js` in your project folder.
2. Replace the placeholder values with the real keys you copied in Step 3.

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "...",
    appId: "..."
};
```

## Step 5: Test It!
1. Open your `admin.html`.
2. Login and make a change (e.g., add a service).
3. Open `index.html` or `services.html` in a **different browser** (or Incognito mode).
4. If you see the change, it's working!

---

**Troubleshooting:**
- If pages are still empty for friends, ensure you have clicked "Save" in the admin panel *after* setting up Firebase, to push your local data to the cloud.
- Check the browser console (F12) for any red error messages.
