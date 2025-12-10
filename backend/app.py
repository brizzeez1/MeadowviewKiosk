"""
================================================================
APP.PY - FLASK BACKEND SERVER
================================================================
This is the main Python backend for the Ward Kiosk application.

PURPOSE:
- Serve as a local REST API for the kiosk frontend
- Handle data storage (local filesystem or Google Drive)
- Provide endpoints for all kiosk features

RUNNING THE SERVER:
================================================================
1. Create a virtual environment (recommended):
   
   cd backend
   python -m venv venv
   
   On Windows:
     venv\\Scripts\\activate
   
   On Mac/Linux:
     source venv/bin/activate

2. Install dependencies:
   
   pip install -r requirements.txt

3. Run the server:
   
   python app.py
   
   The server will start at http://localhost:5000

4. Test it's working:
   
   Open a browser and go to:
   http://localhost:5000/api/config
   
   You should see a JSON response.

================================================================
WINDOWS KIOSK NOTES:
================================================================
This server is designed to run locally on the kiosk machine.
The frontend (index.html) will call API endpoints like:
- http://localhost:5000/api/selfies
- http://localhost:5000/api/temple-visits

In Windows 10 kiosk mode, you'll need to:
1. Set up this Python server to start automatically on boot
2. Configure Edge/Chrome to open the frontend URL
3. Both the server and browser should run on the same machine

TIP: Use a Windows batch file or Task Scheduler to start
the Python server automatically when the machine boots.

================================================================
"""

# ================================================================
# SECTION 1: IMPORTS
# ================================================================

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
from datetime import datetime

# Import our configuration
from config import API_PORT, STORAGE_MODE, DEBUG_MODE

# Import storage modules
from storage_local import LocalStorage
from storage_google_drive import GoogleDriveStorage


# ================================================================
# SECTION 2: APP INITIALIZATION
# ================================================================

app = Flask(__name__)

# Enable CORS (Cross-Origin Resource Sharing)
# This allows the frontend to call the API from a different origin
# (e.g., frontend served from file:// or GitHub Pages)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # Allow all origins (tighten for production)
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


# ================================================================
# SECTION 3: STORAGE INITIALIZATION
# ================================================================

# Select storage backend based on configuration
if STORAGE_MODE == "googleDrive":
    storage = GoogleDriveStorage()
    print("[Backend] Using Google Drive storage")
else:
    storage = LocalStorage()
    print("[Backend] Using local filesystem storage")


# ================================================================
# SECTION 4: UTILITY FUNCTIONS
# ================================================================

def success_response(data=None, message=None):
    """
    Create a standard success response.
    
    Args:
        data: Optional data to include in response
        message: Optional message
    
    Returns:
        JSON response with status 'ok'
    """
    response = {"status": "ok"}
    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    return jsonify(response)


def error_response(message, status_code=400):
    """
    Create a standard error response.
    
    Args:
        message: Error message
        status_code: HTTP status code (default 400)
    
    Returns:
        JSON response with error status
    """
    response = {"status": "error", "message": message}
    return jsonify(response), status_code


def todo_response(endpoint_name):
    """
    Create a TODO placeholder response.
    
    Args:
        endpoint_name: Name of the endpoint
    
    Returns:
        JSON response indicating feature is not yet implemented
    """
    return jsonify({
        "status": "TODO",
        "message": f"Endpoint {endpoint_name} not yet implemented",
        "data": []
    })


# ================================================================
# SECTION 5: CONFIGURATION ENDPOINT
# ================================================================

@app.route('/api/config', methods=['GET'])
def get_config():
    """
    GET /api/config
    
    Returns the backend configuration.
    Frontend can use this to sync settings.
    
    Response:
    {
        "status": "ok",
        "data": {
            "storage_mode": "local",
            "api_version": "1.0.0",
            ...
        }
    }
    """
    config_data = {
        "storage_mode": STORAGE_MODE,
        "api_version": "1.0.0",
        "debug_mode": DEBUG_MODE,
        "server_time": datetime.now().isoformat()
    }
    return success_response(data=config_data)


# ================================================================
# SECTION 6: TEMPLE VISITS ENDPOINTS
# ================================================================

@app.route('/api/temple-visits', methods=['GET'])
def get_temple_visits():
    """
    GET /api/temple-visits
    
    Returns all temple visit records.
    
    TODO: Implement actual data loading from storage
    
    Response:
    {
        "status": "ok",
        "data": [
            { "id": 1, "date": "2024-01-15", "count": 5, "notes": "..." },
            ...
        ]
    }
    """
    # TODO: Load from storage
    # visits = storage.list_temple_visits()
    # return success_response(data=visits)
    
    # Placeholder response
    return success_response(data=[], message="Temple visits endpoint ready (no data yet)")


@app.route('/api/temple-visits', methods=['POST'])
def post_temple_visit():
    """
    POST /api/temple-visits
    
    Create a new temple visit record.
    
    Request body:
    {
        "date": "2024-01-15",
        "count": 5,
        "notes": "Great temple trip!"
    }
    
    TODO: Implement actual data saving to storage
    """
    data = request.get_json()
    
    if not data:
        return error_response("No data provided")
    
    # Validate required fields
    if 'date' not in data:
        return error_response("'date' field is required")
    
    # TODO: Save to storage
    # result = storage.save_temple_visit(data)
    # return success_response(data=result, message="Temple visit saved")
    
    # Placeholder response
    return todo_response("POST /api/temple-visits")


# ================================================================
# SECTION 7: SELFIES ENDPOINTS
# ================================================================

