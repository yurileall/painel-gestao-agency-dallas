/* Prospecção (perfis abordados no 1x1): leitura e gravação */
import { prospectToRow, rowToProspect } from '../lib/mappers.js';
import { createCollection } from './collection.js';

const prospects = createCollection({ table:'prospects', stateKey:'prospects', toRow:prospectToRow, fromRow:rowToProspect });

export const loadProspects = prospects.load;
export const saveProspect = prospects.save;
export const deleteProspect = prospects.remove;
export const applyProspectChange = prospects.applyRemote;
