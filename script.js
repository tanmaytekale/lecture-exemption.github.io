document.addEventListener('DOMContentLoaded', () => {
    const lectureContainer = document.getElementById('lecture-container');
    const addLectureBtn = document.getElementById('add-lecture-btn');
    const exemptionForm = document.getElementById('exemption-form');
    const currentDateSpan = document.getElementById('current-date');

    // Set current date
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateSpan.textContent = today.toLocaleDateString('en-US', options);

    // Generate 5-minute interval time options (6 AM to 6 PM)
    const timeDatalist = document.getElementById('time-options');
    for (let h = 6; h <= 18; h++) {
        for (let m = 0; m < 60; m += 15) {
            // Stop at 18:00 exactly
            if (h === 18 && m > 0) break;

            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            const option = document.createElement('option');
            option.value = `${hour}:${minute}`;
            timeDatalist.appendChild(option);
        }
    }



    let lectureCount = 1;

    // Helper to handle auto-end time logic
    function setupTimeAutoFill(startInput, endInput) {
        startInput.addEventListener('change', () => {
            if (!startInput.value) return;

            const [h, m] = startInput.value.split(':').map(Number);
            if (isNaN(h) || isNaN(m)) return;

            // Add 1 hour
            let endH = h + 1;
            let endM = m;

            // Handle day rollover if necessary (though strictly 6-18 constraint might prevent this need, good to have)
            if (endH >= 24) endH -= 24;

            const endHStr = endH.toString().padStart(2, '0');
            const endMStr = endM.toString().padStart(2, '0');

            // Set end time and trigger input event if needed
            endInput.value = `${endHStr}:${endMStr}`;
        });
    }

    // Initialize auto-fill for the first static entry
    const firstStartInput = document.querySelector('input[name="start_time[]"]');
    const firstEndInput = document.querySelector('input[name="end_time[]"]');
    if (firstStartInput && firstEndInput) {
        setupTimeAutoFill(firstStartInput, firstEndInput);
    }

    // Autofill Logic
    function setupAutofill(input, ghost, list) {
        if (!list) return;

        // Find the accept button in this wrapper
        const wrapper = input.parentElement;
        const acceptBtn = wrapper.querySelector('.autofill-accept');

        // Create or find Suggestion Preview element (for non-aligning matches)
        let preview = wrapper.parentElement.querySelector('.suggestion-preview');
        if (!preview) {
            preview = document.createElement('div');
            preview.className = 'suggestion-preview';
            wrapper.parentElement.appendChild(preview);
        }

        // Clean "Dr." or "Mr." for matching
        const cleanName = (str) => str.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)\s*/i, '');

        function acceptSuggestion() {
            if (ghost.hasAttribute('data-full-value')) {
                input.value = ghost.getAttribute('data-full-value');
                ghost.textContent = '';
                preview.textContent = ''; // Clear preview
                ghost.removeAttribute('data-full-value');
                if (acceptBtn) acceptBtn.classList.remove('visible');
                input.dispatchEvent(new Event('change'));
            }
        }

        if (acceptBtn) {
            acceptBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent focus loss issues
                acceptSuggestion();
            });
            // Touch support
            acceptBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                acceptSuggestion();
            });
        }

        input.addEventListener('input', function () {
            const val = this.value.toLowerCase().trim();
            ghost.textContent = '';
            preview.textContent = '';
            ghost.removeAttribute('data-full-value');
            if (acceptBtn) acceptBtn.classList.remove('visible');

            if (!val || val.length < 2) return; // Wait for 2 chars

            // Priority Matching
            let match = null;
            let matchType = ''; // 'prefix', 'cleaned_prefix', 'fuzzy'

            // 1. Exact Prefix (e.g. "Basics" -> "Basics of Calculus")
            match = list.find(item => item.toLowerCase().startsWith(val));
            if (match) {
                matchType = 'prefix';
            } else {
                // 2. Cleaned Prefix (e.g. "Suman" -> "Dr. Suman")
                match = list.find(item => cleanName(item).toLowerCase().startsWith(val));
                if (match) {
                    matchType = 'cleaned_prefix';
                } else {
                    // 3. Word Start (e.g. "Calc" -> "Basics of Calculus")
                    // Check if ANY word in the string starts with the input
                    match = list.find(item => {
                        const words = item.toLowerCase().split(/\s+/);
                        // Checks if "Calc" matches start of "Calculus"
                        return words.some(w => w.startsWith(val));
                    });

                    if (match) {
                        matchType = 'fuzzy';
                    } else {
                        // 4. Any Substring (e.g. "chem" -> "Chemistry")
                        // Usually covered by Word Start, but good fallback
                        match = list.find(item => item.toLowerCase().includes(val));
                        if (match) matchType = 'fuzzy';
                    }
                }
            }

            if (match) {
                // Store the full value to use on accept
                ghost.setAttribute('data-full-value', match);

                // Show Accept Button
                if (acceptBtn) acceptBtn.classList.add('visible');

                // Visual Feedback Strategy
                if (matchType === 'prefix') {
                    // Perfect alignment
                    ghost.textContent = match;
                } else if (matchType === 'cleaned_prefix') {
                    // Cleaned alignment (User: "Suman", Match: "Dr. Suman Madan")
                    const cleaned = cleanName(match);
                    if (cleaned.toLowerCase().startsWith(val)) {
                        ghost.textContent = cleaned;
                    } else {
                        // Fallback if logic fails unexpectedly
                        preview.textContent = `Suggested: ${match}`;
                    }
                } else {
                    // Fuzzy / Word Match (User: "Madan", Match: "Dr. Suman Madan")
                    // Cannot use ghost text. Show preview below.
                    preview.textContent = `Suggested: ${match}`;
                }
            }
        });

        input.addEventListener('keydown', function (e) {
            // Tab or Right Arrow to accept
            if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghost.hasAttribute('data-full-value')) {
                e.preventDefault();
                acceptSuggestion();
            }
        });

        // Clear on blur (Delayed to allow click)
        input.addEventListener('blur', () => {
            setTimeout(() => {
                ghost.textContent = '';
                preview.textContent = '';
                if (acceptBtn) acceptBtn.classList.remove('visible');
            }, 200);
        });
    }

    // Initialize Autofill for existing inputs
    const initCourseInput = document.querySelector('input[name="course_name[]"]');
    const initCourseGhost = initCourseInput.nextElementSibling;
    if (typeof COURSES !== 'undefined') setupAutofill(initCourseInput, initCourseGhost, COURSES);

    const initFacultyInput = document.querySelector('input[name="faculty_name[]"]');
    const initFacultyGhost = initFacultyInput.nextElementSibling;
    if (typeof FACULTIES !== 'undefined') setupAutofill(initFacultyInput, initFacultyGhost, FACULTIES);


    function createLectureEntry() {
        lectureCount++;

        const entryDiv = document.createElement('div');
        entryDiv.className = 'lecture-entry';
        entryDiv.innerHTML = `
            <div class="lecture-entry-header">
                <span class="lecture-count">Lecture #${lectureCount}</span>
                <button type="button" class="remove-btn" title="Remove Lecture">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="form-group">
                <label>Course Name</label>
                <div class="input-wrapper">
                    <input type="text" name="course_name[]" required autocomplete="off">
                    <span class="ghost-text"></span>
                    <div class="autofill-accept" title="Accept Suggestion">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>Faculty Name</label>
                <div class="input-wrapper">
                    <input type="text" name="faculty_name[]" required autocomplete="off">
                    <span class="ghost-text"></span>
                    <div class="autofill-accept" title="Accept Suggestion">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </div>
            </div>
            <div class="form-group">

                <label>Time Duration</label>
                <div class="time-range">
                    <div class="time-input-wrapper">
                        <input type="time" name="start_time[]" list="time-options" aria-label="Start Time" required step="900">
                    </div>
                    <div class="time-separator">to</div>
                    <div class="time-input-wrapper">
                        <input type="time" name="end_time[]" list="time-options" aria-label="End Time" required step="900">
                    </div>
                </div>
            </div>
        `;

        // Set default date
        // const dateInput = entryDiv.querySelector('input[name="lecture_date[]"]');
        // if (dateInput) dateInput.value = new Date().toISOString().split('T')[0]; // Removed as per instruction

        // Setup auto-fill for new inputs (Time)
        const startInput = entryDiv.querySelector('input[name="start_time[]"]');
        const endInput = entryDiv.querySelector('input[name="end_time[]"]');

        // Add step attribute for 15 min intervals (already in template, but keeping this for robustness if template changes)
        // startInput.setAttribute('step', '900'); // Removed as per instruction, already in template
        // endInput.setAttribute('step', '900'); // Removed as per instruction, already in template

        setupTimeAutoFill(startInput, endInput);

        // Setup Smart Autofill for new inputs (Course/Faculty)
        const courseInput = entryDiv.querySelector('input[name="course_name[]"]');
        const courseGhost = courseInput.nextElementSibling;
        if (typeof COURSES !== 'undefined') setupAutofill(courseInput, courseGhost, COURSES);

        const facultyInput = entryDiv.querySelector('input[name="faculty_name[]"]');
        const facultyGhost = facultyInput.nextElementSibling;
        if (typeof FACULTIES !== 'undefined') setupAutofill(facultyInput, facultyGhost, FACULTIES);

        const removeBtn = entryDiv.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            entryDiv.remove();
            updateLectureCounts();
        });

        lectureContainer.appendChild(entryDiv);
    }

    function updateLectureCounts() {
        const entries = lectureContainer.querySelectorAll('.lecture-entry');
        lectureCount = entries.length;
        entries.forEach((entry, index) => {
            const countSpan = entry.querySelector('.lecture-count');
            if (countSpan) {
                countSpan.textContent = `Lecture #${index + 1}`;
            }
        });
    }

    addLectureBtn.addEventListener('click', createLectureEntry);

    exemptionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = exemptionForm.querySelector('.btn-primary');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = `
            <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:0.5rem; animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
            Submitting...
        `;
        submitBtn.disabled = true;

        // Collect form data manually to structure it nicely
        const formData = new FormData(exemptionForm);
        const data = {
            personal: {
                name: formData.get('name'),
                app_id: formData.get('app_id')
            },
            lectures: [],
            reason: formData.get('reason')
        };

        // Extract arrays
        const courses = formData.getAll('course_name[]');
        const faculties = formData.getAll('faculty_name[]');
        const startTimes = formData.getAll('start_time[]');
        const endTimes = formData.getAll('end_time[]');
        // const dates = formData.getAll('lecture_date[]'); // Capture dates - Removed as per instruction

        courses.forEach((course, index) => {
            data.lectures.push({
                course: course,
                faculty: faculties[index],
                startTime: startTimes[index],
                endTime: endTimes[index],
                // date: dates[index] // Store raw YYYY-MM-DD - Removed as per instruction
            });
        });

        // Generate Flat Rows for SheetDB
        // We are moving away from "Daily Tabs" to one "Master Sheet" with a Date column.

        // 1. Get Form Values
        const name = data.personal.name;
        const appId = data.personal.app_id;
        const reason = data.reason;

        // 2. Calculate IST Date (DD-MM-YYYY)
        // using 'en-GB' gives DD/MM/YYYY, we enforce Asia/Kolkata timezone
        const istDate = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-');

        // 3. Build Row Objects
        // SheetDB expects an ARRAY of objects if we want to add multiple rows.
        // Each object represents one row in the Excel/Google Sheet.

        const payload = data.lectures.map((lecture, index) => {
            // Logic for "Merged" look: Only show Name/AppID/Reason on the FIRST row of the batch.
            // For subsequent lectures, leave those fields blank.
            const isFirst = index === 0;

            // Format Date: YYYY-MM-DD -> DD-MM-YYYY - Removed as per instruction
            // let formattedDate = "";
            // if (lecture.date) {
            //     const [y, m, d] = lecture.date.split('-');
            //     formattedDate = `${d}-${m}-${y}`;
            // }

            return {
                "Date": istDate, // Always send IST date
                "Name": isFirst ? name : "",
                "App ID": isFirst ? appId : "",
                "Course": lecture.course,
                "Faculty": lecture.faculty,
                "Lecture Timing": `${lecture.startTime} - ${lecture.endTime}`,
                "Reason": isFirst ? reason : ""
            };
        });

        // REPLACE THIS WITH YOUR SHEETDB API URL
        const SHEETDB_URL = "https://sheetdb.io/api/v1/ji96simaqki9d";

        try {
            console.log("Sending request to:", SHEETDB_URL);

            // SheetDB requires POST with a 'data' array for bulk insert
            // or just the array directly depending on the endpoint style. 
            // Standard API v1: POST /api/v1/{id} with body as JSON array.

            const response = await fetch(SHEETDB_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // SheetDB returns JSON with created/updated info
            const result = await response.json();
            console.log('Server response:', result);

            // SheetDB usually returns { created: N } or similar
            if (response.ok) {
                alert('Exemption request submitted successfully!');
                document.getElementById('exemption-form').reset();

                // Reset UI
                const dynamicEntries = lectureContainer.querySelectorAll('.lecture-entry:not(:first-child)');
                dynamicEntries.forEach(el => el.remove());
                lectureCount = 1;
                updateLectureCounts();

                const today = new Date();
                const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                document.getElementById('current-date').textContent = dateStr;
            } else {
                console.error('Submission failed:', result);
                alert('Error submitting request. Check console for details.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Network error. Please check your connection.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
});

// Add spin keyframes dynamically just in case
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
document.head.appendChild(styleSheet);
