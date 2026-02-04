#!/bin/bash
#
# Fetch agent conversations for a Base44 app
# Usage: fetch-agent-conversations.sh <app_id> [options]
#
# Options:
#   --agent-name <name>    Filter by agent name
#   --limit <number>       Max results (default: 50)
#   --errors-only          Only show conversations with tool errors
#   --conversation-id <id> Fetch specific conversation
#

set -e

# Parse arguments
APP_ID=""
AGENT_NAME=""
LIMIT="50"
ERRORS_ONLY=false
CONVERSATION_ID=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --agent-name)
            AGENT_NAME="$2"
            shift 2
            ;;
        --limit)
            LIMIT="$2"
            shift 2
            ;;
        --errors-only)
            ERRORS_ONLY=true
            shift
            ;;
        --conversation-id)
            CONVERSATION_ID="$2"
            shift 2
            ;;
        -*)
            echo "Unknown option: $1" >&2
            exit 1
            ;;
        *)
            if [ -z "$APP_ID" ]; then
                APP_ID="$1"
            fi
            shift
            ;;
    esac
done

if [ -z "$APP_ID" ]; then
    echo "Usage: fetch-agent-conversations.sh <app_id> [options]" >&2
    echo "" >&2
    echo "Options:" >&2
    echo "  --agent-name <name>    Filter by agent name" >&2
    echo "  --limit <number>       Max results (default: 50)" >&2
    echo "  --errors-only          Only show conversations with tool errors" >&2
    echo "  --conversation-id <id> Fetch specific conversation" >&2
    exit 1
fi

# Read token from auth file
AUTH_FILE="$HOME/.base44/auth/auth.json"
if [ ! -f "$AUTH_FILE" ]; then
    echo "Error: Not authenticated. Run 'base44 login' first." >&2
    exit 1
fi

PLATFORM_TOKEN=$(jq -r '.accessToken' "$AUTH_FILE")
if [ -z "$PLATFORM_TOKEN" ] || [ "$PLATFORM_TOKEN" = "null" ]; then
    echo "Error: Invalid auth token. Run 'base44 login' to refresh." >&2
    exit 1
fi

BASE_URL="https://app.base44.com"

# Step 1: Get app user token from platform token
APP_USER_TOKEN=$(curl -s "${BASE_URL}/api/apps/${APP_ID}/auth/token" \
    -H "Authorization: Bearer ${PLATFORM_TOKEN}" | jq -r '.token')

if [ -z "$APP_USER_TOKEN" ] || [ "$APP_USER_TOKEN" = "null" ]; then
    echo "Error: Failed to get app user token. Check app ID and permissions." >&2
    exit 1
fi

# Step 2: Fetch conversations
if [ -n "$CONVERSATION_ID" ]; then
    # Fetch specific conversation
    RESPONSE=$(curl -s "${BASE_URL}/api/apps/${APP_ID}/agents/conversations/${CONVERSATION_ID}" \
        -H "Authorization: Bearer ${APP_USER_TOKEN}")
else
    # Build query params
    QUERY_PARAMS="?limit=${LIMIT}"
    if [ -n "$AGENT_NAME" ]; then
        QUERY_PARAMS="${QUERY_PARAMS}&agent_name=${AGENT_NAME}"
    fi

    RESPONSE=$(curl -s "${BASE_URL}/api/apps/${APP_ID}/agents/conversations${QUERY_PARAMS}" \
        -H "Authorization: Bearer ${APP_USER_TOKEN}")
fi

# Step 3: Filter for errors if requested
if [ "$ERRORS_ONLY" = true ]; then
    echo "$RESPONSE" | jq '[.[] | select(.messages[]?.tool_calls[]?.status == "error")]'
else
    echo "$RESPONSE" | jq '.'
fi
