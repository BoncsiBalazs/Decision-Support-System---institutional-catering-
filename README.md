# ZeroWaste Entry – English translation of original project

This is an English-language translation of the **original user-supplied 6-step data-entry template**. It retains the original HTML structure, form IDs, calculation routines, six-step sensory workflow, local IndexedDB persistence, photo collection and download formats.

## GitHub Pages setup
1. Create a PUBLIC repository, e.g. `zerowaste-data-entry-en`.
2. Upload the **contents of this folder** to the repository root (including `index.html`, `app-public-anon-v4.js`, `data-public-anon-v4.js`, `styles-public-anon-v4.css`, `mate_logo.png`, `icons/`, and `manifest.webmanifest`). Do **not** upload the ZIP itself.
3. Navigate to Settings → Pages → Build and deployment. Select `Deploy from a branch`, `main`, `/(root)`, Save.
4. Open `https://YOUR_USERNAME.github.io/zerowaste-data-entry-en/`.

## Data & privacy
- Stored submissions remain in the local browser’s IndexedDB and are not automatically uploaded to GitHub. Back up/export regularly.
- The demonstration institution list is anonymised. Do not publish identifiable institutional or participant records in the repository.
- **The XLSX and CSV exports deliberately retain the original 60 Hungarian internal field keys**, to remain compatible with the thesis ZeroWaste R pipeline. Interface descriptions, dish labels, sensory descriptors and exported values have been translated where this does not break compatibility. The technical schema keys are not user-facing UI text.
- The original application's XLSX download depends on the SheetJS CDN; an internet connection may be required for that export. The original built-in CSV and ZIP implementations do not rely on that CDN.
- The English variant uses a separate IndexedDB name so previous Hungarian records are not silently migrated or overwritten.

## Release checks
Run `node --check app-public-anon-v4.js` and `node --check data-public-anon-v4.js`. Browser-test all six steps, sensory attribute/descriptor restrictions, add/edit/delete, JSON backup, CSV, XLSX and ZIP/photo exports before operational use.
