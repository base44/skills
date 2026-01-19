#!/usr/bin/env bash
#
# Validate all skills in the repository using skills-cli
#
# Usage: ./scripts/validate.sh [skill-path]
#   If no argument provided, validates all skills in skills/ directory
#   If skill-path provided, validates only that skill

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation results
FAILED=0
PASSED=0
SKILLS_CHECKED=()

validate_skill() {
    local skill_dir="$1"
    local skill_name
    skill_name=$(basename "$skill_dir")
    
    echo -e "${YELLOW}Validating:${NC} $skill_dir"
    
    if skills validate "$skill_dir"; then
        echo -e "${GREEN}✓${NC} $skill_name passed validation"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $skill_name failed validation"
        ((FAILED++))
    fi
    
    SKILLS_CHECKED+=("$skill_name")
    echo ""
}

# Change to repo root
cd "$(dirname "$0")/.."

# Check if skills-cli is installed
if ! command -v skills &> /dev/null; then
    echo -e "${RED}Error:${NC} skills-cli is not installed"
    echo "Install it with: pip install -r requirements.txt"
    exit 1
fi

# If a specific skill path is provided, validate only that
if [[ $# -gt 0 ]]; then
    if [[ -d "$1" ]]; then
        validate_skill "$1"
    else
        echo -e "${RED}Error:${NC} Directory not found: $1"
        exit 1
    fi
else
    # Find all skill directories (containing SKILL.md), excluding _template
    echo "Searching for skills to validate..."
    echo ""
    
    while IFS= read -r -d '' skill_file; do
        skill_dir=$(dirname "$skill_file")
        
        # Skip _template directory
        if [[ "$skill_dir" == *"/_template"* ]] || [[ "$skill_dir" == *"_template"* ]]; then
            echo -e "${YELLOW}Skipping template:${NC} $skill_dir"
            continue
        fi
        
        validate_skill "$skill_dir"
    done < <(find skills -name "SKILL.md" -print0 2>/dev/null || true)
fi

# Summary
echo "========================================"
echo "Validation Summary"
echo "========================================"
echo -e "Skills checked: ${#SKILLS_CHECKED[@]}"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [[ ${#SKILLS_CHECKED[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No skills found to validate.${NC}"
    echo "Skills should be placed in skills/.curated/ or skills/.experimental/"
    exit 0
fi

if [[ $FAILED -gt 0 ]]; then
    echo -e "${RED}Validation failed!${NC}"
    exit 1
else
    echo -e "${GREEN}All skills passed validation!${NC}"
    exit 0
fi
