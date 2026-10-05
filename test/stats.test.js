import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableMonths, dashboardStats, pipelineStats, financeStats, operationMetrics } from '../js/lib/stats.js';

const TODAY = '2026-10-10';
const CLIENTS = [
  { id:'a', name:'A', combo:'basico',     price:200, saleDate:'2026-09-01', owner:'Breno', status:'entregue',    producaoStartDate:'2026-09-02', deliveredDate:'2026-09-03' },
  { id:'b', name:'B', combo:'presenca',   price:300, saleDate:'2026-09-10', owner:'Yuri',  status:'entregue',    producaoStartDate:'2026-09-12', deliveredDate:'2026-09-16' },
  { id:'c', name:'C', combo:'presenca',   price:300, saleDate:'2026-10-09', owner:'Yuri',  status:'em_producao', producaoStartDate:'2026-10-09', deliveredDate:null },
  { id:'d', name:'D', combo:'autoridade', price:400, saleDate:'2026-10-01', owner:'Yuri',  status:'pendente',    producaoStartDate:null,         deliveredDate:null },
];

test('availableMonths: do mais recente ao mais antigo, sem repetir', () => {
  assert.deepEqual(availableMonths(CLIENTS), ['2026-10', '2026-09']);
  assert.deepEqual(availableMonths([]), []);
});

test('dashboardStats: todo o período', () => {
  const s = dashboardStats(CLIENTS, '');
  assert.equal(s.deals, 4);
  assert.equal(s.delivered, 2);
  assert.equal(s.revenue, 1200);
  assert.equal(s.avgTicket, 300);
  assert.deepEqual(s.comboCounts, { basico:1, presenca:2, autoridade:1 });
  assert.deepEqual(s.recent.map(c => c.id), ['c', 'd', 'b', 'a']);
});

test('dashboardStats: filtra pelo mês e não divide por zero', () => {
  const out = dashboardStats(CLIENTS, '2026-10');
  assert.equal(out.deals, 2);
  assert.equal(out.revenue, 700);
  assert.equal(out.delivered, 0);
  const vazio = dashboardStats(CLIENTS, '2025-01');
  assert.equal(vazio.avgTicket, 0);
  assert.deepEqual(vazio.comboCounts, { basico:0, presenca:0, autoridade:0 });
});

test('pipelineStats: colunas, atrasados e prazo cumprido', () => {
  const s = pipelineStats(CLIENTS, 3, TODAY);
  assert.deepEqual(s.byStatus.entregue.map(c => c.id), ['a', 'b']);
  assert.equal(s.active, 2);
  assert.equal(s.late, 1);                 // D: 9 dias em aberto com prazo de 3
  assert.equal(s.avgDeliveryDays, 4);      // A levou 2 dias, B levou 6
  assert.equal(s.slaRate, 50);             // só A ficou dentro do prazo
});

test('pipelineStats: sem entregas, médias ficam nulas', () => {
  const s = pipelineStats([], 3, TODAY);
  assert.equal(s.avgDeliveryDays, null);
  assert.equal(s.slaRate, null);
  assert.equal(s.active, 0);
});

test('financeStats: por mês e totais', () => {
  const s = financeStats(CLIENTS, { '2026-09':100, '2026-08':50 }, '2026-10');
  assert.deepEqual(s.months.map(m => m.month), ['2026-10', '2026-09', '2026-08']);

  const set = s.months[1];
  assert.deepEqual(set, { month:'2026-09', deals:2, revenue:500, spend:100, cpa:50, profit:400, roas:5 });

  const out = s.months[0]; // vendas sem gasto lançado: CPA e ROAS indefinidos
  assert.equal(out.cpa, null);
  assert.equal(out.roas, null);
  assert.equal(out.profit, 700);

  const ago = s.months[2]; // gasto sem venda: prejuízo
  assert.equal(ago.profit, -50);
  assert.equal(ago.cpa, null);

  assert.equal(s.totalRevenue, 1200);
  assert.equal(s.totalSpend, 150);
  assert.equal(s.cpa, 37.5);
  assert.equal(s.roas, 8);
  assert.deepEqual(s.byCombo, { basico:200, presenca:600, autoridade:400 });
});

test('financeStats: o mês atual aparece mesmo sem dados', () => {
  const s = financeStats([], {}, '2026-10');
  assert.deepEqual(s.months.map(m => m.month), ['2026-10']);
  assert.equal(s.cpa, null);
  assert.equal(s.roas, null);
});

test('operationMetrics', () => {
  const m = operationMetrics(CLIENTS);
  assert.equal(m.total, 4);
  assert.equal(m.avgWaitDays, 1);          // A: 1 dia, B: 2 dias, C: 0 dias
  assert.equal(m.avgProductionDays, 2.5);  // A: 1 dia, B: 4 dias
  assert.equal(m.finishRate, 50);
  assert.deepEqual(m.byMonth, [{ month:'2026-09', count:2 }, { month:'2026-10', count:2 }]);
  assert.deepEqual(m.ownerLoad, [{ owner:'Yuri', count:2 }]);
});

test('operationMetrics: sem clientes', () => {
  const m = operationMetrics([]);
  assert.equal(m.avgWaitDays, null);
  assert.equal(m.avgProductionDays, null);
  assert.equal(m.finishRate, null);
  assert.deepEqual(m.byMonth, []);
});
