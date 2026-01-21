-- =====================================================
-- Directory Database Schema Extension
-- =====================================================
-- This script adds the multi-city directory tables for
-- languages, cities, categories, and businesses.
--
-- Instructions:
-- 1. Run this AFTER the main supabase-schema.sql
-- 2. Go to your Supabase dashboard > SQL Editor
-- 3. Paste and run this script
-- =====================================================

-- =====================================================
-- 1. CREATE LANGUAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.languages (
    code VARCHAR(5) PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_native VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE CITIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_es VARCHAR(200),
    name_sr VARCHAR(200),
    name_fr VARCHAR(200),
    country_code VARCHAR(3) NOT NULL,
    region VARCHAR(200),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_es VARCHAR(200),
    name_sr VARCHAR(200),
    name_fr VARCHAR(200),
    description_en TEXT,
    description_es TEXT,
    description_sr TEXT,
    description_fr TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE BUSINESSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    slug VARCHAR(200) UNIQUE NOT NULL,
    name VARCHAR(300) NOT NULL,
    description_en TEXT,
    description_es TEXT,
    description_sr TEXT,
    description_fr TEXT,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(500),
    supported_languages VARCHAR(5)[] DEFAULT ARRAY['en']::VARCHAR(5)[],
    logo_url VARCHAR(500),
    cover_image_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_cities_slug ON public.cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_country ON public.cities(country_code);
CREATE INDEX IF NOT EXISTS idx_cities_active ON public.cities(is_active);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_businesses_city ON public.businesses(city_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_user ON public.businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON public.businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_city_category ON public.businesses(city_id, category_id);

-- =====================================================
-- 6. CREATE UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_cities_updated_at 
    BEFORE UPDATE ON public.cities 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at 
    BEFORE UPDATE ON public.businesses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE RLS POLICIES
-- =====================================================

-- Languages: Public read access
CREATE POLICY "Languages are publicly readable" ON public.languages
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage languages" ON public.languages
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Cities: Public read access for active cities
CREATE POLICY "Active cities are publicly readable" ON public.cities
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage cities" ON public.cities
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Categories: Public read access for active categories
CREATE POLICY "Active categories are publicly readable" ON public.categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage categories" ON public.categories
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- Businesses: Public read access for active businesses
CREATE POLICY "Active businesses are publicly readable" ON public.businesses
    FOR SELECT USING (is_active = true);

-- Business owners can update their own records
CREATE POLICY "Business owners can update own records" ON public.businesses
    FOR UPDATE USING (auth.uid() = user_id);

-- Business owners can insert their own records
CREATE POLICY "Users can create businesses" ON public.businesses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage businesses" ON public.businesses
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- =====================================================
-- 9. SEED DATA - LANGUAGES
-- =====================================================

INSERT INTO public.languages (code, name_en, name_native, is_active) VALUES
    ('en', 'English', 'English', true),
    ('es', 'Spanish', 'Español', true),
    ('sr', 'Serbian', 'Српски', true),
    ('fr', 'French', 'Français', true)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 10. SEED DATA - PILOT CITIES
-- =====================================================

INSERT INTO public.cities (slug, name_en, name_es, name_sr, name_fr, country_code, region, latitude, longitude, timezone) VALUES
    ('miami', 'Miami', 'Miami', 'Мајами', 'Miami', 'USA', 'Florida', 25.7617, -80.1918, 'America/New_York'),
    ('los-angeles', 'Los Angeles', 'Los Ángeles', 'Лос Анђелес', 'Los Angeles', 'USA', 'California', 34.0522, -118.2437, 'America/Los_Angeles'),
    ('new-york', 'New York', 'Nueva York', 'Њујорк', 'New York', 'USA', 'New York', 40.7128, -74.0060, 'America/New_York'),
    ('chicago', 'Chicago', 'Chicago', 'Чикаго', 'Chicago', 'USA', 'Illinois', 41.8781, -87.6298, 'America/Chicago'),
    ('houston', 'Houston', 'Houston', 'Хјустон', 'Houston', 'USA', 'Texas', 29.7604, -95.3698, 'America/Chicago'),
    ('phoenix', 'Phoenix', 'Phoenix', 'Феникс', 'Phoenix', 'USA', 'Arizona', 33.4484, -112.0740, 'America/Phoenix'),
    ('san-antonio', 'San Antonio', 'San Antonio', 'Сан Антонио', 'San Antonio', 'USA', 'Texas', 29.4241, -98.4936, 'America/Chicago'),
    ('san-diego', 'San Diego', 'San Diego', 'Сан Дијего', 'San Diego', 'USA', 'California', 32.7157, -117.1611, 'America/Los_Angeles'),
    ('dallas', 'Dallas', 'Dallas', 'Далас', 'Dallas', 'USA', 'Texas', 32.7767, -96.7970, 'America/Chicago'),
    ('austin', 'Austin', 'Austin', 'Остин', 'Austin', 'USA', 'Texas', 30.2672, -97.7431, 'America/Chicago')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 11. SEED DATA - CATEGORIES (NICHES)
-- =====================================================

INSERT INTO public.categories (slug, name_en, name_es, name_sr, name_fr, description_en, description_es, description_sr, description_fr, icon, sort_order) VALUES
    ('restaurants', 'Restaurants', 'Restaurantes', 'Ресторани', 'Restaurants', 
     'Find the best local restaurants and dining experiences', 
     'Encuentra los mejores restaurantes locales y experiencias gastronómicas',
     'Пронађите најбоље локалне ресторане и гастрономска искуства',
     'Trouvez les meilleurs restaurants locaux et expériences culinaires',
     'utensils', 1),
    ('real-estate', 'Real Estate', 'Bienes Raíces', 'Некретнине', 'Immobilier',
     'Properties for sale and rent in your area',
     'Propiedades en venta y alquiler en tu área',
     'Некретнине за продају и изнајмљивање у вашем подручју',
     'Propriétés à vendre et à louer dans votre région',
     'home', 2),
    ('legal-services', 'Legal Services', 'Servicios Legales', 'Правне услуге', 'Services Juridiques',
     'Attorneys and legal professionals',
     'Abogados y profesionales legales',
     'Адвокати и правни стручњаци',
     'Avocats et professionnels du droit',
     'scale', 3),
    ('healthcare', 'Healthcare', 'Salud', 'Здравство', 'Santé',
     'Doctors, clinics, and medical services',
     'Médicos, clínicas y servicios médicos',
     'Лекари, клинике и медицинске услуге',
     'Médecins, cliniques et services médicaux',
     'heart-pulse', 4),
    ('automotive', 'Automotive', 'Automotriz', 'Аутомобилизам', 'Automobile',
     'Car dealers, mechanics, and auto services',
     'Concesionarios, mecánicos y servicios automotrices',
     'Продавци аутомобила, механичари и ауто услуге',
     'Concessionnaires, mécaniciens et services automobiles',
     'car', 5),
    ('home-services', 'Home Services', 'Servicios del Hogar', 'Кућне услуге', 'Services à Domicile',
     'Plumbers, electricians, and home repair',
     'Plomeros, electricistas y reparaciones del hogar',
     'Водоинсталатери, електричари и кућне поправке',
     'Plombiers, électriciens et réparations à domicile',
     'wrench', 6),
    ('beauty-wellness', 'Beauty & Wellness', 'Belleza y Bienestar', 'Лепота и велнес', 'Beauté et Bien-être',
     'Salons, spas, and wellness centers',
     'Salones, spas y centros de bienestar',
     'Салони, спа центри и велнес центри',
     'Salons, spas et centres de bien-être',
     'sparkles', 7),
    ('financial-services', 'Financial Services', 'Servicios Financieros', 'Финансијске услуге', 'Services Financiers',
     'Banks, accountants, and financial advisors',
     'Bancos, contadores y asesores financieros',
     'Банке, рачуновође и финансијски саветници',
     'Banques, comptables et conseillers financiers',
     'landmark', 8),
    ('education', 'Education', 'Educación', 'Образовање', 'Éducation',
     'Schools, tutors, and educational services',
     'Escuelas, tutores y servicios educativos',
     'Школе, тутори и образовне услуге',
     'Écoles, tuteurs et services éducatifs',
     'graduation-cap', 9),
    ('technology', 'Technology', 'Tecnología', 'Технологија', 'Technologie',
     'IT services, software, and tech support',
     'Servicios de TI, software y soporte técnico',
     'ИТ услуге, софтвер и техничка подршка',
     'Services informatiques, logiciels et support technique',
     'laptop', 10)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 12. SEED DATA - SAMPLE BUSINESSES
-- =====================================================

-- Get city and category IDs for seeding
DO $$
DECLARE
    miami_id UUID;
    la_id UUID;
    ny_id UUID;
    restaurants_id UUID;
    real_estate_id UUID;
    legal_id UUID;
    healthcare_id UUID;
BEGIN
    SELECT id INTO miami_id FROM public.cities WHERE slug = 'miami';
    SELECT id INTO la_id FROM public.cities WHERE slug = 'los-angeles';
    SELECT id INTO ny_id FROM public.cities WHERE slug = 'new-york';
    SELECT id INTO restaurants_id FROM public.categories WHERE slug = 'restaurants';
    SELECT id INTO real_estate_id FROM public.categories WHERE slug = 'real-estate';
    SELECT id INTO legal_id FROM public.categories WHERE slug = 'legal-services';
    SELECT id INTO healthcare_id FROM public.categories WHERE slug = 'healthcare';

    -- Miami Restaurants
    INSERT INTO public.businesses (city_id, category_id, slug, name, description_en, description_es, description_sr, description_fr, address, phone, email, website, supported_languages)
    VALUES 
        (miami_id, restaurants_id, 'la-carreta-miami', 'La Carreta', 
         'Authentic Cuban cuisine in the heart of Miami',
         'Auténtica cocina cubana en el corazón de Miami',
         'Аутентична кубанска кухиња у срцу Мајамија',
         'Cuisine cubaine authentique au cœur de Miami',
         '3632 SW 8th St, Miami, FL 33135', '(305) 444-7501', 'info@lacarreta.com', 'https://lacarreta.com',
         ARRAY['en', 'es']::VARCHAR(5)[]),
        (miami_id, restaurants_id, 'versailles-miami', 'Versailles Restaurant',
         'The world''s most famous Cuban restaurant',
         'El restaurante cubano más famoso del mundo',
         'Најпознатији кубански ресторан на свету',
         'Le restaurant cubain le plus célèbre du monde',
         '3555 SW 8th St, Miami, FL 33135', '(305) 444-0240', 'info@versaillesrestaurant.com', 'https://versaillesrestaurant.com',
         ARRAY['en', 'es']::VARCHAR(5)[])
    ON CONFLICT (slug) DO NOTHING;

    -- Miami Real Estate
    INSERT INTO public.businesses (city_id, category_id, slug, name, description_en, description_es, description_sr, description_fr, address, phone, email, website, supported_languages)
    VALUES 
        (miami_id, real_estate_id, 'miami-luxury-homes', 'Miami Luxury Homes',
         'Premier luxury real estate in South Florida',
         'Bienes raíces de lujo premier en el sur de Florida',
         'Премијум луксузне некретнине у јужној Флориди',
         'Immobilier de luxe de premier plan dans le sud de la Floride',
         '1000 Brickell Ave, Miami, FL 33131', '(305) 555-0100', 'info@miamiluxuryhomes.com', 'https://miamiluxuryhomes.com',
         ARRAY['en', 'es', 'fr']::VARCHAR(5)[])
    ON CONFLICT (slug) DO NOTHING;

    -- LA Restaurants
    INSERT INTO public.businesses (city_id, category_id, slug, name, description_en, description_es, description_sr, description_fr, address, phone, email, website, supported_languages)
    VALUES 
        (la_id, restaurants_id, 'bestia-la', 'Bestia',
         'Italian-inspired cuisine in the Arts District',
         'Cocina de inspiración italiana en el Distrito de las Artes',
         'Кухиња инспирисана италијанском у Уметничком дистрикту',
         'Cuisine d''inspiration italienne dans le quartier des arts',
         '2121 E 7th Pl, Los Angeles, CA 90021', '(213) 514-5724', 'info@bestiala.com', 'https://bestiala.com',
         ARRAY['en']::VARCHAR(5)[])
    ON CONFLICT (slug) DO NOTHING;

    -- NY Legal Services
    INSERT INTO public.businesses (city_id, category_id, slug, name, description_en, description_es, description_sr, description_fr, address, phone, email, website, supported_languages)
    VALUES 
        (ny_id, legal_id, 'manhattan-law-group', 'Manhattan Law Group',
         'Full-service law firm serving New York',
         'Bufete de abogados de servicio completo sirviendo a Nueva York',
         'Адвокатска канцеларија са пуном услугом која опслужује Њујорк',
         'Cabinet d''avocats à service complet desservant New York',
         '350 Fifth Avenue, New York, NY 10118', '(212) 555-0200', 'contact@manhattanlawgroup.com', 'https://manhattanlawgroup.com',
         ARRAY['en', 'es']::VARCHAR(5)[])
    ON CONFLICT (slug) DO NOTHING;

    -- NY Healthcare
    INSERT INTO public.businesses (city_id, category_id, slug, name, description_en, description_es, description_sr, description_fr, address, phone, email, website, supported_languages)
    VALUES 
        (ny_id, healthcare_id, 'nyc-medical-center', 'NYC Medical Center',
         'Comprehensive healthcare services in Manhattan',
         'Servicios de salud integrales en Manhattan',
         'Свеобухватне здравствене услуге на Менхетну',
         'Services de santé complets à Manhattan',
         '123 Park Avenue, New York, NY 10017', '(212) 555-0300', 'info@nycmedicalcenter.com', 'https://nycmedicalcenter.com',
         ARRAY['en', 'es', 'fr']::VARCHAR(5)[])
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- =====================================================
-- 13. VERIFICATION QUERIES
-- =====================================================

-- Check tables created
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'languages') THEN
        RAISE NOTICE 'SUCCESS: languages table created';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cities') THEN
        RAISE NOTICE 'SUCCESS: cities table created';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
        RAISE NOTICE 'SUCCESS: categories table created';
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'businesses') THEN
        RAISE NOTICE 'SUCCESS: businesses table created';
    END IF;
END $$;

-- Summary counts
SELECT 'languages' as table_name, count(*) as row_count FROM public.languages
UNION ALL
SELECT 'cities', count(*) FROM public.cities
UNION ALL
SELECT 'categories', count(*) FROM public.categories
UNION ALL
SELECT 'businesses', count(*) FROM public.businesses;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
