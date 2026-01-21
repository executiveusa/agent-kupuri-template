import { getVisitorId, getSessionId } from '../ab-testing';

export interface LeadData {
  businessId?: string;
  cityId?: string;
  categoryId?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  leadType: 'contact' | 'quote' | 'callback' | 'claim';
  language?: string;
}

export interface LeadSubmissionResult {
  success: boolean;
  leadId?: string;
  error?: string;
}

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

// Get UTM parameters from URL
export function getUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || undefined,
    medium: params.get('utm_medium') || undefined,
    campaign: params.get('utm_campaign') || undefined,
    term: params.get('utm_term') || undefined,
    content: params.get('utm_content') || undefined,
  };
}

// Store UTM params in session for attribution
export function storeUTMParams(): void {
  if (typeof window === 'undefined') return;
  
  const utm = getUTMParams();
  if (Object.values(utm).some(v => v)) {
    sessionStorage.setItem('utm_params', JSON.stringify(utm));
  }
}

// Get stored UTM params
export function getStoredUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  
  const stored = sessionStorage.getItem('utm_params');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return getUTMParams();
}

// Get device type
export function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

// Get referrer
export function getReferrer(): string {
  if (typeof window === 'undefined') return '';
  return document.referrer || '';
}

// Get source from referrer
export function getSourceFromReferrer(): string {
  const referrer = getReferrer();
  if (!referrer) return 'direct';
  
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    
    if (hostname.includes('google')) return 'google';
    if (hostname.includes('bing')) return 'bing';
    if (hostname.includes('yahoo')) return 'yahoo';
    if (hostname.includes('facebook') || hostname.includes('fb.')) return 'facebook';
    if (hostname.includes('instagram')) return 'instagram';
    if (hostname.includes('twitter') || hostname.includes('t.co')) return 'twitter';
    if (hostname.includes('linkedin')) return 'linkedin';
    if (hostname.includes('youtube')) return 'youtube';
    
    return 'referral';
  } catch {
    return 'referral';
  }
}

// Submit lead
export async function submitLead(data: LeadData): Promise<LeadSubmissionResult> {
  try {
    const utm = getStoredUTMParams();
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    
    // Get A/B test attribution from session storage
    let abTestId: string | undefined;
    let abVariant: string | undefined;
    
    if (typeof window !== 'undefined') {
      const abAttribution = sessionStorage.getItem('ab_attribution');
      if (abAttribution) {
        try {
          const parsed = JSON.parse(abAttribution);
          abTestId = parsed.testId;
          abVariant = parsed.variantId;
        } catch {
          // Ignore parse errors
        }
      }
    }

    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        source: utm.source || getSourceFromReferrer(),
        sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        utmSource: utm.source,
        utmMedium: utm.medium,
        utmCampaign: utm.campaign,
        utmTerm: utm.term,
        utmContent: utm.content,
        abTestId,
        abVariant,
        deviceType: getDeviceType(),
        visitorId,
        sessionId,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to submit lead' };
    }

    const result = await response.json();
    
    // Track conversion for A/B test
    if (abTestId && abVariant) {
      await fetch('/api/ab-tests/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: abTestId,
          variantId: abVariant,
          eventType: 'conversion',
          conversionType: data.leadType,
          visitorId,
          sessionId,
        }),
      });
    }

    return { success: true, leadId: result.id };
  } catch (error) {
    console.error('Error submitting lead:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Track phone click
export async function trackPhoneClick(businessId: string, phone: string): Promise<void> {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'phone_click',
        eventCategory: 'lead',
        eventAction: 'click',
        eventLabel: phone,
        businessId,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
    });
  } catch (error) {
    console.error('Error tracking phone click:', error);
  }
}

// Track email click
export async function trackEmailClick(businessId: string, email: string): Promise<void> {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'email_click',
        eventCategory: 'lead',
        eventAction: 'click',
        eventLabel: email,
        businessId,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
    });
  } catch (error) {
    console.error('Error tracking email click:', error);
  }
}

// Track website click
export async function trackWebsiteClick(businessId: string, website: string): Promise<void> {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'website_click',
        eventCategory: 'lead',
        eventAction: 'click',
        eventLabel: website,
        businessId,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
    });
  } catch (error) {
    console.error('Error tracking website click:', error);
  }
}

// Validate email
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate phone (basic)
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// Format phone for display
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}
