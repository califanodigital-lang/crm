import test from 'node:test'
import assert from 'node:assert/strict'

import {
  toIsoDate,
  getDefaultMonthlyRange,
  isDateInRange,
  hasAnyDateInRange,
  doesRangeOverlap,
} from './dateRange.js'

test('una data gia in formato AAAA-MM-GG resta identica', () => {
  assert.equal(toIsoDate('2026-09-01'), '2026-09-01')
  assert.equal(toIsoDate('2026-08-31'), '2026-08-31')
  assert.equal(toIsoDate('2026-09-01T00:00:00'), '2026-09-01')
  assert.equal(toIsoDate('2026-09-01T23:30:00+02:00'), '2026-09-01')
})

test('una data costruita in orario locale non scivola al giorno prima', () => {
  assert.equal(toIsoDate(new Date(2026, 8, 1)), '2026-09-01')
  assert.equal(toIsoDate(new Date(2026, 0, 1)), '2026-01-01')
  assert.equal(toIsoDate(new Date(2026, 11, 31)), '2026-12-31')
})

test('il mese di riferimento comincia il primo e finisce l ultimo giorno', () => {
  assert.deepEqual(
    getDefaultMonthlyRange(new Date(2026, 8, 15)),
    { start: '2026-09-01', end: '2026-09-30' },
  )
  assert.deepEqual(
    getDefaultMonthlyRange(new Date(2026, 11, 3)),
    { start: '2026-12-01', end: '2026-12-31' },
  )
})

test('un incasso dell ultimo giorno di agosto non finisce in settembre', () => {
  const { start, end } = getDefaultMonthlyRange(new Date(2026, 8, 15))
  assert.equal(isDateInRange('2026-08-31', start, end), false)
  assert.equal(isDateInRange('2026-09-01', start, end), true)
  assert.equal(isDateInRange('2026-09-30', start, end), true)
  assert.equal(isDateInRange('2026-10-01', start, end), false)
})

test('febbraio bisestile e non bisestile finiscono nel giorno giusto', () => {
  assert.equal(getDefaultMonthlyRange(new Date(2028, 1, 10)).end, '2028-02-29')
  assert.equal(getDefaultMonthlyRange(new Date(2027, 1, 10)).end, '2027-02-28')
})

test('valori vuoti o illeggibili restano fuori da qualsiasi periodo', () => {
  assert.equal(toIsoDate(null), '')
  assert.equal(toIsoDate(''), '')
  assert.equal(isDateInRange(null, '2026-09-01', '2026-10-01'), false)
  assert.equal(isDateInRange('non e una data', '2026-09-01', '2026-10-01'), false)
})

test('hasAnyDateInRange e doesRangeOverlap seguono le stesse date', () => {
  const start = '2026-09-01'
  const end = '2026-09-30'
  assert.equal(hasAnyDateInRange(['2026-08-31', '2026-09-05'], start, end), true)
  assert.equal(hasAnyDateInRange(['2026-08-31', '2026-10-02'], start, end), false)
  assert.equal(hasAnyDateInRange(['2026-09-30'], start, end), true)
  assert.equal(doesRangeOverlap({ startValue: '2026-08-20', endValue: '2026-09-02' }, start, end), true)
  assert.equal(doesRangeOverlap({ startValue: '2026-10-02', endValue: '2026-10-09' }, start, end), false)
  assert.equal(doesRangeOverlap({ startValue: '2026-08-01', endValue: '2026-08-31' }, start, end), false)
})
