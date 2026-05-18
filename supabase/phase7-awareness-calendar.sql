-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 7 Migration
-- Intelligent Calendar & Awareness System
-- Tracks Kenyan national days, international observance days,
-- NGO/environmental days, community days, and foundation events.
-- Run in Supabase SQL Editor. Safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. AWARENESS DAYS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.awareness_days (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  description    TEXT,
  -- Annual recurring: use month + day
  month          INT CHECK (month BETWEEN 1 AND 12),
  day            INT CHECK (day BETWEEN 1 AND 31),
  -- One-off: use specific_date (overrides month/day)
  specific_date  DATE,
  category       TEXT NOT NULL DEFAULT 'international'
                   CHECK (category IN (
                     'kenyan_national', 'international',
                     'ngo_environmental', 'community_volunteer',
                     'education_youth', 'foundation'
                   )),
  priority       TEXT NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('high', 'medium', 'low')),
  icon_emoji     TEXT DEFAULT '📅',
  theme_color    TEXT DEFAULT '#1E3A8A',
  banner_message TEXT,
  link_url       TEXT,
  link_label     TEXT,
  program_slugs  TEXT[],
  tags           TEXT[],
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_awareness_days_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS awareness_days_updated_at ON public.awareness_days;
CREATE TRIGGER awareness_days_updated_at
  BEFORE UPDATE ON public.awareness_days
  FOR EACH ROW EXECUTE PROCEDURE public.update_awareness_days_updated_at();

ALTER TABLE public.awareness_days ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'awareness_days' AND policyname = 'awareness_days: public read active') THEN
    CREATE POLICY "awareness_days: public read active"
      ON public.awareness_days FOR SELECT USING (is_active = TRUE);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'awareness_days' AND policyname = 'awareness_days: admin manage') THEN
    CREATE POLICY "awareness_days: admin manage"
      ON public.awareness_days FOR ALL
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS awareness_days_month_day_idx ON public.awareness_days (month, day);
CREATE INDEX IF NOT EXISTS awareness_days_specific_idx  ON public.awareness_days (specific_date) WHERE specific_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS awareness_days_category_idx  ON public.awareness_days (category, priority);


-- ============================================================
-- 2. SEED DATA — Comprehensive Awareness Calendar
-- ============================================================
INSERT INTO public.awareness_days
  (name, description, month, day, category, priority, icon_emoji, theme_color, banner_message, link_url, link_label)
VALUES

-- ── KENYAN NATIONAL DAYS ────────────────────────────────────
(
  'New Year''s Day',
  'A fresh start for Kenya and our communities.',
  1, 1, 'kenyan_national', 'high', '🎊', '#3E6A27',
  'Happy New Year! We step into another year of service, impact, and community.',
  '/donate', 'Support Our Work'
),
(
  'International Women''s Day',
  'Celebrating women''s achievements and advancing gender equality.',
  3, 8, 'kenyan_national', 'high', '🌸', '#db2777',
  'Happy International Women''s Day! Women are the backbone of our communities.',
  '/programs', 'Women Empowerment'
),
(
  'Labour Day',
  'Celebrating the dignity of work and the rights of every worker in Kenya.',
  5, 1, 'kenyan_national', 'high', '⚒️', '#3E6A27',
  'Happy Labour Day! We honour every worker building a better Kenya.',
  '/programs', 'Our Programs'
),
(
  'Madaraka Day',
  'Kenya''s Internal Self-Governance Day — marking our freedom journey since 1963.',
  6, 1, 'kenyan_national', 'high', '🇰🇪', '#3E6A27',
  'Happy Madaraka Day! Today we celebrate Kenya''s self-governance and the freedom of our people.',
  '/about', 'Our Story'
),
(
  'Huduma Day',
  'Celebrating public service and community dedication across Kenya.',
  10, 10, 'kenyan_national', 'high', '🏛️', '#3E6A27',
  'Happy Huduma Day! We celebrate those who serve our communities with dedication and honour.',
  '/programs', 'Our Programs'
),
(
  'Mashujaa Day',
  'Heroes Day — honouring every Kenyan who fought for independence and continues to serve.',
  10, 20, 'kenyan_national', 'high', '🦁', '#3E6A27',
  'Happy Mashujaa Day! We honour Kenya''s heroes — including every volunteer in our family.',
  '/auth/signup', 'Join the Movement'
),
(
  'Jamhuri Day',
  'Kenya''s Independence Day — celebrating over 60 years of nationhood.',
  12, 12, 'kenyan_national', 'high', '🇰🇪', '#3E6A27',
  'Happy Jamhuri Day! Together, let us build the Kenya every citizen deserves.',
  '/about', 'Our Vision'
),
(
  'Christmas Day',
  'A season of love, generosity, and community spirit.',
  12, 25, 'kenyan_national', 'high', '🎄', '#3E6A27',
  'Happy Christmas! The spirit of giving is at the heart of everything we do.',
  '/donate', 'Give a Gift'
),
(
  'Boxing Day',
  'A day of generosity — giving back to those in need.',
  12, 26, 'kenyan_national', 'medium', '🎁', '#3E6A27',
  'Happy Boxing Day! A perfect moment to think about giving back to your community.',
  '/donate', 'Donate Today'
),

