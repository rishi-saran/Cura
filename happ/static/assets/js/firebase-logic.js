




// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1y2pKLRctvf_CnoHPcEZPPZ74ynBt8vY",
  authDomain: "cura-notification-db-connect.firebaseapp.com",
  projectId: "cura-notification-db-connect",
  storageBucket: "cura-notification-db-connect.firebasestorage.app",
  messagingSenderId: "921372015026",
  appId: "1:921372015026:web:fb8aa6f30700b3ffa38cab",
  measurementId: "G-PBDGYGHXL1"
};

// happ/static/assets/js/firebase-logic.js


// --- DO NOT EDIT BELOW THIS LINE ---

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let currentEditId = null;

function openModal(modalId) {
    if (!currentEditId) {
        document.querySelector(`#${modalId}`).querySelectorAll('input').forEach(input => input.value = '');
    }
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

document.addEventListener('DOMContentLoaded', async function() {
    const body = document.querySelector('body');
    const djangoUserId = body.dataset.userId;
    if (!djangoUserId) return;

    try {
        const messaging = firebase.messaging();
        await messaging.requestPermission();
        const fcmToken = await messaging.getToken();
        if (fcmToken) {
            const userDocRef = db.collection('users').doc(djangoUserId);
            await userDocRef.set({ fcmToken: fcmToken }, { merge: true });
        }
    } catch (err) { console.error('Firebase Messaging Error:', err); }
    
    loadDynamicData(djangoUserId);
});

async function saveReminder(type) {
    const djangoUserId = document.querySelector('body').dataset.userId;
    if (!djangoUserId) return alert("You must be logged in.");
    let collectionName, modalId;
    let dataToSave = { userId: djangoUserId };

    try {
        if (type === 'medication') {
            collectionName = 'medicationSchedules';
            modalId = 'medication-modal';
            dataToSave.name = document.getElementById('med-name-input').value;
            dataToSave.dosage = document.getElementById('med-dosage-input').value;
            dataToSave.program = document.getElementById('med-program-input').value;
            dataToSave.quantity = document.getElementById('med-quantity-input').value;
            dataToSave.time = document.getElementById('med-time-input').value;
        } else if (type === 'appointment') {
            collectionName = 'appointmentSchedules';
            modalId = 'appointment-modal';
            dataToSave.doctor = document.getElementById('appt-doctor-input').value;
            dataToSave.location = document.getElementById('appt-location-input').value;
            const localDate = document.getElementById('appt-datetime-input').value;
            dataToSave.datetime = new Date(localDate).toISOString();
        } else if (type === 'activity') {
            collectionName = 'activitySchedules';
            modalId = 'activity-modal';
            dataToSave.activity = document.getElementById('activity-name-input').value;
            dataToSave.duration = document.getElementById('activity-duration-input').value;
            dataToSave.time = document.getElementById('activity-time-input').value;
        }
        if (Object.values(dataToSave).some(val => val === "")) return alert("Please fill out all fields.");
        
        if (currentEditId) {
            await db.collection(collectionName).doc(currentEditId).update(dataToSave);
            alert("Reminder updated successfully!");
        } else {
            dataToSave.createdAt = new Date();
            dataToSave.status = 'pending';
            await db.collection(collectionName).add(dataToSave);
            alert("Reminder saved successfully!");
        }
        closeModal(modalId);
        currentEditId = null;
    } catch (error) { console.error("ERROR SAVING REMINDER:", error); }
}

async function openEditModal(type, docId) {
    currentEditId = docId;
    let collectionName, modalId;
    if (type === 'medication') { collectionName = 'medicationSchedules'; modalId = 'medication-modal'; }
    if (type === 'appointment') { collectionName = 'appointmentSchedules'; modalId = 'appointment-modal'; }
    if (type === 'activity') { collectionName = 'activitySchedules'; modalId = 'activity-modal'; }

    const doc = await db.collection(collectionName).doc(docId).get();
    if (!doc.exists) return alert("Could not find reminder to edit.");
    const data = doc.data();

    if (type === 'medication') {
        document.getElementById('med-name-input').value = data.name || '';
        document.getElementById('med-dosage-input').value = data.dosage || '';
        document.getElementById('med-program-input').value = data.program || '';
        document.getElementById('med-quantity-input').value = data.quantity || '';
        document.getElementById('med-time-input').value = data.time || '';
    } else if (type === 'appointment') {
        document.getElementById('appt-doctor-input').value = data.doctor || '';
        document.getElementById('appt-location-input').value = data.location || '';
        document.getElementById('appt-datetime-input').value = data.datetime ? data.datetime.substring(0, 16) : '';
    } else if (type === 'activity') {
        document.getElementById('activity-name-input').value = data.activity || '';
        document.getElementById('activity-duration-input').value = data.duration || '';
        document.getElementById('activity-time-input').value = data.time || '';
    }
    openModal(modalId);
}

async function deleteReminder(type, docId) {
    if (!confirm("Are you sure you want to delete this reminder?")) return;
    let collectionName;
    if (type === 'medication') collectionName = 'medicationSchedules';
    if (type === 'appointment') collectionName = 'appointmentSchedules';
    if (type === 'activity') collectionName = 'activitySchedules';
    try {
        await db.collection(collectionName).doc(docId).delete();
    } catch (error) { console.error("Error deleting reminder: ", error); }
}

async function recordAction(type, docId, action) {
    let collectionName;
    if (type === 'medication') collectionName = 'medicationSchedules';
    if (type === 'appointment') collectionName = 'appointmentSchedules';
    if (type === 'activity') collectionName = 'activitySchedules';
    try {
        await db.collection(collectionName).doc(docId).update({ status: action });
    } catch (error) { console.error(`Error marking as ${action}: `, error); }
}


function loadDynamicData(userId) {
    const emptyMessage = '<div class="empty-list-message"><p>Press the + button to add a new item.</p></div>';
    const handleError = (error, container) => {
        console.error("FIREBASE READ FAILED:", error);
        container.innerHTML = `<div class="empty-list-message"><p>Error loading data. Check console.</p></div>`;
    };

    const medContainer = document.getElementById('medication-list-container');
    if (medContainer) {
        db.collection('medicationSchedules').where('userId', '==', userId).orderBy('time').onSnapshot(snapshot => {
            if (snapshot.empty) return medContainer.innerHTML = emptyMessage;
            medContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const s = doc.data();
                // 👇 This new variable determines the card's class based on its status 👇
                const statusClass = s.status === 'Done' ? 'done-card' : (s.status === 'Skipped' ? 'skipped-card' : '');
                medContainer.innerHTML += `
                    <div class="template-card ${statusClass}">
                        <div class="card-actions">
                            <button class="icon-btn" aria-label="delete" onclick="deleteReminder('medication', '${doc.id}')">
                                <svg class="icon" viewBox="0 0 24 24"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-5h6l1 2h4v2H2V4h4l1-2zM9 9h2v9H9V9zm4 0h2v9h-2V9z"/></svg>
                            </button>
                            <button class="icon-btn" aria-label="edit" onclick="openEditModal('medication', '${doc.id}')">
                                <svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                        </div>
                        <div class="card-body">
                            <h2 class="card-title">${s.name}</h2>
                            <div class="card-details">
                                <p><strong>Time:</strong> ${s.time}</p>
                                <p><strong>Dosage:</strong> ${s.dosage}</p>
                                <p><strong>Program:</strong> ${s.program}</p>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="footer-btn done" onclick="recordAction('medication', '${doc.id}', 'Done')">Done</button>
                            <button class="footer-btn skip" onclick="recordAction('medication', '${doc.id}', 'Skipped')">Skip</button>
                        </div>
                    </div>`;
            });
        }, error => handleError(error, medContainer));
    }

    const apptContainer = document.getElementById('appointment-list-container');
    if (apptContainer) {
        db.collection('appointmentSchedules').where('userId', '==', userId).orderBy('datetime', 'desc').onSnapshot(snapshot => {
            if (snapshot.empty) return apptContainer.innerHTML = emptyMessage;
            apptContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const s = doc.data();
                const eventDate = new Date(s.datetime);
                const statusClass = s.status === 'Done' ? 'done-card' : (s.status === 'Skipped' ? 'skipped-card' : '');
                apptContainer.innerHTML += `
                    <div class="template-card ${statusClass}">
                         <div class="card-actions">
                            <button class="icon-btn" aria-label="delete" onclick="deleteReminder('appointment', '${doc.id}')">
                                <svg class="icon" viewBox="0 0 24 24"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-5h6l1 2h4v2H2V4h4l1-2zM9 9h2v9H9V9zm4 0h2v9h-2V9z"/></svg>
                            </button>
                            <button class="icon-btn" aria-label="edit" onclick="openEditModal('appointment', '${doc.id}')">
                                <svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                        </div>
                        <div class="card-body">
                            <h2 class="card-title">${s.doctor}</h2>
                            <div class="card-details">
                                <p><strong>Date:</strong> ${eventDate.toDateString()}</p>
                                <p><strong>Time:</strong> ${eventDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                <p><strong>Location:</strong> ${s.location}</p>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="footer-btn done" onclick="recordAction('appointment', '${doc.id}', 'Done')">Done</button>
                            <button class="footer-btn skip" onclick="recordAction('appointment', '${doc.id}', 'Skipped')">Skip</button>
                        </div>
                    </div>`;
            });
        }, error => handleError(error, apptContainer));
    }

    const activityContainer = document.getElementById('activity-list-container');
    if (activityContainer) {
        db.collection('activitySchedules').where('userId', '==', userId).orderBy('time').onSnapshot(snapshot => {
            if (snapshot.empty) return activityContainer.innerHTML = emptyMessage;
            activityContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const s = doc.data();
                const statusClass = s.status === 'Done' ? 'done-card' : (s.status === 'Skipped' ? 'skipped-card' : '');
                activityContainer.innerHTML += `
                     <div class="template-card ${statusClass}">
                         <div class="card-actions">
                            <button class="icon-btn" aria-label="delete" onclick="deleteReminder('activity', '${doc.id}')">
                                <svg class="icon" viewBox="0 0 24 24"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-5h6l1 2h4v2H2V4h4l1-2zM9 9h2v9H9V9zm4 0h2v9h-2V9z"/></svg>
                            </button>
                            <button class="icon-btn" aria-label="edit" onclick="openEditModal('activity', '${doc.id}')">
                                <svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                        </div>
                        <div class="card-body">
                            <h2 class="card-title">${s.activity}</h2>
                            <div class="card-details">
                                <p><strong>Time:</strong> ${s.time}</p>
                                <p><strong>Duration:</strong> ${s.duration}</p>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="footer-btn done" onclick="recordAction('activity', '${doc.id}', 'Done')">Done</button>
                            <button class="footer-btn skip" onclick="recordAction('activity', '${doc.id}', 'Skipped')">Skip</button>
                        </div>
                    </div>`;
            });
        }, error => handleError(error, activityContainer));
    }
}