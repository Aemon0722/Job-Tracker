// Fetch jobs from chrome.storage
function fetchJobs() {
    chrome.storage.local.get("jobs", (result) => {
        const jobs = result.jobs || [];
        console.log(jobs); // Log the job array
        updateExtension(jobs);
    });
}


function updateExtension(jobs) {
    const tableBody = document.querySelector("tbody");
    tableBody.innerHTML = ""; // Clear existing content

    const fragment = document.createDocumentFragment(); // Create a DocumentFragment for performance

    jobs.forEach((job, index) => {
        const row = document.createElement("tr");

        // Create table cells without using innerHTML
        const cells = [
            `<th scope="row">${index + 1}</th>`,
            `<td>${job.title}</td>`,
            `<td>${job.company}</td>`,
            `<td>${job.location}</td>`,
            `<td>${job.source}</td>`,
            statusSelector(job),
            `<td><button class="btn btn-danger btn-sm btn-custom">Delete</button></td>`
        ];

        cells.forEach(cell => {
            const cellElement = document.createElement('td');
            cellElement.innerHTML = cell;
            row.appendChild(cellElement);
        });

        // Attach event listener for the delete button
        const deleteButton = row.querySelector('.btn-danger');
        deleteButton.addEventListener('click', () => {
            deleteJob(job.id); // Call deleteJob with the job's unique ID
        });

        fragment.appendChild(row); // Append row to the DocumentFragment
    });

    tableBody.appendChild(fragment); // Append the entire fragment to the table body
}


function statusSelector(job) {
    const options = [
        { value: 'saved', text: 'Saved' },
        { value: 'applied', text: 'Applied' },
        { value: 'interview', text: 'Interview in Progress' },
        { value: 'offered', text: 'Offered' },
        { value: 'rejected', text: 'Rejected' }
    ];

    let selectHTML = `<select class="job-status-select" data-job-id="${job.id}">`;
    
    options.forEach(option => {
        // Set the current job status as the selected option
        const selected = job.status === option.value ? 'selected' : '';
        selectHTML += `<option value="${option.value}" ${selected}>${option.text}</option>`;
    });
    
    selectHTML += `</select>`;

    return selectHTML;
}

function deleteJob(id) {
    console.log("Attempting to delete job with ID:", id); // Log the ID being deleted
    chrome.storage.local.get("jobs", (result) => {
        const jobs = result.jobs || [];
        console.log("Current jobs:", jobs); // Log current jobs for debugging

        const updatedJobs = jobs.filter((job) => job.id !== id); // Remove job by unique ID
        console.log("Updated jobs after deletion:", updatedJobs); // Log updated jobs

        chrome.storage.local.set({ jobs: updatedJobs }, () => {
            console.log("Job deleted:", id);
            fetchJobs(); // Refresh the job list
            showNotification("Job deleted successfully!"); // User feedback
        });
    });
}

// Function to show user notifications (replace with your preferred method)
function showNotification(message) {
    // Example using alert (replace with toast or custom UI)
    alert(message);
}

function exportJobs() {

    // Step 1: Prepare the CSV data
    const csvRows = []; // Array to store CSV rows
    const headers = ["ID", "Title", "Company", "Location", "Source", "Status"]; // CSV headers

    // Add Headers row to the array
    csvRows.push(headers.join(","));

    // Add data rows to the array
    chrome.storage.local.get("jobs", (result) => {
        const jobs = result.jobs || [];
        jobs.forEach((job) => {
            csvRows.push([job.id, job.title, job.company, job.location, job.source, job.status].join(","));
        });
    });

    // Step 2: Create a CSV string
    const csvString = csvRows.join("\n");

    // Step 3: Create a blob file from the CSV string
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Step 4: Create a link and trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = "jobs.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // free up memory
}

// Add event listener when the document is loaded
document.addEventListener("DOMContentLoaded", () => {
    fetchJobs(); // Fetch jobs

    // Set up the export button event listener
    document.getElementById("export-jobs").addEventListener("click", exportJobs);
});