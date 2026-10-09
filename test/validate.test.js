import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateClient, validateLead, validateProspect, normalizeHandle, normalizeUrl, isHttpUrl } from '../js/lib/validate.js';

const client = (over = {}) => ({
  name:'Dra. Evelyn', whatsapp:'(71) 91234-5678', combo:['presenca'], price:297, saleDate:'2026-10-01',
  status:'pendente', slaDays:3, ...over,
});
const lead = (over = {}) => ({ name:'Barbearia do Zé', whatsapp:'', combo:'', contactDate:'2026-10-01', followUpDate:null, ...over });
const prospect = (over = {}) => ({
  id:'p_1', handle:'dra.exemplo', whatsapp:'(71) 91234-5678', niche:'Psicologia', scenario:'B', channel:'whatsapp', firstMsgDate:'2026-10-09',
  status:'respondeu', nextStep:'Enviar prévia', nextStepDate:null, ...over,
});

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

test('cliente: prazo precisa ser um número inteiro entre 1 e 365', () => {
  assert.equal(validateClient(client({ slaDays:1 })).slaDays, undefined);
  assert.equal(validateClient(client({ slaDays:365 })).slaDays, undefined);
  assert.ok(validateClient(client({ slaDays:0 })).slaDays);
  assert.ok(validateClient(client({ slaDays:366 })).slaDays);
  assert.ok(validateClient(client({ slaDays:1.5 })).slaDays);
  assert.ok(validateClient(client({ slaDays:undefined })).slaDays);
});

test('cliente: combo e status precisam existir', () => {
  assert.ok(validateClient(client({ combo:['premium'] })).combo);
  assert.ok(validateClient(client({ combo:[] })).combo);
  assert.ok(validateClient(client({ status:'cancelado' })).status);
});

test('cliente: itens avulsos combinam entre si, mas não com um combo', () => {
  assert.deepEqual(validateClient(client({ combo:['landing_page','link_bio'] })), {});
  assert.ok(validateClient(client({ combo:['presenca','landing_page'] })).combo);
  assert.ok(validateClient(client({ combo:['presenca','autoridade'] })).combo);
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

test('normalizeHandle tira o @, as maiúsculas e aceita o link do perfil', () => {
  assert.equal(normalizeHandle(' @Dra.Exemplo '), 'dra.exemplo');
  assert.equal(normalizeHandle('dra_exemplo'), 'dra_exemplo');
  assert.equal(normalizeHandle('https://www.instagram.com/Dra.Exemplo/?hl=pt-br'), 'dra.exemplo');
  assert.equal(normalizeHandle('instagram.com/dra.exemplo'), 'dra.exemplo');
  assert.equal(normalizeHandle(undefined), '');
});

test('perfil válido não gera erros', () => {
  assert.deepEqual(validateProspect(prospect()), {});
  assert.deepEqual(validateProspect(prospect({ scenario:'', niche:'', nextStep:'' })), {});
});

test('perfil: @ obrigatório, no formato do Instagram e sem repetir', () => {
  assert.ok(validateProspect(prospect({ handle:'' })).handle);
  assert.ok(validateProspect(prospect({ handle:'dra exemplo' })).handle);
  assert.ok(validateProspect(prospect({ handle:'x'.repeat(31) })).handle);
  assert.ok(validateProspect(prospect(), [prospect({ id:'p_2' })]).handle);
  assert.equal(validateProspect(prospect(), [prospect()]).handle, undefined); // editar o próprio perfil não é repetição
});

test('perfil: WhatsApp é opcional, mas se vier precisa estar completo', () => {
  assert.equal(validateProspect(prospect({ whatsapp:'' })).whatsapp, undefined);
  assert.ok(validateProspect(prospect({ whatsapp:'9123-4567' })).whatsapp);
});

test('perfil: cenário, canal e status precisam existir', () => {
  assert.ok(validateProspect(prospect({ scenario:'D' })).scenario);
  assert.ok(validateProspect(prospect({ channel:'email' })).channel);
  assert.ok(validateProspect(prospect({ status:'talvez' })).status);
});

test('perfil: só "a abordar" pode ficar sem a data da primeira mensagem', () => {
  assert.equal(validateProspect(prospect({ status:'a_abordar', firstMsgDate:null })).firstMsgDate, undefined);
  assert.ok(validateProspect(prospect({ status:'enviada', firstMsgDate:null })).firstMsgDate);
  assert.ok(validateProspect(prospect({ firstMsgDate:'2026-02-30' })).firstMsgDate);
  assert.ok(validateProspect(prospect({ nextStepDate:'2026-13-01' })).nextStepDate);
});
