/*******************************************************************************
 * 
 *  TEMPLE 365 - Google Apps Script Backend
 *  
 *  A 365-day temple attendance tracker with selfie mosaic
 *  
 *  SECTIONS:
 *    1. CONFIGURATION (Lines 20-35)
 *    2. WEB APP ENTRY POINT (Lines 40-75)
 *    3. SHEET HELPER FUNCTIONS (Lines 80-130)
 *    4. GET DATA FUNCTIONS - PRODUCTION (Lines 135-220)
 *    4B. GET DATA FUNCTIONS - TEST (Lines 225-310)
 *    5. SAVE/LOG FUNCTIONS (Lines 315-420)
 *    6. ADMIN FUNCTIONS (Lines 425-530)
 *    7. TEST FUNCTIONS (Lines 535-620)
 *    9. MOSAIC TESTING FUNCTIONS (Lines 625-950)
 * 
 ******************************************************************************/


/*******************************************************************************
 * SECTION 1: CONFIGURATION
 * 
 * Change these values to match your Google Drive folder and Sheet tab name
 ******************************************************************************/

var TEMPLE_SELFIE_FOLDER_ID = '1oA5lWlefTaHlhiD4MkbZ3ju3J8K2pNSE';
var LOG_SHEET_NAME = 'Temple365_Log';

// Test Configuration
var TEST_IMAGES_FOLDER_ID = '1ILU1giYt0WgB4yz-WRwbPZcaYeeJmDBZ';
var TEST_MOSAIC_OUTPUT_FOLDER_ID = '18wZWaqXjb23Z7eMrrQTPzlJ0d6ljsn7B';
var CHRIST_IMAGE_FILE_ID = '1BA3UETEMLEtUifK-YpSUc7QmGv21SIyr';
var TEST_SHEET_NAME = 'TEST_Mosaic_Log';

// Image IDs (for reference)
// Gilbert Temple Header: 1vWrG0PSB-velGLzNRJK1vB7pjkNNBwX1
// Gilbert Temple Background: 1CKBt5_gdrXXZ6MxJwJyVSSpKF4lgrffD
// Christ Mosaic Base: 1BA3UETEMLEtUifK-YpSUc7QmGv21SIyr


/*******************************************************************************
 * SECTION 2: WEB APP ENTRY POINT
 * 
 * doGet() is called when someone visits your web app URL
 * 
 * MODES:
 * - Production: https://script.google.com/.../exec
 * - Test: https://script.google.com/.../exec?mode=test
 ******************************************************************************/

function doGet(e) {
  var mode = (e && e.parameter && e.parameter.mode)
    ? String(e.parameter.mode).toLowerCase()
    : '';

  var isKiosk = (mode === 'kiosk');
  var isTest  = (mode === 'test');

  // Choose HTML file by mode
  var htmlFile = isKiosk ? 'IndexKiosk' : 'IndexStandalone';
  var template = HtmlService.createTemplateFromFile(htmlFile);

  template.isKiosk = isKiosk;

  if (isTest) {
    template.checkedVisits  = TEST_GetCheckedVisits();
    template.selfieData     = TEST_GetSelfieDataForMosaic();
    template.totalVisits    = TEST_GetTotalEntries();
    template.testMode       = true;
    template.testSheetName  = TEST_SHEET_NAME;
  } else {
    template.checkedVisits  = getCheckedVisits();
    template.selfieData     = getSelfieDataForMosaic();
    template.totalVisits    = getTotalEntries();
    template.testMode       = false;
    template.testSheetName  = '';
  }

  return template.evaluate()
    .setTitle('Temple 365' + (isTest ? ' [TEST]' : ''))
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}




/*******************************************************************************
 * SECTION 3: SHEET HELPER FUNCTIONS
 * 
 * Utilities for accessing the Google Sheet
 ******************************************************************************/

/**
 * Get the log sheet by name
 * Creates the sheet with headers if it doesn't exist
 */
function getLogSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(LOG_SHEET_NAME);
  
  // If sheet doesn't exist, create it with headers
  if (!sheet) {
    sheet = ss.insertSheet(LOG_SHEET_NAME);
    sheet.appendRow([
      'Timestamp',
      'VisitNumber',
      'Name',
      'FileId',
      'FileUrl',
      'GridPosition'
    ]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  
  return sheet;
}

/**
 * Setup/reset the sheet (run manually if needed)
 */
function setupSheet() {
  var sheet = getLogSheet();
  Logger.log('Sheet "' + LOG_SHEET_NAME + '" is ready.');
  Logger.log('Headers: Timestamp, VisitNumber, Name, FileId, FileUrl, GridPosition');
}


/*******************************************************************************
 * SECTION 4: GET DATA FUNCTIONS - PRODUCTION
 * 
 * Functions to retrieve data for the frontend (PRODUCTION MODE)
 ******************************************************************************/

/**
 * Get total number of entries (visits logged)
 */
function getTotalEntries() {
  var sheet = getLogSheet();
  var lastRow = sheet.getLastRow();
  return Math.max(0, lastRow - 1);  // Subtract header row
}

/**
 * Return a list of grid positions that have been checked
 * Used to show which checkboxes should be checked/locked
 */
function getCheckedVisits() {
  var sheet = getLogSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return [];

  // Column F contains GridPosition
  var data = sheet.getRange(2, 6, lastRow - 1, 1).getValues();
  var positions = [];
  
  for (var i = 0; i < data.length; i++) {
    var pos = data[i][0];
    if (pos && !isNaN(pos)) {
      positions.push(Number(pos));
    }
  }
  
  return positions;
}

/**
 * Get selfie data for the mosaic display
 * Returns array of objects with fileId and visitNumber
 */
function getSelfieDataForMosaic() {
  var sheet = getLogSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return [];
  
  // Get all data rows
  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var selfies = [];
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var visitNumber = row[1];  // Column B
    var name = row[2];         // Column C
    var fileId = row[3];       // Column D
    var gridPosition = row[5]; // Column F
    
    // Only include real images (skip obvious test placeholders)
    if (fileId && String(fileId).indexOf('test_') !== 0) {
      selfies.push({
        visitNumber: Number(visitNumber) || (i + 1),
        name: name || '',
        fileId: fileId,
        gridPosition: Number(gridPosition) || (i + 1)
      });
    }
  }
  
  return selfies;
}


/*******************************************************************************
 * SECTION 4B: GET DATA FUNCTIONS - TEST
 * 
 * Functions to retrieve TEST data for mosaic display (mirrors production functions)
 ******************************************************************************/

/**
 * Get TEST selfie data for the mosaic display
 * Returns array of objects with fileId and visitNumber from TEST sheet
 */
function TEST_GetSelfieDataForMosaic() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TEST_SHEET_NAME);
  
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }
  
  var lastRow = sheet.getLastRow();
  
  // Get all data rows from TEST sheet
  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var selfies = [];
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var visitNumber = row[1];  // Column B
    var name = row[2];         // Column C
    var fileId = row[3];       // Column D
    var gridPosition = row[5]; // Column F
    
    // Include all test images
    if (fileId) {
      selfies.push({
        visitNumber: Number(visitNumber) || (i + 1),
        name: name || '',
        fileId: fileId,
        gridPosition: Number(gridPosition) || (i + 1)
      });
    }
  }
  
  return selfies;
}

/**
 * Get TEST checked visits for checkbox display
 */
function TEST_GetCheckedVisits() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TEST_SHEET_NAME);
  
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }
  
  var lastRow = sheet.getLastRow();
  
  // Column F contains GridPosition
  var data = sheet.getRange(2, 6, lastRow - 1, 1).getValues();
  var positions = [];
  
  for (var i = 0; i < data.length; i++) {
    var pos = data[i][0];
    if (pos && !isNaN(pos)) {
      positions.push(Number(pos));
    }
  }
  
  return positions;
}

/**
 * Get TEST total entries count
 */
function TEST_GetTotalEntries() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TEST_SHEET_NAME);
  
  if (!sheet) {
    return 0;
  }
  
  var lastRow = sheet.getLastRow();
  return Math.max(0, lastRow - 1);  // Subtract header row
}


/*******************************************************************************
 * SECTION 5: SAVE/LOG FUNCTIONS
 * 
 * Functions to save temple check entries
 ******************************************************************************/

/**
 * Save a temple check entry
 * Called from the frontend form submission
 * 
 * Visit number is determined by the order of submission (sequential)
 * Grid position is the checkbox that was clicked
 * 
 * @param {Object} formObject - Contains name, gridPosition, and selfie file
 * @returns {Object} - Result with success status and details
 */
