const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

// Available models on OpenRouter
export const MODELS = {
  // Fast & cheap
  LLAMA_3_8B: 'meta-llama/llama-3-8b-instruct',
  MISTRAL_7B: 'mistralai/mistral-7b-instruct',
  
  // Balanced
  LLAMA_3_70B: 'meta-llama/llama-3-70b-instruct',
  MIXTRAL_8X7B: 'mistralai/mixtral-8x7b-instruct',
  
  // High quality
  GPT_4O_MINI: 'openai/gpt-4o-mini',
  GPT_4O: 'openai/gpt-4o',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',
  CLAUDE_3_SONNET: 'anthropic/claude-3.5-sonnet',
  
  // Default for most tasks
  DEFAULT: 'meta-llama/llama-3-70b-instruct',
} as const;

export async function chat(
  messages: ChatMessage[],
  options: GenerationOptions = {}
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      'X-Title': 'Business Directory AI',
    },
    body: JSON.stringify({
      model: options.model || MODELS.DEFAULT,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
      top_p: options.topP ?? 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenRouter error:', error);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Generate business description
export async function generateBusinessDescription(
  businessName: string,
  category: string,
  city: string,
  existingInfo?: string
): Promise<{ en: string; es: string; sr: string; fr: string }> {
  const prompt = `Generate a compelling business description for "${businessName}", a ${category} business located in ${city}.
${existingInfo ? `Additional info: ${existingInfo}` : ''}

Requirements:
- Professional and engaging tone
- Highlight unique value propositions
- Include a call to action
- 2-3 sentences, around 50-80 words

Respond in JSON format with translations:
{
  "en": "English description",
  "es": "Spanish description", 
  "sr": "Serbian description (use Cyrillic script)",
  "fr": "French description"
}`;

  const response = await chat([
    { role: 'system', content: 'You are a professional copywriter specializing in local business marketing. Always respond with valid JSON.' },
    { role: 'user', content: prompt },
  ], { model: MODELS.GPT_4O_MINI, temperature: 0.8 });

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Error parsing description:', error);
    return {
      en: `${businessName} is a trusted ${category} provider in ${city}. Contact us today for exceptional service.`,
      es: `${businessName} es un proveedor confiable de ${category} en ${city}. Contáctenos hoy para un servicio excepcional.`,
      sr: `${businessName} је поуздан пружалац услуга ${category} у граду ${city}. Контактирајте нас данас.`,
      fr: `${businessName} est un fournisseur de confiance de ${category} à ${city}. Contactez-nous aujourd'hui.`,
    };
  }
}

// Qualify and score a lead
export async function qualifyLead(lead: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  leadType: string;
}): Promise<{
  score: number;
  quality: 'hot' | 'qualified' | 'unqualified';
  insights: string[];
  suggestedResponse: string;
}> {
  const prompt = `Analyze this lead and provide qualification insights:

Name: ${lead.name}
Email: ${lead.email || 'Not provided'}
Phone: ${lead.phone || 'Not provided'}
Company: ${lead.company || 'Not provided'}
Message: ${lead.message || 'Not provided'}
Lead Type: ${lead.leadType}

Provide a JSON response with:
{
  "score": <0-100 score>,
  "quality": "<hot|qualified|unqualified>",
  "insights": ["insight 1", "insight 2"],
  "suggestedResponse": "A personalized response template"
}

Scoring criteria:
- Has both email and phone: +30
- Has company name: +15
- Detailed message (>50 chars): +20
- Quote/callback request: +25
- Professional email domain: +10`;

  const response = await chat([
    { role: 'system', content: 'You are a lead qualification expert. Analyze leads and provide actionable insights. Always respond with valid JSON.' },
    { role: 'user', content: prompt },
  ], { model: MODELS.LLAMA_3_70B, temperature: 0.3 });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found');
  } catch {
    // Fallback scoring
    let score = 10;
    if (lead.email) score += 20;
    if (lead.phone) score += 30;
    if (lead.company) score += 15;
    if (lead.message && lead.message.length > 50) score += 20;
    if (lead.leadType === 'quote') score += 25;

    return {
      score,
      quality: score >= 70 ? 'hot' : score >= 50 ? 'qualified' : 'unqualified',
      insights: ['Lead received', 'Follow up recommended'],
      suggestedResponse: `Thank you for your interest, ${lead.name}! We'll be in touch shortly.`,
    };
  }
}

