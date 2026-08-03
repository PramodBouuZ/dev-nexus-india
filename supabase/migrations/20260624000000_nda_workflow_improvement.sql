-- Database Migration: NDA Workflow Improvement

ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;
ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS under_review_at TIMESTAMPTZ;
