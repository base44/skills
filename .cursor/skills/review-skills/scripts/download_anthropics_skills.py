#!/usr/bin/env python3
"""
Download and filter anthropics/skills repository for skill review reference.

Downloads the anthropics/skills repo as a ZIP from GitHub, extracts it to a cache
directory, and filters to keep only relevant files (SKILL.md and references).

Usage:
    python scripts/download_anthropics_skills.py [--force] [--clean] [--cache-dir PATH]

Options:
    --force         Force re-download even if cache is fresh (< 7 days old)
    --clean         Clear the cache directory (without downloading)
    --cache-dir     Custom cache directory (default: .cursor/cache/anthropics-skills)

Examples:
    python scripts/download_anthropics_skills.py
    python scripts/download_anthropics_skills.py --force
    python scripts/download_anthropics_skills.py --clean
    python scripts/download_anthropics_skills.py --cache-dir /tmp/skills-cache
"""

import argparse
import io
import json
import os
import shutil
import sys
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError


# Configuration
REPO_URL = "https://github.com/anthropics/skills/archive/refs/heads/main.zip"
DEFAULT_CACHE_DIR = ".cursor/cache/anthropics-skills"
CACHE_MAX_AGE_DAYS = 7
METADATA_FILE = ".cache_metadata.json"

# Files and directories to keep
KEEP_PATTERNS = {
    "SKILL.md",  # Main skill files
}

# Directories to keep (with their contents)
KEEP_DIRS = {
    "references",  # Reference documentation
}

# Files and directories to explicitly remove
REMOVE_PATTERNS = {
    "README.md",
    "CONTRIBUTING.md",
    "LICENSE",
    "LICENSE.txt",
    ".gitignore",
    ".github",
    ".git",
    "assets",
    "scripts",
    "__pycache__",
    ".DS_Store",
}


def get_workspace_root() -> Path:
    """Find the workspace root by looking for .cursor directory."""
    current = Path.cwd()
    
    # Walk up to find .cursor directory
    for parent in [current] + list(current.parents):
        if (parent / ".cursor").exists():
            return parent
    
    # Fallback to current directory
    return current


def get_cache_dir(custom_path: str = None) -> Path:
    """Get the cache directory path."""
    if custom_path:
        return Path(custom_path).resolve()
    
    workspace = get_workspace_root()
    return workspace / DEFAULT_CACHE_DIR


def load_cache_metadata(cache_dir: Path) -> dict:
    """Load cache metadata from file."""
    metadata_path = cache_dir / METADATA_FILE
    if metadata_path.exists():
        try:
            with open(metadata_path, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}


def save_cache_metadata(cache_dir: Path, metadata: dict):
    """Save cache metadata to file."""
    metadata_path = cache_dir / METADATA_FILE
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)


def is_cache_fresh(cache_dir: Path) -> bool:
    """Check if the cache exists and is less than CACHE_MAX_AGE_DAYS old."""
    if not cache_dir.exists():
        return False
    
    metadata = load_cache_metadata(cache_dir)
    if "downloaded_at" not in metadata:
        return False
    
    try:
        downloaded_at = datetime.fromisoformat(metadata["downloaded_at"])
        age = datetime.now() - downloaded_at
        return age < timedelta(days=CACHE_MAX_AGE_DAYS)
    except (ValueError, TypeError):
        return False


def clean_cache(cache_dir: Path) -> bool:
    """Remove the cache directory entirely."""
    if cache_dir.exists():
        shutil.rmtree(cache_dir)
        return True
    return False


def download_repo_zip() -> bytes:
    """Download the repository ZIP file from GitHub."""
    print(f"Downloading from {REPO_URL}...")
    
    request = Request(
        REPO_URL,
        headers={"User-Agent": "skill-downloader/1.0"}
    )
    
    try:
        with urlopen(request, timeout=60) as response:
            total_size = response.headers.get("Content-Length")
            if total_size:
                total_size = int(total_size)
                print(f"Total size: {total_size / 1024 / 1024:.1f} MB")
            
            data = response.read()
            print(f"Downloaded {len(data) / 1024 / 1024:.1f} MB")
            return data
    except HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        sys.exit(1)
    except URLError as e:
        print(f"URL Error: {e.reason}")
        sys.exit(1)


def should_keep_file(file_path: Path, relative_path: Path) -> bool:
    """Determine if a file should be kept based on filtering rules."""
    name = file_path.name
    parts = relative_path.parts
    
    # Always remove files matching remove patterns
    for pattern in REMOVE_PATTERNS:
        if name == pattern or pattern in parts:
            return False
    
    # Keep SKILL.md files
    if name in KEEP_PATTERNS:
        return True
    
    # Keep files in references directories
    for keep_dir in KEEP_DIRS:
        if keep_dir in parts:
            # Only keep .md files in references
            if name.endswith(".md"):
                return True
    
    return False


