/* Leads (follow-up): leitura e gravação */
import { leadToRow, rowToLead } from '../lib/mappers.js';
import { createCollection } from './collection.js';

const leads = createCollection({ table:'leads', stateKey:'leads', toRow:leadToRow, fromRow:rowToLead });

export const loadLeads = leads.load;
export const saveLead = leads.save;
export const deleteLead = leads.remove;
export const applyLeadChange = leads.applyRemote;
