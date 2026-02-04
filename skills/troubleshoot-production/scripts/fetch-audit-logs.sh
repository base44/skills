#!/bin/bash
#
# Fetch audit logs for a Base44 app
#
# Usage:
#   ./fetch-audit-logs.sh <app_id> [options]
#
# Options:
#   --status <success|failure>       Filter by outcome
#   --event-types <json_array>       Filter by event types, e.g. '["api.function.call"]'
#   --user-email <email>             Filter by user email
#   --start-date <ISO datetime>      Filter events from this date
#   --end-date <ISO datetime>        Filter events until this date
#   --limit <1-1000>                 Results per page (default: 50)
#   --order <ASC|DESC>               Sort order (default: DESC)
#   --cursor-timestamp <ISO datetime>  Pagination cursor timestamp
#   --cursor-user-email <email>        Pagination cursor user email
#
# Examples:
#   ./fetch-audit-logs.sh abc123
#   ./fetch-audit-logs.sh abc123 --status failure
#   ./fetch-audit-logs.sh abc123 --event-types '["api.function.call"]'
#   ./fetch-audit-logs.sh abc123 --status failure --event-types '["api.function.call"]' --limit 10
#   ./fetch-audit-logs.sh abc123 --user-email user@example.com --start-date 2024-01-01T00:00:00Z
#

set -e

APP_ID="$1"

if [[ -z "$APP_ID" ]]; then
    echo "Error: app_id is required" >&2
    echo "Usage: $0 <app_id> [options]" >&2
    exit 1
fi

shift

# Initialize filter variables
STATUS=""
EVENT_TYPES=""
USER_EMAIL=""
START_DATE=""
END_DATE=""
LIMIT=""
ORDER=""
CURSOR_TIMESTAMP=""
CURSOR_USER_EMAIL=""

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --status)
            STATUS="$2"
            shift 2
            ;;
        --event-types)
            EVENT_TYPES="$2"
            shift 2
            ;;
        --user-email)
            USER_EMAIL="$2"
            shift 2
            ;;
        --start-date)
            START_DATE="$2"
            shift 2
            ;;
        --end-date)
            END_DATE="$2"
            shift 2
            ;;
        --limit)
            LIMIT="$2"
            shift 2
            ;;
        --order)
            ORDER="$2"
            shift 2
            ;;
        --cursor-timestamp)
            CURSOR_TIMESTAMP="$2"
            shift 2
            ;;
        --cursor-user-email)
            CURSOR_USER_EMAIL="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
    esac
done

# Read token from Base44 CLI auth file
AUTH_FILE="$HOME/.base44/auth/auth.json"
if [[ ! -f "$AUTH_FILE" ]]; then
    echo "Error: Not authenticated. Run 'base44 login' first." >&2
    exit 1
fi

TOKEN=$(jq -r '.accessToken' "$AUTH_FILE")
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
    echo "Error: Invalid auth token. Run 'base44 login' to re-authenticate." >&2
    exit 1
fi

BASE_URL="https://app.base44.com"

# Get workspace ID from app
WORKSPACE_ID=$(curl -s "$BASE_URL/api/apps/$APP_ID" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.organization_id')

if [[ -z "$WORKSPACE_ID" || "$WORKSPACE_ID" == "null" ]]; then
    echo "Error: Could not get workspace ID for app $APP_ID" >&2
    exit 1
fi

# Build request body
REQUEST_BODY=$(jq -n \
    --arg app_id "$APP_ID" \
    --arg status "$STATUS" \
    --argjson event_types "${EVENT_TYPES:-null}" \
    --arg user_email "$USER_EMAIL" \
    --arg start_date "$START_DATE" \
    --arg end_date "$END_DATE" \
    --arg limit "$LIMIT" \
    --arg order "$ORDER" \
    --arg cursor_timestamp "$CURSOR_TIMESTAMP" \
    --arg cursor_user_email "$CURSOR_USER_EMAIL" \
    '{
        app_id: $app_id,
        order: (if $order != "" then $order else "DESC" end),
        limit: (if $limit != "" then ($limit | tonumber) else 50 end)
    }
    + (if $status != "" then {status: $status} else {} end)
    + (if $event_types != null then {event_types: $event_types} else {} end)
    + (if $user_email != "" then {user_email: $user_email} else {} end)
    + (if $start_date != "" then {start_date: $start_date} else {} end)
    + (if $end_date != "" then {end_date: $end_date} else {} end)
    + (if $cursor_timestamp != "" then {cursor_timestamp: $cursor_timestamp} else {} end)
    + (if $cursor_user_email != "" then {cursor_user_email: $cursor_user_email} else {} end)'
)

# Fetch audit logs
curl -s -X POST "$BASE_URL/api/workspace/audit-logs/list?workspaceId=$WORKSPACE_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_BODY"
