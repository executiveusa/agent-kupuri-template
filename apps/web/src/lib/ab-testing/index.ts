// Types
export interface ABVariant {
  id: string;
  name: string;
  weight: number;
  config: Record<string, unknown>;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  test_type: string;
  target_page: string;
  variants: ABVariant[];
  traffic_percentage: number;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  winner_variant?: string;
  auto_optimize: boolean;
}

export interface ABAssignment {
  testId: string;
  variantId: string;
  variant: ABVariant;
}

// Cookie/Storage key prefix
const AB_STORAGE_PREFIX = 'ab_';

// Get visitor ID (creates one if doesn't exist)
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
}

// Get session ID
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

// Deterministic variant assignment based on visitor ID
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Select variant based on weights
function selectVariant(variants: ABVariant[], visitorId: string, testId: string): ABVariant {
  const hash = hashString(`${visitorId}_${testId}`);
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let target = hash % totalWeight;
  
  for (const variant of variants) {
    target -= variant.weight;
    if (target < 0) {
      return variant;
    }
  }
  
  return variants[0]; // Fallback to first variant
}

// Check if visitor is in test traffic
function isInTestTraffic(trafficPercentage: number, visitorId: string, testId: string): boolean {
  const hash = hashString(`traffic_${visitorId}_${testId}`);
  return (hash % 100) < trafficPercentage;
}

// Get stored assignment
function getStoredAssignment(testId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${AB_STORAGE_PREFIX}${testId}`);
}

// Store assignment
function storeAssignment(testId: string, variantId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${AB_STORAGE_PREFIX}${testId}`, variantId);
}

// Main function to get variant assignment
export function getVariantAssignment(test: ABTest): ABAssignment | null {
  if (test.status !== 'running') {
    // If test has a winner, return that
    if (test.winner_variant) {
      const winnerVariant = test.variants.find(v => v.id === test.winner_variant);
      if (winnerVariant) {
        return {
          testId: test.id,
          variantId: winnerVariant.id,
          variant: winnerVariant,
        };
      }
    }
    return null;
  }

  const visitorId = getVisitorId();
  if (!visitorId) return null;

  // Check if visitor is in test traffic
  if (!isInTestTraffic(test.traffic_percentage, visitorId, test.id)) {
    return null;
  }

  // Check for existing assignment
  const storedVariantId = getStoredAssignment(test.id);
  if (storedVariantId) {
    const storedVariant = test.variants.find(v => v.id === storedVariantId);
    if (storedVariant) {
      return {
        testId: test.id,
        variantId: storedVariantId,
        variant: storedVariant,
      };
    }
  }

  // Assign new variant
  const variant = selectVariant(test.variants, visitorId, test.id);
  storeAssignment(test.id, variant.id);

  return {
    testId: test.id,
    variantId: variant.id,
    variant,
  };
}

// Track impression
export async function trackImpression(testId: string, variantId: string): Promise<void> {
  try {
    await fetch('/api/ab-tests/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId,
        variantId,
        eventType: 'impression',
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
      }),
    });
  } catch (error) {
    console.error('Error tracking impression:', error);
  }
}

// Track click
export async function trackClick(testId: string, variantId: string, elementId?: string): Promise<void> {
  try {
    await fetch('/api/ab-tests/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId,
        variantId,
        eventType: 'click',
        elementId,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
      }),
    });
  } catch (error) {
    console.error('Error tracking click:', error);
  }
}

// Track conversion
export async function trackConversion(
  testId: string,
  variantId: string,
  conversionType: string,
  value?: number
): Promise<void> {
  try {
    await fetch('/api/ab-tests/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId,
        variantId,
        eventType: 'conversion',
        conversionType,
        value,
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
      }),
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
  }
}

// Statistical significance calculator
export function calculateSignificance(
  controlConversions: number,
  controlSamples: number,
  variantConversions: number,
  variantSamples: number
): { confidence: number; lift: number; isSignificant: boolean } {
  if (controlSamples === 0 || variantSamples === 0) {
    return { confidence: 0, lift: 0, isSignificant: false };
  }

  const controlRate = controlConversions / controlSamples;
  const variantRate = variantConversions / variantSamples;
  
  // Calculate lift
  const lift = controlRate > 0 ? ((variantRate - controlRate) / controlRate) * 100 : 0;
  
  // Z-score calculation for two proportions
  const pooledRate = (controlConversions + variantConversions) / (controlSamples + variantSamples);
  const standardError = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / controlSamples + 1 / variantSamples)
  );
  
  const zScore = standardError > 0 ? (variantRate - controlRate) / standardError : 0;
  
  // Convert z-score to confidence (approximate)
  const confidence = Math.min(99.9, Math.abs(zScore) * 30); // Simplified approximation
  
  return {
    confidence,
    lift,
    isSignificant: confidence >= 95,
  };
}
