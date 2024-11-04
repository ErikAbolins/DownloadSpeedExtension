function updateSpeedDisplay(speed) {
  const speedElement = document.getElementById("speed");
  if (speed > 0) {
    // Convert bytes per second to KB/s for readability
    const speedMBps = (speed / 1048576).toFixed(2);
    speedElement.textContent = `${speedMBps} MB/s`;
  } else {
    speedElement.textContent = "No active downloads.";
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "updateSpeed") {
    updateSpeedDisplay(message.speed);
  }
});
