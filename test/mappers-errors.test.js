import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientToRow, rowToClient, leadToRow, rowToLead, newId } from '../js/lib/mappers.js';
import { dbErrorMessage, isNetworkError } from '../js/lib/errors.js';

test('cliente: ida e volta pelo formato do banco preserva os dados', () => {
  const client = {
    id:'c_abc', name:'Dra. Evelyn', whatsapp:'71912345678', niche:'Psicologia', combo:'presenca', price:297,
    saleDate:'2026-10-01', owner:'Yuri', status:'entregue', deliverables:{ lp:{ done:true, url:'https://a.com' }, whats:true },
    notes:'obs', deliveredDate:'2026-10-03', producaoStartDate:'2026-10-02',
  };
  assert.deepEqual(rowToClient(clientToRow(client)), client);
});

test('clientToRow usa snake_case e troca vazio por null', () => {
  const row = clientToRow({ id:'c_1', name:'A', whatsapp:'', niche:'', combo:'basico', price:0, saleDate:'2026-10-01', status:'pendente' });
  assert.equal(row.sale_date, '2026-10-01');
  assert.equal(row.whatsapp, null);
  assert.equal(row.delivered_date, null);
  assert.equal(row.producao_start_date, null);
  assert.deepEqual(row.deliverables, {});
  assert.equal('saleDate' in row, false);
});

test('rowToClient converte o preço numeric (texto) em número', () => {
  assert.equal(rowToClient({ id:'c_1', price:'197.90' }).price, 197.9);
  assert.equal(rowToClient({ id:'c_1', price:null }).price, 0);
});

test('lead: ida e volta pelo formato do banco preserva os dados', () => {
  const lead = { id:'l_abc', name:'Zé', whatsapp:'71912345678', combo:'basico', contactDate:'2026-10-01', followUpDate:'2026-10-08', notes:'obs' };
  assert.deepEqual(rowToLead(leadToRow(lead)), lead);
  assert.equal(leadToRow({ ...lead, followUpDate:null, combo:'' }).follow_up_date, null);
});

test('newId gera ids únicos com o prefixo pedido', () => {
  assert.match(newId('c'), /^c_[a-z0-9]+$/);
  assert.match(newId('l'), /^l_[a-z0-9]+$/);
  assert.notEqual(newId('c'), newId('c'));
});

test('isNetworkError só reconhece falha de rede', () => {
  assert.equal(isNetworkError({ message:'TypeError: Failed to fetch' }), true);
  assert.equal(isNetworkError({ message:'NetworkError when attempting to fetch resource.' }), true);
  assert.equal(isNetworkError({ code:'42501', message:'permission denied' }), false);
  assert.equal(isNetworkError(null), false);
});

test('dbErrorMessage traduz os códigos conhecidos', () => {
  assert.match(dbErrorMessage({ code:'42501', message:'permission denied for table clients' }), /Sem permissão/);
  assert.match(dbErrorMessage({ code:'23514', message:'violates check constraint' }), /fora das regras/);
  assert.match(dbErrorMessage({ message:'TypeError: Failed to fetch' }), /Sem conexão/);
  assert.match(dbErrorMessage({ code:'PGRST301', message:'JWT expired' }), /sessão expirou/);
  assert.equal(dbErrorMessage({ code:'XX000', message:'algo raro' }), 'algo raro');
  assert.equal(dbErrorMessage(null), 'erro desconhecido');
});