function saveTempleCheck(formObject) {
  try {
    var sheet = getLogSheet();

    // Extract and validate form data
    var name = (formObject.name || '').toString().trim();
    var gridPosition = parseInt(formObject.dayNumber, 10);  // This is actually grid position

    if (!name) {
      return { success: false, message: 'Name is required.' };
    }
    
    if (!gridPosition || isNaN(gridPosition) || gridPosition < 1) {
      return { success: false, message: 'Invalid grid position.' };
    }

    // ---------- OPTIONAL SELFIE HANDLING ----------
    var fileBlob = formObject.selfie;
    if (Array.isArray(fileBlob)) {
      fileBlob = fileBlob[0];
    }

    var fileId = '';
    var fileUrl = '';

    if (fileBlob) {
      var bytes = null;
      try {
        bytes = fileBlob.getBytes();
      } catch (e) {
        bytes = null;   // treat as no selfie if we can’t read it
      }

      if (bytes && bytes.length > 0) {
        var folder = DriveApp.getFolderById(TEMPLE_SELFIE_FOLDER_ID);

        var nowForFile = new Date();
        var timestampStr = Utilities.formatDate(
          nowForFile,
          Session.getScriptTimeZone(),
          'yyyyMMdd-HHmmss'
        );

        var safeName = name.replace(/[^\w\s-]/g, '').substring(0, 40) || 'TempleAttendee';

        var contentType = fileBlob.getContentType() || 'image/jpeg';
        var ext = '.jpg';
        if (contentType === 'image/png')       ext = '.png';
        else if (contentType === 'image/heic' ||
                 contentType === 'image/heif') ext = '.heic';
        else if (contentType === 'image/webp') ext = '.webp';

        var fileName = 'Visit' + (getTotalEntries() + 1) + '_' + safeName + '_' + timestampStr + ext;

        var file = folder.createFile(fileBlob);
        file.setName(fileName);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        fileId  = file.getId();
        fileUrl = file.getUrl();
      }
    }
    // ---------- END OPTIONAL SELFIE HANDLING ------

    // Calculate visit number (sequential)
    var visitNumber = getTotalEntries() + 1;

    // Append row: [Timestamp, VisitNumber, Name, FileId, FileUrl, GridPosition]
    var now = new Date();
    sheet.appendRow([
      now,
      visitNumber,
      name,
      fileId,
      fileUrl,
      gridPosition
    ]);

    return {
      success: true,
      message: 'Saved successfully.',
      visitNumber: visitNumber,
      gridPosition: gridPosition,
      name: name,
      fileId: fileId,
      fileUrl: fileUrl,
      hasSelfie: !!fileId
    };

  } catch (err) {
    Logger.log('Error in saveTempleCheck: ' + err.message);
    return {
      success: false,
      message: err.message || 'Unknown error occurred'
    };
  }
}
/*******************************************************************************
 * SECTION 5B: KIOSK SELFIE UPLOAD
 * 
 * Handles base64 image uploads from the kiosk webcam capture
 ******************************************************************************/

/**
 * Save a kiosk selfie (base64 image from webcam)
 * Called via HTTP POST from the kiosk selfie capture screen
 * 
 * @param {Object} e - Event object with postData
 * @returns {Object} - Result with success status and file info
 */
