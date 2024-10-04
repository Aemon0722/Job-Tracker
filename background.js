chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed and background script running.");
});

// Store active ports
const activePorts = new Set();

// Listen for connections from content scripts
chrome.runtime.onConnect.addListener((port) => {
    console.log("Content script connected.");
    activePorts.add(port); // Add port to the set of active ports

    port.onMessage.addListener((message) => {
        if (message.action === "init") {
            console.log("Received message from content script:", message);
        }

        if (message.action === "saveJob") {
            const job = message.job; // Get the job from the message
            console.log("Received job for saving:", job);

            // Validate job object
            if (!job || !job.id || !job.title || !job.company) {
                console.error("Invalid job object:", job);
                port.postMessage({ success: false, error: "Invalid job data." });
                return;
            }

            // Save job to chrome.storage
            chrome.storage.local.get({ jobs: [] }, (result) => {
                const updatedJobs = [...result.jobs, job]; // Include the new job object
                chrome.storage.local.set({ jobs: updatedJobs }, () => {
                    console.log('Job saved:', job);
                    console.log('Updated jobs list:', updatedJobs); // Log updated jobs
                    // Send a response back to the content script
                    port.postMessage({ success: true });
                });
            });
        }
    });

    port.onDisconnect.addListener(() => {
        console.log("Content script disconnected.");
        activePorts.delete(port); // Remove port from the set of active ports
    });
});

// Function to check the active tab and manage connection
function checkActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];

        if (currentTab && currentTab.url.includes("jobsdb.com")) {
            console.log("Active tab is jobsdb.com");
            // Send a message to all active ports to keep connections alive
            activePorts.forEach((port) => {
                port.postMessage({ action: "keepAlive" });
            });
        } else {
            console.log("Not on jobsdb.com, disconnecting...");
            // Optionally disconnect all ports if needed
            activePorts.forEach((port) => port.disconnect());
        }
    });
}

// Listen for tab updates to check the URL again
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        checkActiveTab();
    }
});