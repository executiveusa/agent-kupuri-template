-- =====================================================
-- Lead Generation & A/B Testing Schema
-- =====================================================
-- This script adds tables for lead capture, A/B testing,
-- analytics tracking, and monetization features.
-- =====================================================

-- =====================================================
-- 1. LEADS TABLE - Core lead capture
-- =====================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    
    -- Contact Information
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(200),
    
    -- Lead Details
    message TEXT,
    lead_type VARCHAR(50) DEFAULT 'contact', -- contact, quote, callback, claim
    source VARCHAR(100), -- search, direct, referral, ad
    source_url TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(200),
    utm_content VARCHAR(200),
    
    -- A/B Test Attribution
    ab_test_id UUID,
    ab_variant VARCHAR(50),
    
    -- Lead Scoring
    score INTEGER DEFAULT 0,
    quality VARCHAR(20) DEFAULT 'unqualified', -- unqualified, qualified, hot, converted
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, converted, lost
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    language VARCHAR(5) DEFAULT 'en',
    device_type VARCHAR(20), -- desktop, mobile, tablet
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    contacted_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ
);

-- =====================================================
-- 2. LEAD ACTIVITIES - Track all interactions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    activity_type VARCHAR(50) NOT NULL, -- created, viewed, contacted, note_added, status_changed, converted
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. A/B TESTS TABLE - Test configuration
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Test Configuration
    test_type VARCHAR(50) NOT NULL, -- cta, layout, headline, form, pricing
    target_page VARCHAR(100), -- directory, city, category, business
    
    -- Variants stored as JSONB array
    variants JSONB NOT NULL DEFAULT '[]',
    -- Example: [{"id": "control", "name": "Original", "weight": 50}, {"id": "variant_a", "name": "New CTA", "weight": 50}]
    
    -- Traffic Allocation
    traffic_percentage INTEGER DEFAULT 100, -- % of traffic included in test
    
    -- Goals & Metrics
    primary_goal VARCHAR(50) DEFAULT 'conversion', -- conversion, click, engagement, revenue
    secondary_goals VARCHAR(50)[] DEFAULT ARRAY[]::VARCHAR(50)[],
    
    -- Statistical Settings
    confidence_level DECIMAL(5,2) DEFAULT 95.00,
    minimum_sample_size INTEGER DEFAULT 100,
    
    -- Auto-optimization
    auto_optimize BOOLEAN DEFAULT false,
    optimization_threshold DECIMAL(5,2) DEFAULT 95.00, -- confidence needed to auto-select winner
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, running, paused, completed, archived
    winner_variant VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- =====================================================
-- 4. A/B TEST RESULTS - Track variant performance
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
    variant_id VARCHAR(50) NOT NULL,
    
    -- Metrics
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    
    -- Calculated Rates (updated by trigger/function)
    click_rate DECIMAL(8,4) DEFAULT 0,
    conversion_rate DECIMAL(8,4) DEFAULT 0,
    revenue_per_visitor DECIMAL(12,4) DEFAULT 0,
    
    -- Statistical Data
    confidence DECIMAL(5,2) DEFAULT 0,
    lift DECIMAL(8,4) DEFAULT 0, -- % improvement over control
    
    -- Time-based tracking
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(test_id, variant_id, date)
);

-- =====================================================
-- 5. EVENT TRACKING - All user interactions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Details
    event_type VARCHAR(100) NOT NULL, -- page_view, search, click, form_submit, call_click, etc.
    event_category VARCHAR(100), -- directory, business, lead, search
    event_action VARCHAR(100),
    event_label VARCHAR(200),
    event_value DECIMAL(12,2),
    
    -- Context
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    
    -- A/B Test Context
    ab_test_id UUID REFERENCES public.ab_tests(id) ON DELETE SET NULL,
    ab_variant VARCHAR(50),
    
    -- Session & User
    session_id VARCHAR(100),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    visitor_id VARCHAR(100), -- anonymous visitor tracking
    
    -- Attribution
    source VARCHAR(100),
    medium VARCHAR(100),
    campaign VARCHAR(100),
    referrer TEXT,
    
    -- Device & Location
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(3),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- Page Context
    page_url TEXT,
    page_path VARCHAR(500),
    search_query VARCHAR(500),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    language VARCHAR(5) DEFAULT 'en',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. SEARCH QUERIES - Track search behavior
