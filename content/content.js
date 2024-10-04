let port;

// Function to set up connection to the background script
function setupConnection() {
    port = chrome.runtime.connect();

    // Handle disconnection
    port.onDisconnect.addListener(() => {
        console.log("Disconnected from background script. Cleaning up...");
        port = null; // Clear the port variable on disconnect
    });

    // Initial message to indicate the content script has started
    port.postMessage({ action: "init", message: "Job tracker started." });

    // Listen for keep-alive messages
    port.onMessage.addListener((message) => {
        if (message.action === "keepAlive") {
            console.log("Keep-alive signal received from background script.");
            // Optional: Handle any logic needed to keep the connection alive
        }
    });
}

// Function to generate unique job IDs
function generateUniqueId() {
    return `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Unique ID generation
}

// Function to set up save button event listeners
function setupSaveButtons() {
    const saveButtons = document.querySelectorAll('[id^="serp-save-job-"]');

    if (saveButtons.length === 0) {
        console.log("No save buttons found.");
        return; // Exit if no buttons are found
    }

    saveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const job_id = button.getAttribute('id').split('-').reverse()[0];
            const job_post = document.querySelector(`[data-job-id="${job_id}"]`);

            if (!job_post) {
                console.error(`Job post not found for job_id: ${job_id}`);
                return;
            }

            const company = job_post.querySelector('[data-type="company"]')?.innerText || 'N/A';
            const title = document.getElementById(`job-title-${job_id}`)?.innerText || 'N/A';
            const location = job_post.querySelector('[data-type="location"]')?.innerText || 'N/A';

            const jobsDetails = {
                id: generateUniqueId(),
                company: company,
                title: title,
                location: location,
                source: "Jobsdb",
                status: "Saved"
            };
            console.log(jobsDetails);
            sendMessageToBackground({ action: "saveJob", job: jobsDetails });
        });
    });
}

// Function to send messages to the background script
function sendMessageToBackground(message) {
    if (port) {
        try {
            console.log("Sending message to background script:", message);
            port.postMessage(message);
        } catch (error) {
            console.error("Failed to send message to background.js: ", error);
        }
    } else {
        console.error("Port is not connected.");
    }
}

// Use MutationObserver to detect when save buttons are added to the DOM
const observer = new MutationObserver(() => {
    const saveButtons = document.querySelectorAll('[id^="serp-save-job-"]');
    if (saveButtons.length > 0) {
        console.log("Save buttons detected.");
        setupSaveButtons(); // Call the setup function
        observer.disconnect(); // Stop observing after finding the buttons
    }
});

// Start observing the document for changes
observer.observe(document.body, { childList: true, subtree: true });

// Initial call to setupSaveButtons in case buttons are already loaded
setupSaveButtons();
setupConnection();
console.log(port);