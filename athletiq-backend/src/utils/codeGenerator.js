// src/utils/codeGenerator.js

function generateRandomCode(prefix = "", length = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

/**
 * Generates a unique code by calling the existsFn(code) to check DB.
 * If the code exists, it retries until it's unique.
 */
async function generateShortCode(prefix, existsFn) {
  if (typeof existsFn !== "function") {
    throw new Error("generateShortCode: existsFn must be a function");
  }

  let code;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    code = generateRandomCode(prefix);
    exists = await existsFn(code);
    attempts++;
  }

  if (exists) throw new Error("Failed to generate unique code after 10 attempts");

  return code;
}

module.exports = { generateShortCode };