-- =====================================================

CREATE TABLE IF NOT EXISTS public.search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    query VARCHAR(500) NOT NULL,
    normalized_query VARCHAR(500), -- lowercase, trimmed
    
    -- Filters Applied
    city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    language VARCHAR(5) DEFAULT 'en',
    filters JSONB DEFAULT '{}',
    
    -- Results
    results_count INTEGER DEFAULT 0,
    clicked_results UUID[] DEFAULT ARRAY[]::UUID[], -- business IDs clicked
    
    -- Conversion
    converted BOOLEAN DEFAULT false,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    
    -- Session
    session_id VARCHAR(100),
    visitor_id VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. PREMIUM LISTINGS - Monetization
-- =====================================================

CREATE TABLE IF NOT EXISTS public.premium_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    
    -- Premium Features
    listing_type VARCHAR(50) NOT NULL, -- featured, spotlight, premium, basic
    
    -- Placement
    featured_in_city BOOLEAN DEFAULT false,
    featured_in_category BOOLEAN DEFAULT false,
    featured_in_search BOOLEAN DEFAULT false,
    priority_rank INTEGER DEFAULT 0, -- higher = more prominent
    
    -- Pricing
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    
    -- Subscription
    stripe_subscription_id VARCHAR(100),
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, paused, cancelled, expired
    
    -- Dates
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. INDEXES FOR PERFORMANCE
-- =====================================================

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_business ON public.leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_city ON public.leads(city_id);
CREATE INDEX IF NOT EXISTS idx_leads_category ON public.leads(category_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_quality ON public.leads(quality);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_ab_test ON public.leads(ab_test_id, ab_variant);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_business ON public.events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON public.events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_visitor ON public.events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_events_ab_test ON public.events(ab_test_id, ab_variant);

-- A/B Test indexes
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON public.ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test ON public.ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_date ON public.ab_test_results(date DESC);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_search_queries_query ON public.search_queries(normalized_query);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON public.search_queries(created_at DESC);

-- Premium listings indexes
CREATE INDEX IF NOT EXISTS idx_premium_business ON public.premium_listings(business_id);
CREATE INDEX IF NOT EXISTS idx_premium_status ON public.premium_listings(status);
CREATE INDEX IF NOT EXISTS idx_premium_type ON public.premium_listings(listing_type);

-- Full-text search on businesses
CREATE INDEX IF NOT EXISTS idx_businesses_search ON public.businesses 
    USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description_en, '')));

-- =====================================================
-- 9. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON public.leads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at 
    BEFORE UPDATE ON public.ab_tests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_test_results_updated_at 
    BEFORE UPDATE ON public.ab_test_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_premium_listings_updated_at 
    BEFORE UPDATE ON public.premium_listings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_listings ENABLE ROW LEVEL SECURITY;

-- Leads: Business owners can see their leads
CREATE POLICY "Business owners can view their leads" ON public.leads
    FOR SELECT USING (
        business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    );

CREATE POLICY "Service role can manage leads" ON public.leads
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Anyone can insert leads (public forms)
CREATE POLICY "Anyone can create leads" ON public.leads
    FOR INSERT WITH CHECK (true);