function doPost(e) {
  try {
    // Parse the incoming data
    var params = e.parameter;
    var action = params.action;
    
    // Route to appropriate handler
    if (action === 'saveKioskSelfie') {
      return saveKioskSelfie(params);
    }
    
    // Unknown action
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Unknown action: ' + action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    Logger.log('Error in doPost: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.message || 'Unknown error'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Save a selfie from kiosk webcam capture
 * 
 * @param {Object} params - Contains imageData (base64), timestamp
 * @returns {TextOutput} - JSON response
 */
function saveKioskSelfie(params) {
  try {
    var imageData = params.imageData;
    var timestamp = params.timestamp || new Date().toISOString();
    
    if (!imageData) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'No image data provided'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Decode base64 to blob
    var decodedImage = Utilities.base64Decode(imageData);
    var blob = Utilities.newBlob(decodedImage, 'image/jpeg', 'kiosk_selfie.jpg');
    
    // Get the selfie folder
    var folder = DriveApp.getFolderById(TEMPLE_SELFIE_FOLDER_ID);
    
    // Generate filename with timestamp
    var now = new Date();
    var timestampStr = Utilities.formatDate(
      now,
      Session.getScriptTimeZone(),
      'yyyyMMdd-HHmmss'
    );
    var fileName = 'KioskSelfie_' + timestampStr + '.jpg';
    
    // Create file in Drive
    var file = folder.createFile(blob);
    file.setName(fileName);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fileId = file.getId();
    var fileUrl = file.getUrl();
    
    // Log to sheet (optional - uses next visit number)
    var sheet = getLogSheet();
    var visitNumber = getTotalEntries() + 1;
    
    sheet.appendRow([
      now,
      visitNumber,
      'Kiosk Selfie',  // Name placeholder for kiosk selfies
      fileId,
      fileUrl,
      visitNumber  // Grid position
    ]);
    
    Logger.log('Kiosk selfie saved: ' + fileName + ' (ID: ' + fileId + ')');
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Selfie saved successfully',
      fileId: fileId,
      fileUrl: fileUrl,
      visitNumber: visitNumber
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    Logger.log('Error in saveKioskSelfie: ' + err.message);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.message || 'Failed to save selfie'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/*******************************************************************************
 * SECTION 6: ADMIN FUNCTIONS
 * 
 * Functions for administrators only - run from Script Editor
 ******************************************************************************/

/**
 * ADMIN ONLY: Clear a visit by visit number
 * Run from Script Editor: Run > adminClearVisit
 */
function adminClearVisit(visitNumber) {
  if (visitNumber === undefined) {
    var ui = SpreadsheetApp.getUi();
    var response = ui.prompt('Clear Visit', 'Enter the visit number to clear:', ui.ButtonSet.OK_CANCEL);
    
    if (response.getSelectedButton() !== ui.Button.OK) {
      return;
    }
    visitNumber = parseInt(response.getResponseText(), 10);
  }
  
  visitNumber = Number(visitNumber);
  
  if (!visitNumber || isNaN(visitNumber) || visitNumber < 1) {
    throw new Error('Invalid visit number: ' + visitNumber);
  }

  var sheet = getLogSheet();
  var data = sheet.getDataRange().getValues();
  var deletedCount = 0;

  for (var i = data.length - 1; i >= 1; i--) {
    var row = data[i];
    var rowVisit = row[1];
    var fileId = row[3];

    if (Number(rowVisit) === visitNumber) {
      if (fileId) {
        try {
          DriveApp.getFileById(fileId).setTrashed(true);
          Logger.log('Trashed file: ' + fileId);
        } catch (e) {
          Logger.log('Could not trash file ' + fileId + ': ' + e.message);
        }
      }
      
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }
  
  Logger.log('Cleared visit ' + visitNumber + ': ' + deletedCount + ' entries removed.');
  
  try {
    SpreadsheetApp.getUi().alert('Cleared ' + deletedCount + ' entries for Visit #' + visitNumber);
  } catch (e) {}
}

/**
 * ADMIN ONLY: Clear ALL data (use with caution!)
 */
function adminClearAllData() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Clear All Data',
    'This will delete ALL visit records and trash ALL selfie files. Are you sure?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  var sheet = getLogSheet();
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    ui.alert('No data to clear.');
    return;
  }
  
  // Get all file IDs and trash them
  var data = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
  var trashedCount = 0;
  
  for (var i = 0; i < data.length; i++) {
    var fileId = data[i][0];
    if (fileId) {
      try {
        DriveApp.getFileById(fileId).setTrashed(true);
        trashedCount++;
      } catch (e) {}
    }
  }
  
  // Delete all data rows
  sheet.deleteRows(2, lastRow - 1);
  
  ui.alert('Cleared ' + (lastRow - 1) + ' records and trashed ' + trashedCount + ' files.');
}

/**
 * ADMIN ONLY: View summary
 */
function adminViewSummary() {
  var totalVisits = getTotalEntries();
  var checkedPositions = getCheckedVisits();
  
  Logger.log('=== Temple 365 Summary ===');
  Logger.log('Total visits logged: ' + totalVisits);
  Logger.log('Grid positions filled: ' + checkedPositions.length);
  
  try {
    SpreadsheetApp.getUi().alert(
      'Temple 365 Summary\n\n' +
      'Total visits logged: ' + totalVisits + '\n' +
      'Grid positions filled: ' + checkedPositions.length + ' / 365'
    );
  } catch (e) {}
}


/*******************************************************************************
 * SECTION 7: TEST FUNCTIONS
 * 
 * Functions to test the mosaic with sample data
 ******************************************************************************/

/**
 * TEST: Add sample entries with placeholder images
 * Run this to test the mosaic display
 * 
 * @param {number} count - Number of test entries to add (default 10)
 */
function testAddSampleEntries(count) {
  count = count || 10;
  
  var sheet = getLogSheet();
  var folder = DriveApp.getFolderById(TEMPLE_SELFIE_FOLDER_ID);
  var currentTotal = getTotalEntries();
  
  // Sample names
  var names = ['John', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa', 'James', 'Emma', 'Robert', 'Anna'];
  
  for (var i = 0; i < count; i++) {
    var visitNumber = currentTotal + i + 1;
    var gridPosition = visitNumber;  // For testing, use sequential positions
    var name = names[i % names.length] + ' ' + (Math.floor(i / names.length) + 1);
    
    var now = new Date();
    var fakeFileId = 'test_' + visitNumber + '_' + now.getTime();
    
    sheet.appendRow([
      now,
      visitNumber,
      name,
      fakeFileId,
      'https://example.com/test',
      gridPosition
    ]);
  }
  
  Logger.log('Added ' + count + ' test entries. Total now: ' + (currentTotal + count));
  
  try {
    SpreadsheetApp.getUi().alert('Added ' + count + ' test entries.\nNote: These have fake file IDs for testing layout only.');
  } catch (e) {}
}

/**
 * TEST: Generate grid positions for 365 entries
 * This fills all 365 positions with test data
 */
function testFillAllPositions() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    'Fill All Positions',
    'This will add test entries for all 365 positions. Continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  var sheet = getLogSheet();
  var existingPositions = getCheckedVisits();
  var names = ['Brother Smith', 'Sister Jones', 'Elder Brown', 'Sister Davis', 'Brother Wilson'];
  var addedCount = 0;
  
  for (var pos = 1; pos <= 365; pos++) {
    if (existingPositions.indexOf(pos) === -1) {
      var visitNumber = getTotalEntries() + 1;
      var name = names[pos % names.length];
      var now = new Date();
      var fakeFileId = 'test_pos' + pos + '_' + now.getTime();
      
      sheet.appendRow([
        now,
        visitNumber,
        name,
        fakeFileId,
        'https://example.com/test',
        pos
      ]);
      
      addedCount++;
    }
  }
  
  ui.alert('Added ' + addedCount + ' test entries to fill remaining positions.');
}


/*******************************************************************************
 * SECTION 9: MOSAIC TESTING FUNCTIONS (TEMPORARY - FOR TESTING ONLY)
 * 
 * These functions create a progressive mosaic test without affecting
 * your production code or data. Safe to delete after testing.
 ******************************************************************************/

/**
 * MAIN TEST CONTROLLER - Version 1: Run from Script Editor
 * 
 * EASY METHOD: Just change the number below and run this function
 * 
 * Week 1: Set imageCount = 52
 * Week 2: Set imageCount = 104
 * Week 3: Set imageCount = 156
 * etc.
 */
function TEST_RunProgressiveMosaicTest() {
  
  // ========================================
  // CHANGE THIS NUMBER FOR EACH TEST:
  // ========================================
  var imageCount = 365;  // ← CHANGE THIS: 52, 104, 156, 208, 260, 312, 365
  // ========================================
  
  Logger.log('=== STARTING MOSAIC TEST ===');
  Logger.log('Processing ' + imageCount + ' images...');
  
  try {
    // Step 1: Populate test sheet with entries
    Logger.log('Step 1: Populating sheet entries...');
    TEST_PopulateSheetEntries(imageCount);
    Logger.log('✅ Sheet populated with ' + imageCount + ' entries');
    
    // Step 2: Generate the mosaic data
    Logger.log('Step 2: Generating mosaic data...');
    var mosaicFileId = TEST_GenerateCompositeMosaic(imageCount);
    Logger.log('✅ Mosaic data generated');
    
    // Step 3: Show results in log
    Logger.log('');
    Logger.log('=== TEST COMPLETE ===');
    Logger.log('Processed: ' + imageCount + ' images');
    Logger.log('Test sheet: "' + TEST_SHEET_NAME + '"');
    Logger.log('Mosaic file ID: ' + mosaicFileId);
    Logger.log('View mosaic data at:');
    Logger.log('https://drive.google.com/file/d/' + mosaicFileId + '/view');
    Logger.log('');
    Logger.log('Next steps:');
    Logger.log('1. Check the "' + TEST_SHEET_NAME + '" sheet in your spreadsheet');
    Logger.log('2. Verify all ' + imageCount + ' entries are there');
    Logger.log('3. Add ?mode=test to your web app URL to view test data');
    Logger.log('4. For next week, change imageCount to ' + (imageCount + 52) + ' and run again');
    
    return {
      success: true,
      imageCount: imageCount,
      mosaicFileId: mosaicFileId
    };
    
  } catch (error) {
    Logger.log('');
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log('');
    throw error;
  }
}

/**
 * ALTERNATIVE: Run from Spreadsheet Menu
 * This version DOES use UI prompts (run from spreadsheet, not script editor)
 */
function TEST_RunProgressiveMosaicTest_WithPrompt() {
  var ui = SpreadsheetApp.getUi();
  
  // Ask how many images to process this time
  var response = ui.prompt(
    'Progressive Mosaic Test',
    'How many test images should we process?\n\n' +
    'Suggestions:\n' +
    '- Week 1: 52 images\n' +
    '- Week 2: 104 images\n' +
    '- Week 3: 156 images\n' +
    '- Full year: 365 images',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  
  var imageCount = parseInt(response.getResponseText(), 10);
  
  if (!imageCount || imageCount < 1) {
    ui.alert('Please enter a valid number.');
    return;
  }
  
  ui.alert('Starting test with ' + imageCount + ' images.\n\nCheck the Apps Script logs for progress...');
  
  try {
    // Step 1: Populate test sheet with entries
    TEST_PopulateSheetEntries(imageCount);
    
    // Step 2: Generate the mosaic image
    var mosaicFileId = TEST_GenerateCompositeMosaic(imageCount);
    
    // Step 3: Show results
    ui.alert(
      'Test Complete! ✅\n\n' +
      'Processed: ' + imageCount + ' images\n' +
      'Test sheet: "' + TEST_SHEET_NAME + '"\n' +
      'Mosaic file ID: ' + mosaicFileId + '\n\n' +
      'Add ?mode=test to your web app URL to view test data'
    );
    
  } catch (error) {
    ui.alert('Error: ' + error.message);
  }
}

/**
 * Creates test entries in a separate sheet
 * Maps test images to sheet rows without touching production data
 */
function TEST_PopulateSheetEntries(imageCount) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TEST_SHEET_NAME);
  
  // Create test sheet if it doesn't exist
  if (!sheet) {
    Logger.log('Creating new test sheet: ' + TEST_SHEET_NAME);
    sheet = ss.insertSheet(TEST_SHEET_NAME);
    sheet.appendRow([
      'Timestamp',
      'VisitNumber', 
      'Name',
      'FileId',
      'FileUrl',
      'GridPosition'
    ]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    // Clear existing data (keep headers)
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      Logger.log('Clearing ' + (lastRow - 1) + ' existing test entries...');
      sheet.deleteRows(2, lastRow - 1);
    }
  }
  
  // Get test images from folder
  Logger.log('Loading test images from folder: ' + TEST_IMAGES_FOLDER_ID);
  var folder = DriveApp.getFolderById(TEST_IMAGES_FOLDER_ID);
  var files = folder.getFiles();
  var testImages = [];
  
  // Collect all test image file IDs
  while (files.hasNext() && testImages.length < imageCount) {
    var file = files.next();
    var mimeType = file.getMimeType();
    
    // Only include image files
    if (mimeType.indexOf('image/') === 0) {
      testImages.push({
        id: file.getId(),
        name: file.getName(),
        url: file.getUrl()
      });
    }
  }
  
  Logger.log('Found ' + testImages.length + ' image files in folder');
  
  // Check if we have enough images
  if (testImages.length < imageCount) {
    throw new Error(
      'Not enough test images! Found: ' + testImages.length + ', Needed: ' + imageCount + 
      '. Please add more images to folder: ' + TEST_IMAGES_FOLDER_ID
    );
  }
  
  // Sample family names for variety
  var names = [
    'Smith Family', 'Johnson Family', 'Williams Family', 'Brown Family',
    'Jones Family', 'Garcia Family', 'Miller Family', 'Davis Family',
    'Rodriguez Family', 'Martinez Family', 'Hernandez Family', 'Lopez Family',
    'Anderson Family', 'Thomas Family', 'Taylor Family', 'Moore Family',
    'Jackson Family', 'Martin Family', 'Lee Family', 'Thompson Family',
    'White Family', 'Harris Family', 'Clark Family', 'Lewis Family',
    'Robinson Family', 'Walker Family', 'Young Family', 'Allen Family',
    'King Family', 'Wright Family', 'Scott Family', 'Torres Family',
    'Nguyen Family', 'Hill Family', 'Flores Family', 'Green Family',
    'Adams Family', 'Nelson Family', 'Baker Family', 'Hall Family'
  ];
  
  // Populate sheet with test entries
  Logger.log('Adding ' + imageCount + ' entries to sheet...');
  var now = new Date();
  var rowsToAdd = [];
  
  for (var i = 0; i < imageCount; i++) {
    var visitNumber = i + 1;
    var testImage = testImages[i];
    var familyName = names[i % names.length];
    
    // Add some time variance (simulate entries over weeks)
    var daysAgo = Math.floor((imageCount - i) / 7); // Spread over weeks
    var timestamp = new Date(now.getTime() - daysAgo * 24 * 3600000);
    
    rowsToAdd.push([
      timestamp,
      visitNumber,
      familyName,
      testImage.id,
      testImage.url,
      visitNumber  // GridPosition matches VisitNumber for testing
    ]);
  }
  
  // Batch append for speed
  if (rowsToAdd.length > 0) {
    sheet.getRange(2, 1, rowsToAdd.length, 6).setValues(rowsToAdd);
  }
  
  Logger.log('✅ Successfully added ' + imageCount + ' entries to test sheet');
}

/**
 * Generates mosaic metadata file
 * This creates a data file that can be used by external mosaic generators
 */
function TEST_GenerateCompositeMosaic(imageCount) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TEST_SHEET_NAME);
  
  if (!sheet || sheet.getLastRow() < 2) {
    throw new Error('No test data found. Run TEST_PopulateSheetEntries first.');
  }
  
  Logger.log('Reading ' + imageCount + ' selfie entries from sheet...');
  
  // Get all selfie entries
  var data = sheet.getRange(2, 1, imageCount, 6).getValues();
  var selfies = [];
  
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    selfies.push({
      visitNumber: row[1],
      name: row[2],
      fileId: row[3],
      fileUrl: row[4],
      gridPosition: row[5]
    });
  }
  
  // Mosaic grid dimensions
  var COLS = 19;
  var ROWS = 25;
  
  Logger.log('Creating mosaic data file...');
  
  var mosaicFolder = DriveApp.getFolderById(TEST_MOSAIC_OUTPUT_FOLDER_ID);
  var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  var fileName = 'MosaicData_' + imageCount + 'photos_' + timestamp + '.json';
  
  // Create mosaic metadata
  var mosaicData = {
    generatedAt: new Date().toISOString(),
    imageCount: imageCount,
    gridSize: { 
      cols: COLS, 
      rows: ROWS,
      totalTiles: COLS * ROWS
    },
    baseImageFileId: CHRIST_IMAGE_FILE_ID,
    baseImageUrl: 'https://lh3.googleusercontent.com/d/' + CHRIST_IMAGE_FILE_ID + '=s1200',
    selfies: selfies,
    downloadLinks: {
      baseImage: 'https://drive.google.com/uc?export=download&id=' + CHRIST_IMAGE_FILE_ID
    },
    instructions: [
      'This file contains mosaic generation data',
      'Use external Python/JavaScript script to generate actual photomosaic',
      'Or import into web app to display live mosaic'
    ]
  };
  
  var file = mosaicFolder.createFile(
    fileName,
    JSON.stringify(mosaicData, null, 2),
    MimeType.PLAIN_TEXT
  );
  
  // Make file accessible
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  Logger.log('✅ Mosaic data file created: ' + file.getName());
  Logger.log('File ID: ' + file.getId());
  
  return file.getId();
}

