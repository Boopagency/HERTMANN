#!/usr/bin/env bash
# Aplica as migrações num Postgres local descartável e corre os testes de RLS.
# Usa scripts/supabase/auth-stub.sql — uma SIMULAÇÃO mínima do Supabase
# (papéis anon/authenticated, auth.users, auth.uid()). Não substitui um teste
# no projeto Supabase real.
#
#   PGHOST=/tmp/hm-pg PGPORT=55432 PGUSER=postgres scripts/supabase/testar-rls.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${DB:-hm_rls_teste}
psql -v ON_ERROR_STOP=1 -q -c "drop database if exists $DB" -c "create database $DB"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f scripts/supabase/auth-stub.sql
for f in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"; done
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f scripts/supabase/rls-test.sql 2>&1 | grep -E "OK|FALHA|PASSARAM|ERROR"
