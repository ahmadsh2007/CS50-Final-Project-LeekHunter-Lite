document.addEventListener('DOMContentLoaded', () => {
    // Element Selectors
    const analyzeButton = document.getElementById('analyze-button');
    const codeInput = document.getElementById('code-input');
    const languageSelector = document.getElementById('language-selector');
    const resultsBody = document.getElementById('results-body');
    const loader = document.getElementById('loader');
    const noIssuesMessage = document.getElementById('no-issues-message');
    const resultsTable = document.getElementById('results-table');
    const lineNumbers = document.getElementById('line-numbers');

    // Line Number Logic
    const updateLineNumbers = () => {
        if (!codeInput || !lineNumbers) return;

        const lineCount = codeInput.value.split('\n').length;
        lineNumbers.innerHTML = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
    };

    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeInput.scrollTop;
    });

    codeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeInput.selectionStart;
            const end = codeInput.selectionEnd;
            codeInput.value = codeInput.value.substring(0, start) + '\t' + codeInput.value.substring(end);
            codeInput.selectionStart = codeInput.selectionEnd = start + 1;
        }
        setTimeout(updateLineNumbers, 0);
    });

    updateLineNumbers();


    // Analysis Logic
    analyzeButton.addEventListener('click', async () => {
        const code = codeInput.value;
        const lang = languageSelector.value;

        if (!code.trim()) {
            console.warn('Please enter some code to analyze.');
            return;
        }

        loader.classList.remove('hidden');
        resultsBody.innerHTML = '';
        noIssuesMessage.classList.add('hidden');

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, lang }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server responded with status: ${response.status}`);
            }

            const issues = await response.json();
            displayIssues(issues);

        } catch (error) {
            console.error('Error:', error);
            const errorRow = `
                <tr class="severity-error">
                    <td>N/A</td>
                    <td>Error</td>
                    <td colspan="2">${error.message}</td>
                </tr>`;
            resultsBody.innerHTML = errorRow;
            resultsTable.style.display = 'table';
        } finally {
            loader.classList.add('hidden');
        }
    });

    function displayIssues(issues) {
        if (issues.length === 0) {
            noIssuesMessage.classList.remove('hidden');
            return;
        }
        
        resultsTable.style.display = 'table';
        
        issues.forEach(issue => {
            const row = document.createElement('tr');
            row.classList.add(`severity-${(issue.severity || 'info').toLowerCase()}`);
            row.innerHTML = `
                <td data-label="Line">${issue.line || 'N/A'}</td>
                <td data-label="Severity" class="severity-cell">${issue.severity || 'Info'}</td>
                <td data-label="Message">${issue.message || ''}</td>
                <td data-label="Suggestion"><pre>${issue.suggestion || ''}</pre></td>
            `;
            resultsBody.appendChild(row);
        });
    }
});