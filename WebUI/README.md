# ALL FOR EOM SEONGHYEON — WebUI

Vanilla HTML/CSS/JavaScript prototype migrated from the repository source.

## Current state

- Legacy interface and LocalStorage caption/XP/streak state preserved in `js/main.js`.
- Optional **Firebase Google Authentication UI** included; it remains disabled until the web config is filled.
- Read-only Firestore caption query is prepared in `js/services/caption.service.js`, but **not wired to the existing caption UI yet**.
- **No server-side XP verification, role management or live counters yet**.
- Firestore rules in `../firebase/firestore.rules` **deny all reads and writes** until the next security review and explicitly deploying new rules.
- The GitHub Pages workflow publishes `WebUI/` from `main`.

## Firebase setup checklist

1. Go to https://console.firebase.google.com and create/select your Firebase project.
2. In **Project settings → Your apps**, register a Web app and copy the *web app config* values (`apiKey`, `authDomain`, `projectId`, `appId`) into `js/config/firebase-config.js`. These are public web identifiers; **never paste a service-account JSON or private key**.
3. In **Authentication → Sign-in method**, enable **Google**.
4. In **Authentication → Settings → Authorized domains**, add `silcosudo.github.io` (or your custom domain), if absent. Firebase may not include deployed domains by default.
5. Under **Firestore Database**, create the database in a suitable region. Do **not** use open test rules. Keep the deny-all rules until the permissions for actual collections have been planned and reviewed.
6. Test on localhost using a local HTTP server, not by opening `file://` directly.
7. To deploy the `WebUI` folder through GitHub Pages, use GitHub Actions to publish `WebUI/` as the Pages artifact. Selecting an arbitrary `WebUI` path via Pages branch-source deployment is not supported.

## Auth and data boundaries

**Google login only identifies a user.** It does not grant admin rights, sync LocalStorage, or securely award XP. The LocalStorage content remains editable by users. A later backend migration must define document ownership rules and independently verify any authoritative rewards.

## Modules

- `js/config/firebase.js`: Firebase app/Auth/Firestore initialization, safely disabled while config missing.
- `js/services/auth.service.js`: Google sign-in, sign-out, auth state.
- `js/features/auth/auth.js`: Auth widget DOM events.
- `js/services/caption.service.js`: Future read-only approved caption query.
- `js/main.js`: Existing UI and local business logic.

The UI was structurally extracted from the repository version, not the separately uploaded (3) event prototype. Browser behavior has not yet been tested against a real Firebase project.
