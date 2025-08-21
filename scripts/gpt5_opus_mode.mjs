import { execSync } from "node:child_process";
import fs from "node:fs";

const [, , mode = "review", inputPath = "", extra = ""] = process.argv;

const SYSTEM_PROMPT = `
You are "Opus-Reviewer", a meticulous senior engineer.
Be conservative and correctness-first. Prefer small, surgical diffs.
Always output in this order:
1) Findings (bullet list by file)
2) Patches (unified diff blocks)
3) Tests (concrete additions/changes)
4) Risk summary (merge: yes/no)
Check: logic edge cases, security (authZ vs authN, injection, CSRF/XSS/SSRF, secrets), performance (N+1, indexes, batching, caching), error handling, i18n/timezones, pagination, a11y/ARIA.
`;

const MODE_GUIDANCE = {
  review: "Perform a line-by-line code review of the diff/content.",
  security: "Perform a security review; show exploits and minimal-diff fixes.",
  performance: "Analyze complexity and data access; propose targeted optimizations.",
  fidelity: "Compare UI to design tokens/spec; provide exact CSS/Tailwind patches.",
  docs: "Generate/update runbook: env vars, start/stop, rollback, common failures."
};

function gitDiff() {
  try { return execSync("git diff --cached", { encoding: "utf8" }).trim(); }
  catch { return ""; }
}
function read(path) {
  if (!path) return "";
  try { return fs.readFileSync(path, "utf8"); } catch { return ""; }
}

const diff = gitDiff();
const fileContent = read(inputPath);

// Redact common secret-looking strings from diffs and file content before sending
const redactSecrets = (text) => {
  if (!text) return text;
  // redact API keys, secrets, tokens, private keys, and passwords
  let out = text.replace(/(OPENAI_API_KEY|API_KEY|APIKEY|SECRET|JWT_SECRET|GOOGLE_CLIENT_SECRET|TWILIO_AUTH_TOKEN|EMAIL_PASSWORD)\s*=\s*[^\s"'\\]*/gi, '$1=REDACTED');
  out = out.replace(/("|')(sk-[a-zA-Z0-9_-]{20,}|\w{32,})("|')/g, '"REDACTED_SECRET"');
  out = out.replace(/-----BEGIN[\s\S]*?PRIVATE KEY-----[\s\S]*?-----END[\s\S]*?PRIVATE KEY-----/g, 'REDACTED_PRIVATE_KEY');
  // redact common password patterns
  out = out.replace(/(password\s*[:=]\s*)([^\n\r,]+)/gi, '$1REDACTED');
  return out;
};

const safeDiff = redactSecrets(diff);
const safeFileContent = redactSecrets(fileContent);
const userContent = `
Mode: ${mode.toUpperCase()}
Project context: ${extra || "(none)"}
Input (prefer diff if present):
---BEGIN DIFF---
${diff || "(no staged diff; falling back to file content)"}
---END DIFF---
---BEGIN FILE CONTENT---
${fileContent}
---END FILE CONTENT---
`;

const payload = {
  model: "gpt-5",
  messages: [
    { role: "system", content: SYSTEM_PROMPT },
  { role: "user", content: `${MODE_GUIDANCE[mode] || MODE_GUIDANCE.review}\n\n${userContent.replace(diff, safeDiff).replace(fileContent, safeFileContent)}` }
  ],
  temperature: 0.2
};

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

(async () => {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    console.error("API error:", await res.text());
    process.exit(1);
  }
  const data = await res.json();
  console.log((data.choices?.[0]?.message?.content || "").trim());
})();
