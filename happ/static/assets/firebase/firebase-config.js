/* static/assets/firebase/firebase-config.js
   Firebase v8 + Firestore + FCM glue for CURA
*/

// --- Firebase config (yours) ---
var firebaseConfig = {
  apiKey: "AIzaSyA1y2pKLRctvf_CnoHPcEZPPZ74ynBt8vY",
  authDomain: "cura-notification-db-connect.firebaseapp.com",
  projectId: "cura-notification-db-connect",
  storageBucket: "cura-notification-db-connect.firebasestorage.app",
  messagingSenderId: "921372015026",
  appId: "1:921372015026:web:fb8aa6f30700b3ffa38cab",
  measurementId: "G-PBDGYGHXL1"
};

// Web Push (VAPID) public key (yours)
var VAPID_PUBLIC_KEY =
  "BEvrl8qalc2ijbI6Rpg3UyHY4nihaGfVtUwumGbrzsafGaBSkln1lVnFr_q5y6JtyybbS5gdn3AVC_tHc9LAZPA";

// --- Initialize Firebase safely (avoid re-init on navigations) ---
(function initFirebaseOnce() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    window.firebaseApp = firebase.app();
    window.db = firebase.firestore();
  } catch (e) {
    console.error("Firebase init failed:", e);
  }
})();

// Global edit state so inline onclick handlers always see it
if (typeof window.currentEditId === "undefined") {
  window.currentEditId = null;
}

document.addEventListener("DOMContentLoaded", function () {
  (async function setupMessaging() {
    try {
      if (!("serviceWorker" in navigator)) return;

      // Register at site root (must be served at /firebase-messaging-sw.js)
      var reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;

      // Ask permission
      var permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notifications permission not granted:", permission);
        return;
      }

      var messaging = firebase.messaging();

      // Foreground handler (tab is visible) -> explicitly show a notification
      messaging.onMessage(function (payload) {
        console.log("[FCM] foreground message:", payload);
        var n = payload.notification || {};
        var title = n.title || "CURA Reminder";
        var opts = {
          body: n.body || "You have a scheduled reminder.",
          icon: n.icon || "/static/assets/images/bell.png",
          data: payload.data || {}
        };
        // Only show if permission ok
        if (Notification.permission === "granted") {
          try { new Notification(title, opts); } catch (e) { console.warn("Notification error:", e); }
        }
      });

      // Get/save token
      var token = await messaging.getToken({
        vapidKey: VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: reg
      });

      var djangoUserId = (document.querySelector("body")?.dataset?.userId) || "";
      if (token && djangoUserId) {
        await window.db.collection("users").doc(String(djangoUserId))
          .set({ fcmToken: token }, { merge: true });
        console.log("✅ Saved FCM token for user", djangoUserId);
      }

      if (messaging.onTokenRefresh) {
        messaging.onTokenRefresh(async function () {
          try {
            var newToken = await messaging.getToken({
              vapidKey: VAPID_PUBLIC_KEY,
              serviceWorkerRegistration: reg
            });
            if (newToken && djangoUserId) {
              await window.db.collection("users").doc(String(djangoUserId))
                .set({ fcmToken: newToken }, { merge: true });
              console.log("🔄 Token refreshed and saved");
            }
          } catch (e) { console.error("Token refresh failed:", e); }
        });
      }
    } catch (err) {
      console.error("Firebase Messaging Error:", err);
    }
  })();

  // Load lists if page has a user
  var uid = (document.querySelector("body")?.dataset?.userId) || "";
  if (uid && typeof window.loadDynamicData === "function") {
    window.loadDynamicData(uid);
  }
});

/* ---------- CRUD HELPERS (EXPOSED ON window) ---------- */

