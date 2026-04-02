from django.core.mail import EmailMultiAlternatives
from django.conf import settings

BRAND_COLOR = "#6B8F71"

def _base_html(title, body_html):
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr><td style="background:{BRAND_COLOR};padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:600">🌿 MindMate</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:2px;text-transform:uppercase">Mental Health Support</p>
        </td></tr>
        <tr><td style="padding:40px">
          <h2 style="margin:0 0 20px;color:#2D3748;font-size:22px">{title}</h2>
          {body_html}
        </td></tr>
        <tr><td style="background:#F7F7F7;padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0">
          <p style="margin:0;color:#A0AEC0;font-size:12px">MindMate — University Mental Health Support</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _send(to_email, subject, html):
    msg = EmailMultiAlternatives(
        subject=subject,
        body=subject,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email]
    )
    msg.attach_alternative(html, "text/html")
    try:
        msg.send()
        print(f"[EMAIL] Sent to {to_email}: {subject}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def send_welcome_email(user):
    body = f"""
    <p style="color:#4A5568;font-size:15px;line-height:1.7">Hi <strong>{user.first_name or user.email}</strong>,</p>
    <p style="color:#4A5568;font-size:15px;line-height:1.7">Welcome to <strong>MindMate</strong>! We are here to support your mental health journey.</p>
    <div style="background:#EBF3EC;border-left:4px solid {BRAND_COLOR};border-radius:8px;padding:16px 20px;margin:24px 0">
      <p style="margin:0;color:#2D3748;font-size:14px;font-style:italic">"Every student deserves a safe space to grow, heal, and thrive."</p>
    </div>
    <ul style="color:#4A5568;font-size:14px;line-height:2">
      <li>Submit a support request to connect with a counselor</li>
      <li>Browse our wellness resource library</li>
      <li>Message your assigned counselor directly</li>
      <li>Book counseling sessions</li>
    </ul>"""
    html = _base_html("Welcome to MindMate", body)
    return _send(user.email, "Welcome to MindMate — Your Support Portal", html)


def send_session_booked(session):
    dt = session.scheduled_at.strftime("%A, %B %d %Y at %I:%M %p")
    for recipient, role_label in [(session.student, "student"), (session.counselor, "counselor")]:
        other = session.counselor if role_label == "student" else session.student
        meet_row = ""
        if session.meeting_link:
            meet_row = f'''<tr><td style="padding:8px 0;border-top:1px solid #D0E8D1">
              <span style="color:#718096;font-size:13px">Meeting Link</span><br>
              <a href="{session.meeting_link}" style="color:{BRAND_COLOR}">{session.meeting_link}</a>
            </td></tr>'''
        body = f"""
        <p style="color:#4A5568;font-size:15px;line-height:1.7">Hi <strong>{recipient.first_name or recipient.email}</strong>,</p>
        <p style="color:#4A5568;font-size:15px;line-height:1.7">A counseling session has been <strong>confirmed</strong>.</p>
        <div style="background:#EBF3EC;border-radius:12px;padding:24px;margin:24px 0">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:8px 0"><span style="color:#718096;font-size:13px">Date and Time</span><br>
              <strong style="color:#2D3748;font-size:15px">{dt}</strong></td></tr>
            <tr><td style="padding:8px 0;border-top:1px solid #D0E8D1"><span style="color:#718096;font-size:13px">Duration</span><br>
              <strong style="color:#2D3748">{session.duration_mins} minutes</strong></td></tr>
            <tr><td style="padding:8px 0;border-top:1px solid #D0E8D1">
              <span style="color:#718096;font-size:13px">{"Counselor" if role_label == "student" else "Student"}</span><br>
              <strong style="color:#2D3748">{other.get_full_name() or other.email}</strong></td></tr>
            <tr><td style="padding:8px 0;border-top:1px solid #D0E8D1"><span style="color:#718096;font-size:13px">Location</span><br>
              <strong style="color:#2D3748">{session.location or "To be confirmed"}</strong></td></tr>
            {meet_row}
          </table>
        </div>"""
        html = _base_html("Session Confirmed", body)
        _send(recipient.email, f"MindMate Session Confirmed — {dt}", html)


def send_session_cancelled(session, cancelled_by):
    dt = session.scheduled_at.strftime("%A, %B %d %Y at %I:%M %p")
    for recipient in [session.student, session.counselor]:
        if recipient == cancelled_by:
            continue
        body = f"""
        <p style="color:#4A5568;font-size:15px;line-height:1.7">Hi <strong>{recipient.first_name or recipient.email}</strong>,</p>
        <p style="color:#4A5568;font-size:15px;line-height:1.7">
          Your session on <strong>{dt}</strong> was
          <strong style="color:#E53E3E">cancelled</strong> by
          {cancelled_by.get_full_name() or cancelled_by.email}.
        </p>
        <p style="color:#4A5568;font-size:15px">Please log in to MindMate to reschedule.</p>"""
        html = _base_html("Session Cancelled", body)
        _send(recipient.email, f"MindMate Session Cancelled — {dt}", html)


def send_new_message_notification(recipient, sender, message_preview, conversation_id=None):
    preview = message_preview[:200] + ("..." if len(message_preview) > 200 else "")
    body = f"""
    <p style="color:#4A5568;font-size:15px;line-height:1.7">Hi <strong>{recipient.first_name or recipient.email}</strong>,</p>
    <p style="color:#4A5568;font-size:15px;line-height:1.7">
      You have a new message from <strong>{sender.get_full_name() or sender.email}</strong>:
    </p>
    <div style="background:#F7F7F7;border-left:4px solid {BRAND_COLOR};border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0;color:#2D3748;font-size:14px;font-style:italic">"{preview}"</p>
    </div>
    <div style="text-align:center;margin:28px 0">
      <a href="https://cautious-space-funicular-wr5g7grq456gc5pqv-3000.app.github.dev/messages"
         style="background:{BRAND_COLOR};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
        Reply Now
      </a>
    </div>"""
    html = _base_html(f"New message from {sender.get_full_name() or sender.email}", body)
    return _send(recipient.email, f"New MindMate message from {sender.get_full_name() or sender.email}", html)


def send_case_status_update(case, old_status, new_status):
    status_colors = {
        "open": "#B5860D", "in_progress": "#4299E1",
        "resolved": "#6B8F71", "closed": "#718096",
    }
    color = status_colors.get(new_status, BRAND_COLOR)
    body = f"""
    <p style="color:#4A5568;font-size:15px;line-height:1.7">Hi <strong>{case.student.first_name or case.student.email}</strong>,</p>
    <p style="color:#4A5568;font-size:15px;line-height:1.7">
      Your support case <strong>#{case.case_number}</strong> status has been updated.
    </p>
    <div style="background:#F7F7F7;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
      <span style="font-size:14px;color:#718096;text-decoration:line-through">{old_status.replace("_"," ").title()}</span>
      <span style="font-size:22px;margin:0 12px">to</span>
      <span style="font-size:16px;color:{color};font-weight:700">{new_status.replace("_"," ").title()}</span>
    </div>"""
    html = _base_html("Case Status Updated", body)
    return _send(case.student.email, f"MindMate Case #{case.case_number} Updated", html)