-- ── INTERNATIONAL DAYS ──────────────────────────────────────
(
  'International Education Day',
  'Celebrating the role of education for peace and development globally.',
  1, 24, 'education_youth', 'medium', '🎓', '#7c3aed',
  'On International Education Day — quality education is the greatest gift we can give.',
  '/programs', 'Education Programs'
),
(
  'World Cancer Day',
  'Uniting the world to end cancer through awareness and action.',
  2, 4, 'international', 'high', '🎗️', '#2D5CC8',
  'On World Cancer Day — health is a right for every Kenyan, not a privilege.',
  '/programs', 'Health Programs'
),
(
  'World Day of Social Justice',
  'Promoting social justice, fair treatment, and dignity for all peoples.',
  2, 20, 'international', 'medium', '⚖️', '#2D5CC8',
  'On World Day of Social Justice — we are committed to equality for every Kenyan.',
  '/about', 'Our Mission'
),
(
  'World Wildlife Day',
  'Celebrating Kenya''s wild animals and plants and their vital role in our ecosystem.',
  3, 3, 'ngo_environmental', 'medium', '🦁', '#559135',
  'On World Wildlife Day — Kenya''s wildlife is our heritage. Let us protect it together.',
  '/programs', 'Environmental Programs'
),
(
  'World Forest Day',
  'Raising awareness of the importance of forests for communities and climate.',
  3, 21, 'ngo_environmental', 'medium', '🌳', '#559135',
  'On World Forest Day — plant a tree, grow a future for Kenya.',
  '/programs', 'Environmental Programs'
),
(
  'World Water Day',
  'Focusing attention on the importance of freshwater for life and community.',
  3, 22, 'ngo_environmental', 'high', '💧', '#3A87B3',
  'On World Water Day — clean water is a right, not a privilege. Let us protect it.',
  '/programs', 'Environmental Programs'
),
(
  'World Autism Awareness Day',
  'Promoting inclusion and understanding for people with autism.',
  4, 2, 'education_youth', 'medium', '💙', '#2D5CC8',
  'On World Autism Awareness Day — inclusion, understanding, and acceptance for all.',
  '/programs', 'Community Programs'
),
(
  'World Health Day',
  'Raising awareness about global health challenges and the right to healthcare.',
  4, 7, 'international', 'high', '🏥', '#2D5CC8',
  'On World Health Day — everyone deserves quality healthcare. That is what we fight for.',
  '/programs', 'Health Programs'
),
(
  'Earth Day',
  'The world''s largest annual event demonstrating support for environmental protection.',
  4, 22, 'ngo_environmental', 'high', '🌍', '#559135',
  'Happy Earth Day! Our planet needs our care. Join us in protecting Kenya''s environment.',
  '/programs', 'Environmental Programs'
),
(
  'World Book Day',
  'Promoting reading, publishing, and the joy of books globally.',
  4, 23, 'education_youth', 'medium', '📚', '#7c3aed',
  'Happy World Book Day! Literacy opens doors — support education in our communities.',
  '/programs', 'Education Programs'
),
(
  'Africa Day',
  'Celebrating Africa''s unity, rich culture, and extraordinary progress.',
  5, 25, 'international', 'high', '🌍', '#dc2626',
  'Happy Africa Day! We are proud of our continent and its incredible people.',
  '/about', 'About Us'
),
(
  'World Environment Day',
  'The United Nations'' principal vehicle for encouraging awareness and action for the environment.',
  6, 5, 'ngo_environmental', 'high', '🌿', '#559135',
  'Happy World Environment Day! Every action counts for Kenya''s natural heritage.',
  '/programs', 'Environmental Programs'
),
(
  'World Oceans Day',
  'Celebrating our world''s oceans and protecting marine life for future generations.',
  6, 8, 'ngo_environmental', 'medium', '🌊', '#3A87B3',
  'On World Oceans Day — Kenya''s coast and lakes are treasures worth protecting.',
  '/programs', 'Environmental Programs'
),
(
  'World Day Against Child Labour',
  'Highlighting the plight of child labourers and pushing for their education.',
  6, 12, 'education_youth', 'high', '🧒', '#7c3aed',
  'On World Day Against Child Labour — every child deserves education, not exploitation.',
  '/programs', 'Youth Programs'
),
(
  'International Day of the African Child',
  'Marking the 1976 Soweto uprising and championing children''s rights across Africa.',
  6, 16, 'education_youth', 'high', '👧🏾', '#7c3aed',
  'On the International Day of the African Child — every child''s right to learn must be upheld.',
  '/programs', 'Education Programs'
),
(
  'World Day to Combat Desertification',
  'Raising awareness of international efforts to combat land degradation.',
  6, 17, 'ngo_environmental', 'medium', '🏜️', '#D97706',
  'On this day, we fight land degradation to sustain Kenyan communities for generations.',
  '/programs', 'Environmental Programs'
),
(
  'World Refugee Day',
  'Honouring the strength, courage, and perseverance of refugees worldwide.',
  6, 20, 'international', 'high', '🕊️', '#2D5CC8',
  'On World Refugee Day — we stand with the displaced and advocate for dignity for all.',
  '/programs', 'Community Programs'
),
(
  'World Population Day',
  'Focusing attention on population issues and their effect on development.',
  7, 11, 'international', 'medium', '👥', '#2D5CC8',
  'On World Population Day — sustainable communities start with informed, empowered families.',
  '/programs', 'Our Programs'
),
(
  'Nelson Mandela International Day',
  'Honouring Mandela''s legacy through 67 minutes of community service.',
  7, 18, 'community_volunteer', 'high', '✊', '#D97706',
  'Happy Mandela Day! Give 67 minutes of service to your community in his great honour.',
  '/auth/signup', 'Volunteer Today'
),
(
  'International Day of Indigenous Peoples',
  'Raising awareness and protecting the rights of the world''s indigenous communities.',
  8, 9, 'international', 'medium', '🏞️', '#D97706',
  'Today we recognise and celebrate Kenya''s indigenous communities and their heritage.',
  '/about', 'Our Story'
),
(
  'International Youth Day',
  'Raising awareness of challenges facing young people and celebrating their contributions.',
  8, 12, 'education_youth', 'high', '🌟', '#7c3aed',
  'Happy International Youth Day! Young people are the heart of our foundation.',
  '/programs', 'Youth Programs'
),
(
  'International Literacy Day',
  'Highlighting the importance of literacy to individuals, communities, and societies.',
  9, 8, 'education_youth', 'high', '✏️', '#7c3aed',
  'On International Literacy Day — because every Kenyan child deserves to read and write.',
  '/programs', 'Education Programs'
),
(
  'World Suicide Prevention Day',
  'Raising awareness of suicide prevention and supporting mental health worldwide.',
  9, 10, 'international', 'high', '💚', '#559135',
  'On World Suicide Prevention Day — mental health matters. You are not alone.',
  '/contact', 'Get Support'
),
(
  'World Ozone Day',
  'Commemorating the signing of the Montreal Protocol to protect the ozone layer.',
  9, 16, 'ngo_environmental', 'medium', '☀️', '#559135',
  'On World Ozone Day — protecting our atmosphere means protecting our communities.',
  '/programs', 'Environmental Programs'
),
(
  'International Day of Peace',
  'Annually commemorated to strengthen the ideals of peace among all peoples.',
  9, 21, 'international', 'high', '🕊️', '#2D5CC8',
  'Happy International Day of Peace — peace begins in our communities and hearts.',
  '/about', 'Our Mission'
),
(
  'International Day of Older Persons',
  'Raising awareness of the opportunities and challenges in an ageing world.',
  10, 1, 'community_volunteer', 'medium', '👴', '#D97706',
  'On International Day of Older Persons — we honour the wisdom of our elders.',
  '/programs', 'Community Programs'
),
(
  'World Teachers'' Day',
  'Honouring teachers who shape the future of communities worldwide.',
  10, 5, 'education_youth', 'high', '🍎', '#7c3aed',
  'Happy World Teachers'' Day! Teachers are the architects of our communities'' future.',
  '/programs', 'Education Programs'
),
(
  'World Mental Health Day',
  'Raising global awareness and mobilising efforts in support of mental health.',
  10, 10, 'international', 'high', '💚', '#559135',
  'On World Mental Health Day — mental wellness is community wellness. No one left behind.',
  '/contact', 'Reach Out'
),
(
  'International Day of the Girl Child',
  'Highlighting the needs and challenges faced by girls, and promoting their rights.',
  10, 11, 'education_youth', 'high', '👧', '#db2777',
  'On International Day of the Girl Child — every girl deserves education, safety, and opportunity.',
  '/programs', 'Youth Programs'
),
(
  'International Day for Disaster Risk Reduction',
  'Promoting a global culture of risk-reduction, resilience, and preparedness.',
  10, 13, 'ngo_environmental', 'medium', '🆘', '#dc2626',
  'On this day, we promote disaster preparedness and resilience in our communities.',
  '/programs', 'Community Programs'
),
(
  'World Food Day',
  'Promoting awareness and action for those who suffer from hunger.',
  10, 16, 'international', 'high', '🌾', '#D97706',
  'On World Food Day — no child in Kenya should go to sleep hungry.',
  '/donate', 'Feed Communities'
),
(
  'International Day for the Eradication of Poverty',
  'Promoting awareness of the need to eradicate poverty and destitution.',
  10, 17, 'international', 'high', '🤲', '#2D5CC8',
  'On this day — poverty is not inevitable. Together we can and will end it.',
  '/donate', 'Support Communities'
),
(
  'World Kindness Day',
  'Highlighting good deeds and the common thread of kindness that binds communities.',
  11, 15, 'community_volunteer', 'medium', '💛', '#D97706',
  'Happy World Kindness Day! Small acts of kindness build great communities.',
  '/donate', 'Do Something Kind'
),
(
  'Universal Children''s Day',
  'Promoting international togetherness and children''s welfare worldwide.',
  11, 20, 'education_youth', 'high', '🧒', '#7c3aed',
  'Happy Universal Children''s Day! Every child is our greatest investment.',
  '/programs', 'Youth Programs'
),
(
  'International Day Against Violence on Women',
  'Raising awareness of violence against women and girls worldwide.',
  11, 25, 'international', 'high', '🎗️', '#db2777',
  'Today we stand against gender-based violence. Every woman deserves safety and dignity.',
  '/programs', 'Women Empowerment'
),
(
  'World AIDS Day',
  'Uniting people around the world to fight against HIV and reduce stigma.',
  12, 1, 'international', 'high', '🎗️', '#dc2626',
  'On World AIDS Day — we fight for health equity and an AIDS-free generation.',
  '/programs', 'Health Programs'
),
(
  'International Day of Persons with Disabilities',
  'Promoting the rights and well-being of persons with disabilities.',
  12, 3, 'international', 'high', '♿', '#2D5CC8',
  'On International Day of Persons with Disabilities — inclusion is not optional, it is essential.',
  '/programs', 'Community Programs'
),
(
  'International Volunteer Day',
  'Celebrating the invaluable contributions of volunteers worldwide.',
  12, 5, 'community_volunteer', 'high', '🙌', '#D97706',
  'Happy International Volunteer Day! To every volunteer in our family — THANK YOU!',
  '/auth/signup', 'Join as Volunteer'
),
(
  'Human Rights Day',
  'Commemorating the adoption of the Universal Declaration of Human Rights in 1948.',
  12, 10, 'international', 'high', '⚖️', '#2D5CC8',
  'On Human Rights Day — we reaffirm our commitment to dignity and rights for all Kenyans.',
  '/about', 'Our Values'
),
(
  'International Migrants Day',
  'Recognising the contributions of migrants and their human rights.',
  12, 18, 'international', 'medium', '🌏', '#2D5CC8',
  'On International Migrants Day — we stand for human dignity regardless of borders.',
  '/programs', 'Community Programs'
)

ON CONFLICT DO NOTHING;


-- ============================================================
-- 3. SITE SETTINGS — Awareness System Toggle
-- ============================================================
INSERT INTO public.site_settings (key, value) VALUES
  ('show_awareness_banner',  'true'),
  ('awareness_min_priority', 'medium')   -- 'high' | 'medium' | 'low'
ON CONFLICT (key) DO NOTHING;
