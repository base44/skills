#!/bin/bash
#
# Fetch runtime logs for a Base44 backend function (from Deno Deploy)
#
# Usage:
#   ./fetch-function-logs.sh <app_id> <function_name> [options]
#
# Options:
#   --since <ISO datetime>    Show logs from this time (default: 2021-08-01T00:00:00Z)
#   --until <ISO datetime>    Show logs until this time
#
# Examples:
#   ./fetch-function-logs.sh abc123 myFunction
#   ./fetch-function-logs.sh abc123 myFunction --since 2024-01-01T00:00:00Z
#   ./fetch-function-logs.sh abc123 myFunction --since 2024-01-01T00:00:00Z --until 2024-01-02T00:00:00Z
#

set -e

APP_ID="$1"
FUNCTION_NAME="$2"

if [[ -z "$APP_ID" || -z "$FUNCTION_NAME" ]]; then
    echo "Error: app_id and function_name are required" >&2
    echo "Usage: $0 <app_id> <function_name> [options]" >&2
    exit 1
fi

shift 2

# Initialize filter variables
SINCE=""
UNTIL=""

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        --since)
            SINCE="$2"
            shift 2
            ;;
        --until)
            UNTIL="$2"
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

# Build URL with query parameters
URL="$BASE_URL/api/apps/$APP_ID/functions-mgmt/$FUNCTION_NAME/logs"
QUERY_PARAMS=""

if [[ -n "$SINCE" ]]; then
    QUERY_PARAMS="since=$SINCE"
fi

if [[ -n "$UNTIL" ]]; then
    if [[ -n "$QUERY_PARAMS" ]]; then
        QUERY_PARAMS="$QUERY_PARAMS&until=$UNTIL"
    else
        QUERY_PARAMS="until=$UNTIL"
    fi
fi

if [[ -n "$QUERY_PARAMS" ]]; then
    URL="$URL?$QUERY_PARAMS"
fi

# Fetch function logs
curl -s "$URL" -H "Authorization: Bearer $TOKEN"