window.saveReminder = async function saveReminder(type) {
  var djangoUserId = (document.querySelector("body")?.dataset?.userId) || "";
  if (!djangoUserId) return alert("You must be logged in.");

  var collectionName, modalId;
  var dataToSave = { userId: djangoUserId };

  try {
    if (type === "medication") {
      collectionName = "medicationSchedules";
      modalId = "medication-modal";
      dataToSave.name     = document.getElementById("med-name-input").value;
      dataToSave.dosage   = document.getElementById("med-dosage-input").value;
      dataToSave.program  = document.getElementById("med-program-input").value;
      dataToSave.quantity = document.getElementById("med-quantity-input").value;
      dataToSave.time     = document.getElementById("med-time-input").value;
    } else if (type === "appointment") {
      collectionName = "appointmentSchedules";
      modalId = "appointment-modal";
      dataToSave.doctor   = document.getElementById("appt-doctor-input").value;
      dataToSave.location = document.getElementById("appt-location-input").value;
      var localDate       = document.getElementById("appt-datetime-input").value;
      dataToSave.datetime = localDate ? new Date(localDate).toISOString() : "";
    } else if (type === "activity") {
      collectionName = "activitySchedules";
      modalId = "activity-modal";
      dataToSave.activity = document.getElementById("activity-name-input").value;
      dataToSave.duration = document.getElementById("activity-duration-input").value;
      dataToSave.time     = document.getElementById("activity-time-input").value;
    } else {
      return alert("Unknown type: " + type);
    }

    if (Object.values(dataToSave).some(function (v) { return v === ""; })) {
      return alert("Please fill out all fields.");
    }

    if (window.currentEditId) {
      await window.db.collection(collectionName).doc(window.currentEditId).update(dataToSave);
      alert("Reminder updated successfully!");
    } else {
      dataToSave.createdAt = new Date();
      dataToSave.status    = "pending";
      await window.db.collection(collectionName).add(dataToSave);
      alert("Reminder saved successfully!");
    }

    if (typeof window.closeModal === "function") window.closeModal(modalId);
    window.currentEditId = null;
  } catch (error) {
    console.error("ERROR SAVING REMINDER:", error);
    alert("There was an error saving your reminder.");
  }
};

window.openEditModal = async function openEditModal(type, docId) {
  window.currentEditId = docId;

  var collectionName, modalId;
  if (type === "medication")      { collectionName = "medicationSchedules";  modalId = "medication-modal"; }
  else if (type === "appointment"){ collectionName = "appointmentSchedules"; modalId = "appointment-modal"; }
  else if (type === "activity")   { collectionName = "activitySchedules";    modalId = "activity-modal"; }
  else return;

  var snap = await window.db.collection(collectionName).doc(docId).get();
  if (!snap.exists) return alert("Could not find reminder to edit.");
  var data = snap.data();

  if (type === "medication") {
    document.getElementById("med-name-input").value     = data.name     || "";
    document.getElementById("med-dosage-input").value   = data.dosage   || "";
    document.getElementById("med-program-input").value  = data.program  || "";
    document.getElementById("med-quantity-input").value = data.quantity || "";
    document.getElementById("med-time-input").value     = data.time     || "";
  } else if (type === "appointment") {
    document.getElementById("appt-doctor-input").value   = data.doctor   || "";
    document.getElementById("appt-location-input").value = data.location || "";
    document.getElementById("appt-datetime-input").value = data.datetime ? data.datetime.substring(0,16) : "";
  } else if (type === "activity") {
    document.getElementById("activity-name-input").value     = data.activity || "";
    document.getElementById("activity-duration-input").value = data.duration || "";
    document.getElementById("activity-time-input").value     = data.time     || "";
  }

  if (typeof window.openModal === "function") window.openModal(modalId);
};

window.deleteReminder = async function deleteReminder(type, docId) {
  if (!confirm("Are you sure you want to delete this reminder?")) return;
  var collectionName;
  if (type === "medication")      collectionName = "medicationSchedules";
  else if (type === "appointment")collectionName = "appointmentSchedules";
  else if (type === "activity")   collectionName = "activitySchedules";
  else return;

  try {
    await window.db.collection(collectionName).doc(docId).delete();
  } catch (error) { console.error("Error deleting reminder:", error); }
};

window.recordAction = async function recordAction(type, docId, action) {
  var collectionName;
  if (type === "medication")      collectionName = "medicationSchedules";
  else if (type === "appointment")collectionName = "appointmentSchedules";
  else if (type === "activity")   collectionName = "activitySchedules";
  else return;

  try {
    await window.db.collection(collectionName).doc(docId).update({ status: action });
    console.log("Reminder", docId, "=>", action);
  } catch (error) {
    console.error("Status update failed:", error);
    alert("Could not update status. See console.");
  }
};

