require("dotenv").config();
const { adToBs, bsToAd } = require("../src/utils/nepaliDate");
const { translateName } = require("../src/utils/translateName");

async function test() {
  console.log("Testing Nepali date conversions:");

  const adDate = "2025-06-23";
  const bsDate = adToBs(adDate);
  console.log(`AD ${adDate} => BS ${bsDate}`);

  const backToAd = bsToAd(bsDate);
  console.log(`BS ${bsDate} => AD ${backToAd}`);

  console.log("\nTesting name translation:");

  // Translate Nepali to English
  const nepName = "सुरेश";
  const translatedEng = await translateName(nepName, "ne", "en");
  console.log(`Nepali "${nepName}" => English "${translatedEng}"`);

  // Translate English to Nepali
  const engName = "Suresh";
  const translatedNep = await translateName(engName, "en", "ne");
  console.log(`English "${engName}" => Nepali "${translatedNep}"`);
}

test()
  .then(() => console.log("Test completed successfully."))
  .catch((err) => console.error("Test failed:", err));
