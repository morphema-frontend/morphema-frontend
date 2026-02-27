#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000/api}"
TOKEN="${TOKEN:-demo-token}"

auth() {
  echo "Authorization: Bearer ${TOKEN}"
}

echo "1) Create gig (venue)"
curl -s -X POST "$BASE_URL/venue/gigs" \
  -H "$(auth)" -H "Content-Type: application/json" \
  -d '{"title":"Demo gig","payAmount":120,"currency":"EUR","startTime":"2026-03-01T00:00:00.000Z","endTime":"2026-03-01T23:59:00.000Z"}'
echo

echo "2) List venue gigs (copy GIG_ID)"
curl -s "$BASE_URL/venue/gigs" -H "$(auth)"
echo

echo "Set GIG_ID before continuing (export GIG_ID=1)."

echo "3) Publish gig"
curl -s -X POST "$BASE_URL/venue/gigs/${GIG_ID}/publish" -H "$(auth)"
echo

echo "4) Worker list published gigs"
curl -s "$BASE_URL/gigs" -H "$(auth)"
echo

echo "5) Worker apply (copy APP_ID)"
curl -s -X POST "$BASE_URL/gigs/${GIG_ID}/apply" \
  -H "$(auth)" -H "Content-Type: application/json" \
  -d '{"workerName":"Worker Demo"}'
echo

echo "6) Worker applications (copy APP_ID)"
curl -s "$BASE_URL/worker/applications" -H "$(auth)"
echo

echo "Set APP_ID before continuing (export APP_ID=1)."

echo "7) Venue accept application"
curl -s -X POST "$BASE_URL/venue/applications/${APP_ID}/accept" -H "$(auth)"
echo

echo "8) Worker marks completed"
curl -s -X POST "$BASE_URL/applications/${APP_ID}/complete" -H "$(auth)"
echo

echo "9) Venue settles gig"
curl -s -X POST "$BASE_URL/gigs/${GIG_ID}/settle" -H "$(auth)"
echo

echo "10) Venue history"
curl -s "$BASE_URL/venue/history" -H "$(auth)"
echo