@app.route('/api/selfies', methods=['GET'])
def get_selfies():
    """
    GET /api/selfies
    
    Returns list of all selfie metadata.
    
    TODO: Implement actual selfie listing from storage
    
    Response:
    {
        "status": "ok",
        "data": [
            { "id": 1, "filename": "selfie_001.jpg", "timestamp": "...", "caption": "..." },
            ...
        ]
    }
    """
    # TODO: Load from storage
    # selfies = storage.list_selfies()
    # return success_response(data=selfies)
    
    return success_response(data=[], message="Selfies endpoint ready (no data yet)")


@app.route('/api/selfies', methods=['POST'])
def post_selfie():
    """
    POST /api/selfies
    
    Upload a new selfie.
    
    Request body:
    {
        "imageBase64": "data:image/jpeg;base64,...",
        "caption": "Optional caption"
    }
    
    TODO: Implement actual image saving to storage
    TODO: Handle large image uploads efficiently
    TODO: Add image validation and compression
    """
    data = request.get_json()
    
    if not data:
        return error_response("No data provided")
    
    if 'imageBase64' not in data:
        return error_response("'imageBase64' field is required")
    
    # TODO: Save to storage
    # result = storage.save_selfie(data['imageBase64'], data.get('caption', ''))
    # return success_response(data=result, message="Selfie saved")
    
    return todo_response("POST /api/selfies")


# ================================================================
# SECTION 8: MIRACLES ENDPOINTS (PHASE 2)
# ================================================================

@app.route('/api/miracles', methods=['GET'])
def get_miracles():
    """
    GET /api/miracles
    
    Returns all miracle stories.
    
    TODO: Implement when Phase 2 is ready
    """
    # TODO: Load from storage
    # miracles = storage.list_miracles()
    # return success_response(data=miracles)
    
    return success_response(data=[], message="Miracles endpoint ready (Phase 2)")


@app.route('/api/miracles', methods=['POST'])
def post_miracle():
    """
    POST /api/miracles
    
    Submit a new miracle story.
    
    Request body:
    {
        "title": "My miracle",
        "story": "This is what happened...",
        "author": "Anonymous"
    }
    
    TODO: Implement when Phase 2 is ready
    """
    data = request.get_json()
    
    if not data:
        return error_response("No data provided")
    
    # TODO: Save to storage
    return todo_response("POST /api/miracles")


# ================================================================
# SECTION 9: MISSIONS ENDPOINTS (PHASE 2)
# ================================================================

@app.route('/api/missions', methods=['GET'])
def get_missions():
    """
    GET /api/missions
    
    Returns all missionaries and their mission details.
    
    TODO: Implement when Phase 2 is ready
    
    Response:
    {
        "status": "ok",
        "data": [
            {
                "id": 1,
                "name": "Elder Smith",
                "mission": "Brazil São Paulo North",
                "startDate": "2024-01-15",
                "photoUrl": "...",
                "location": { "lat": -23.5505, "lng": -46.6333 }
            },
            ...
        ]
    }
    """
    # TODO: Load from storage
    return success_response(data=[], message="Missions endpoint ready (Phase 2)")


# ================================================================
# SECTION 10: CALENDAR ENDPOINTS (PHASE 2)
# ================================================================

@app.route('/api/calendar', methods=['GET'])
def get_calendar():
    """
    GET /api/calendar
    
    Returns ward calendar events.
    
    Query parameters:
    - start: Start date filter (YYYY-MM-DD)
    - end: End date filter (YYYY-MM-DD)
    
    TODO: Implement when Phase 2 is ready
    TODO: Consider Google Calendar integration
    """
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    # TODO: Load from storage/calendar API
    return success_response(data=[], message="Calendar endpoint ready (Phase 2)")


# ================================================================
# SECTION 11: TEMPLE PHOTOS ENDPOINT (FUTURE)
# ================================================================

@app.route('/api/temple-photos', methods=['GET'])
def get_temple_photos():
    """
    GET /api/temple-photos
    
    Returns list of temple photos for the screensaver.
    
    TODO: Implement dynamic photo loading
    TODO: Could load from local folder or Google Drive
    """
    # TODO: Scan photos directory and return list
    # photos = storage.list_temple_photos()
    # return success_response(data=photos)
    
    # For now, return empty list (frontend uses config.js photos)
    return success_response(data=[], message="Use frontend config for photos")


# ================================================================
# SECTION 12: HEALTH CHECK ENDPOINT
# ================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    GET /api/health
    
    Simple health check endpoint.
    Returns OK if server is running.
    """
    return success_response(message="Server is healthy")


# ================================================================
# SECTION 13: ERROR HANDLERS
# ================================================================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return error_response("Endpoint not found", 404)


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return error_response("Internal server error", 500)


# ================================================================
# SECTION 14: SERVER STARTUP
# ================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("WARD KIOSK BACKEND SERVER")
    print("=" * 60)
    print(f"Starting server on http://localhost:{API_PORT}")
    print(f"Storage mode: {STORAGE_MODE}")
    print(f"Debug mode: {DEBUG_MODE}")
    print("=" * 60)
    print("")
    print("Endpoints available:")
    print("  GET  /api/config        - Get configuration")
    print("  GET  /api/health        - Health check")
    print("  GET  /api/temple-visits - Get temple visits")
    print("  POST /api/temple-visits - Add temple visit")
    print("  GET  /api/selfies       - Get selfies")
    print("  POST /api/selfies       - Upload selfie")
    print("  GET  /api/miracles      - Get miracles (Phase 2)")
    print("  POST /api/miracles      - Add miracle (Phase 2)")
    print("  GET  /api/missions      - Get missionaries (Phase 2)")
    print("  GET  /api/calendar      - Get events (Phase 2)")
    print("")
    print("Press Ctrl+C to stop the server")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',  # Allow connections from any IP
        port=API_PORT,
        debug=DEBUG_MODE
    )
