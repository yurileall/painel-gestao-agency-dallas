import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agingInfo, leadAging, applyStatusDates, adjacentStatus } from '../js/lib/rules.js';

const TODAY = '2026-10-10';
const SLA = 3;

test('agingInfo em aberto: ok, atenção no dia do prazo, atrasado depois', () => {
  const open = saleDate => agingInfo({ status:'pendente', saleDate }, SLA, TODAY);
  assert.deepEqual(open('2026-10-09'), { days:1, level:'ok' });
  assert.deepEqual(open('2026-10-07'), { days:3, level:'atencao' });
  assert.deepEqual(open('2026-10-06'), { days:4, level:'atrasado' });
});

test('agingInfo entregue: conta até a data da entrega, não até hoje', () => {
  const noPrazo = { status:'entregue', saleDate:'2026-09-01', deliveredDate:'2026-09-04' };
  assert.deepEqual(agingInfo(noPrazo, SLA, TODAY), { days:3, level:'ok' });
  const fora = { status:'entregue', saleDate:'2026-09-01', deliveredDate:'2026-09-06' };
  assert.deepEqual(agingInfo(fora, SLA, TODAY), { days:5, level:'atrasado' });
});

test('leadAging com data de retorno', () => {
  const at = followUpDate => leadAging({ contactDate:'2026-10-01', followUpDate }, TODAY);
  assert.deepEqual(at('2026-10-08'), { level:'atrasado', label:'atrasado 2d' });
  assert.deepEqual(at('2026-10-10'), { level:'atrasado', label:'chamar hoje' });
  assert.deepEqual(at('2026-10-11'), { level:'atencao', label:'chamar amanhã' });
  assert.deepEqual(at('2026-10-15'), { level:'ok', label:'chamar em 5d' });
});

test('leadAging sem data de retorno mostra dias sem contato', () => {
  assert.deepEqual(leadAging({ contactDate:'2026-10-03', followUpDate:null }, TODAY), { level:'ok', label:'7d sem contato' });
});

test('applyStatusDates carimba início de produção e entrega', () => {
  const base = { status:'pendente', producaoStartDate:null, deliveredDate:null };
  assert.deepEqual(applyStatusDates(base, TODAY), base);
  assert.deepEqual(applyStatusDates({ ...base, status:'em_producao' }, TODAY),
    { status:'em_producao', producaoStartDate:TODAY, deliveredDate:null });
  assert.deepEqual(applyStatusDates({ ...base, status:'entregue' }, TODAY),
    { status:'entregue', producaoStartDate:TODAY, deliveredDate:TODAY });
});

test('applyStatusDates preserva datas já carimbadas e limpa a entrega ao voltar', () => {
  const entregue = { status:'entregue', producaoStartDate:'2026-10-02', deliveredDate:'2026-10-05' };
  assert.deepEqual(applyStatusDates(entregue, TODAY), entregue);
  assert.deepEqual(applyStatusDates({ ...entregue, status:'em_producao' }, TODAY),
    { status:'em_producao', producaoStartDate:'2026-10-02', deliveredDate:null });
});

test('applyStatusDates não altera o objeto recebido', () => {
  const original = { status:'entregue', producaoStartDate:null, deliveredDate:null };
  applyStatusDates(original, TODAY);
  assert.equal(original.deliveredDate, null);
});

test('adjacentStatus para nas pontas do pipeline', () => {
  assert.equal(adjacentStatus('pendente', 'fwd'), 'em_producao');
  assert.equal(adjacentStatus('em_producao', 'fwd'), 'entregue');
  assert.equal(adjacentStatus('entregue', 'fwd'), null);
  assert.equal(adjacentStatus('em_producao', 'back'), 'pendente');
  assert.equal(adjacentStatus('pendente', 'back'), null);
  assert.equal(adjacentStatus('desconhecido', 'fwd'), null);
});
