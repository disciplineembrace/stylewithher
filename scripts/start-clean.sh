#!/bin/bash
# Clean environment start script for StyleWithHer
# This ensures no old DATABASE_URL leaks from the parent shell

unset DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_gGcXxFaZ90nQ@ep-floral-bar-ao2qh123-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
cd /home/z/my-project
exec npx next dev --port 3000