-- Lead activities: Business owners can view
CREATE POLICY "Business owners can view lead activities" ON public.lead_activities
    FOR SELECT USING (
        lead_id IN (
            SELECT l.id FROM public.leads l 
            JOIN public.businesses b ON l.business_id = b.id 
            WHERE b.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage lead activities" ON public.lead_activities
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- A/B Tests: Admins only (via service role)
CREATE POLICY "Service role can manage ab tests" ON public.ab_tests
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

CREATE POLICY "Anyone can read active ab tests" ON public.ab_tests
    FOR SELECT USING (status = 'running');

-- A/B Test Results: Service role only
CREATE POLICY "Service role can manage ab test results" ON public.ab_test_results
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Events: Insert only for tracking, service role for reading
CREATE POLICY "Anyone can create events" ON public.events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage events" ON public.events
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Search queries: Insert only, service role for analytics
CREATE POLICY "Anyone can create search queries" ON public.search_queries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage search queries" ON public.search_queries
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Premium listings: Business owners can view their own
CREATE POLICY "Business owners can view their premium listings" ON public.premium_listings
    FOR SELECT USING (
        business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid())
    );

CREATE POLICY "Service role can manage premium listings" ON public.premium_listings
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(lead_row public.leads)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Base score
    score := 10;
    
    -- Has email (+20)
    IF lead_row.email IS NOT NULL THEN
        score := score + 20;
    END IF;
    
    -- Has phone (+30)
    IF lead_row.phone IS NOT NULL THEN
        score := score + 30;
    END IF;
    
    -- Has company (+15)
    IF lead_row.company IS NOT NULL THEN
        score := score + 15;
    END IF;
    
    -- Has message (+10)
    IF lead_row.message IS NOT NULL AND length(lead_row.message) > 50 THEN
        score := score + 10;
    END IF;
    
    -- Quote request (+25)
    IF lead_row.lead_type = 'quote' THEN
        score := score + 25;
    END IF;
    
    -- Callback request (+20)
    IF lead_row.lead_type = 'callback' THEN
        score := score + 20;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate lead score
CREATE OR REPLACE FUNCTION auto_score_lead()
RETURNS TRIGGER AS $$
BEGIN
    NEW.score := calculate_lead_score(NEW);
    
    -- Auto-qualify based on score
    IF NEW.score >= 70 THEN
        NEW.quality := 'hot';
    ELSIF NEW.score >= 50 THEN
        NEW.quality := 'qualified';
    ELSE
        NEW.quality := 'unqualified';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_score_lead_trigger
    BEFORE INSERT OR UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION auto_score_lead();

-- Function to update A/B test results rates
CREATE OR REPLACE FUNCTION update_ab_test_rates()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.impressions > 0 THEN
        NEW.click_rate := NEW.clicks::DECIMAL / NEW.impressions;
        NEW.conversion_rate := NEW.conversions::DECIMAL / NEW.impressions;
        NEW.revenue_per_visitor := NEW.revenue / NEW.impressions;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ab_test_rates_trigger
    BEFORE INSERT OR UPDATE ON public.ab_test_results
    FOR EACH ROW
    EXECUTE FUNCTION update_ab_test_rates();

-- =====================================================
-- 12. SAMPLE A/B TESTS
-- =====================================================

INSERT INTO public.ab_tests (name, description, test_type, target_page, variants, status) VALUES
    ('CTA Button Color Test', 'Testing blue vs green CTA buttons on business cards', 'cta', 'category',
     '[{"id": "control", "name": "Blue Button", "weight": 50, "config": {"color": "blue"}}, {"id": "variant_a", "name": "Green Button", "weight": 50, "config": {"color": "green"}}]',
     'running'),
    ('Contact Form Layout', 'Testing single column vs two column form layout', 'form', 'business',
     '[{"id": "control", "name": "Single Column", "weight": 50, "config": {"layout": "single"}}, {"id": "variant_a", "name": "Two Column", "weight": 50, "config": {"layout": "two-column"}}]',
     'running'),
    ('Headline Copy Test', 'Testing different value propositions in directory header', 'headline', 'directory',
     '[{"id": "control", "name": "Find Local Businesses", "weight": 33, "config": {"headline": "Find Local Businesses"}}, {"id": "variant_a", "name": "Connect with Experts", "weight": 33, "config": {"headline": "Connect with Local Experts"}}, {"id": "variant_b", "name": "Get Free Quotes", "weight": 34, "config": {"headline": "Get Free Quotes Today"}}]',
     'running')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

SELECT 'Lead generation and A/B testing schema created successfully!' as status;
