// Centralized configuration for Google services (placeholders only)
// Replace with real values when ready. Never commit real IDs.

export const GA4_ID = 'G-XXXXXXXXXX';
export const ADS_CONVERSION_ID = 'AW-XXXXXXXXX';
export const ADS_PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX';
export const GOOGLE_VERIFICATION_CODE = 'GOOGLE_VERIFICATION_CODE'; // update via Search Console
export const CONSENT_KEY = 'chraim_consent_v2';
export const DEFAULT_CONSENT = { analytics: false, ads: false, timestamp: 0 };

window.CHRAIM_CONFIG = {
  GA4_ID,
  ADS_CONVERSION_ID,
  ADS_PUBLISHER_ID,
  GOOGLE_VERIFICATION_CODE,
  CONSENT_KEY,
  DEFAULT_CONSENT
};
