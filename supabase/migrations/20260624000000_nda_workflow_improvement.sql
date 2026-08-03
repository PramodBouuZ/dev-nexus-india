-- Database Migration: NDA Workflow Improvement

ALTER TYPE public.nda_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE public.nda_status ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE public.nda_status ADD VALUE IF NOT EXISTS 'received';
ALTER TYPE public.nda_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.nda_status ADD VALUE IF NOT EXISTS 'viewed';
ALTER TYPE public.nda_status ADD VALUE IF NOT EXISTS 'expired';

ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;
ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS under_review_at TIMESTAMPTZ;
