# Project Plan: Personal Firebase File Hosting Site

## Context

Build a personal Google Drive alternative as a React SPA, hosted on Firebase with a custom GoDaddy domain. Only one user (you) will ever access it. The goal is a clean file browser with upload, download, delete, and folder navigation backed by Firebase Cloud Storage.

---

## GoDaddy Domain Protection — Recommendation

**Get basic WHOIS Privacy (~$10-15/yr). Skip the "Full Domain Protection" upsell.**

- **WHOIS Privacy**: Hides your name, address, email, phone from the public WHOIS database. Worth it.
- **Full Domain Protection / Ultimate**: Adds "change lock" (requires extra verification to modify nameservers/contacts) and malware scanning. These are enterprise upsells with real friction and minimal security benefit for a personal site.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React + TypeScript | SPA, type safety |
| Build tool | Vite | Fast, modern, replaces CRA |
| Styling | Tailwind CSS | Rapid utility-first UI |
| Auth | Firebase Auth (Google provider) | Single SSO button |
| Storage | Firebase Cloud Storage | Direct file hosting |
| Hosting | Firebase Hosting | Free tier generous, CDN, HTTPS |
| Access control | Firebase Security Rules | UID allowlist |

---

## Architecture

### Security Model (Critical)
Lock down everything to a single UID in Firebase Security Rules. No backend needed.

**Storage Rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == 'YOUR_GOOGLE_UID';
    }
  }
}
```

After initial login, find your UID in the Firebase Auth console and hardcode it. This is the simplest, most reliable approach for a single-user system.

### App Flow
1. User hits site → check auth state
2. Not signed in → show login page with Google Sign-In button
3. Signed in → check UID matches yours → if not, sign out and show error
4. Signed in as you → show file browser

---

## Project Structure

```
jalvarez/
├── src/
│   ├── lib/
│   │   └── firebase.ts          # Firebase app init + exports
│   ├── hooks/
│   │   ├── useAuth.ts           # Auth state, sign in/out
│   │   └── useStorage.ts        # List files, upload, download, delete
│   ├── components/
│   │   ├── LoginPage.tsx        # Google sign-in UI
│   │   ├── FileExplorer.tsx     # Main file browser shell
│   │   ├── FileList.tsx         # Grid/list of files and folders
│   │   ├── FileItem.tsx         # Single file row/card
│   │   ├── BreadcrumbNav.tsx    # Current path display
│   │   └── UploadZone.tsx       # Drag-and-drop + file picker
│   ├── App.tsx                  # Auth gate + routing
│   └── main.tsx
├── .env.local                   # Firebase config keys (gitignored)
├── firebase.json                # Firebase Hosting config
├── .firebaserc                  # Firebase project alias
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## Implementation Steps

### 1. Firebase Project Setup (Console)
- Create Firebase project at console.firebase.google.com
- Enable **Authentication** → Google provider
- Enable **Cloud Storage** → start in production mode (security rules will restrict access)
- Enable **Hosting**
- Copy Firebase config keys → will go in `.env.local`

### 2. Scaffold the Project
```bash
npm create vite@latest jalvarez -- --template react-ts
cd jalvarez
npm install firebase
npm install -D tailwindcss @tailwindcss/vite
npm install -g firebase-tools
firebase login
firebase init hosting storage
```

### 3. Firebase Config (`src/lib/firebase.ts`)
Initialize app, export `auth`, `storage` instances. Read config from `import.meta.env.VITE_*` variables.

### 4. Auth Hook (`src/hooks/useAuth.ts`)
- `onAuthStateChanged` listener
- `signInWithPopup(GoogleAuthProvider)`
- `signOut`
- Guard: if signed-in UID ≠ your UID, immediately sign out

### 5. Storage Hook (`src/hooks/useStorage.ts`)
- `listAll(ref)` / `list(ref)` — list files and folders at a path
- `getDownloadURL(ref)` — generate download link
- `uploadBytesResumable(ref, file)` — upload with progress
- `deleteObject(ref)` — delete file

### 6. UI Components
- `LoginPage`: centered card, Google sign-in button
- `BreadcrumbNav`: clickable path segments
- `UploadZone`: `onDrop` handler + `<input type="file" multiple>`
- `FileList`: table or grid view with name, size, date, actions
- `FileItem`: download link, delete button (with confirmation)

### 7. Deploy & Domain Setup

**Firebase Hosting:**
```bash
npm run build
firebase deploy --only hosting
```

**Custom Domain:**
1. Firebase Console → Hosting → Add custom domain
2. Firebase gives you DNS records (A records or CNAME)
3. GoDaddy DNS Management → add those records
4. Wait for propagation (minutes to hours)
5. Firebase auto-provisions SSL cert via Let's Encrypt

### 8. Apply Security Rules
Deploy Storage rules locking access to your UID:
```bash
firebase deploy --only storage
```

---

## Features (MVP)

- [x] Google Sign-In (only your account works)
- [x] Browse files and folders
- [x] Upload files (drag-and-drop + file picker, with progress)
- [x] Download files
- [x] Delete files
- [x] Create folders (by uploading to a new path prefix)
- [x] Breadcrumb navigation

**Post-MVP (optional):**
- File preview (images, PDFs inline)
- Rename files
- Move files between folders
- Storage usage indicator

---

## Environment Variables (`.env.local`)

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Never commit this file. Add to `.gitignore`.

---

## Verification Checklist

1. `npm run dev` → app loads at localhost, Google sign-in works
2. Sign in with your account → file browser appears
3. Sign in with a different Google account → immediately signed out
4. Upload a file → appears in list and in Firebase Storage console
5. Download a file → works
6. Delete a file → removed from list and Storage console
7. `firebase deploy` → live at `your-project.web.app`
8. Custom domain → site loads at your GoDaddy domain with HTTPS
9. Firebase Storage rules deployed → direct Storage URL access blocked for unauthenticated requests

---

## Cost Estimate (Firebase Spark / free tier)

| Resource | Free Tier | Typical personal use |
|---|---|---|
| Hosting | 10 GB storage, 360 MB/day transfer | Well within |
| Storage | 5 GB storage, 1 GB/day download | Fine for personal use |
| Auth | 10k/month sign-ins | Way under |

Storage beyond 5 GB: ~$0.026/GB/month (Blaze plan, pay-as-you-go). Upgrading to Blaze is required if you need more than 5 GB — you only pay for what you use above free tier.
