// --- Element Selectors ---
const analyzeButton = document.getElementById("analyze-button");
const codeInput = document.getElementById("code-input");
const languageSelector = document.getElementById("language-selector");
const resultsBody = document.getElementById("results-body");
const loader = document.getElementById("loader");
const noIssuesMessage = document.getElementById("no-issues-message");
const resultsTable = document.getElementById("results-table");
const lineNumbers = document.getElementById("line-numbers");
const uploadButton = document.getElementById("upload-button");
const fileInput = document.getElementById("file-input");

// --- File Upload Logic ---
uploadButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".py")) {
    languageSelector.value = "python";
  } else if (fileName.endsWith(".c") || fileName.endsWith(".h")) {
    languageSelector.value = "c";
  } else {
    alert("Invalid file type. Please upload a .py, .c, or .h file.");
    fileInput.value = ""; // Reset
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    codeInput.value = e.target.result;
    updateLineNumbers();
  };
  reader.readAsText(file);
  fileInput.value = ""; // Reset for re-uploading the same file
});

// --- Line Number and Editor Sync Logic ---
const updateLineNumbers = () => {
  const lineCount = codeInput.value.split("\n").length;
  lineNumbers.value = Array.from({ length: lineCount }, (_, i) => i + 1).join(
    "\n"
  );
};
codeInput.addEventListener("input", updateLineNumbers);
codeInput.addEventListener("scroll", () => {
  lineNumbers.scrollTop = codeInput.scrollTop;
});
codeInput.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    document.execCommand("insertText", false, "\t");
  }
});
updateLineNumbers(); // Initial call

// --- Gemini API Analysis Logic ---
const buildPrompt = (code, lang) => {
  return `
    You are an expert programmer and AI code reviewer specializing in ${lang}.
    Your task is to perform a static analysis of the following code. Do NOT execute the code.

    Analyze the code for the following:
    1. Syntax errors, type errors, or potential runtime exceptions.
    2. Bad practices (e.g., unused variables, inefficient loops, security vulnerabilities like SQL injection).
    3. Logical errors or confusing logic.
    4. Memory management issues (especially for C).

    Return your findings as a JSON array of objects. Each object must have the following fields:
    - "line": The line number where the issue occurs (integer or null if general).
    - "severity": The severity of the issue ("error", "warning", or "info").
    - "message": A clear, concise description of the issue.
    - "suggestion": A concrete suggestion or code example on how to fix the issue.

    If the code is perfect and has no issues, return an empty JSON array [].

    Code to analyze:
    \`\`\`${lang}
    ${code}
    \`\`\`
    `;
};

const displayIssues = (issues) => {
  resultsBody.innerHTML = "";

  if (issues.length === 0) {
    noIssuesMessage.classList.remove("hidden");
    resultsTable.classList.add("hidden");
    return;
  }

  noIssuesMessage.classList.add("hidden");
  resultsTable.classList.remove("hidden");

  const severityColors = {
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-sky-50 border-sky-200 text-sky-800",
  };

  issues.forEach((issue) => {
    const severity = (issue.severity || "info").toLowerCase();
    const row = document.createElement("tr");
    row.className = `border-b ${
      severityColors[severity] || severityColors["info"]
    }`;

    row.innerHTML = `
            <td class="px-4 py-3 font-mono">${issue.line || "N/A"}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs font-semibold rounded-full capitalize 
                    ${severity === "error" ? "bg-red-200 text-red-800" : ""}
                    ${
                      severity === "warning"
                        ? "bg-amber-200 text-amber-800"
                        : ""
                    }
                    ${severity === "info" ? "bg-sky-200 text-sky-800" : ""}">
                    ${issue.severity || "Info"}
                </span>
            </td>
            <td class="px-4 py-3">${issue.message || ""}</td>
            <td class="px-4 py-3">
                <pre class="code-suggestion text-xs bg-[#282c34] text-slate-300 p-2 rounded-md whitespace-pre-wrap break-words">${
                  issue.suggestion || ""
                }</pre>
            </td>
        `;
    resultsBody.appendChild(row);
  });
};

analyzeButton.addEventListener("click", async () => {
  const code = codeInput.value;
  const lang = languageSelector.value;

  if (!code.trim()) {
    alert("Please enter some code to analyze.");
    return;
  }

  // --- UI updates for loading state ---
  loader.classList.remove("hidden");
  analyzeButton.disabled = true;
  analyzeButton.classList.add("opacity-50", "cursor-not-allowed");
  resultsBody.innerHTML = ""; // Clear previous results
  noIssuesMessage.classList.add("hidden");
  resultsTable.classList.remove("hidden"); // Ensure table is visible

  try {
    // CORRECT: Calling your own backend server at the /analyze route
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, lang }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Server responded with status: ${response.status}`
      );
    }

    const issues = await response.json();
    displayIssues(issues);
  } catch (error) {
    console.error("Error:", error);
    const errorIssue = [
      {
        line: "N/A",
        severity: "error",
        message:
          "Failed to analyze code. There might be an issue with the backend server.",
        suggestion: error.message,
      },
    ];
    displayIssues(errorIssue);
  } finally {
    // --- Revert UI from loading state ---
    loader.classList.add("hidden");
    analyzeButton.disabled = false;
    analyzeButton.classList.remove("opacity-50", "cursor-not-allowed");
  }
});
