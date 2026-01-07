const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const csv = require('csv-parser');
const xlsx = require('xlsx');

const app = express();
const PORT = 3000;
const CSV_FILE = path.join(__dirname, 'Member-log.csv');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Cache for member details: App ID -> { Name, Year, Role }
const memberCache = {};

// Load CSV Data on Startup
function loadMemberData() {
    fs.createReadStream(CSV_FILE)
        .pipe(csv())
        .on('data', (data) => {
            const cleanData = {};
            Object.keys(data).forEach(key => {
                cleanData[key.trim()] = data[key];
            });

            if (cleanData['App ID']) {
                memberCache[cleanData['App ID']] = {
                    Name: cleanData['Name'], // Fetch Name from CSV
                    Year: cleanData['Year'],
                    Role: cleanData['Role']
                };
            }
        })
        .on('end', () => {
            console.log('Member data loaded. Total members:', Object.keys(memberCache).length);
        });
}

loadMemberData();

// Get formatted date string DD-MM-YYYY
function getFormattedDate() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Get daily file paths
function getDailyPaths() {
    const dateStr = getFormattedDate();
    const listsDir = path.join(__dirname, 'lists');

    // Ensure lists directory exists
    if (!fs.existsSync(listsDir)) {
        fs.mkdirSync(listsDir);
    }

    return {
        json: path.join(listsDir, `exemption_requests_${dateStr}.json`),
        xlsx: path.join(listsDir, `NASA HERC 2026 - Team Mushak Exemption list (${dateStr}).xlsx`)
    };
}

// Function to regenerate Daily Excel
function regenerateDailyExcel() {
    const { json: jsonPath, xlsx: xlsxPath } = getDailyPaths();

    // Read current daily JSON
    if (!fs.existsSync(jsonPath)) {
        return; // Nothing to generate
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    let requests = [];
    try {
        requests = JSON.parse(rawData);
    } catch (e) {
        console.error("Error parsing JSON:", e);
        return;
    }

    // Format data for Excel
    const excelData = [];
    requests.forEach((req, index) => {
        // Master Lookup: Use App ID to get details from CSV
        // If not found, fall back to "Unknown" or request data (though request name is unreliable per user)
        const member = memberCache[req.personal.app_id] || { Name: 'Unknown', Year: 'Unknown', Role: 'Unknown' };

        req.lectures.forEach((lec, lecIndex) => {
            const isFirst = lecIndex === 0;
            excelData.push({
                'Sr. No.': isFirst ? index + 1 : '',
                'Name': isFirst ? member.Name : '', // Use CSV Name
                'App ID': isFirst ? req.personal.app_id : '',
                'Year': isFirst ? member.Year : '',
                'Role': isFirst ? member.Role : '',
                'Course': lec.course,
                'Faculty': lec.faculty,
                'Lecture Timing': `${lec.startTime}-${lec.endTime}`,
                'Reason': isFirst ? req.reason : ''
            });
        });
    });

    // Create Workbook
    const wb = xlsx.utils.book_new();
    // Use header array to ensure order matches sample sheet
    const ws = xlsx.utils.json_to_sheet(excelData, {
        header: ['Sr. No.', 'Name', 'App ID', 'Year', 'Role', 'Course', 'Faculty', 'Lecture Timing', 'Reason']
    });

    // Adjust column widths (approx)
    const wscols = [
        { wch: 8 },  // Sr No
        { wch: 20 }, // Name
        { wch: 10 }, // App ID
        { wch: 10 }, // Year
        { wch: 20 }, // Role
        { wch: 20 }, // Course
        { wch: 20 }, // Faculty
        { wch: 15 }, // Lecture Timing
        { wch: 40 }  // Reason
    ];
    ws['!cols'] = wscols;

    xlsx.utils.book_append_sheet(wb, ws, "Exemptions");
    xlsx.writeFile(wb, xlsxPath);
    console.log(`Excel updated: ${xlsxPath}`);
}

app.post('/submit', (req, res) => {
    const paths = getDailyPaths();

    // Ensure JSON file exists
    if (!fs.existsSync(paths.json)) {
        fs.writeFileSync(paths.json, JSON.stringify([], null, 2));
    }

    const newRequest = {
        id: Date.now(),
        submittedAt: new Date().toISOString(),
        ...req.body
    };

    try {
        // Append to JSON
        const rawData = fs.readFileSync(paths.json, 'utf8');
        const requests = JSON.parse(rawData);
        requests.push(newRequest);
        fs.writeFileSync(paths.json, JSON.stringify(requests, null, 2));

        console.log('Request saved to:', paths.json);

        // Regenerate Excel
        regenerateDailyExcel();

        res.json({ success: true, message: 'Request saved and Excel updated' });
    } catch (err) {
        console.error('Error saving request:', err);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Daily Files:', getDailyPaths());
});
