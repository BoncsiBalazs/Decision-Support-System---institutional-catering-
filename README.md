# ZeroWaste Entry — English static data-entry module

This is a **fully English, client-side data-entry module** for institutional catering plate-waste measurements and staff sensory evaluation. It is designed to be deployed as a **separate GitHub Pages site**. It is distinct from the server-based ZeroWaste R/Shiny dashboard.

## Files

| File | Purpose |
|---|---|
| `index.html` | Public English data-entry interface |
| `styles.css` | Responsive interface styles |
| `app.js` | Local IndexedDB storage, forms, editable records, import-ready exports |
| `schema.js` | Complete 60-field ZeroWaste source schema and transparent quantity conversions |
| `excel.js` | Self-contained XLSX/ZIP export; no third-party JavaScript dependency |
| `favicon.svg` | Site icon |
| `.nojekyll` | Makes GitHub Pages serve this static project without Jekyll processing |
| `examples/sample_raw_entry_events.xlsx` | **Synthetic** workbook showing the import-column structure |
| `DATA_DICTIONARY_EN.csv` | English field definitions for unchanged internal source keys |
| `GITHUB_PAGES_SETUP_EN.md` | Deployment and acceptance-test tutorial |

## Key methodological conventions

- Original source schema: 60 fields, one meal-service event per row, potentially containing soup and main-course assessments.
- Soup served quantity: litres (`L`); main-course served quantity: kilograms (`kg`). These are **not interchangeable**.
- Original measurement units are retained. `dL → L` and `dkg/g → kg` arithmetic conversions are permitted. `portions/pieces` are only converted with an explicitly recorded, verified amount per portion/piece. Otherwise the standardised quantity is blank rather than guessed.
- Returned plate waste is recorded in kilograms. Main-course component and side-dish waste can be entered separately.
- The staff rating scale ranges from 1 (very poor) to 5 (very good) for appearance, odour, taste, texture and overall liking.
- Technical internal column identifiers such as `leves_adag` and `masodik_moslek` intentionally remain unchanged in XLSX output: **the ZeroWaste R importer depends on them**. All human-facing labels, guidance, UI messages, field descriptions and instructions are English.
- Each institution gets its own sheet in the XLSX workbook, matching the legacy R import approach. Sheets are limited to Excel's 31-character naming rule.

## Operation and data protection

- No login, no application server, and no automatic transmission to GitHub or any other service.
- Entries, comments, and compressed photos are stored in **IndexedDB on the current browser/device only**. Local data can be lost if browser storage is cleared, an incognito session ends, or the device is replaced.
- Use **Export and backup → Download backup** regularly, and keep exported JSON/XLSX/ZIP files in protected storage.
- Do not commit collected entries, photographs, backups, or real institution/participant data to a public GitHub repository. GitHub Pages is public by default.
- The generated `ZeroWaste_Entry_Import.zip` contains:
  - `data_raw/raw_entry_events.xlsx`
  - `data_media/entry_media.csv`
  - `data_media/entry_photos/...` (if photos were attached)
- Back up the existing ZeroWaste files before copying exported material into the main ZeroWaste R project. Running the R/Shiny pipeline is a separate step.
- The static module does not support multi-device real-time synchronisation or access control. A secured database/backend would be needed for centralised deployment with multiple staff members.

## Local testing

The ES modules require a web origin. Use the published GitHub Pages URL or a local web server (for example `python -m http.server 8000`, then open `http://localhost:8000/`). Opening `index.html` directly with the `file://` scheme may fail due to browser module security restrictions.

## Study context

The demonstration data are fictional. No original institutional dataset or human participant responses are embedded in this repository. The end-to-end research pipeline and separate Shiny dashboard belong to the ZeroWaste R project, not this GitHub Pages repository.
