import { NextRequest, NextResponse } from 'next/server';
import {
  generateBusinessDescription,
  generateSEOContent,
  generateOutreachEmail,
  translateContent,
  qualifyLead,
} from '@/lib/ai/openrouter';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'business-description': {
        const { businessName, category, city, existingInfo } = body;
        if (!businessName || !category || !city) {
          return NextResponse.json(
            { error: 'Missing required fields: businessName, category, city' },
            { status: 400 }
          );
        }
        const descriptions = await generateBusinessDescription(
          businessName,
          category,
          city,
          existingInfo
        );
        return NextResponse.json({ descriptions });
      }

      case 'seo-content': {
        const { city, category, language } = body;
        if (!city || !category) {
          return NextResponse.json(
            { error: 'Missing required fields: city, category' },
            { status: 400 }
          );
        }
        const content = await generateSEOContent(city, category, language || 'en');
        return NextResponse.json({ content });
      }

      case 'outreach-email': {
        const { businessName, ownerName, category, city } = body;
        if (!businessName || !ownerName || !category || !city) {
          return NextResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        }
        const email = await generateOutreachEmail(businessName, ownerName, category, city);
        return NextResponse.json({ email });
      }

      case 'translate': {
        const { content, targetLanguage } = body;
        if (!content || !targetLanguage) {
          return NextResponse.json(
            { error: 'Missing required fields: content, targetLanguage' },
            { status: 400 }
          );
        }
        const translation = await translateContent(content, targetLanguage);
        return NextResponse.json({ translation });
      }

      case 'qualify-lead': {
        const { lead } = body;
        if (!lead || !lead.name) {
          return NextResponse.json(
            { error: 'Missing required field: lead' },
            { status: 400 }
          );
        }
        const qualification = await qualifyLead(lead);
        return NextResponse.json({ qualification });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: 'AI generation failed' },
      { status: 500 }
    );
  }
}
