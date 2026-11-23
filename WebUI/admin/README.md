# Firestore browser importer

This importer runs in the browser using Firebase Web SDK. It does NOT need Node.js or a service-account key.

## Source
Use the `firestore-seed.json` file generated from **ALL FOR EOM SEONGHYEON VER 2.0 (3)(1).html** in the conversation's import package. The file contains 330 real source-content documents across seven collection paths (including nested event captions). Demo counts and fabricated member records were excluded.

## Setup
1. Firebase Console: create Firestore Database in **Production mode**.
2. Firebase Console -> Authentication -> Sign-in method -> Google -> Enable. Under Authorized domains, allow the hostname from which you run the web importer, e.g. `silcosudo.github.io` for GitHub Pages.
3. Publish `WebUI/` from `main` using the GitHub Actions Pages workflow. Set Pages Source to GitHub Actions and allow `main` in the `github-pages` environment deployment rules.
4. Open `/admin/import.html` from the published site and sign in with the Google account that will be Admin.
5. Copy the **UID** shown there.
6. Firebase Console -> Firestore Database -> Rules: paste the contents of `firebase/firestore.rules` from this repo, replace `REPLACE_WITH_GOOGLE_ADMIN_UID` with your own UID, then publish those Rules. The repository file alone does not deploy rules.
7. On the importer page choose `firestore-seed.json`; review the counts; enter `all-for-eom-seonghyeon-651f9`; confirm and import. The importer first reads existing docs, then commits only missing docs in batches. Do not run multiple imports concurrently.
8. Verify results under Firestore Database -> Data. After import, consider removing the importer page and tightening/removing temporary create permission, then separately design read rules for your public website.

## Important
- The interface has a frontend sign-in check, but **only deployed Firestore Security Rules enforce admin permissions**.
- Never share private service-account keys or weaken rules to `allow write: if true`.
- Import uses a best-effort read-before-write check to avoid overwriting records. Concurrent third-party changes between checking and writing require extra precautions.
- Rules are admin-only for now, so public website visitors will **not** be able to read Firestore yet. Public read rules will be designed as part of the next frontend migration.
- This importer does not change the existing website's localStorage UI or auto-import data until you explicitly choose the file and click Import.
