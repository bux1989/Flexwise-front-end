# Supabase Backups

This file tracks external links to Supabase SQL dumps. Do not commit raw .sql files to the repo.

## flexwise29082025dump.sql
- Date: 2025-08-29
- Link: https://cdn.builder.io/o/assets%2F020295f4dae640e8b44edc48cd1c867a%2F9cf7711466274973a64b7d921aa87a09?alt=media&token=52bcfda2-e477-4a04-8aca-b2f02919e569&apiKey=020295f4dae640e8b44edc48cd1c867a

## Import Instructions (safe)
- Supabase SQL Editor: Open SQL, paste relevant sections as needed.
- CLI/psql: psql "$SUPABASE_DB_URL" -f dump.sql (never commit dump.sql; keep locally or secure storage).

Notes:
- Sanitization required if contains sensitive data.
- Update this file when new dumps are available.