// Generate SEO content for category/city pages
export async function generateSEOContent(
  city: string,
  category: string,
  language: 'en' | 'es' | 'sr' | 'fr' = 'en'
): Promise<{
  title: string;
  metaDescription: string;
  h1: string;
  introText: string;
  faqQuestions: { question: string; answer: string }[];
}> {
  const languageNames = { en: 'English', es: 'Spanish', sr: 'Serbian', fr: 'French' };
  
  const prompt = `Generate SEO-optimized content for a ${category} directory page in ${city}.
Language: ${languageNames[language]}

Provide JSON with:
{
  "title": "SEO title (50-60 chars)",
  "metaDescription": "Meta description (150-160 chars)",
  "h1": "Main heading",
  "introText": "2-3 paragraph intro about finding ${category} in ${city}",
  "faqQuestions": [
    {"question": "FAQ 1", "answer": "Answer 1"},
    {"question": "FAQ 2", "answer": "Answer 2"},
    {"question": "FAQ 3", "answer": "Answer 3"}
  ]
}`;

  const response = await chat([
    { role: 'system', content: `You are an SEO expert. Generate content in ${languageNames[language]}. Always respond with valid JSON.` },
    { role: 'user', content: prompt },
  ], { model: MODELS.GPT_4O_MINI, temperature: 0.7 });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found');
  } catch {
    return {
      title: `Best ${category} in ${city} | Local Directory`,
      metaDescription: `Find top-rated ${category} businesses in ${city}. Read reviews, compare services, and get quotes from local professionals.`,
      h1: `${category} in ${city}`,
      introText: `Looking for ${category} services in ${city}? Our directory connects you with trusted local businesses.`,
      faqQuestions: [
        { question: `How do I find ${category} in ${city}?`, answer: 'Browse our directory to find verified local businesses.' },
      ],
    };
  }
}

// Generate personalized outreach email
export async function generateOutreachEmail(
  businessName: string,
  ownerName: string,
  category: string,
  city: string
): Promise<string> {
  const prompt = `Write a personalized outreach email to invite ${businessName} (owned by ${ownerName}) to list their ${category} business in our ${city} directory.

Requirements:
- Professional but friendly tone
- Highlight benefits (free exposure, leads, credibility)
- Include a clear call to action
- Keep it concise (150-200 words)
- Don't be pushy`;

  return chat([
    { role: 'system', content: 'You are a business development specialist writing outreach emails.' },
    { role: 'user', content: prompt },
  ], { model: MODELS.LLAMA_3_70B, temperature: 0.8 });
}

// Chat with potential customer (for chatbot)
export async function chatWithVisitor(
  messages: ChatMessage[],
  context: {
    city?: string;
    category?: string;
    businessName?: string;
  }
): Promise<string> {
  const systemPrompt = `You are a helpful assistant for a local business directory.
${context.city ? `Current city: ${context.city}` : ''}
${context.category ? `Current category: ${context.category}` : ''}
${context.businessName ? `Current business: ${context.businessName}` : ''}

Help visitors:
- Find businesses that match their needs
- Answer questions about services
- Encourage them to contact businesses or request quotes
- Be friendly, helpful, and concise

If they're ready to contact a business, encourage them to fill out the contact form.`;

  return chat([
    { role: 'system', content: systemPrompt },
    ...messages,
  ], { model: MODELS.LLAMA_3_8B, temperature: 0.7, maxTokens: 300 });
}

// Translate content
export async function translateContent(
  content: string,
  targetLanguage: 'en' | 'es' | 'sr' | 'fr'
): Promise<string> {
  const languageNames = { en: 'English', es: 'Spanish', sr: 'Serbian (Cyrillic)', fr: 'French' };
  
  const prompt = `Translate the following text to ${languageNames[targetLanguage]}. 
Maintain the same tone and formatting. Only output the translation, nothing else.

Text to translate:
${content}`;

  return chat([
    { role: 'system', content: 'You are a professional translator. Provide accurate, natural-sounding translations.' },
    { role: 'user', content: prompt },
  ], { model: MODELS.GPT_4O_MINI, temperature: 0.3 });
}

// Analyze A/B test results and recommend winner
export async function analyzeABTest(testData: {
  testName: string;
  variants: {
    name: string;
    impressions: number;
    conversions: number;
    revenue: number;
  }[];
}): Promise<{
  recommendation: string;
  confidence: string;
  insights: string[];
  nextSteps: string[];
}> {
  const prompt = `Analyze this A/B test and provide recommendations:

Test: ${testData.testName}

Variants:
${testData.variants.map(v => `- ${v.name}: ${v.impressions} impressions, ${v.conversions} conversions (${((v.conversions/v.impressions)*100).toFixed(2)}%), $${v.revenue} revenue`).join('\n')}

Provide JSON with:
{
  "recommendation": "Which variant to choose and why",
  "confidence": "high|medium|low",
  "insights": ["insight 1", "insight 2"],
  "nextSteps": ["next step 1", "next step 2"]
}`;

  const response = await chat([
    { role: 'system', content: 'You are a conversion rate optimization expert. Analyze A/B tests and provide data-driven recommendations. Always respond with valid JSON.' },
    { role: 'user', content: prompt },
  ], { model: MODELS.LLAMA_3_70B, temperature: 0.3 });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found');
  } catch {
    return {
      recommendation: 'Need more data to make a recommendation',
      confidence: 'low',
      insights: ['Insufficient data for statistical significance'],
      nextSteps: ['Continue running the test', 'Increase traffic to variants'],
    };
  }
}
