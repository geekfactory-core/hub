// -----------------------------------------------------------------------------
// This file was generated with the help of AI (ChatGPT).
// -----------------------------------------------------------------------------

/**
 * Creates a file from an array of strings and triggers a download in the browser.
 * @param lines - Array of strings to write to the file.
 * @param filename - Name of the file to download (default: 'download.txt').
 * @param fileType - MIME type of the file (default: 'text/plain').
 */
export function downloadStringsAsFile(lines: Array<string>, filename: string = 'download.txt', fileType: string = 'text/plain'): void {
    try {
        // Convert the array of strings into a single string (e.g., join with newlines)
        const content = lines.join('\n');

        // Create a Blob with the content
        const blob = new Blob([content], {type: fileType});

        // Create a temporary URL for the Blob
        const url = window.URL.createObjectURL(blob);

        // Create a temporary <a> element to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        // Append the link to the DOM, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Release the Blob URL
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error creating or downloading file:', error);
    }
}
