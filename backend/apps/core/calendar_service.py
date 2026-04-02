import json
import os
from datetime import timedelta
from django.conf import settings


def _get_service():
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        creds_json = getattr(settings, "GOOGLE_SERVICE_ACCOUNT_JSON", None)
        creds_path = getattr(settings, "GOOGLE_SERVICE_ACCOUNT_FILE", None)

        if creds_json:
            info = json.loads(creds_json)
            creds = service_account.Credentials.from_service_account_info(
                info, scopes=["https://www.googleapis.com/auth/calendar"]
            )
        elif creds_path and os.path.exists(creds_path):
            creds = service_account.Credentials.from_service_account_file(
                creds_path, scopes=["https://www.googleapis.com/auth/calendar"]
            )
        else:
            return None

        return build("calendar", "v3", credentials=creds)
    except Exception as e:
        print(f"[CALENDAR] Not configured: {e}")
        return None


def create_calendar_event(session):
    service = _get_service()
    if not service:
        print("[CALENDAR] Skipping — no credentials configured")
        return None

    start_dt    = session.scheduled_at
    end_dt      = start_dt + timedelta(minutes=session.duration_mins)
    calendar_id = getattr(settings, "GOOGLE_CALENDAR_ID", "primary")

    event = {
        "summary": f"MindMate: {session.student.get_full_name()} & {session.counselor.get_full_name()}",
        "description": f"Counseling session via MindMate.\nCase: {session.case or 'General'}\nNotes: {session.notes or ''}",
        "location": session.location or "Online",
        "start": {"dateTime": start_dt.isoformat(), "timeZone": "Africa/Kigali"},
        "end":   {"dateTime": end_dt.isoformat(),   "timeZone": "Africa/Kigali"},
        "attendees": [
            {"email": session.student.email,   "displayName": session.student.get_full_name()},
            {"email": session.counselor.email, "displayName": session.counselor.get_full_name()},
        ],
        "conferenceData": {
            "createRequest": {
                "requestId": f"mindmate-{session.id}",
                "conferenceSolutionKey": {"type": "hangoutsMeet"},
            }
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email",  "minutes": 24 * 60},
                {"method": "popup",  "minutes": 30},
            ],
        },
    }

    try:
        created   = service.events().insert(
            calendarId=calendar_id, body=event,
            conferenceDataVersion=1, sendUpdates="all",
        ).execute()
        meet_link = created.get("conferenceData", {}).get("entryPoints", [{}])[0].get("uri", "")
        return {
            "event_id":   created["id"],
            "event_link": created.get("htmlLink", ""),
            "meet_link":  meet_link,
        }
    except Exception as e:
        print(f"[CALENDAR ERROR] {e}")
        return None


def cancel_calendar_event(event_id):
    if not event_id:
        return
    service = _get_service()
    if not service:
        return
    calendar_id = getattr(settings, "GOOGLE_CALENDAR_ID", "primary")
    try:
        service.events().delete(
            calendarId=calendar_id, eventId=event_id, sendUpdates="all"
        ).execute()
        print(f"[CALENDAR] Event {event_id} cancelled")
    except Exception as e:
        print(f"[CALENDAR CANCEL ERROR] {e}")
