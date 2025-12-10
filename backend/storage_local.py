"""
================================================================
STORAGE_LOCAL.PY - LOCAL FILESYSTEM STORAGE
================================================================
This module handles storing and retrieving data from the local
filesystem.

PURPOSE:
- Save selfies to local disk
- Store temple visits, miracles, etc. in JSON files
- List and retrieve stored data

FILE STRUCTURE:
./data/
├── selfies/
│   ├── selfie_001.jpg
│   ├── selfie_002.jpg
│   └── metadata.json
├── temple_photos/
│   └── (screensaver images)
├── temple_visits.json
├── miracles.json
├── missionaries.json
└── calendar.json

USAGE:
    from storage_local import LocalStorage
    
    storage = LocalStorage()
    
    # Save a selfie
    result = storage.save_selfie(image_base64, caption="Family photo")
    
    # List selfies
    selfies = storage.list_selfies()
    
    # Save temple visit
    storage.save_temple_visit({"date": "2024-01-15", "count": 5})
================================================================
"""

import os
import json
import base64
from datetime import datetime
from config import (
    DATA_DIR, 
    SELFIES_DIR, 
    TEMPLE_VISITS_FILE,
    MIRACLES_FILE,
    MISSIONARIES_FILE,
    CALENDAR_FILE,
    LOG_STORAGE
)


