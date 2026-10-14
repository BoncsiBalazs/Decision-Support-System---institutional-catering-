# GitHub Pages deployment guide — ZeroWaste Entry

## 1. Prepare your new repository

1. Sign in to https://github.com/.
2. In the upper-right `+` menu, select **New repository**.
3. Choose a repository name such as `zerowaste-entry-en`. Do **not** name it the same as your existing ZeroWaste dashboard or any other Pages repository.
4. Select **Public** if you use GitHub Free and want a public Pages site. Create the repository without adding starter files if you already have the supplied site files.
5. GitHub Pages publishes **website files**, not private research databases. Never upload participant records, photographs, institutional raw data, or private backup files.

## 2. Upload the site files

1. Open the new repository and choose **Add file → Upload files**.
2. From this ZIP, upload `index.html`, `app.js`, `schema.js`, `excel.js`, `styles.css`, `favicon.svg`, `.nojekyll` and optionally `README.md`, `GITHUB_PAGES_SETUP_EN.md`, `DATA_DICTIONARY_EN.csv` and the synthetic `examples/` folder.
3. Preserve names and directory structure. Most importantly, `index.html`, `app.js`, `schema.js`, `excel.js` and `styles.css` must be **at the root of the publishing branch**.
4. Commit the changes directly to `main` (or your chosen publishing branch).

## 3. Enable GitHub Pages

1. Open the repository **Settings** page.
2. Select **Pages** in the sidebar.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Select branch **main** and directory **/(root)**.
5. Click **Save** and wait for publication.
6. The page is usually published at `https://YOUR-USERNAME.github.io/zerowaste-entry-en/` (replace the example username and repository name). The repository's Pages settings display the exact URL.

Official GitHub documentation:
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 4. Acceptance test after publication

1. Open the public Pages address in Chrome, Edge or Firefox.
2. Confirm **Local-only storage active** appears in the header.
3. On **New / edit entry**, enter a fictional institution, measurement date, and age group. Enter a soup such as `Vegetable soup`, served `125 dL`, waste `1.2 kg`, and temperature `65.3 °C`.
4. Confirm the standardised soup quantity reads **12.5 L**.
5. Enable main course and enter `Green pea purée`, served `250 dkg`, waste `2.3 kg`. Confirm the standardised value reads **2.5 kg**.
6. Save. Open **Saved entries** and verify that the event appears. Click **Edit** and confirm the values are restored.
7. Open **Export and backup**, download the Excel workbook, and inspect `raw_entry_events.xlsx` in Excel. The original 60 schema fields should be present in the first row. Internal source keys are not user-facing UI text.
8. Download the import ZIP. It should contain `data_raw/raw_entry_events.xlsx` and `data_media/entry_media.csv` (and photos if attached).
9. Download a private JSON backup and store it safely. **Do not upload the JSON backup to GitHub.**

## 5. Integrate with the ZeroWaste R project

1. Download an import ZIP from the live Entry website.
2. Save a backup of any existing `data_raw/raw_entry_events.xlsx` in the **private** ZeroWaste R project.
3. Extract the downloaded ZIP and copy the generated `data_raw/raw_entry_events.xlsx` to `ZeroWaste/data_raw/raw_entry_events.xlsx`. If photos were recorded, copy the contents of `data_media/` into `ZeroWaste/data_media/`.
4. Run the ZeroWaste processing chain in the R project, e.g. `Rscript ZeroWaste.R --rebuild --no-app`, or use the project's existing Windows launcher.
5. Verify date, institution, course, recorded original units, standardised amounts, and linked event IDs in the processed output.
6. Do not overwrite an existing source workbook until you have merged or archived previous entries where applicable. The static form does **not** automatically merge workbooks previously collected on another device.

## 6. Updating the website

To update text or validation logic, replace the corresponding GitHub files in the public repository and commit the changes. GitHub Pages automatically publishes the new site after the deployment completes. Previously stored browser entries normally remain locally available while the site stays at the same origin, but always export a backup before important changes.

## 7. Limitations

- Static site: no central shared database, no role-based user accounts, no server backups.
- Browser storage is local and can be deleted.
- Conversion from portions/pieces to a physical served quantity requires a verified factor.
- This repository is a newly developed English entry module constructed to match the ZeroWaste 60-column Excel import; it is **not a verbatim translation of a previously supplied HTML app**, as that original front-end source code was not included in the available research ZIP.
- Do not use GitHub Pages as a collection endpoint for sensitive data without designing and reviewing a separate authenticated backend and data-protection process.
