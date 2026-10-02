import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayISO, isValidISODate, daysBetween, monthKey, monthLabel } from '../js/lib/dates.js';
import { fmtBRL, fmtDate, escapeHtml } from '../js/lib/format.js';

test('todayISO usa o dia local, não o UTC', () => {
  // 22h locais: em UTC-3, toISOString() já devolveria o dia seguinte
  assert.equal(todayISO(new Date(2026, 9, 1, 22, 30)), '2026-10-01');
  assert.equal(todayISO(new Date(2026, 0, 5, 0, 1)), '2026-01-05');
});

test('isValidISODate recusa formato errado e datas que não existem', () => {
  assert.equal(isValidISODate('2026-02-28'), true);
  assert.equal(isValidISODate('2024-02-29'), true);
  assert.equal(isValidISODate('2026-02-30'), false);
  assert.equal(isValidISODate('2026-13-01'), false);
  assert.equal(isValidISODate('01/10/2026'), false);
  assert.equal(isValidISODate(''), false);
  assert.equal(isValidISODate(null), false);
});

test('daysBetween conta dias de calendário', () => {
  assert.equal(daysBetween('2026-10-01', '2026-10-01'), 0);
  assert.equal(daysBetween('2026-10-01', '2026-10-04'), 3);
  assert.equal(daysBetween('2026-10-04', '2026-10-01'), -3);
  assert.equal(daysBetween('2026-02-27', '2026-03-01'), 2);
  assert.equal(daysBetween('2025-12-31', '2026-01-01'), 1);
  assert.equal(daysBetween(null, '2026-10-01'), 0);
});

test('daysBetween sem a segunda data conta até hoje', () => {
  assert.equal(daysBetween(todayISO()), 0);
});

test('monthKey e monthLabel', () => {
  assert.equal(monthKey('2026-10-01'), '2026-10');
  assert.equal(monthKey(null), '');
  assert.equal(monthLabel('2026-10'), 'Out/2026');
  assert.equal(monthLabel('2026-01'), 'Jan/2026');
  assert.equal(monthLabel(''), '');
});

test('fmtBRL', () => {
  assert.equal(fmtBRL(1234.5), 'R$ 1.234,50');
  assert.equal(fmtBRL(0), 'R$ 0,00');
  assert.equal(fmtBRL(null), 'R$ 0,00');
});

test('fmtDate', () => {
  assert.equal(fmtDate('2026-10-01'), '01/10/2026');
  assert.equal(fmtDate(null), '—');
});

test('escapeHtml neutraliza marcação e aceita valores não-texto', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(escapeHtml("Zé & 'Cia'"), 'Zé &amp; &#39;Cia&#39;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(42), '42');
});
