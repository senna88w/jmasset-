/**
 * JOYMODE Asset Library — Batch Share Files
 *
 * Paste this into Google Apps Script (script.google.com)
 * signed in as shane@usejoymode.com, then click Run.
 *
 * Sets all image/video files in the asset folders to
 * "Anyone with the link can VIEW" so thumbnails load
 * on the deployed asset library site.
 */

function makeFilesViewable() {
  const folderIds = [
    '1uA-ew9bQxlfSdG7FtcRTyrDCyo9FhQN6', // Internal Static
    '1T-q8IW7_eb5-3o86i6inFTXrAKVC8PnL', // Internal Video
    '1U9_-Lv_McBLdR2qSbBvKBRbw5YzgFSN8', // Ariel Moradzadeh
    '1AaHD_fQ-ml_bh3Gzx8fXlPzcALsRHQWq', // Ben Greenfield
    '1bJCGQ62JvZcuy0_4wImdzxXa6JLpXz0M', // Daniel Lopez
    '1AgZ7u9ugKeAzWKZpfhmzwX0ESbjQ5Y7Q', // Dave Asprey
    '1ZED0soSIK7a0HUypzsw8qs1xkimHztpT', // Dr. Eric Trexler
    '1nn1-PGy9ZbWVTKl0ZPSI2dUfejh08iXv', // Eric Hinman
    '1-a8pFG0wBmWNkxXexZKG7A-FSLxEF-Wg', // Harold
    '1HEyKvP85SdyXccGKUdnX2lnMN4D47Oyl', // Inside Only Fans
    '1Sk6cqHANjs0RYMERsIXMsJb6B8OuBfeH', // Justin Houman
    '1nBOnSzEJkqiZcDlCg85_qqZAHVWl8785', // Kayla
    '1xOKnQzehCVCQ3MR9dFtFQ-3UTD1O4UJ7', // Mind Pump
    '1B5K9QKaOcyu_3v7bprP2PYjHJen7alTR', // Sandbox Boys
    '1QdlNGkWut8jaaagknFRUbb4VlUUqhSiU', // Shane
    '1ri3uQMg6fHTViVp44k_VYN6CykrFVH6K', // Fighter & The Kid
    '1jawbuibOourB4PIoizSpFTjSCVmeMoFQ', // Viktor Simco
    '1VssS9e949rhuEUiMzp4X3MQsULs0xGA3', // Wade Critides
    '11PJi_9hoEIYXDPcQWqECyi9Wvvx0Mhtn', // Previous Creators
    '1DcEYQCBVNRXh9sddLGm7hxhhAbN78bKG', // Shane in the Sauna
    '1Xk49CZcVmBcK7uzsrF9DFxWHQypIdOqF', // Primer Video Library
    '1dCAv-xmPQNwID9cr64T3zUV4anWm33EU', // Primer Video
    '18cd6Vb9sZQuGY0SkhF_c_Ov91VcUfY7R', // UGC Root
  ];

  let count = 0;

  folderIds.forEach(folderId => {
    try {
      const folder = DriveApp.getFolderById(folderId);
      shareFolder(folder, 0);
    } catch(e) {
      Logger.log('Skipping folder ' + folderId + ': ' + e.message);
    }
  });

  function shareFolder(folder, depth) {
    if (depth > 5) return;

    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        count++;
        if (count % 100 === 0) Logger.log('Shared ' + count + ' files...');
      } catch(e) {
        // Skip files we can't modify sharing on
      }
    }

    const subs = folder.getFolders();
    while (subs.hasNext()) {
      shareFolder(subs.next(), depth + 1);
    }
  }

  Logger.log('Done! Set ' + count + ' files to "Anyone with the link can view"');
}