/* ---------- Live list rendering ---------- */
window.loadDynamicData = function loadDynamicData(userId) {
  var emptyMessage = '<div class="empty-list-message"><p>Press the + button to add a new item.</p></div>';
  var handleError = function (error, container) {
    console.error("FIREBASE READ FAILED:", error);
    container.innerHTML = '<div class="empty-list-message"><p>Error loading data. Check console.</p></div>';
  };

  // Medications
  var medContainer = document.getElementById("medication-list-container");
  if (medContainer) {
    window.db.collection("medicationSchedules")
      .where("userId", "==", userId).orderBy("time")
      .onSnapshot(function (snapshot) {
        if (snapshot.empty) return medContainer.innerHTML = emptyMessage;
        medContainer.innerHTML = "";
        snapshot.forEach(function (d) {
          var s = d.data();
          medContainer.innerHTML += `
            <div class="template-card ${s.status === "Done" ? "done-card" : ""}">
              <div class="card-actions">
                <button class="icon-btn" aria-label="delete" onclick="deleteReminder('medication', '${d.id}')">
                  <svg class="icon" viewBox="0 0 24 24"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-5h6l1 2h4v2H2V4h4l1-2zM9 9h2v9H9V9zm4 0h2v9h-2V9z"/></svg>
                </button>
                <button class="icon-btn" aria-label="edit" onclick="openEditModal('medication', '${d.id}')">
                  <svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
              </div>
              <div class="card-body">
                <h2 class="card-title">${s.name || ""}</h2>
                <div class="card-details">
                  <p><strong>Time:</strong> ${s.time || ""}</p>
                  <p><strong>Dosage:</strong> ${s.dosage || ""}</p>
                  <p><strong>Program:</strong> ${s.program || ""}</p>
                </div>
              </div>
              <div class="card-footer">
                <button class="footer-btn done" onclick="recordAction('medication', '${d.id}', 'Done')">Done</button>
                <button class="footer-btn skip" onclick="recordAction('medication', '${d.id}', 'Skipped')">Skip</button>
              </div>
            </div>`;
        });
      }, function (err) { handleError(err, medContainer); });
  }

  // Appointments
  var apptContainer = document.getElementById("appointment-list-container");
  if (apptContainer) {
    window.db.collection("appointmentSchedules")
      .where("userId", "==", userId).orderBy("datetime", "desc")
      .onSnapshot(function (snapshot) {
        if (snapshot.empty) return apptContainer.innerHTML = emptyMessage;
        apptContainer.innerHTML = "";
        snapshot.forEach(function (d) {
          var s = d.data();
          var eventDate = s.datetime ? new Date(s.datetime) : null;
          apptContainer.innerHTML += `
            <div class="template-card ${s.status === "Done" ? "done-card" : ""}">
              <div class="card-actions">
                <button class="icon-btn" aria-label="delete" onclick="deleteReminder('appointment', '${d.id}')">
                  <svg class="icon" viewBox="0 0 24 24"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-5h6l1 2h4v2H2V4h4l1-2zM9 9h2v9H9V9zm4 0h2v9h-2V9z"/></svg>
                </button>
                <button class="icon-btn" aria-label="edit" onclick="openEditModal('appointment', '${d.id}')">
                  <svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
              </div>
              <div class="card-body">
                <h2 class="card-title">${s.doctor || ""}</h2>
                <div class="card-details">
                  <p><strong>Date:</strong> ${eventDate ? eventDate.toDateString() : ""}</p>
                  <p><strong>Time:</strong> ${eventDate ? eventDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ""}</p>
                  <p><strong>Location:</strong> ${s.location || ""}</p>
                </div>
              </div>
              <div class="card-footer">
                <button class="footer-btn done" onclick="recordAction('appointment', '${d.id}', 'Done')">Done</button>
                <button class="footer-btn skip" onclick="recordAction('appointment', '${d.id}', 'Skipped')">Skip</button>
              </div>
            </div>`;
        });
      }, function (err) { handleError(err, apptContainer); });
  }

  // Activities
  var actContainer = document.getElementById("activity-list-container");
  if (actContainer) {
    window.db.collection("activitySchedules")
      .where("userId", "==", userId).orderBy("time")
      .onSnapshot(function (snapshot) {
        if (snapshot.empty) return actContainer.innerHTML = emptyMessage;
        actContainer.innerHTML = "";
        snapshot.forEach(function (d) {
          var s = d.data();
          actContainer.innerHTML += `
            <div class="template-card ${s.status === "Done" ? "done-card" : ""}">
              <div class="card-actions">
                <button class="icon-btn" aria-label="delete" onclick="deleteReminder('activity', '${d.id}')">
                  <svg class="icon" viewBox="0 0 24 24"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-5h6l1 2h4v2H2V4h4l1-2zM9 9h2v9H9V9zm4 0h2v9h-2V9z"/></svg>
                </button>
                <button class="icon-btn" aria-label="edit" onclick="openEditModal('activity', '${d.id}')">
                  <svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                </button>
              </div>
              <div class="card-body">
                <h2 class="card-title">${s.activity || ""}</h2>
                <div class="card-details">
                  <p><strong>Time:</strong> ${s.time || ""}</p>
                  <p><strong>Duration:</strong> ${s.duration || ""}</p>
                </div>
              </div>
              <div class="card-footer">
                <button class="footer-btn done" onclick="recordAction('activity', '${d.id}', 'Done')">Done</button>
                <button class="footer-btn skip" onclick="recordAction('activity', '${d.id}', 'Skipped')">Skip</button>
              </div>
            </div>`;
        });
      }, function (err) { handleError(err, actContainer); });
  }
};
