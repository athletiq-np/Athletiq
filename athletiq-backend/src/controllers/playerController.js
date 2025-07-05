const pool = require('../config/db');
const fs = require('fs');
const { OpenAI } = require('openai');
const apiResponse = require('../utils/apiResponse');

// ========== 1. REGISTER PLAYER HANDLER ==========

exports.registerPlayer = async (req, res) => {
  try {
    const {
      full_name,
      dob,
      gender,
      father_name,
      mother_name,
      guardian_phone,
      guardian_email,
      address
    } = req.body;

    if (!full_name || !dob || !gender || !father_name || !guardian_phone)
      return res.status(400).json(apiResponse.error("Missing required fields.", 400));

    let photoFilename = null;
    let certFilename = null;
    if (req.files && req.files.photo) photoFilename = req.files.photo[0].filename;
    if (req.files && req.files.birthCertificate) certFilename = req.files.birthCertificate[0].filename;

    // Optional: Duplicate check logic here

    // Insert into DB
    const result = await pool.query(
      `INSERT INTO players (
        full_name, dob, gender, father_name, mother_name, guardian_phone, guardian_email, address, photo_url, birth_certificate_url, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING id`,
      [full_name, dob, gender, father_name, mother_name, guardian_phone, guardian_email, address, photoFilename, certFilename]
    );
    res.status(201).json(apiResponse.success(
      { player_id: result.rows[0].id }, 
      "Player registered successfully!"
    ));
  } catch (err) {
    console.error("Player registration error:", err);
    res.status(500).json(apiResponse.error("Server error during registration.", 500));
  }
};

// ========== 2. OCR WITH GPT-4o VISION HANDLER ==========

// Setup OpenAI client (requires OPENAI_API_KEY in your .env file)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * OCR: Extract birth certificate data using GPT-4o Vision API.
 * Expects file field "certificate" (image/pdf).
 * Returns: { full_name, father_name, mother_name, dob_ad, dob_bs, address }
 */
exports.extractBirthCertificateData = async (req, res) => {
  try {
    // 1. Validate uploaded file
    if (!req.files || !req.files.certificate || !req.files.certificate[0]) {
      return res.status(400).json({ message: "No certificate file uploaded." });
    }
    const file = req.files.certificate[0];
    const filePath = file.path;
    const fileBuffer = fs.readFileSync(filePath);

    // 2. GPT-4o Vision API prompt
    const systemPrompt = `
You are an OCR assistant for Nepali birth certificates. 
Extract and return structured JSON data with the following keys:
- full_name (string)
- father_name (string)
- mother_name (string)
- dob_ad (string, YYYY-MM-DD)
- dob_bs (string, YYYY-MM-DD or Nepali format)
- address (string)

If any data is missing, use null. Only respond with JSON, no explanation.
`;

    // 3. Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 500,
      temperature: 0.0,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the birth certificate data from this image:" },
            { type: "image_file", image: fileBuffer }
          ]
        }
      ]
    });

    // 4. Parse JSON from GPT-4o output
    let data;
    try {
      data = JSON.parse(response.choices[0].message.content);
    } catch (e) {
      return res.status(500).json({ message: "Could not parse OCR response.", raw: response.choices[0].message.content });
    }

    res.json({
      message: "OCR extracted using GPT-4o.",
      data,
      file: { filePath, originalName: file.originalname }
    });
  } catch (err) {
    console.error("OCR extraction error:", err);
    res.status(500).json({ message: "Server error during OCR extraction.", error: err.message });
  }
};
