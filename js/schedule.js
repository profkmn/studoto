// DOM Elements
const weeklySchedule = document.getElementById('weeklySchedule');
const importCSVBtn = document.getElementById('importCSVBtn');
const exportCalendarBtn = document.getElementById('exportCalendarBtn');

// Days of the week for the schedule
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Initialize the weekly schedule
function initWeeklySchedule() {
    weeklySchedule.innerHTML = '';
    
    weekdays.forEach(day => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        dayColumn.innerHTML = `
            <div class="day-header">${day}</div>
            <div class="class-list" data-day="${day.toLowerCase()}"></div>
        `;
        weeklySchedule.appendChild(dayColumn);
    });
    
    loadClasses();
}

// Load classes from Firestore
function loadClasses() {
    if (!auth.currentUser) return;
    
    db.collection('classes')
        .where('userId', '==', auth.currentUser.uid)
        .orderBy('startTime')
        .onSnapshot(snapshot => {
            // Clear all class lists
            document.querySelectorAll('.class-list').forEach(list => {
                list.innerHTML = '';
            });
            
            // Add classes to their respective days
            snapshot.forEach(doc => {
                const classData = doc.data();
                const dayList = document.querySelector(`.class-list[data-day="${classData.day}"]`);
                
                if (dayList) {
                    const classItem = document.createElement('div');
                    classItem.className = 'class-item';
                    classItem.innerHTML = `
                        <div class="class-name">${classData.name} ${classData.code ? `(${classData.code})` : ''}</div>
                        <div class="class-time">${formatTime(classData.startTime)} - ${formatTime(classData.endTime)}</div>
                        ${classData.location ? `<div class="class-location">${classData.location}</div>` : ''}
                        <button class="delete-class" data-id="${doc.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    
                    dayList.appendChild(classItem);
                }
            });
            
            // Add event listeners to delete buttons
            document.querySelectorAll('.delete-class').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const classId = button.dataset.id;
                    if (confirm('Are you sure you want to delete this class?')) {
                        db.collection('classes').doc(classId).delete()
                            .catch(error => {
                                console.error('Error deleting class:', error);
                                alert('Failed to delete class');
                            });
                    }
                });
            });
        });
}

// Format time from HH:MM to 12-hour format
function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
}

// Import classes from CSV
importCSVBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const csvData = event.target.result;
            const classes = parseCSV(csvData);
            
            // Add classes to Firestore
            const batch = db.batch();
            const classesRef = db.collection('classes');
            
            classes.forEach(classData => {
                if (isValidClass(classData)) {
                    const newClassRef = classesRef.doc();
                    batch.set(newClassRef, {
                        ...classData,
                        userId: auth.currentUser.uid
                    });
                }
            });
            
            batch.commit()
                .then(() => {
                    alert(`Successfully imported ${classes.length} classes`);
                })
                .catch(error => {
                    console.error('Error importing classes:', error);
                    alert('Failed to import classes');
                });
        };
        
        reader.readAsText(file);
    };
    
    input.click();
});

// Parse CSV data
function parseCSV(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const obj = {};
        const currentLine = lines[i].split(',');
        
        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentLine[j] ? currentLine[j].trim() : '';
        }
        
        // Map CSV fields to our class structure
        if (obj.day && obj.start && obj.end) {
            result.push({
                name: obj.name || obj.class || '',
                code: obj.code || '',
                day: obj.day.toLowerCase(),
                startTime: obj.start,
                endTime: obj.end,
                location: obj.location || obj.room || ''
            });
        }
    }
    
    return result;
}

// Validate class data
function isValidClass(classData) {
    return (
        classData.name &&
        classData.day && weekdays.map(d => d.toLowerCase()).includes(classData.day) &&
        classData.startTime && isValidTime(classData.startTime) &&
        classData.endTime && isValidTime(classData.endTime)
    );
}

// Validate time format (HH:MM)
function isValidTime(time) {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

// Export to Google Calendar
exportCalendarBtn.addEventListener('click', () => {
    if (!auth.currentUser) return;
    
    db.collection('classes')
        .where('userId', '==', auth.currentUser.uid)
        .get()
        .then(snapshot => {
            const events = [];
            
            snapshot.forEach(doc => {
                const classData = doc.data();
                events.push(classToCalendarEvent(classData));
            });
            
            if (events.length === 0) {
                alert('No classes to export');
                return;
            }
            
            // Create ICS file
            const icsContent = generateICS(events);
            downloadFile('class_schedule.ics', icsContent);
        })
        .catch(error => {
            console.error('Error exporting classes:', error);
            alert('Failed to export classes');
        });
});

// Convert class data to calendar event format
function classToCalendarEvent(classData) {
    // Create a sample event for the current week
    const now = new Date();
    const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
    const targetDay = weekdays.indexOf(classData.day.charAt(0).toUpperCase() + classData.day.slice(1));
    
    // Calculate the date of the next occurrence of this class day
    let daysToAdd = (targetDay - currentDay + 7) % 7;
    if (daysToAdd === 0 && isTimeBeforeNow(classData.startTime)) {
        daysToAdd = 7; // Move to next week if class time already passed today
    }
    
    const eventDate = new Date(now);
    eventDate.setDate(now.getDate() + daysToAdd);
    
    const [startHour, startMinute] = classData.startTime.split(':').map(Number);
    const [endHour, endMinute] = classData.endTime.split(':').map(Number);
    
    const startTime = new Date(eventDate);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(eventDate);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    return {
        title: `${classData.name}${classData.code ? ` (${classData.code})` : ''}`,
        description: classData.location ? `Location: ${classData.location}` : '',
        start: startTime,
        end: endTime,
        location: classData.location || ''
    };
}

// Check if time is before current time
function isTimeBeforeNow(time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    return hours < now.getHours() || (hours === now.getHours() && minutes < now.getMinutes());
}

// Generate ICS file content
function generateICS(events) {
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//UniScheduler//EN'
    ];
    
    events.forEach(event => {
        icsContent.push(
            'BEGIN:VEVENT',
            `DTSTART:${formatDateToICS(event.start)}`,
            `DTEND:${formatDateToICS(event.end)}`,
            `SUMMARY:${event.title}`,
            event.description ? `DESCRIPTION:${event.description}` : '',
            event.location ? `LOCATION:${event.location}` : '',
            'END:VEVENT'
        );
    });
    
    icsContent.push('END:VCALENDAR');
    return icsContent.join('\n');
}

// Format date for ICS (YYYYMMDDTHHMMSSZ)
function formatDateToICS(date) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
}

// Download file helper
function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize schedule when user logs in
auth.onAuthStateChanged(user => {
    if (user) {
        initWeeklySchedule();
    }
});