// --- 1. State & Elements ---
const input = document.getElementById('markdown-input');
const preview = document.getElementById('preview-wrapper');
const downloadBtn = document.getElementById('download-btn');
const loadingOverlay = document.getElementById('loading-overlay');

const defaultMarkdown = `# Welcome to MarkdownToPDF

This is a simple, **real-time** markdown editor.

## Features:
- Real-time preview
- **PDF Export** (A4 Portrait)
- **PDF Export** (A4 Portrait)
- Syntax highlight support (basic)

### Example Code
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### Example List
1. Item 1
2. Item 2
   - Subitem A
   - Subitem B


---
*Use three dashes above for a separator.*

====
*Use four equal signs above for a page break (in PDF).*
`;

// --- 2. Initialization ---
function init() {
    // Load Markdown
    if (!input.value) {
        input.value = defaultMarkdown;
    }
    updatePreview();

    // Event Listeners
    // Event Listeners
    input.addEventListener('input', debounce(updatePreview, 300));
    downloadBtn.addEventListener('click', downloadPDF);
}

// --- 3. Markdown Logic ---
function updatePreview() {
    const raw = input.value;
    // Handle logical page breaks for UI
    // We replace '---' with a hr that we style as a break
    // Note: markedjs converts '---' to <hr> by default. We just style hr or a specific class.

    // Custom renderer could be added here if needed, but default is usually fine.
    // Replace ==== with a page break marker
    // We use a regex ensuring it's on its own line
    const processed = raw.replace(/^={4,}$/gm, '<div class="page-break"></div>');

    // Let's just run marked.
    const html = marked.parse(processed);
    preview.innerHTML = html;
}

// --- 4. PDF Generation ---
function downloadPDF() {
    setLoading(true);

    // Options for html2pdf
    const opt = {
        margin: [10, 10, 10, 10], // top, left, bottom, right in mm
        filename: 'markdown-to-pdf.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } // respect page-break-.., and <hr> usually triggers new page in some settings
    };

    // NOTE: html2pdf handles the '---' (hr) as a line, not necessarily a force-page-break unless we CSS it.
    // Let's inject a specialized style for printing just before generating
    // Actually, best way for '---' to be a page break is using CSS 'page-break-after: always' on <hr>
    const style = document.createElement('style');
    style.innerHTML = `
        .page-break {
            page-break-after: always;
            height: 0;
            margin: 0;
            border: 0;
        }
        .page-break::after { content: none; }
        .markdown-body { font-size: 10pt; } /* Adjust font for PDF legibility if needed */
    `;
    preview.appendChild(style);

    html2pdf().set(opt).from(preview).save().then(() => {
        setLoading(false);
        style.remove(); // Clean up
    }).catch(err => {
        console.error(err);
        alert("Error ensuring PDF");
        setLoading(false);
        style.remove();
    });
}

// --- 5. Utilities ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setLoading(isActive) {
    if (isActive) {
        loadingOverlay.classList.add('active');
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = 'Generating...';
    } else {
        loadingOverlay.classList.remove('active');
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download PDF`;
    }
}



// Run
init();