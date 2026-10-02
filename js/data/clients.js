/* Clientes: leitura e gravação */
import { state } from '../store.js';
import { clientToRow, rowToClient } from '../lib/mappers.js';
import { applyStatusDates } from '../lib/rules.js';
import { createCollection } from './collection.js';

const clients = createCollection({ table:'clients', stateKey:'clients', toRow:clientToRow, fromRow:rowToClient });

export const loadClients = clients.load;
export const saveClient = clients.save;
export const deleteClient = clients.remove;
export const applyClientChange = clients.applyRemote;

/** Move o cliente no pipeline, ajustando as datas de produção e de entrega. */
export function moveClient(id, status){
  const c = state.clients.find(c => c.id === id);
  if(!c || c.status === status) return Promise.resolve({ ok:true });
  return saveClient(applyStatusDates({ ...c, status }));
}