def should_keep_directory(dir_path: Path, relative_path: Path) -> bool:
    """Determine if a directory should be kept."""
    name = dir_path.name
    parts = relative_path.parts
    
    # Remove directories matching remove patterns
    for pattern in REMOVE_PATTERNS:
        if name == pattern or pattern in parts:
            return False
    
    return True


def extract_and_filter(zip_data: bytes, cache_dir: Path) -> dict:
    """Extract ZIP and filter to keep only relevant files."""
    stats = {
        "total_files": 0,
        "kept_files": 0,
        "skills_found": [],
    }
    
    # Clear existing cache
    if cache_dir.exists():
        print("Clearing existing cache...")
        shutil.rmtree(cache_dir)
    
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    print("Extracting and filtering files...")
    
    with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
        # Get list of all files
        all_files = zf.namelist()
        stats["total_files"] = len(all_files)
        
        for file_path in all_files:
            # Skip the root directory entry
            if file_path.endswith("/"):
                continue
            
            # Remove the repo root directory prefix (e.g., "skills-main/")
            parts = file_path.split("/", 1)
            if len(parts) < 2:
                continue
            
            relative_path = Path(parts[1])
            if not relative_path.parts:
                continue
            
            # Check if we should keep this file
            full_path = cache_dir / relative_path
            
            if should_keep_file(full_path, relative_path):
                # Ensure parent directory exists
                full_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Extract file
                with zf.open(file_path) as src:
                    with open(full_path, "wb") as dst:
                        dst.write(src.read())
                
                stats["kept_files"] += 1
                
                # Track skills found
                if full_path.name == "SKILL.md":
                    skill_dir = relative_path.parent.name
                    if skill_dir and skill_dir != ".":
                        stats["skills_found"].append(skill_dir)
    
    return stats


def create_index_file(cache_dir: Path, skills: list):
    """Create an index file listing all available skills."""
    index_path = cache_dir / "INDEX.md"
    
    content = """# Anthropic Skills Repository - Local Cache

This is a filtered copy of the [anthropics/skills](https://github.com/anthropics/skills) repository.

## Available Skills

The following skills are available for reference:

"""
    
    for skill in sorted(skills):
        skill_path = f"skills/{skill}/SKILL.md"
        content += f"- [{skill}]({skill_path})\n"
    
    content += """
## Usage

These skills serve as reference examples for reviewing and improving other skills.
Each skill contains a `SKILL.md` file and optionally a `references/` directory.

## Cache Information

This cache is automatically managed. Run the download script with `--force` to refresh.
"""
    
    with open(index_path, "w") as f:
        f.write(content)


def main():
    parser = argparse.ArgumentParser(
        description="Download and filter anthropics/skills repository"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-download even if cache is fresh"
    )
    parser.add_argument(
        "--clean",
        action="store_true",
        help="Clear the cache directory (without downloading)"
    )
    parser.add_argument(
        "--cache-dir",
        type=str,
        help=f"Custom cache directory (default: {DEFAULT_CACHE_DIR})"
    )
    
    args = parser.parse_args()
    cache_dir = get_cache_dir(args.cache_dir)
    
    print(f"Cache directory: {cache_dir}")
    
    # Handle --clean flag
    if args.clean:
        if clean_cache(cache_dir):
            print("Cache cleared successfully.")
        else:
            print("Cache directory does not exist.")
        return
    
    # Check if cache is fresh
    if not args.force and is_cache_fresh(cache_dir):
        metadata = load_cache_metadata(cache_dir)
        print(f"Cache is fresh (downloaded: {metadata.get('downloaded_at', 'unknown')})")
        print(f"Skills available: {metadata.get('skills_count', 'unknown')}")
        print("Use --force to re-download")
        return
    
    # Download repository
    zip_data = download_repo_zip()
    
    # Extract and filter
    stats = extract_and_filter(zip_data, cache_dir)
    
    # Create index file
    create_index_file(cache_dir, stats["skills_found"])
    
    # Save metadata
    metadata = {
        "downloaded_at": datetime.now().isoformat(),
        "source_url": REPO_URL,
        "total_files_in_repo": stats["total_files"],
        "kept_files": stats["kept_files"],
        "skills_count": len(stats["skills_found"]),
        "skills": stats["skills_found"],
    }
    save_cache_metadata(cache_dir, metadata)
    
    # Print summary
    print("\n" + "=" * 50)
    print("Download complete!")
    print(f"  Total files in repo: {stats['total_files']}")
    print(f"  Files kept: {stats['kept_files']}")
    print(f"  Skills found: {len(stats['skills_found'])}")
    print(f"  Cache location: {cache_dir}")
    print("=" * 50)
    
    if stats["skills_found"]:
        print("\nAvailable skills:")
        for skill in sorted(stats["skills_found"])[:10]:
            print(f"  - {skill}")
        if len(stats["skills_found"]) > 10:
            print(f"  ... and {len(stats['skills_found']) - 10} more")


if __name__ == "__main__":
    main()
