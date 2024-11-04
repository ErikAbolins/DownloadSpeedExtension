let downloadData = {};

// Function to check active downloads
function checkActiveDownloads() {
  chrome.downloads.search({ state: "in_progress" }, (downloads) => {
    if (downloads.length > 0) {
      downloads.forEach((download) => {
        // Initialize download data if it's a new download
        if (!downloadData[download.id]) {
          downloadData[download.id] = {
            bytesReceived: download.bytesReceived,
            lastBytesReceived: download.bytesReceived,
            startTime: Date.now(),
            lastTime: Date.now(),
          };
          console.log(`New download detected: ID ${download.id}`);

          // Show a notification when a new download starts
          createDownloadNotification(download);
        } else {
          const currentTime = Date.now();
          const elapsedTime =
            (currentTime - downloadData[download.id].lastTime) / 1000; // seconds
          const bytesReceived = download.bytesReceived;

          // Calculate speed only if time has passed
          if (elapsedTime > 0) {
            const deltaBytes =
              bytesReceived - downloadData[download.id].lastBytesReceived; // New bytes since last check
            const speed = deltaBytes / elapsedTime; // bytes/sec

            console.log(
              `Current download speed for ID ${download.id}: ${speed} bytes/sec`,
            );

            // Send update to popup
            chrome.runtime.sendMessage({ action: "updateSpeed", speed });

            // Update last received bytes and time
            downloadData[download.id].lastBytesReceived = bytesReceived;
            downloadData[download.id].lastTime = currentTime;
          }
        }
      });
    } else {
      // No active downloads
      chrome.runtime.sendMessage({ action: "updateSpeed", speed: 0 }); // Reset speed in popup
    }
  });
}

// Function to create download notifications
function createDownloadNotification(downloadItem) {
  if (chrome.notifications) {
    chrome.notifications.create(`download_${downloadItem.id}`, {
      type: "basic",
      iconUrl: "icon48.png", // Ensure you have an icon in your extension folder
      title: "Download Started",
      message: `Download of "${downloadItem.filename}" started. Click the extension icon to view speed.`,
      priority: 2,
    });
  } else {
    console.error("Notifications API is not available.");
  }
}

// Listen for download creation to show notification
chrome.downloads.onCreated.addListener((downloadItem) => {
  if (!downloadData[downloadItem.id]) {
    downloadData[downloadItem.id] = {
      bytesReceived: downloadItem.bytesReceived,
      lastBytesReceived: downloadItem.bytesReceived,
      startTime: Date.now(),
      lastTime: Date.now(),
    };

    // Create a notification for the new download
    createDownloadNotification(downloadItem);
  }
});

// Listen for notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  // Check if the notification ID starts with "download_"
  if (notificationId.startsWith("download_")) {
    // Open the extension popup
    chrome.action.openPopup(); // Opens the extension's popup (if you have one)

    // Optionally, you can navigate to a specific page:
    // chrome.tabs.create({ url: chrome.runtime.getURL("yourPage.html") });
  }
});

// Poll every second for active downloads
setInterval(checkActiveDownloads, 1000);
