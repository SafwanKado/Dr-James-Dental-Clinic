/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUpcomingDays(count: number = 14): { dateString: string; label: string; weekday: string; dayNum: number; isWeekend: boolean }[] {
  const days = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const dayOfWeek = d.getDay(); // 0 is Sunday

    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    days.push({
      dateString,
      label,
      weekday,
      dayNum: d.getDate(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    });
  }

  return days;
}

export const TIME_SLOTS = [
  "08:30 AM",
  "09:15 AM",
  "10:00 AM",
  "10:45 AM",
  "11:30 AM",
  "01:15 PM",
  "02:00 PM",
  "02:45 PM",
  "03:30 PM",
  "04:15 PM",
  "05:00 PM"
];
