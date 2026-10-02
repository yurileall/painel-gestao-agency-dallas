import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateClient, validateLead, normalizeUrl, isHttpUrl, normalizeDeliverables } from '../js/lib/validate.js';

const client = (over = {}) => ({
  name:'Dra. Evelyn', whatsapp:'(71) 91234-5678', combo:'presenca', price:297, saleDate:'2026-10-01',
  status:'pendente', deliverables:{ lp:{ done:false, url:'' }, whats:false }, ...over,
});
const lead = (over = {}) => ({ name:'Barbearia do Zé', whatsapp:'', combo:'', contactDate:'2026-10-01', followUpDate:null, ...over });

test('cliente válido não gera erros', () => {
  assert.deepEqual(validateClient(client()), {});
});

test('cliente: nome obrigatório e com limite', () => {
  assert.ok(validateClient(client({ name:'' })).name);
  assert.ok(validateClient(client({ name:'   ' })).name);
  assert.ok(validateClient(client({ name:'x'.repeat(121) })).name);
});

test('cliente: WhatsApp é opcional, mas se vier precisa estar completo', () => {
  assert.equal(validateClient(client({ whatsapp:'' })).whatsapp, undefined);
  assert.equal(validateClient(client({ whatsapp:'71912345678' })).whatsapp, undefined);
  assert.equal(validateClient(client({ whatsapp:'+55 (71) 91234-5678' })).whatsapp, undefined);
  assert.ok(validateClient(client({ whatsapp:'9123-4567' })).whatsapp);
  assert.ok(validateClient(client({ whatsapp:'abc' })).whatsapp);
});

test('cliente: preço zero é aceito; negativo e não-numérico não', () => {
  assert.equal(validateClient(client({ price:0 })).price, undefined);
  assert.ok(validateClient(client({ price:-1 })).price);
  assert.ok(validateClient(client({ price:NaN })).price);
  assert.ok(validateClient(client({ price:1e12 })).price);
});

test('cliente: data da venda obrigatória e real', () => {
  assert.ok(validateClient(client({ saleDate:'' })).saleDate);
  assert.ok(validateClient(client({ saleDate:'2026-02-30' })).saleDate);
});

test('cliente: combo e status precisam existir', () => {
  assert.ok(validateClient(client({ combo:'premium' })).combo);
  assert.ok(validateClient(client({ status:'cancelado' })).status);
});

test('cliente: link de entregável precisa ser http(s)', () => {
  assert.deepEqual(validateClient(client({ deliverables:{ lp:{ done:true, url:'https://site.com/lp' } } })), {});
  assert.ok(validateClient(client({ deliverables:{ lp:{ done:true, url:'javascript:alert(1)' } } })).deliverables);
  assert.ok(validateClient(client({ deliverables:{ lp:{ done:true, url:'https://semponto' } } })).deliverables);
});

test('normalizeUrl completa o https:// e isHttpUrl confere o resultado', () => {
  assert.equal(normalizeUrl('  meusite.com.br/lp '), 'https://meusite.com.br/lp');
  assert.equal(normalizeUrl('http://a.com'), 'http://a.com');
  assert.equal(normalizeUrl(''), '');
  assert.equal(normalizeUrl(undefined), '');
  assert.equal(isHttpUrl('https://meusite.com.br/lp'), true);
  assert.equal(isHttpUrl('ftp://a.com'), false);
  assert.equal(isHttpUrl('nada'), false);
});

test('normalizeDeliverables mantém o formato de cada entregável', () => {
  assert.deepEqual(
    normalizeDeliverables({ lp:{ done:true, url:'site.com' }, whats:true, seo:false }),
    { lp:{ done:true, url:'https://site.com' }, whats:true, seo:false });
  assert.deepEqual(normalizeDeliverables(undefined), {});
});

test('lead válido não gera erros', () => {
  assert.deepEqual(validateLead(lead()), {});
  assert.deepEqual(validateLead(lead({ combo:'basico', followUpDate:'2026-10-01' })), {});
});

test('lead: nome, data do contato e combo', () => {
  assert.ok(validateLead(lead({ name:'' })).name);
  assert.ok(validateLead(lead({ contactDate:'' })).contactDate);
  assert.ok(validateLead(lead({ combo:'premium' })).combo);
});

test('lead: retorno não pode ser antes do contato', () => {
  assert.ok(validateLead(lead({ followUpDate:'2026-09-30' })).followUpDate);
  assert.equal(validateLead(lead({ followUpDate:'2026-10-20' })).followUpDate, undefined);
});
