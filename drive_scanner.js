/**
 * JOYMODE Asset Library — Auto-Updating Drive Scanner
 *
 * Paste this into Google Apps Script (script.google.com)
 * signed in as shane@usejoymode.com, then:
 *
 * 1. Run setupScriptProperties() first — it will prompt you to set your GitHub token
 * 2. Run scanAndPushToGitHub() to test
 * 3. Run createTimeTrigger() to set up automatic 6-hour scanning
 *
 * That's it! Assets will auto-update every 6 hours.
 */

// ============================================================
// CONFIGURATION
// ============================================================

const GITHUB_REPO = 'senna88w/jmasset-';
const GITHUB_FILE_PATH = 'data/assets.json';
const GITHUB_BRANCH = 'main';

const FOLDER_CONFIGS = [
  // Internal Static Ad Creative
  {id: '1uA-ew9bQxlfSdG7FtcRTyrDCyo9FhQN6', product: 'Past Ads', type: 'Internal Static'},
  // Internal Video Ad Creative
  {id: '1T-q8IW7_eb5-3o86i6inFTXrAKVC8PnL', product: 'Past Ads', type: 'Internal Video'},
  // Creator/Talent Folders
  {id: '1U9_-Lv_McBLdR2qSbBvKBRbw5YzgFSN8', product: 'Creator UGC', type: 'Ariel Moradzadeh'},
  {id: '1AaHD_fQ-ml_bh3Gzx8fXlPzcALsRHQWq', product: 'Creator UGC', type: 'Ben Greenfield'},
  {id: '1bJCGQ62JvZcuy0_4wImdzxXa6JLpXz0M', product: 'Creator UGC', type: 'Daniel Lopez'},
  {id: '1AgZ7u9ugKeAzWKZpfhmzwX0ESbjQ5Y7Q', product: 'Creator UGC', type: 'Dave Asprey'},
  {id: '1ZED0soSIK7a0HUypzsw8qs1xkimHztpT', product: 'Creator UGC', type: 'Dr. Eric Trexler'},
  {id: '1nn1-PGy9ZbWVTKl0ZPSI2dUfejh08iXv', product: 'Creator UGC', type: 'Eric Hinman'},
  {id: '1-a8pFG0wBmWNkxXexZKG7A-FSLxEF-Wg', product: 'Creator UGC', type: 'Harold'},
  {id: '1HEyKvP85SdyXccGKUdnX2lnMN4D47Oyl', product: 'Creator UGC', type: 'Inside Only Fans'},
  {id: '1Sk6cqHANjs0RYMERsIXMsJb6B8OuBfeH', product: 'Creator UGC', type: 'Justin Houman'},
  {id: '1nBOnSzEJkqiZcDlCg85_qqZAHVWl8785', product: 'Creator UGC', type: 'Kayla'},
  {id: '1xOKnQzehCVCQ3MR9dFtFQ-3UTD1O4UJ7', product: 'Creator UGC', type: 'Mind Pump'},
  {id: '1B5K9QKaOcyu_3v7bprP2PYjHJen7alTR', product: 'Creator UGC', type: 'Sandbox Boys'},
  {id: '1QdlNGkWut8jaaagknFRUbb4VlUUqhSiU', product: 'Creator UGC', type: 'Shane'},
  {id: '1ri3uQMg6fHTViVp44k_VYN6CykrFVH6K', product: 'Creator UGC', type: 'The Fighter & The Kid'},
  {id: '1jawbuibOourB4PIoizSpFTjSCVmeMoFQ', product: 'Creator UGC', type: 'Viktor Simco'},
  {id: '1VssS9e949rhuEUiMzp4X3MQsULs0xGA3', product: 'Creator UGC', type: 'Wade Critides'},
  {id: '11PJi_9hoEIYXDPcQWqECyi9Wvvx0Mhtn', product: 'Creator UGC', type: 'Previous Creators'},
  {id: '1DcEYQCBVNRXh9sddLGm7hxhhAbN78bKG', product: 'Creator UGC', type: 'Shane in the Sauna'},
  // Primer Video Library
  {id: '1Xk49CZcVmBcK7uzsrF9DFxWHQypIdOqF', product: 'Past Ads', type: 'Primer Video'},
  // Primer Video
  {id: '1dCAv-xmPQNwID9cr64T3zUV4anWm33EU', product: 'Past Ads', type: 'Primer Video'},
  // UGC Root
  {id: '18cd6Vb9sZQuGY0SkhF_c_Ov91VcUfY7R', product: 'Creator UGC', type: 'UGC'},
];

const FORMAT_MAP = {
  'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/gif': 'GIF',
  'image/svg+xml': 'SVG', 'image/heic': 'HEIC',
  'video/mp4': 'MP4', 'video/quicktime': 'MP4',
  'application/pdf': 'PDF'
};