class LocalStorage:
    """
    Local filesystem storage handler.
    
    This class manages all data storage operations for the kiosk
    when running in "local" storage mode.
    """
    
    # ============================================================
    # SECTION 1: INITIALIZATION
    # ============================================================
    
    def __init__(self):
        """
        Initialize the local storage.
        Creates necessary directories if they don't exist.
        """
        self._ensure_directories()
        self._log("LocalStorage initialized")
    
    def _ensure_directories(self):
        """Create data directories if they don't exist."""
        directories = [
            DATA_DIR,
            SELFIES_DIR
        ]
        
        for directory in directories:
            if not os.path.exists(directory):
                os.makedirs(directory)
                self._log(f"Created directory: {directory}")
    
    def _log(self, message):
        """Log a storage operation if logging is enabled."""
        if LOG_STORAGE:
            print(f"[LocalStorage] {message}")
    
    
    # ============================================================
    # SECTION 2: JSON FILE HELPERS
    # ============================================================
    
    def _read_json_file(self, filepath):
        """
        Read data from a JSON file.
        
        Args:
            filepath: Path to the JSON file
            
        Returns:
            Parsed JSON data, or empty list if file doesn't exist
        """
        if not os.path.exists(filepath):
            return []
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            self._log(f"Warning: Invalid JSON in {filepath}")
            return []
        except Exception as e:
            self._log(f"Error reading {filepath}: {e}")
            return []
    
    def _write_json_file(self, filepath, data):
        """
        Write data to a JSON file.
        
        Args:
            filepath: Path to the JSON file
            data: Data to write (will be JSON serialized)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            self._log(f"Error writing {filepath}: {e}")
            return False
    
    def _get_next_id(self, data_list):
        """
        Get the next available ID for a list of records.
        
        Args:
            data_list: List of records with 'id' field
            
        Returns:
            Next available ID (integer)
        """
        if not data_list:
            return 1
        max_id = max(item.get('id', 0) for item in data_list)
        return max_id + 1
    
    
    # ============================================================
    # SECTION 3: SELFIE STORAGE
    # ============================================================
    
    def save_selfie(self, image_base64, caption=""):
        """
        Save a selfie image to local storage.
        
        Args:
            image_base64: Base64-encoded image data
                         (with or without data:image/... prefix)
            caption: Optional caption for the selfie
            
        Returns:
            Dict with saved selfie metadata, or None on error
            
        TODO: Implement actual image saving
        TODO: Add image validation
        TODO: Add image compression/resizing
        """
        self._log("save_selfie called (not yet implemented)")
        
        # TODO: Implementation steps:
        # 1. Strip base64 prefix if present
        #    if ',' in image_base64:
        #        image_base64 = image_base64.split(',')[1]
        #
        # 2. Decode base64 to bytes
        #    image_bytes = base64.b64decode(image_base64)
        #
        # 3. Generate unique filename
        #    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        #    filename = f"selfie_{timestamp}.jpg"
        #    filepath = os.path.join(SELFIES_DIR, filename)
        #
        # 4. Save image file
        #    with open(filepath, 'wb') as f:
        #        f.write(image_bytes)
        #
        # 5. Save metadata
        #    metadata = {
        #        'id': self._get_next_id(self.list_selfies()),
        #        'filename': filename,
        #        'caption': caption,
        #        'timestamp': datetime.now().isoformat()
        #    }
        #    self._save_selfie_metadata(metadata)
        #
        # 6. Return metadata
        #    return metadata
        
        return None
    
    def list_selfies(self):
        """
        List all selfies.
        
        Returns:
            List of selfie metadata dicts
            
        TODO: Implement actual listing
        """
        self._log("list_selfies called (not yet implemented)")
        
        # TODO: Implementation:
        # metadata_file = os.path.join(SELFIES_DIR, 'metadata.json')
        # return self._read_json_file(metadata_file)
        
        return []
    
    def _save_selfie_metadata(self, metadata):
        """
        Save selfie metadata to the metadata file.
        
        TODO: Implement
        """
        # metadata_file = os.path.join(SELFIES_DIR, 'metadata.json')
        # all_metadata = self._read_json_file(metadata_file)
        # all_metadata.append(metadata)
        # self._write_json_file(metadata_file, all_metadata)
        pass
    
    
    # ============================================================
    # SECTION 4: TEMPLE VISITS STORAGE
    # ============================================================
    
    def save_temple_visit(self, data):
        """
        Save a temple visit record.
        
        Args:
            data: Dict with visit data
                  Required: 'date'
                  Optional: 'count', 'notes'
                  
        Returns:
            The saved record with ID, or None on error
            
        TODO: Implement actual saving
        """
        self._log("save_temple_visit called (not yet implemented)")
        
        # TODO: Implementation:
        # visits = self._read_json_file(TEMPLE_VISITS_FILE)
        # 
        # new_visit = {
        #     'id': self._get_next_id(visits),
        #     'date': data['date'],
        #     'count': data.get('count', 1),
        #     'notes': data.get('notes', ''),
        #     'created_at': datetime.now().isoformat()
        # }
        # 
        # visits.append(new_visit)
        # self._write_json_file(TEMPLE_VISITS_FILE, visits)
        # 
        # return new_visit
        
        return None
    
    def list_temple_visits(self):
        """
        List all temple visits.
        
        Returns:
            List of temple visit records
            
        TODO: Implement actual listing
        """
        self._log("list_temple_visits called (not yet implemented)")
        
        # TODO: Implementation:
        # return self._read_json_file(TEMPLE_VISITS_FILE)
        
        return []
    
    
    # ============================================================
    # SECTION 5: MIRACLES STORAGE (PHASE 2)
    # ============================================================
    
    def save_miracle(self, data):
        """
        Save a miracle story.
        
        Args:
            data: Dict with miracle data
                  Required: 'story'
                  Optional: 'title', 'author'
                  
        Returns:
            The saved record with ID
            
        TODO: Implement when Phase 2 is ready
        """
        self._log("save_miracle called (Phase 2 - not yet implemented)")
        return None
    
    def list_miracles(self):
        """
        List all miracles.
        
        Returns:
            List of miracle records
            
        TODO: Implement when Phase 2 is ready
        """
        self._log("list_miracles called (Phase 2 - not yet implemented)")
        return []
    
    
    # ============================================================
    # SECTION 6: MISSIONARIES STORAGE (PHASE 2)
    # ============================================================
    
    def save_missionary(self, data):
        """
        Save a missionary record.
        
        TODO: Implement when Phase 2 is ready
        """
        self._log("save_missionary called (Phase 2 - not yet implemented)")
        return None
    
    def list_missionaries(self):
        """
        List all missionaries.
        
        TODO: Implement when Phase 2 is ready
        """
        self._log("list_missionaries called (Phase 2 - not yet implemented)")
        return []
    
    
    # ============================================================
    # SECTION 7: CALENDAR STORAGE (PHASE 2)
    # ============================================================
    
    def save_event(self, data):
        """
        Save a calendar event.
        
        TODO: Implement when Phase 2 is ready
        """
        self._log("save_event called (Phase 2 - not yet implemented)")
        return None
    
    def list_events(self, start_date=None, end_date=None):
        """
        List calendar events, optionally filtered by date range.
        
        TODO: Implement when Phase 2 is ready
        """
        self._log("list_events called (Phase 2 - not yet implemented)")
        return []
    
    
    # ============================================================
    # SECTION 8: TEMPLE PHOTOS (SCREENSAVER)
    # ============================================================
    
    def list_temple_photos(self):
        """
        List all temple photos available for the screensaver.
        
        Scans the temple_photos directory and returns list of paths.
        
        Returns:
            List of photo file paths
            
        TODO: Implement actual directory scanning
        """
        self._log("list_temple_photos called (not yet implemented)")
        
        # TODO: Implementation:
        # photos = []
        # photo_dir = TEMPLE_PHOTOS_DIR
        # 
        # if os.path.exists(photo_dir):
        #     for filename in os.listdir(photo_dir):
        #         if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        #             photos.append(f"assets/temple_photos/{filename}")
        # 
        # return photos
        
        return []
