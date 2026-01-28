-- Fix RLS Policies for Migration
-- Run this in Supabase SQL Editor to allow data insertion

-- Add INSERT policies for all tables
CREATE POLICY "Allow insert spieler" ON spieler FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert turniere" ON turniere FOR INSERT WITH CHECK (true);

-- If you get "policy already exists" errors, run these DROP commands first:
-- DROP POLICY IF EXISTS "Allow insert spieler" ON spieler;
-- DROP POLICY IF EXISTS "Allow insert turniere" ON turniere;
