-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 10 Migration
-- Creates the missing media_assets and leadership_team tables.
-- These tables are referenced by the application but were never
-- created in earlier migrations, causing the Media Library and
-- About page leadership section to fail.
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

-- ============================================================
-- MEDIA ASSETS  ← admin/media + admin/gallery picker + actions/media.ts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media_assets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url          TEXT NOT NULL,
  thumb_url    TEXT,
  storage_path TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  file_size    BIGINT NOT NULL,
  mime_type    TEXT NOT NULL,
  file_type    TEXT NOT NULL CHECK (file_type IN ('image', 'document')),
  alt_text     TEXT,
  title        TEXT,
  description  TEXT,
  tags         TEXT[] NOT NULL DEFAULT '{}',
  folder       TEXT NOT NULL DEFAULT 'general',
  uploaded_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Admins can read all media assets
CREATE POLICY "media_assets: admin read"
  ON public.media_assets FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can insert media assets
CREATE POLICY "media_assets: admin insert"
  ON public.media_assets FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update media assets
CREATE POLICY "media_assets: admin update"
  ON public.media_assets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete media assets
CREATE POLICY "media_assets: admin delete"
  ON public.media_assets FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes (also declared in phase5 — IF NOT EXISTS keeps this idempotent)
CREATE INDEX IF NOT EXISTS media_assets_file_type_idx
  ON public.media_assets (file_type, created_at DESC);

CREATE INDEX IF NOT EXISTS media_assets_folder_idx
  ON public.media_assets (folder, created_at DESC);

CREATE INDEX IF NOT EXISTS media_assets_uploaded_by_idx
  ON public.media_assets (uploaded_by);

-- ============================================================
-- LEADERSHIP TEAM  ← about/page.tsx + admin settings (saveLeadershipMember)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leadership_team (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  role        TEXT NOT NULL,
  bio         TEXT,
  image_url   TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leadership_team ENABLE ROW LEVEL SECURITY;

-- Anyone can read active leadership members (public About page)
CREATE POLICY "leadership_team: public read active"
  ON public.leadership_team FOR SELECT
  USING (is_active = TRUE);

-- Admins can read all (including inactive)
CREATE POLICY "leadership_team: admin read all"
  ON public.leadership_team FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can insert
CREATE POLICY "leadership_team: admin insert"
  ON public.leadership_team FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can update
CREATE POLICY "leadership_team: admin update"
  ON public.leadership_team FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can delete
CREATE POLICY "leadership_team: admin delete"
  ON public.leadership_team FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS leadership_team_sort_idx
  ON public.leadership_team (sort_order);

CREATE INDEX IF NOT EXISTS leadership_team_active_idx
  ON public.leadership_team (is_active, sort_order);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_leadership_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leadership_team_updated_at ON public.leadership_team;
CREATE TRIGGER leadership_team_updated_at
  BEFORE UPDATE ON public.leadership_team
  FOR EACH ROW EXECUTE PROCEDURE public.update_leadership_team_updated_at();
