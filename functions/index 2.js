// functions/index.js

// This is the modern (v2) way to import and define a scheduled function
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();

// This function runs automatically in the cloud every minute
exports.sendReminders = onSchedule({
    schedule: "every 1 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1" 
}, async (event) => {
    
    // This creates a new Date object correctly localized to India Standard Time
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    console.log(`Checker running. Correct local time is ${currentTime} in Asia/Kolkata`);
    
    const db = admin.firestore();
    const remindersToSend = [];

    // --- Check Medication & Activity Schedules ---
    const medSnapshot = await db.collection("medicationSchedules").where("time", "==", currentTime).get();
    medSnapshot.forEach(doc => remindersToSend.push({ ...doc.data(), type: 'medication' }));

    const activitySnapshot = await db.collection("activitySchedules").where("time", "==", currentTime).get();
    activitySnapshot.forEach(doc => remindersToSend.push({ ...doc.data(), type: 'activity' }));
    
    // --- Check Appointment Schedules ---
    const startOfMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);
    const endOfMinute = new Date(startOfMinute.getTime() + 59999);
    const appointmentSnapshot = await db.collection("appointmentSchedules")
        .where('datetime', '>=', startOfMinute.toISOString())
        .where('datetime', '<=', endOfMinute.toISOString())
        .get();
    appointmentSnapshot.forEach(doc => {
        remindersToSend.push({ ...doc.data(), type: 'appointment' });
    });

    // --- Process and Send Notifications ---
    if (remindersToSend.length > 0) {
        console.log(`Found ${remindersToSend.length} reminders to send.`);
    }

    for (const schedule of remindersToSend) {
        if (!schedule.userId) continue;

        const userDoc = await db.collection('users').doc(String(schedule.userId)).get();
        if (!userDoc.exists || !userDoc.data().fcmToken) continue;

        const fcmToken = userDoc.data().fcmToken;
        let title = '', body = '';

        if (schedule.type === 'medication') {
            title = '💊 Medication Reminder';
            body = `Time for your ${schedule.name} (${schedule.dosage}).`;
        } else if (schedule.type === 'activity') {
            title = '🏃 Activity Reminder';
            body = `Time for your ${schedule.activity} for ${schedule.duration}.`;
        } else if (schedule.type === 'appointment') {
            title = '🗓️ Appointment Reminder';
            body = `Your appointment with Dr. ${schedule.doctor} is starting now.`;
        }

        await sendNotification(fcmToken, title, body);
    }
    return null;
});

async function sendNotification(fcmToken, title, body) {
    const payload = { notification: { title, body, sound: "default" } };
    try {
        await admin.messaging().sendToDevice(fcmToken, payload);
        console.log("✅ Notification sent successfully.");
    } catch (error) {
        console.error("❌ Error sending notification:", error);
    }
}