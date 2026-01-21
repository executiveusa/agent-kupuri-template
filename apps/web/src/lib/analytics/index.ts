import { getVisitorId, getSessionId } from '../ab-testing';
import { getStoredUTMParams, getDeviceType, getReferrer } from '../leads';

export interface EventData {
  eventType: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  businessId?: string;
  cityId?: string;
  categoryId?: string;
  leadId?: string;
  abTestId?: string;
  abVariant?: string;
  metadata?: Record<string, unknown>;
}

export interface PageViewData {
  pagePath: string;
  pageTitle?: string;
  cityId?: string;
  categoryId?: string;
  businessId?: string;
  searchQuery?: string;
}

// Track generic event
export async function trackEvent(data: EventData): Promise<void> {
  try {
    const utm = getStoredUTMParams();
    
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        source: utm.source,
        medium: utm.medium,
        campaign: utm.campaign,
        referrer: getReferrer(),
        deviceType: getDeviceType(),
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        language: typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) : 'en',
      }),
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

// Track page view
export async function trackPageView(data: PageViewData): Promise<void> {
  await trackEvent({
    eventType: 'page_view',
    eventCategory: 'navigation',
    eventAction: 'view',
    eventLabel: data.pageTitle || data.pagePath,
    businessId: data.businessId,
    cityId: data.cityId,
    categoryId: data.categoryId,
    metadata: {
      pagePath: data.pagePath,
      pageTitle: data.pageTitle,
      searchQuery: data.searchQuery,
    },
  });
}

// Track search
export async function trackSearch(
  query: string,
  resultsCount: number,
  filters?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('/api/search/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        normalizedQuery: query.toLowerCase().trim(),
        resultsCount,
        filters,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
      }),
    });
  } catch (error) {
    console.error('Error tracking search:', error);
  }
}

// Track search result click
export async function trackSearchClick(
  query: string,
  businessId: string,
  position: number
): Promise<void> {
  await trackEvent({
    eventType: 'search_click',
    eventCategory: 'search',
    eventAction: 'click',
    eventLabel: query,
    eventValue: position,
    businessId,
    metadata: { query, position },
  });
}

// Track business view
export async function trackBusinessView(businessId: string, businessName: string): Promise<void> {
  await trackEvent({
    eventType: 'business_view',
    eventCategory: 'business',
    eventAction: 'view',
    eventLabel: businessName,
    businessId,
  });
}

// Track CTA click
export async function trackCTAClick(
  ctaType: string,
  businessId?: string,
  abTestId?: string,
  abVariant?: string
): Promise<void> {
  await trackEvent({
    eventType: 'cta_click',
    eventCategory: 'engagement',
    eventAction: 'click',
    eventLabel: ctaType,
    businessId,
    abTestId,
    abVariant,
  });
}

// Track form interaction
export async function trackFormInteraction(
  formType: string,
  action: 'start' | 'field_focus' | 'field_blur' | 'submit' | 'error',
  fieldName?: string,
  businessId?: string
): Promise<void> {
  await trackEvent({
    eventType: 'form_interaction',
    eventCategory: 'form',
    eventAction: action,
    eventLabel: fieldName || formType,
    businessId,
    metadata: { formType, fieldName },
  });
}

// Track scroll depth
export function initScrollTracking(thresholds = [25, 50, 75, 100]): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const tracked = new Set<number>();
  
  const handleScroll = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
    
    for (const threshold of thresholds) {
      if (scrollPercent >= threshold && !tracked.has(threshold)) {
        tracked.add(threshold);
        trackEvent({
          eventType: 'scroll_depth',
          eventCategory: 'engagement',
          eventAction: 'scroll',
          eventLabel: `${threshold}%`,
          eventValue: threshold,
        });
      }
    }
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}

// Track time on page
export function initTimeTracking(intervals = [30, 60, 120, 300]): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const startTime = Date.now();
  const tracked = new Set<number>();
  
  const checkTime = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    
    for (const interval of intervals) {
      if (elapsed >= interval && !tracked.has(interval)) {
        tracked.add(interval);
        trackEvent({
          eventType: 'time_on_page',
          eventCategory: 'engagement',
          eventAction: 'time',
          eventLabel: `${interval}s`,
          eventValue: interval,
        });
      }
    }
  };
  
  const intervalId = setInterval(checkTime, 5000);
  
  return () => {
    clearInterval(intervalId);
  };
}

// Track outbound link clicks
export function initOutboundTracking(): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href) {
      try {
        const url = new URL(link.href);
        if (url.hostname !== window.location.hostname) {
          trackEvent({
            eventType: 'outbound_click',
            eventCategory: 'navigation',
            eventAction: 'click',
            eventLabel: url.hostname,
            metadata: { url: link.href },
          });
        }
      } catch {
        // Invalid URL, ignore
      }
    }
  };
  
  document.addEventListener('click', handleClick);
  
  return () => {
    document.removeEventListener('click', handleClick);
  };
}

// Initialize all tracking
export function initAnalytics(): () => void {
  const cleanupFns: (() => void)[] = [];
  
  // Store UTM params on page load
  if (typeof window !== 'undefined') {
    const utm = new URLSearchParams(window.location.search);
    if (utm.has('utm_source') || utm.has('utm_medium') || utm.has('utm_campaign')) {
      sessionStorage.setItem('utm_params', JSON.stringify({
        source: utm.get('utm_source'),
        medium: utm.get('utm_medium'),
        campaign: utm.get('utm_campaign'),
        term: utm.get('utm_term'),
        content: utm.get('utm_content'),
      }));
    }
  }
  
  cleanupFns.push(initScrollTracking());
  cleanupFns.push(initTimeTracking());
  cleanupFns.push(initOutboundTracking());
  
  return () => {
    cleanupFns.forEach(fn => fn());
  };
}
