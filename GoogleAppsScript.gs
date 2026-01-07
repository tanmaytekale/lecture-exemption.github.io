/**
 * NASA HERC 2026 - Exemption Agent Backend
 * 
 * Instructions:
 * 1. Create a new Google Sheet.
 * 2. Create two tabs: "Exemptions" and "Database".
 * 3. In "Database", import your Member-log.csv (Columns: Sr. No., Name, App ID, Year, Role).
 * 4. In "Exemptions", set header row: Sr. No., Name, App ID, Year, Role, Course, Faculty, Lecture Timing, Reason.
 * 5. Extensions > Apps Script > Paste this code.
 * 6. Deploy > New Deployment > Type: Web App > Who has access: Anyone.
 * 7. Copy the Web App URL and paste it into script.js.
 */

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const exSheet = sheet.getSheetByName("Exemptions");
    const dbSheet = sheet.getSheetByName("Database");
    
    // Parse Request
    const data = JSON.parse(e.postData.contents);
    const appId = String(data.personal.app_id).trim(); // Ensure string for comparison
    
    // 1. LOOKUP USER in "Database"
    // Assuming App ID is in Column C (Index 2) of Database sheet
    // And columns are: Sr, Name, App ID, Year, Role
    const dbData = dbSheet.getDataRange().getValues();
    let userDetails = { Name: "Unknown", Year: "Unknown", Role: "Unknown" };
    
    // Skip header row (i=1)
    for (let i = 1; i < dbData.length; i++) {
      if (String(dbData[i][2]).trim() === appId) {
        userDetails.Name = dbData[i][1];
        userDetails.Year = dbData[i][3];
        userDetails.Role = dbData[i][4];
        break;
      }
    }
    
    // 2. GENERATE ROWS
    // Calculate next Sr. No. based on last row in Exemptions
    const lastRow = exSheet.getLastRow();
    const nextSrNo = lastRow === 0 ? 1 : lastRow; // Simple counter approximation
    
    let newRows = [];
    
    data.lectures.forEach((lec, index) => {
      const isFirst = index === 0;
      let row = [];
      
      // Column Mapping:
      // 0: Sr. No., 1: Name, 2: App ID, 3: Year, 4: Role, 5: Course, 6: Faculty, 7: Lecture Timing, 8: Reason
      
      if (isFirst) {
        row.push(nextSrNo);
        row.push(userDetails.Name);
        row.push(appId);
        row.push(userDetails.Year);
        row.push(userDetails.Role);
      } else {
        // Empty cells for merge effect
        row.push("");
        row.push("");
        row.push("");
        row.push("");
        row.push("");
      }
      
      row.push(lec.course);
      row.push(lec.faculty);
      row.push(`${lec.startTime}-${lec.endTime}`);
      
      if (isFirst) {
        row.push(data.reason);
      } else {
        row.push("");
      }
      
      // Timestamp (Optional, maybe add as 10th column)
      // row.push(new Date()); 
      
      newRows.push(row);
    });
    
    // 3. APPEND TO SHEET
    if (newRows.length > 0) {
      exSheet.getRange(lastRow + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": lastRow + 1 }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Handle CORS for GET requests (optional browser check)
function doGet(e) {
  return ContentService.createTextOutput("Backend is running.");
}