/**
 * Quick function to view your test mosaic status
 */
function TEST_ViewMosaicStatus() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TEST_SHEET_NAME);
  
  if (!sheet) {
    Logger.log('No test data yet. Run TEST_RunProgressiveMosaicTest first.');
    return;
  }
  
  var totalEntries = Math.max(0, sheet.getLastRow() - 1);
  
  Logger.log('=== TEST MOSAIC STATUS ===');
  Logger.log('Test images logged: ' + totalEntries);
  Logger.log('Test sheet: "' + TEST_SHEET_NAME + '"');
  Logger.log('Status: Ready to generate mosaic');
  Logger.log('');
  
  return {
    totalEntries: totalEntries,
    sheetName: TEST_SHEET_NAME
  };
}

/**
 * CLEANUP - Removes all test data when you're done testing
 * Does NOT affect your production Temple365_Log sheet
 */
function TEST_CleanupAllTestData() {
  Logger.log('=== CLEANING UP TEST DATA ===');
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(TEST_SHEET_NAME);
  
  if (sheet) {
    ss.deleteSheet(sheet);
    Logger.log('✅ Test sheet "' + TEST_SHEET_NAME + '" deleted');
  } else {
    Logger.log('ℹ️ No test sheet found');
  }
  
  Logger.log('Cleanup complete');
}

