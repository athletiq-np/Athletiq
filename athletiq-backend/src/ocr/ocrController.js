// src/ocr/ocrController.js

/**
 * OCR Controller
 * - extractBirthCertificateDataAI: Extracts fields from birth certificate image using AI/OCR.
 * - Fields: full_name_eng, full_name_nep, dob_ad, dob_bs, gender, father_name, mother_name, address, etc.
 */

// If using OpenAI Vision API or similar, import dependencies here
// const openai = require('openai'); // Example (commented out for template)

exports.extractBirthCertificateDataAI = async (filePath) => {
  // TODO: Replace this mock logic with actual OCR/AI code.
  // For now, returns a hardcoded mock object for dev/testing/demo.

  // Example: Use filePath as input for your actual OCR/AI integration

  // DEMO OUTPUT:
  return {
    full_name_eng: "Sujan Thapa",
    full_name_nep: "सुजन थापा",
    dob_ad: "2012-04-01",
    dob_bs: "2068-12-19",
    gender: "Male",
    father_name: "Krishna Bahadur Thapa",
    mother_name: "Rita Thapa",
    address: "Pokhara, Kaski"
    // Add more fields as needed
  };
};

// For expansion: You can export more functions for multi-language or multi-type OCR if needed.
