from django import forms
from .models import UserProfile, FamilyMember, Doctor, DoctorNote
from django.contrib.auth.models import User

class DoctorSignupForm(forms.ModelForm):
    doctor_password = forms.CharField(
        widget=forms.PasswordInput,
        min_length=6,
        label="Password"
    )

    class Meta:
        model = Doctor
        fields = [
            'doctor_doctor_id',
            'doctor_full_name',
            'doctor_email',
            'doctor_speciality',
            'doctor_phone',
        ]


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['name', 'age', 'gender', 'dob', 'phone', 'email', 'location', 'emergency_contact', 'photo', 'unique_id', 'patient_code']
        widgets = {
            'patient_code': forms.TextInput(attrs={
                'placeholder': '8-digit code',
                'inputmode': 'numeric',
                'pattern': r'\d{8}',
                'maxlength': '8',
                'autocomplete': 'off',
            })
        }

class FamilyMemberForm(forms.ModelForm):
    class Meta:
        model = FamilyMember
        fields = ['name', 'relationship', 'age', 'gender', 'location', 'photo']


class DoctorNoteForm(forms.ModelForm):
    class Meta:
        model = DoctorNote
        fields = ['title', 'medication_name', 'dosage', 'instructions', 'related_entry']
        widgets = {
            'title': forms.TextInput(attrs={'placeholder': 'Title (optional)'}),
            'medication_name': forms.TextInput(attrs={'placeholder': 'e.g., Atorvastatin'}),
            'dosage': forms.TextInput(attrs={'placeholder': 'e.g., 10 mg once daily'}),
            'instructions': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Notes / instructions'}),
        }
