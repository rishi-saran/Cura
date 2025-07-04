# Cura 🩺 – AI-Powered Post-Hospitalization Recovery Platform

Cura is a patient-centric web platform designed to support individuals recovering from hospitalization or chronic illnesses. It combines intelligent symptom tracking, real-time care dashboards, and secure communication between patients and doctors. Cura is built using Django and integrates features like chatbot assistance, journal logging, and personalized recovery analytics.

---

## 🌟 Features

- 🧠 **AI Chatbot**: Answers recovery-related queries using semantic search.
- 📅 **Daily Journal**: Patients log symptoms and recovery progress.
- 📊 **Doctor Dashboard**: Doctors view patient journals, including symptom graphs and timelines.
- 🔔 **Push Notifications**: Firebase-enabled reminders and alerts.
- 📈 **Graphical Reports**: Visual summaries of symptom severity and recovery milestones.
- 🔒 **Secure Access**: Role-based login for patients, doctors, and admins.

---

## 🛠️ Tech Stack

- **Backend**: Django (Python), SQLite
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **AI Integration**: OpenAI Embeddings + FAISS for retrieval-based chatbot
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Charting**: Matplotlib for symptom visualizations

---

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/Cura.git
   cd Cura


Set up a virtual environment:
python -m venv env
source env/bin/activate  # or env\Scripts\activate on Windows

Install dependencies:
pip install -r requirements.txt

Set up environment variables:
Create a .env file in the root directory with your OpenAI API key and Firebase config if needed.

Run migrations:
python manage.py migrate

Start the development server:
python manage.py runserver

📁 Project Structure
Cura/
├── health/             # Django project config
├── journal/            # Journal logging and reporting
├── chatbot/            # AI chatbot functionality
├── templates/          # HTML templates
├── static/             # Static files (JS, CSS, images)
├── manage.py
├── requirements.txt
└── .env                # Environment variables (not committed)

👨‍⚕️ Roles
Patient: Fills out daily journal and interacts with the AI chatbot.

Doctor: Reviews patient logs and symptom graphs.

Admin: Manages system-wide configuration and user accounts.

