# Joymode Asset Library — Automated Pipeline Setup

## How It Works

1. **GitHub Action** runs every 6 hours (or on manual trigger)
2. **Node.js scanner** authenticates with Google Drive via service account
3. Scans all configured folders, writes `data/assets.json`
4. If data changed, commits and pushes to GitHub
5. **Netlify** auto-deploys on push

## One-Time Setup Steps

### 1. Create a Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google Drive API**:
   - APIs & Services > Library > search "Google Drive API" > Enable
4. Create a service account:
   - APIs & Services > Credentials > Create Credentials > Service Account
   - Name it something like `joymode-asset-scanner`
   - Click Create, then Done
5. Create a JSON key:
   - Click the service account > Keys tab > Add Key > Create new key > JSON
   - Download the JSON file (you'll need its contents in step 3)

### 2. Share Drive Folders with the Service Account

The service account needs read access to your Drive folders.

1. Copy the service account email (looks like `joymode-asset-scanner@your-project.iam.gserviceaccount.com`)
2. For each top-level folder in your asset library:
   - Right-click the folder in Google Drive > Share
   - Paste the service account email
   - Set permission to **Viewer**
   - Uncheck "Notify people" and click Share

> **Tip:** If all asset folders live under one parent folder, you can just share the parent.

### 3. Push to GitHub

```bash
cd ~/Desktop/joymode-asset-library

# Create the repo on GitHub first (https://github.com/new)
# Name: joymode-asset-library, Private

git add .
git commit -m "Initial commit: asset library with automated Drive scanning"
git remote add origin https://github.com/YOUR_USERNAME/joymode-asset-library.git
git push -u origin main
```

### 4. Add the Service Account Secret to GitHub

1. Go to your repo on GitHub > Settings > Secrets and variables > Actions
2. Click **New repository secret**
3. Name: `GOOGLE_SERVICE_ACCOUNT_JSON`
4. Value: Paste the **entire contents** of the JSON key file you downloaded
5. Click Add secret

### 5. Connect Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Add new site > Import an existing project > GitHub
3. Select `joymode-asset-library`
4. Deploy settings: leave defaults (no build command needed)
5. Click Deploy

### 6. Test It

1. Go to your repo > Actions tab
2. Click "Update Asset Library" workflow
3. Click "Run workflow" to trigger a manual scan
4. Watch it run — it should scan Drive, update `data/assets.json`, and push
5. Netlify will auto-deploy the update

## Configuration

### Change Scan Frequency

Edit `.github/workflows/update-assets.yml`, update the cron expression:

- Every 6 hours: `0 */6 * * *` (default)
- Every hour: `0 * * * *`
- Daily at midnight UTC: `0 0 * * *`
- Every 12 hours: `0 */12 * * *`

### Add New Drive Folders

Edit `scripts/scan-drive.js` and add entries to the `FOLDER_CONFIGS` array:

```js
{ id: 'FOLDER_ID_FROM_DRIVE_URL', product: 'Product Name', type: 'Asset Type' },
```

The folder ID is the last part of the Google Drive folder URL.
