// ── Groq API Key ─────────────────────────────────────────────────────────────
const API_KEY = "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";

// ── Groq API URL ─────────────────────────────────────────────────────────────
const API_URL = "https://api.groq.com/openai/v1/chat/completions";


// ── Line Counter ─────────────────────────────────────────────────────────────
document.getElementById("codeInput").addEventListener("input", function () {
  const lines = this.value.split("\n").length;
  document.getElementById("lineCount").textContent = `${lines} line${lines !== 1 ? "s" : ""}`;
});


// ── Main Analyze Function ─────────────────────────────────────────────────────
async function analyzeCode() {

  const code     = document.getElementById("codeInput").value.trim();
  const language = document.getElementById("language").value;
  const langName = document.getElementById("language").options[document.getElementById("language").selectedIndex].text;

  if (!code) {
    showError("Please paste some code first before analyzing.");
    return;
  }

  if (code.length < 5) {
    showError("Code is too short. Please paste at least a few lines.");
    return;
  }

  document.getElementById("loading").style.display = "block";
  document.getElementById("errorsSection").style.display = "none";
  document.getElementById("noErrors").style.display = "none";
  document.getElementById("errorBox").style.display = "none";
  document.getElementById("fixedCodeArea").innerHTML = '<div class="placeholder-text">Analyzing...</div>';
  document.getElementById("copyFixedBtn").style.display = "none";

  const btn = document.getElementById("analyzeBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Analyzing...";

  try {
    const prompt = `
You are an expert ${language} code reviewer and debugger. Analyze the following ${langName} code carefully.

CODE TO ANALYZE:
\`\`\`${language}
${code}
\`\`\`

Your task:
1. Find ALL errors, bugs, and issues in the code
2. Provide the complete fixed version of the code
3. Explain each error clearly

Respond ONLY in this exact JSON format (no extra text, no markdown, just pure JSON):
{
  "errors": [
    {
      "type": "error",
      "title": "Short title of the error",
      "description": "Clear explanation of what is wrong and why"
    }
  ],
  "fixed_code": "the complete corrected code here",
  "has_errors": true
}

Rules:
- type must be one of: error, warning, suggestion
- If no errors found, return empty errors array and has_errors as false
- fixed_code must be the COMPLETE corrected code
- Keep fixed_code as plain text, no markdown code fences
`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 2048,
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || "API call failed");
    }

    const data    = await response.json();
    const rawText = data.choices[0].message.content;

    const cleanText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let result;
    try {
      result = JSON.parse(cleanText);
    } catch (e) {
      throw new Error("AI response was not in the expected format. Please try again.");
    }

    document.getElementById("loading").style.display = "none";

    if (result.fixed_code) {
      document.getElementById("fixedCodeArea").textContent = result.fixed_code;
      document.getElementById("copyFixedBtn").style.display = "block";
    }

    if (result.has_errors && result.errors && result.errors.length > 0) {
      displayErrors(result.errors);
    } else {
      document.getElementById("noErrors").style.display = "block";
    }

  } catch (error) {
    document.getElementById("loading").style.display = "none";
    showError("Something went wrong: " + error.message);
  }

  btn.disabled = false;
  btn.textContent = "🔍 Find & Fix Errors";
}


// ── Display Errors ────────────────────────────────────────────────────────────
function displayErrors(errors) {
  const section    = document.getElementById("errorsSection");
  const list       = document.getElementById("errorsList");
  const countBadge = document.getElementById("errorCount");

  countBadge.textContent = `${errors.length} error${errors.length !== 1 ? "s" : ""}`;
  list.innerHTML = "";

  errors.forEach((err) => {
    const type = err.type || "error";
    const div  = document.createElement("div");
    div.className = `error-item ${type}`;
    div.innerHTML = `
      <span class="error-type">${type}</span>
      <p class="error-title">${err.title}</p>
      <p class="error-desc">${err.description}</p>
    `;
    list.appendChild(div);
  });

  section.style.display = "block";
}


// ── Copy Fixed Code ───────────────────────────────────────────────────────────
function copyFixed() {
  const fixedCode = document.getElementById("fixedCodeArea").textContent;
  navigator.clipboard.writeText(fixedCode).then(() => {
    const btn = document.getElementById("copyFixedBtn");
    btn.textContent = "✅ Copied!";
    setTimeout(() => { btn.textContent = "📋 Copy"; }, 2000);
  });
}


// ── Clear All ─────────────────────────────────────────────────────────────────
function clearAll() {
  document.getElementById("codeInput").value = "";
  document.getElementById("lineCount").textContent = "0 lines";
  document.getElementById("fixedCodeArea").innerHTML = '<div class="placeholder-text">Fixed code will appear here...</div>';
  document.getElementById("errorsSection").style.display = "none";
  document.getElementById("noErrors").style.display = "none";
  document.getElementById("errorBox").style.display = "none";
  document.getElementById("copyFixedBtn").style.display = "none";
  document.getElementById("loading").style.display = "none";
}


// ── Show Error ────────────────────────────────────────────────────────────────
function showError(message) {
  const errorBox = document.getElementById("errorBox");
  errorBox.textContent = "❌ " + message;
  errorBox.style.display = "block";
  setTimeout(() => { errorBox.style.display = "none"; }, 6000);
}
