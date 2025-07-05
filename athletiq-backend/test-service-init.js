// test-service-init.js - Test service initialization
require('dotenv').config();
console.log('Testing service initialization...');

async function testServices() {
  console.log('Testing FileUploadHandler...');
  try {
    const FileUploadHandler = require('./src/services/ai/fileUploadHandler');
    const fileHandler = new FileUploadHandler();
    console.log('✅ FileUploadHandler instantiated successfully');
    
    // Try to access multer upload
    if (fileHandler.upload) {
      console.log('✅ Multer upload configured');
    }
  } catch (error) {
    console.error('❌ Error with FileUploadHandler:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('Testing QueueProcessor...');
  try {
    const QueueProcessor = require('./src/services/queue/queueProcessor');
    console.log('QueueProcessor class loaded, testing instantiation...');
    
    // This is likely where the hanging occurs
    const queueProcessor = new QueueProcessor();
    console.log('✅ QueueProcessor instantiated successfully');
  } catch (error) {
    console.error('❌ Error with QueueProcessor:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('Testing DocumentProcessor...');
  try {
    const DocumentProcessor = require('./src/services/ai/documentProcessor');
    const docProcessor = new DocumentProcessor();
    console.log('✅ DocumentProcessor instantiated successfully');
  } catch (error) {
    console.error('❌ Error with DocumentProcessor:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('Testing OCRService...');
  try {
    const OCRService = require('./src/services/ai/ocrService');
    const ocrService = new OCRService();
    console.log('✅ OCRService instantiated successfully');
  } catch (error) {
    console.error('❌ Error with OCRService:', error.message);
    console.error('Stack:', error.stack);
  }

  console.log('All service tests completed!');
  process.exit(0);
}

// Handle hanging
setTimeout(() => {
  console.log('⚠️  Service initialization taking too long, likely hanging on Redis connection...');
  process.exit(1);
}, 10000);

testServices().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});
