// Workshop and registration settings
const eventSettings = {
  venue: 'ELN Block Seminar Hall, Ground Floor, BVRIT Narsapur',
  registrationUrl: '',

  // Priority 1: Google Apps Script Web App URL (Google Sheets integration)
  googleSheetUrl: (typeof window !== 'undefined' && (
    window.VITE_GOOGLE_SHEET_URL ||
    window.NEXT_PUBLIC_GOOGLE_SHEET_URL ||
    window.GOOGLE_SHEET_URL
  )) || 'https://script.google.com/macros/s/AKfycbz1uJV50SfeMtCTHXf9ZTXw0M9J3mk0drYsUEDhjYAach99BeXFAHlznTub3-kr1Wmd3Q/exec',

  // Priority 2: EmailJS Credentials (Pass dispatch)
  emailjs: {
    serviceId: (typeof window !== 'undefined' && (
      window.VITE_EMAILJS_SERVICE_ID ||
      window.EMAILJS_SERVICE_ID
    )) || '',
    templateId: (typeof window !== 'undefined' && (
      window.VITE_EMAILJS_TEMPLATE_ID ||
      window.EMAILJS_TEMPLATE_ID
    )) || '',
    publicKey: (typeof window !== 'undefined' && (
      window.VITE_EMAILJS_PUBLIC_KEY ||
      window.EMAILJS_PUBLIC_KEY
    )) || ''
  }
};