// ============================================================
// SETUP — Run these once
// ============================================================

/**
 * Run this first. Sets the GitHub token in Script Properties.
 * Generate a token at: https://github.com/settings/tokens
 * Needs "repo" scope (Contents read/write).
 */
function setupScriptProperties() {
  const ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : null;

  // If running from a Sheet, prompt via UI
  if (ui) {
    const result = ui.prompt(
      'GitHub Setup',
      'Paste your GitHub Personal Access Token (needs "repo" scope):',
      ui.ButtonSet.OK_CANCEL
    );
    if (result.getSelectedButton() === ui.Button.OK) {
      PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', result.getResponseText().trim());
      ui.alert('Token saved! Now run scanAndPushToGitHub() to test.');
    }
  } else {
    // If running standalone, set it directly here then run once:
    const token = 'PASTE_YOUR_GITHUB_TOKEN_HERE';
    if (token === 'PASTE_YOUR_GITHUB_TOKEN_HERE') {
      Logger.log('Edit this function and replace PASTE_YOUR_GITHUB_TOKEN_HERE with your actual token, then run again.');
      return;
    }
    PropertiesService.getScriptProperties().setProperty('GITHUB_TOKEN', token);
    Logger.log('Token saved! Now run scanAndPushToGitHub() to test.');
  }
}

/**
 * Run this once to create a time-based trigger that scans every 6 hours.
 */
function createTimeTrigger() {
  // Remove any existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'scanAndPushToGitHub') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Create new 6-hour trigger
  ScriptApp.newTrigger('scanAndPushToGitHub')
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log('Trigger created! scanAndPushToGitHub will run every 6 hours.');
}

// ============================================================
// MAIN — This runs on the timer
// ============================================================

/**
 * Scans all Drive folders, builds the asset JSON, and pushes it to GitHub.
 * GitHub push triggers Netlify auto-deploy.
 */
function scanAndPushToGitHub() {
  Logger.log('Starting asset scan...');

  // 1. Scan all folders
  const allAssets = [];
  const validMimes = new Set(Object.keys(FORMAT_MAP));

  FOLDER_CONFIGS.forEach(config => {
    try {
      const folder = DriveApp.getFolderById(config.id);
      scanFolder(folder, config.product, config.type, allAssets, validMimes, 0);
    } catch(e) {
      Logger.log('Error accessing folder ' + config.id + ': ' + e.message);
    }
  });

  Logger.log('Scan complete: ' + allAssets.length + ' assets found.');

  // 2. Build JSON
  const json = JSON.stringify(allAssets);

  // 3. Push to GitHub
  pushToGitHub(json);
}

// ============================================================
// DRIVE SCANNING
// ============================================================

function scanFolder(folder, product, type, results, validMimes, depth) {
  if (depth > 5) return;

  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const mime = file.getMimeType();
    if (validMimes.has(mime)) {
      results.push({
        fileId: file.getId(),
        filename: file.getName(),
        product: product,
        type: type,
        format: FORMAT_MAP[mime] || 'JPG',
        createdDate: file.getDateCreated().toISOString().split('T')[0]
      });
    }
  }

  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    scanFolder(subfolders.next(), product, type, results, validMimes, depth + 1);
  }
}

// ============================================================
// GITHUB PUSH
// ============================================================

function pushToGitHub(content) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) {
    throw new Error('No GitHub token set. Run setupScriptProperties() first.');
  }

  const apiUrl = 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + GITHUB_FILE_PATH;

  // Get current file SHA (needed for updates)
  let sha = null;
  try {
    const getResponse = UrlFetchApp.fetch(apiUrl + '?ref=' + GITHUB_BRANCH, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });

    if (getResponse.getResponseCode() === 200) {
      const fileData = JSON.parse(getResponse.getContentText());
      sha = fileData.sha;

      // Check if content actually changed
      const existingContent = Utilities.newBlob(Utilities.base64Decode(fileData.content.replace(/\n/g, ''))).getDataAsString();
      if (existingContent === content) {
        Logger.log('No changes detected — skipping push.');
        return;
      }
    }
  } catch(e) {
    Logger.log('Could not fetch existing file (may be first push): ' + e.message);
  }

  // Push updated file
  const payload = {
    message: 'chore: update asset library data (automated scan)',
    content: Utilities.base64Encode(content),
    branch: GITHUB_BRANCH
  };
  if (sha) {
    payload.sha = sha;
  }

  const putResponse = UrlFetchApp.fetch(apiUrl, {
    method: 'put',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github.v3+json'
    },
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = putResponse.getResponseCode();
  if (code === 200 || code === 201) {
    Logger.log('Successfully pushed assets.json to GitHub!');
  } else {
    Logger.log('GitHub push failed (' + code + '): ' + putResponse.getContentText());
    throw new Error('GitHub push failed with status ' + code);
  }
}
