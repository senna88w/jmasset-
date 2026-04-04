/**
 * JOYMODE Asset Library — Recursive Drive Scanner
 *
 * Paste this into Google Apps Script (script.google.com)
 * signed in as shane@usejoymode.com, then click Run.
 * Results will be logged — copy them from Execution Log.
 */

function scanAllFolders() {
  const folderConfigs = [
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

  const allAssets = [];
  const formatMap = {
    'image/jpeg': 'JPG', 'image/png': 'PNG', 'image/gif': 'GIF',
    'image/svg+xml': 'SVG', 'image/heic': 'HEIC',
    'video/mp4': 'MP4', 'video/quicktime': 'MP4',
    'application/pdf': 'PDF'
  };
  const validMimes = new Set(Object.keys(formatMap));

  folderConfigs.forEach(config => {
    try {
      const folder = DriveApp.getFolderById(config.id);
      scanFolder(folder, config.product, config.type, allAssets, formatMap, validMimes, 0);
    } catch(e) {
      Logger.log('Error accessing folder ' + config.id + ': ' + e.message);
    }
  });

  // Output as JSON
  Logger.log('TOTAL FILES FOUND: ' + allAssets.length);

  // Split output into chunks to avoid log truncation
  const chunkSize = 100;
  for (let i = 0; i < allAssets.length; i += chunkSize) {
    const chunk = allAssets.slice(i, i + chunkSize);
    Logger.log('CHUNK_' + Math.floor(i/chunkSize) + ':' + JSON.stringify(chunk));
  }
}

function scanFolder(folder, product, type, results, formatMap, validMimes, depth) {
  if (depth > 5) return; // Safety limit

  // Get files
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const mime = file.getMimeType();
    if (validMimes.has(mime)) {
      const name = file.getName();
      const format = formatMap[mime] || 'JPG';
      results.push({
        fileId: file.getId(),
        filename: name,
        product: product,
        type: type,
        format: format
      });
    }
  }

  // Recurse into subfolders
  const subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    const sub = subfolders.next();
    scanFolder(sub, product, type, results, formatMap, validMimes, depth + 1);
  }
}
