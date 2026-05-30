// ============================================================
// lexi/ics.js — iCalendar (.ics) export for hearings & deadlines
//
// Generates a standards-compliant VCALENDAR so lawyers can import court dates
// and task deadlines into Google / Outlook / Apple Calendar. All-day events
// (VALUE=DATE) with an alarm the day before. No dependencies.
// ============================================================

function pad(n) {
  return String(n).padStart(2, '0');
}

function toICSDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function stamp() {
  const d = new Date();
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeICS(text = '') {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// events: [{ uid, title, date (YYYY-MM-DD or Date), description, location }]
export function buildICS(events = [], calName = 'LexiAssist') {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LexiAssist//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(calName)}`,
  ];
  events.forEach((ev, i) => {
    if (!ev.date) return;
    const start = toICSDate(ev.date);
    const endD = new Date(ev.date);
    endD.setDate(endD.getDate() + 1); // all-day events: DTEND is exclusive
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeICS(ev.uid || `${start}-${i}`)}@lexiassist`,
      `DTSTAMP:${stamp()}`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${toICSDate(endD)}`,
      `SUMMARY:${escapeICS(ev.title || 'Legal event')}`
    );
    if (ev.description) lines.push(`DESCRIPTION:${escapeICS(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeICS(ev.location)}`);
    // Reminder at 09:00 the day before.
    lines.push(
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS(ev.title || 'Legal event')}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
