import type { Task } from '@/types/task';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatLocalICSDate(dateISO: string, timeHHMM: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const [hh, mm] = timeHHMM.split(':').map(Number);
  return `${y}${pad2(m)}${pad2(d)}T${pad2(hh)}${pad2(mm)}00`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function buildTaskICS(task: Task): string {
  const startStr = formatLocalICSDate(task.dueDate, task.dueTime);
  const [y, m, d] = task.dueDate.split('-').map(Number);
  const [hh, mm] = task.dueTime.split(':').map(Number);
  const endDate = new Date(y, m - 1, d, hh, mm + 30);
  const endStr = `${endDate.getFullYear()}${pad2(endDate.getMonth() + 1)}${pad2(endDate.getDate())}T${pad2(endDate.getHours())}${pad2(endDate.getMinutes())}00`;

  const reminderMin = task.reminderMinutes === 'none' ? 0 : Number(task.reminderMinutes) || 0;
  const trigger = reminderMin === 0 ? 'PT0M' : `-PT${reminderMin}M`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskFlow PWA//Planner//UK',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${task.id}@taskflow.local`,
    `DTSTAMP:${startStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${escapeICS(task.title)}`,
    task.description ? `DESCRIPTION:${escapeICS(task.description)}` : '',
    task.location ? `LOCATION:${escapeICS(task.location)}` : '',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(`Нагадування: ${task.title}`)}`,
    `TRIGGER:${trigger}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function downloadTaskICS(task: Task) {
  const content = buildTaskICS(task);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `taskflow-${task.dueDate}-${task.dueTime.replace(':', '')}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
