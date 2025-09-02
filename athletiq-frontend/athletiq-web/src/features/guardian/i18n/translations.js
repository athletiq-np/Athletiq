// src/features/guardian/i18n/translations.js
import { useState } from 'react';

export const translations = {
  en: {
    // Authentication
    "auth.continueWithPhone": "Continue with Phone",
    "auth.continueWithEmail": "Continue with Email", 
    "auth.continueWithGoogle": "Continue with Google",
    "auth.verifyContact": "We'll verify your contact to keep your child's data safe.",
    "auth.enterOTP": "Enter verification code",
    "auth.resendCode": "Resend code",
    
    // Child Search
    "search.findChild": "Find Your Child",
    "search.childName": "Child's Full Name",
    "search.dateOfBirth": "Date of Birth",
    "search.schoolOptional": "School (optional)",
    "search.helpText": "If your school already added your child, we'll find them automatically.",
    "search.searching": "Searching...",
    "search.noMatch": "No Match Found",
    "search.createProfile": "Let's create the profile",
    
    // Claim Profile
    "claim.isThisYourChild": "Is this your child?",
    "claim.relationship": "Relationship",
    "claim.mother": "Mother",
    "claim.father": "Father", 
    "claim.guardian": "Guardian",
    "claim.awaitingApproval": "Awaiting School Confirmation",
    "claim.approvalTime": "Usually within 1–3 school days",
    
    // New Athlete
    "athlete.uploadPhoto": "Upload Photo",
    "athlete.uploadBirthCert": "Upload Birth Certificate",
    "athlete.ocrProcessing": "Processing document...",
    "athlete.mismatchFound": "We found some differences",
    "athlete.whichCorrect": "Which information is correct?",
    "athlete.grade": "Grade",
    "athlete.section": "Section",
    "athlete.sportsInterests": "Sports Interests",
    
    // Schools
    "school.selectSchool": "Select School",
    "school.searchSchool": "Search for school...",
    "school.notFound": "School not found?",
    "school.requestNew": "Request to add new school",
    
    // Status
    "status.pending": "Pending School Approval",
    "status.active": "Active Athlete",
    "status.actionRequired": "Action Required",
    "status.rejected": "Rejected",
    "status.whatNext": "What happens next?",
    
    // Common
    "common.next": "Next",
    "common.back": "Back",
    "common.submit": "Submit",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success"
  },
  
  np: {
    // Authentication  
    "auth.continueWithPhone": "फोन प्रयोग गरेर अगाडि बढ्नुहोस्",
    "auth.continueWithEmail": "इमेल प्रयोग गरेर अगाडि बढ्नुहोस्",
    "auth.continueWithGoogle": "गुगल प्रयोग गरेर अगाडि बढ्नुहोस्",
    "auth.verifyContact": "तपाईंको बालकको डाटा सुरक्षित राख्न हामी सम्पर्क प्रमाणीकरण गर्छौं।",
    "auth.enterOTP": "प्रमाणीकरण कोड राख्नुहोस्",
    "auth.resendCode": "कोड पुनः पठाउनुहोस्",
    
    // Child Search
    "search.findChild": "तपाईंको बालक खोज्नुहोस्",
    "search.childName": "बालकको पूरा नाम",
    "search.dateOfBirth": "जन्म मिति",
    "search.schoolOptional": "विद्यालय (वैकल्पिक)",
    "search.helpText": "यदि तपाईंको विद्यालयले पहिले नै तपाईंको बालक थपेको छ भने, हामी स्वतः फेला पार्नेछौं।",
    "search.searching": "खोजी गर्दै...",
    "search.noMatch": "कुनै मिल्दो फेला परेन",
    "search.createProfile": "प्रोफाइल बनाउँदै",
    
    // Claim Profile
    "claim.isThisYourChild": "के यो तपाईंको बालक हो?",
    "claim.relationship": "सम्बन्ध",
    "claim.mother": "आमा",
    "claim.father": "बुबा",
    "claim.guardian": "संरक्षक",
    "claim.awaitingApproval": "विद्यालयको पुष्टि बाकि छ",
    "claim.approvalTime": "सामान्यतया १-३ दिन लाग्छ",
    
    // New Athlete
    "athlete.uploadPhoto": "फोटो अपलोड गर्नुहोस्",
    "athlete.uploadBirthCert": "जन्म प्रमाणपत्र अपलोड गर्नुहोस्",
    "athlete.ocrProcessing": "कागजात प्रशोधन गर्दै...",
    "athlete.mismatchFound": "केही फरक जानकारी फेला पर्यो",
    "athlete.whichCorrect": "कुन जानकारी सही हो?",
    "athlete.grade": "कक्षा",
    "athlete.section": "शाखा",
    "athlete.sportsInterests": "खेलकुदको रुचि",
    
    // Schools
    "school.selectSchool": "विद्यालय छान्नुहोस्",
    "school.searchSchool": "विद्यालय खोज्नुहोस्...",
    "school.notFound": "विद्यालय भेटिएन?",
    "school.requestNew": "नयाँ विद्यालय थप्न अनुरोध गर्नुहोस्",
    
    // Status
    "status.pending": "विद्यालयको स्वीकृति बाँकी",
    "status.active": "सक्रिय खेलाडी",
    "status.actionRequired": "कारबाही आवश्यक",
    "status.rejected": "अस्वीकृत",
    "status.whatNext": "अब के हुन्छ?",
    
    // Common
    "common.next": "अगाडि",
    "common.back": "पछाडि",
    "common.submit": "पेश गर्नुहोस्",
    "common.cancel": "रद्द गर्नुहोस्",
    "common.save": "सुरक्षित गर्नुहोस्",
    "common.loading": "लोड हुँदै...",
    "common.error": "त्रुटि",
    "common.success": "सफल"
  }
};

export const useTranslation = () => {
  const [language, setLanguage] = useState('en');
  
  const t = (key) => {
    return translations[language][key] || key;
  };
  
  return { t, language, setLanguage };
};
