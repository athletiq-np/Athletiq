// Quick test of FootballTemplateService preview generation
const FootballTemplateService = require('./src/services/pdfGeneration/templates/FootballTemplateService');

console.log('🧪 Testing FootballTemplateService...');

try {
  const templateService = new FootballTemplateService();
  console.log('✅ Template service created');
  
  const htmlContent = templateService.generateWithSampleData('blank');
  console.log('✅ Sample data generated');
  console.log('📄 HTML length:', htmlContent.length);
  console.log('📄 First 200 chars:', htmlContent.substring(0, 200));
  
} catch (error) {
  console.error('❌ Error:', error);
  console.error('📋 Stack:', error.stack);
}