/**
 * Add this to your existing onOpen function, or create a new one
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🕌 Temple 365 Testing')
    .addItem('▶️ Run Mosaic Test (with prompt)', 'TEST_RunProgressiveMosaicTest_WithPrompt')
    .addSeparator()
    .addItem('📊 View Test Status', 'TEST_ViewMosaicStatus')
    .addItem('🗑️ Cleanup Test Data', 'TEST_CleanupAllTestData')
    .addToUi();
}
/**
 * DEBUG: Test if data functions work
 * Run this from Script Editor
 */
function DEBUG_TestDataFunctions() {
  Logger.log('=== DEBUGGING TEST DATA FUNCTIONS ===');
  
  // Check if sheet exists
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var testSheet = ss.getSheetByName(TEST_SHEET_NAME);
  
  if (!testSheet) {
    Logger.log('❌ ERROR: TEST sheet does not exist!');
    Logger.log('Sheet name looking for: ' + TEST_SHEET_NAME);
    Logger.log('Run TEST_RunProgressiveMosaicTest first!');
    return;
  }
  
  Logger.log('✅ Test sheet exists: ' + TEST_SHEET_NAME);
  Logger.log('Last row: ' + testSheet.getLastRow());
  
  // Test the functions
  var totalEntries = TEST_GetTotalEntries();
  Logger.log('TEST_GetTotalEntries() returned: ' + totalEntries);
  
  var checkedVisits = TEST_GetCheckedVisits();
  Logger.log('TEST_GetCheckedVisits() returned: ' + checkedVisits.length + ' positions');
  Logger.log('First 10 positions: ' + JSON.stringify(checkedVisits.slice(0, 10)));
  
  var selfieData = TEST_GetSelfieDataForMosaic();
  Logger.log('TEST_GetSelfieDataForMosaic() returned: ' + selfieData.length + ' selfies');
  
  if (selfieData.length > 0) {
    Logger.log('First selfie: ' + JSON.stringify(selfieData[0]));
  }
  
  Logger.log('=== DEBUG COMPLETE ===');
}
/**
 * DEBUG: Check what doGet returns in test mode
 */
