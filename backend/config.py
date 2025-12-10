"""
================================================================
CONFIG.PY - BACKEND CONFIGURATION
================================================================
This file contains all configuration values for the Python backend.

HOW TO USE:
- Edit values below to customize the backend behavior
- Keep these values in sync with frontend config/config.js
  where applicable

SECTIONS:
1. Server Configuration
2. Storage Configuration
3. File Paths
4. Debug Settings
================================================================
"""

# ================================================================
# SECTION 1: SERVER CONFIGURATION
# ================================================================

# Port the API server will run on
# Should match API_BASE_URL in frontend config.js
API_PORT = 5000

# API version (for future compatibility)
API_VERSION = "1.0.0"


# ================================================================
# SECTION 2: STORAGE CONFIGURATION
# ================================================================

# Storage mode: "local" or "googleDrive"
# 
# "local" - Store files on the local filesystem
#   - Selfies saved to ./data/selfies/
#   - Temple visits saved to ./data/temple_visits.json
#   - Etc.
#
# "googleDrive" - Store files in Google Drive
#   - Requires Google API credentials
#   - See storage_google_drive.py for setup instructions
#
# TODO: Keep this in sync with STORAGE_MODE in frontend config.js
STORAGE_MODE = "local"


# ================================================================
# SECTION 3: FILE PATHS (FOR LOCAL STORAGE)
# ================================================================

# Base directory for all data storage
# This will be created if it doesn't exist
DATA_DIR = "./data"

# Subdirectories for different data types
SELFIES_DIR = f"{DATA_DIR}/selfies"
TEMPLE_PHOTOS_DIR = f"{DATA_DIR}/temple_photos"

# JSON file paths for structured data
TEMPLE_VISITS_FILE = f"{DATA_DIR}/temple_visits.json"
MIRACLES_FILE = f"{DATA_DIR}/miracles.json"
MISSIONARIES_FILE = f"{DATA_DIR}/missionaries.json"
CALENDAR_FILE = f"{DATA_DIR}/calendar.json"


# ================================================================
# SECTION 4: GOOGLE DRIVE CONFIGURATION (FOR GOOGLE DRIVE STORAGE)
# ================================================================

# Google Drive folder IDs (get these from Google Drive URLs)
# Example: https://drive.google.com/drive/folders/ABC123...
# The folder ID is the part after /folders/
#
# TODO: Fill these in when setting up Google Drive integration
GOOGLE_DRIVE_SELFIES_FOLDER_ID = ""
GOOGLE_DRIVE_DATA_FOLDER_ID = ""

# Path to Google API credentials file
# Download this from Google Cloud Console
# See: https://developers.google.com/drive/api/quickstart/python
GOOGLE_CREDENTIALS_FILE = "./credentials/google_credentials.json"


# ================================================================
# SECTION 5: DEBUG SETTINGS
# ================================================================

# Enable debug mode
# - Enables Flask debug mode (auto-reload on code changes)
# - More verbose logging
# Set to False for production use
DEBUG_MODE = True

# Log API requests
LOG_REQUESTS = True

# Log storage operations
LOG_STORAGE = True


# ================================================================
# SECTION 6: SECURITY SETTINGS (FUTURE)
# ================================================================

# TODO: Add authentication settings when needed
# API_KEY = ""
# REQUIRE_AUTH = False


# ================================================================
# SECTION 7: RATE LIMITING (FUTURE)
# ================================================================

# TODO: Add rate limiting settings when needed
# MAX_REQUESTS_PER_MINUTE = 60
# ENABLE_RATE_LIMITING = False


# ================================================================
# Print configuration on import (for debugging)
# ================================================================

if DEBUG_MODE:
    print("[Config] Configuration loaded:")
    print(f"  - API_PORT: {API_PORT}")
    print(f"  - STORAGE_MODE: {STORAGE_MODE}")
    print(f"  - DATA_DIR: {DATA_DIR}")
    print(f"  - DEBUG_MODE: {DEBUG_MODE}")
