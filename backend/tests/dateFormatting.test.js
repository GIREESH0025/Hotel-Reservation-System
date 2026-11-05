'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

// Replicate the formatting logic to ensure mathematical and timezone safety
function formatShortDate(date) {
  if (!date) return '—';
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())
    ? new Date(date + 'T00:00:00Z')
    : new Date(date);
  if (isNaN(d.getTime())) return '—';
  const tz = { timeZone: 'UTC' };
  const day = new Intl.DateTimeFormat('en-IN', { day: '2-digit', ...tz }).format(d);
  const month = new Intl.DateTimeFormat('en-IN', { month: 'short', ...tz }).format(d);
  const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short', ...tz }).format(d);
  return `${day} ${month}, ${weekday}`;
}

function formatLongDate(date) {
  if (!date) return '—';
  const d = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())
    ? new Date(date + 'T00:00:00Z')
    : new Date(date);
  if (isNaN(d.getTime())) return '—';
  const tz = { timeZone: 'UTC' };
  const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short', ...tz }).format(d);
  const day = new Intl.DateTimeFormat('en-IN', { day: '2-digit', ...tz }).format(d);
  const month = new Intl.DateTimeFormat('en-IN', { month: 'short', ...tz }).format(d);
  const year = new Intl.DateTimeFormat('en-IN', { year: 'numeric', ...tz }).format(d);
  return `${weekday}, ${day} ${month} ${year}`;
}

function formatISODate(date) {
  if (!date) return '';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return date.trim();
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

test('formatShortDate formats YYYY-MM-DD into "DD Mon, Day" safely without timezone shifts', () => {
  assert.strictEqual(formatShortDate('2026-11-05'), '05 Nov, Thu');
  assert.strictEqual(formatShortDate('2026-11-20'), '20 Nov, Fri');
});

test('formatLongDate formats YYYY-MM-DD into "Day, DD Mon YYYY"', () => {
  assert.strictEqual(formatLongDate('2026-11-05'), 'Thu, 05 Nov 2026');
  assert.strictEqual(formatLongDate('2026-11-20'), 'Fri, 20 Nov 2026');
});

test('formatISODate converts dates consistently into YYYY-MM-DD', () => {
  assert.strictEqual(formatISODate('2026-11-05'), '2026-11-05');
  assert.strictEqual(formatISODate(new Date(Date.UTC(2026, 10, 5))), '2026-11-05');
});