function DEBUG_CheckDoGetOutput() {
  Logger.log('=== DEBUGGING doGet OUTPUT ===');
  
  // Simulate test mode request
  var e = {
    parameter: {
      mode: 'test'
    }
  };
  
  Logger.log('Calling TEST_GetCheckedVisits()...');
  var checkedVisits = TEST_GetCheckedVisits();
  Logger.log('Result: ' + checkedVisits.length + ' positions');
  Logger.log('First 10: ' + JSON.stringify(checkedVisits.slice(0, 10)));
  
  Logger.log('Calling TEST_GetSelfieDataForMosaic()...');
  var selfieData = TEST_GetSelfieDataForMosaic();
  Logger.log('Result: ' + selfieData.length + ' selfies');
  if (selfieData.length > 0) {
    Logger.log('First selfie: ' + JSON.stringify(selfieData[0]));
  }
  
  Logger.log('Calling TEST_GetTotalEntries()...');
  var totalVisits = TEST_GetTotalEntries();
  Logger.log('Result: ' + totalVisits);
  
  Logger.log('');
  Logger.log('Creating template object...');
  var template = {
    checkedVisits: checkedVisits,
    selfieData: selfieData,
    totalVisits: totalVisits,
    testMode: true,
    testSheetName: TEST_SHEET_NAME
  };
  
  Logger.log('Template object created:');
  Logger.log('- checkedVisits length: ' + template.checkedVisits.length);
  Logger.log('- selfieData length: ' + template.selfieData.length);
  Logger.log('- totalVisits: ' + template.totalVisits);
  Logger.log('- testMode: ' + template.testMode);
  
  Logger.log('=== DEBUG COMPLETE ===');
}
