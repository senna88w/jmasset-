/**
 * JOYMODE Asset Library — Google Drive Scanner (Node.js)
 *
 * Scans configured Google Drive folders using a service account,
 * collects asset metadata, and writes data/assets.json.
 *
 * Requires GOOGLE_SERVICE_ACCOUNT_JSON env var (the full JSON key).
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Folder configurations — same as drive_scanner.js (Apps Script version)
const FOLDER_CONFIGS = [
  { id: '1uA-ew9bQxlfSdG7FtcRTyrDCyo9FhQN6', product: 'Past Ads', type: 'Internal Static' },
  { id: '1T-q8IW7_eb5-3o86i6inFTXrAKVC8PnL', product: 'Past Ads', type: 'Internal Video' },
  { id: '1U9_-Lv_McBLdR2qSbBvKBRbw5YzgFSN8', product: 'Creator UGC', type: 'Ariel Moradzadeh' },
  { id: '1AaHD_fQ-ml_bh3Gzx8fXlPzcALsRHQWq', product: 'Creator UGC', type: 'Ben Greenfield' },
  { id: '1bJCGQ62JvZcuy0_4wImdzxXa6JLpXz0M', product: 'Creator UGC', type: 'Daniel Lopez' },
  { id: '1AgZ7u9ugKeAzWKZpfhmzwX0ESbjQ5Y7Q', product: 'Creator UGC', type: 'Dave Asprey' },
  { id: '1ZED0soSIK7a0HUypzsw8qs1xkimHztpT', product: 'Creator UGC', type: 'Dr. Eric Trexler' },
  { id: '1nn1-PGy9ZbWVTKl0ZPSI2dUfejh08iXv', product: 'Creator UGC', type: 'Eric Hinman' },
  { id: '1-a8pFG0wBmWNkxXexZKG7A-FSLxEF-Wg', product: 'Creator UGC', type: 'Harold' },
  { id: '1HEyKvP85SdyXccGKUdnX2lnMN4D47Oyl', product: 'Creator UGC', type: 'Inside Only Fans' },
  { id: '1Sk6cqHANjs0RYMERsIXMsJb6B8OuBfeH', product: 'Creator UGC', type: 'Justin Houman' },
  { id: '1nBOnSzEJkqiZcDlCg85_qqZAHVWl8785', product: 'Creator UGC', type: 'Kayla' },
  { id: '1xOKnQzehCVCQ3MR9dFtFQ-3UTD1O4UJ7', product: 'Creator UGC', type: 'Mind Pump' },
  { id: '1B5K9QKaOcyu_3v7bprP2PYjHJen7alTR', product: 'Creator UGC', type: 'Sandbox Boys' },
  { id: '1QdlNGkWut8jaaagknFRUbb4VlUUqhSiU', product: 'Creator UGC', type: 'Shane' },
  { id: '1ri3uQMg6fHTViVp44k_VYN6CykrFVH6K', product: 'Creator UGC', type: 'The Fighter & The Kid' },
  { id: '1jawbuibOourB4PIoizSpFTjSCVmeMoFQ', product: 'Creator UGC', type: 'Viktor Simco' },
  { id: '1VssS9e949rhuEUiMzp4X3MQsULs0xGA3', product: 'Creator UGC', type: 'Wade Critides' },
  { id: '11PJi_9hoEIYXDPcQWqECyi9Wvvx0Mhtn', product: 'Creator UGC', type: 'Previous Creators' },
  { id: '1DcEYQCBVNRXh9sddLGm7hxhhAbN78bKG', product: 'Creator UGC', type: 'Shane in the Sauna' },
  { id: '1Xk49CZcVmBcK7uzsrF9DFxWHQypIdOqF', product: 'Past Ads', type: 'Primer Video' },
  { id: '1dCAv-xmPQNwID9cr64T3zUV4anWm33EU', product: 'Past Ads', type: 'Primer Video' },
  { id: '18cd6Vb9sZQuGY0SkhF_c_Ov91VcUfY7R', product: 'Creator UGC', type: 'UGC' },
];

const FORMAT_MAP = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/svg+xml': 'SVG',
  'image/heic': 'HEIC',
  'video/mp4': 'MP4',
  'video/quicktime': 'MP4',
  'application/pdf': 'PDF',
};

const VALID_MIMES = Object.keys(FORMAT_MAP);
const MAX_DEPTH = 5;

async function authenticate() {
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is required');
  }
  const creds = JSON.parse(credJson);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

async function scanFolder(drive, folderId, product, type, depth = 0) {
  if (depth > MAX_DEPTH) return [];

  const assets = [];
  let pageToken = null;

  // List files in this folder
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, createdTime)',
      pageSize: 1000,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    for (const file of res.data.files || []) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        // Recurse into subfolder
        const subAssets = await scanFolder(drive, file.id, product, type, depth + 1);
        assets.push(...subAssets);
      } else if (VALID_MIMES.includes(file.mimeType)) {
        assets.push({
          fileId: file.id,
          filename: file.name,
          product,
          type,
          format: FORMAT_MAP[file.mimeType],
          createdDate: file.createdTime ? file.createdTime.split('T')[0] : null,
        });
      }
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return assets;
}

async function main() {
  console.log('Authenticating with Google Drive...');
  const drive = await authenticate();

  console.log(`Scanning ${FOLDER_CONFIGS.length} folder configs...`);
  const allAssets = [];

  for (const config of FOLDER_CONFIGS) {
    try {
      const assets = await scanFolder(drive, config.id, config.product, config.type);
      console.log(`  ${config.product} / ${config.type}: ${assets.length} files`);
      allAssets.push(...assets);
    } catch (err) {
      console.error(`  Error scanning ${config.product} / ${config.type} (${config.id}): ${err.message}`);
    }
  }

  // Write output
  const outPath = path.join(__dirname, '..', 'data', 'assets.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(allAssets, null, 0));

  console.log(`\nDone! ${allAssets.length} assets written to data/assets.json`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
