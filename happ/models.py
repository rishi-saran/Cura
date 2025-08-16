from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_new = models.BooleanField(default=True)

    def __str__(self):
        return self.user.username

class Doctor(models.Model):
    doctor_user = models.OneToOneField(User, on_delete=models.CASCADE)
    doctor_doctor_id = models.CharField(max_length=20, unique=True)
    doctor_full_name = models.CharField(max_length=100)
    doctor_email = models.EmailField()
    doctor_speciality = models.CharField(max_length=100)
    doctor_phone = models.CharField(max_length=15, blank=True, null=True)
    unique_id = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"Dr. {self.doctor_full_name} ({self.doctor_speciality})"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    gender = models.CharField(max_length=20)
    dob = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    location = models.CharField(max_length=200)
    emergency_contact = models.CharField(max_length=15)
    photo = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    assigned_doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True)
    unique_id = models.CharField(max_length=50, null=True, blank=True)
    is_new = models.BooleanField(default=True)


    def __str__(self):
        return self.name

class FamilyMember(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="family_members")
    name = models.CharField(max_length=100)
    relationship = models.CharField(max_length=50)
    age = models.IntegerField()
    gender = models.CharField(max_length=20)
    location = models.CharField(max_length=200, null=True, blank=True)
    photo = models.ImageField(upload_to='family_photos/', null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.relationship})"

class JournalEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    family_member = models.ForeignKey(FamilyMember, on_delete=models.CASCADE, null=True, blank=True)  # ✅ Supports both main user and family
    timestamp = models.DateTimeField(default=timezone.now)

    pain_level = models.CharField(max_length=255, default="No Data")
    energy_level = models.CharField(max_length=255, default="No Data")
    breath = models.CharField(max_length=255, default="No Data")
    chest_pain = models.CharField(max_length=255, default="No Data")
    physical_activity = models.CharField(max_length=255, default="No Data")
    stress_level = models.CharField(max_length=255, default="No Data")
    swelling = models.CharField(max_length=255, default="No Data")
    emergency = models.CharField(max_length=255, default="No Data")
    extra_note = models.TextField(blank=True)

    def __str__(self):
        subject = self.family_member.name if self.family_member else self.user.username
        return f"{subject} – {self.timestamp.strftime('%Y-%m-%d')}"
    
class DoctorNote(models.Model):
    patient        = models.ForeignKey(User, on_delete=models.CASCADE)
    family_member  = models.ForeignKey('FamilyMember', null=True, blank=True, on_delete=models.CASCADE)
    doctor         = models.ForeignKey('Doctor', on_delete=models.CASCADE)

    title          = models.CharField(max_length=150, blank=True)
    medication_name = models.CharField(max_length=150, blank=True)
    dosage         = models.CharField(max_length=150, blank=True)
    instructions   = models.TextField(blank=True)

    # Optional link to the exact journal entry this note is about
    related_entry  = models.ForeignKey('JournalEntry', null=True, blank=True, on_delete=models.SET_NULL)

    timestamp      = models.DateTimeField(default=timezone.now)

    def __str__(self):
        subject = self.family_member.name if self.family_member else self.patient.username
        return f"Note for {subject} – {self.timestamp.strftime('%Y-%m-%d %H:%M')}"