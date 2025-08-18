const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

const TIMEZONE = 'Asia/Kolkata';

function minuteKey(d) {
  return d.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
}

function hhmmNowInTZ() {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false
  });
  const parts = fmt.formatToParts(new Date());
  const hh = parts.find(p => p.type === 'hour').value;
  const mm = parts.find(p => p.type === 'minute').value;
  return `${hh}:${mm}`;
}

async function notifyUser(userId, title, body, linkPath = '/notifications') {
  if (!userId) return;
  const userSnap = await db.collection('users').doc(String(userId)).get();
  const token = userSnap.exists ? userSnap.get('fcmToken') : null;
  if (!token) return;

  const message = {
    token,
    notification: { title, body },
    webpush: { fcmOptions: { link: linkPath } }
  };

  try {
    await messaging.send(message);
  } catch (e) {
    console.error(`FCM send failed for user ${userId}:`, e.code || e.message);
  }
}

exports.checkDueReminders = functions.pubsub
  .schedule('* * * * *')
  .timeZone(TIMEZONE)
  .onRun(async () => {
    const now = new Date();
    const nowKey = minuteKey(now);
    const nowHHMM = hhmmNowInTZ();

    const medsSnap = await db.collection('medicationSchedules')
      .where('time', '==', nowHHMM)
      .get();

    const medJobs = medsSnap.docs.map(async doc => {
      const d = doc.data();
      if (d.lastNotifiedMin === nowKey) return;
      await notifyUser(d.userId, 'Medication reminder',
        `${d.name || 'Medication'} at ${d.time}`);
      await doc.ref.set({ lastNotifiedMin: nowKey }, { merge: true });
    });

    const actSnap = await db.collection('activitySchedules')
      .where('time', '==', nowHHMM)
      .get();

    const actJobs = actSnap.docs.map(async doc => {
      const d = doc.data();
      if (d.lastNotifiedMin === nowKey) return;
      await notifyUser(d.userId, 'Activity reminder',
        `${d.activity || 'Activity'} at ${d.time}`);
      await doc.ref.set({ lastNotifiedMin: nowKey }, { merge: true });
    });

    const startIso = new Date(Math.floor(now.getTime() / 60000) * 60000).toISOString();
    const endIso   = new Date(Math.floor(now.getTime() / 60000) * 60000 + 59999).toISOString();

    const apptSnap = await db.collection('appointmentSchedules')
      .where('datetime', '>=', startIso)
      .where('datetime', '<=', endIso)
      .get();

    const apptJobs = apptSnap.docs.map(async doc => {
      const d = doc.data();
      if (d.lastNotifiedMin === nowKey) return;
      const when = new Date(d.datetime).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' });
      await notifyUser(d.userId, 'Appointment reminder',
        `${d.doctor || 'Appointment'} at ${when}`, '/appointments');
      await doc.ref.set({ lastNotifiedMin: nowKey }, { merge: true });
    });

    await Promise.all([...medJobs, ...actJobs, ...apptJobs]);
    return null;
  });
