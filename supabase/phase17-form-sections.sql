-- ============================================================
-- 4W'S INUA JAMII FOUNDATION — Phase 17 Migration
-- Form sections: group custom registration fields into named sections.
-- Safe to run multiple times (uses ADD COLUMN IF NOT EXISTS).
-- ============================================================

-- Add section_title column to event_form_fields.
-- Fields with the same section_title are rendered together under a
-- section header on the public registration form. Defaults to
-- 'Additional Information' for backward compatibility with existing
-- fields that have no section.
ALTER TABLE public.event_form_fields
  ADD COLUMN IF NOT EXISTS section_title TEXT NOT NULL DEFAULT 'Additional Information';

-- Add a sort_order for sections within an event (optional, for
-- ordering sections differently from field sort_order).
ALTER TABLE public.event_form_fields
  ADD COLUMN IF NOT EXISTS section_sort_order INT NOT NULL DEFAULT 0;

-- Index for efficient grouping
CREATE INDEX IF NOT EXISTS idx_event_form_fields_section
  ON public.event_form_fields(event_id, section_title, sort_order);

-- Refresh PostgREST schema cache so the new columns are visible
NOTIFY pgrst, 'reload schema';
