-- Migration to add medical business template fields to booking_configurations
ALTER TABLE public.booking_configurations
  ADD COLUMN IF NOT EXISTS medical_config JSONB DEFAULT '{
    "branch": "",
    "address": "",
    "google_map_link": "",
    "contact_phone": "",
    "emergency_phone": "",
    "working_hours": "",
    "doctors": [
      {
        "id": "dr_a",
        "name": "Dr. A",
        "department": "General",
        "type": "In-person",
        "languages": "Somali, English",
        "duration": "30",
        "max_patients": "10",
        "status": "Active"
      },
      {
        "id": "dr_b",
        "name": "Dr. B",
        "department": "Pediatrics",
        "type": "In-person",
        "languages": "Somali",
        "duration": "30",
        "max_patients": "10",
        "status": "Active"
      }
    ],
    "booking_rules": {
      "one_per_day": true,
      "same_day_allowed": true,
      "booking_closure_hours": 1,
      "max_advance_days": 7,
      "auto_assign_doctor": true
    },
    "emergency_keywords": ["emergency", "bleeding", "severe pain", "accident", "unconscious", "degdeg"],
    "emergency_message": "This appears to be an emergency. Please stop this booking and contact our emergency line immediately at {{emergency_phone}} or visit the nearest ER.",
    "notifications": {
      "whatsapp_confirmation": true,
      "appointment_summary": true,
      "reminder_24h": true
    },
    "legal_notice": "This chatbot does not provide medical diagnosis. For emergencies, contact the hospital directly."
  }'::jsonb;

-- Comment for the new column
COMMENT ON COLUMN public.booking_configurations.medical_config IS 'Storage for expanded medical-specific settings including doctors, rules, and emergency handling.';
