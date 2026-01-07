# Lecture Exemption Agent

This project is a web-based form for submitting lecture exemption requests. It is designed to be hosted on **GitHub Pages** with a backend powered by **Google Sheets**.

## 🚀 Deployment Guide

### Phase 1: Set up the Backend (Google Sheets)

1.  **Create a Google Sheet**:
    *   Go to [sheets.google.com](https://sheets.google.com) and create a new blank sheet.
    *   Name it `Exemption Database`.

2.  **Create Sheets (Tabs)**:
    *   Rename `Sheet1` to **`Exemptions`**.
    *   Add a new sheet and name it **`Database`**.

3.  **Prepare the Database**:
    *   Open your local `Member-log.csv` file.
    *   Copy **ALL** the data.
    *   Paste it into the **`Database`** sheet starting at cell **A1**.
    *   *Ensure columns are*: `Sr. No.`, `Name`, `App ID`, `Year`, `Role`.

4.  **Prepare the Exemptions Sheet**:
    *   Go to the **`Exemptions`** sheet.
    *   In the first row (A1 to I1), create these headers:
        `Sr. No.`, `Name`, `App ID`, `Year`, `Role`, `Course`, `Faculty`, `Lecture Timing`, `Reason`.

5.  **Add the Script**:
    *   In the Google Sheet, go to **Extensions** > **Apps Script**.
    *   Delete any code in the editor (`myFunction`).
    *   Open the file `GoogleAppsScript.gs` from this project folder.
    *   Copy the code and paste it into the Apps Script editor.

6.  **Deploy**:
    *   Click the blue **Deploy** button > **New deployment**.
    *   Click the **Select type** (gear icon) > **Web app**.
    *   **Description**: "Exemption Backend".
    *   **Execute as**: `Me`.
    *   **Who has access**: **`Anyone`** (This is crucial for the form to work).
    *   Click **Deploy**.
    *   **Authorize** the script (Click Review permissions > Choose account > Advanced > Go to (Unsafe) > Allow).
    *   **Copy the Web App URL** (starts with `https://script.google.com/macros/s/...`).

### Phase 2: Connect the Frontend

1.  Open `script.js` in this folder.
2.  Find the line:
    ```javascript
    const SCRIPT_URL = 'INSERT_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
    ```
3.  Replace the placeholder with your **copied Web App URL**.
4.  Save the file.

### Phase 3: Push to GitHub

1.  Create a new repository on GitHub (e.g., `lecture-exemption`).
2.  In this folder, open a terminal:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/lecture-exemption.git
    git push -u origin main
    ```
3.  **Enable GitHub Pages**:
    *   Go to your Repo Settings > **Pages**.
    *   Under **Source**, select `main` branch.
    *   Click **Save**.

Your form will be live at `https://YOUR_USERNAME.github.io/lecture-exemption/`!
