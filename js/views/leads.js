/* Tela: Follow-up de leads */
import { state } from '../store.js';
import { escapeHtml, fmtDate } from '../lib/format.js';
import { leadAging } from '../lib/rules.js';
import { $, ICON_CLOCK, comboLabel, emptyState, nameCell } from '../ui/dom.js';
import { openLeadModal } from '../ui/lead-modal.js';

const wrap = $('#leadsTableWrap');

export function renderLeadsTable(){
  const rows = state.leads.map(lead => ({ lead, aging: leadAging(lead) }));
  const overdue = r => r.aging.level === 'atrasado' ? 0 : 1;
  // quem está na hora de chamar primeiro; depois, pela data de retorno mais próxima
  rows.sort((a, b) => overdue(a) - overdue(b) || (a.lead.followUpDate || '9999').localeCompare(b.lead.followUpDate || '9999'));

  $('#leadTotal').textContent = rows.length;
  $('#leadDue').textContent = rows.filter(r => r.aging.level === 'atrasado').length;

  wrap.innerHTML = rows.length ? `
    <table>
      <thead><tr><th>Lead</th><th>Interesse</th><th>Contato inicial</th><th>Status</th><th>Observação</th></tr></thead>
      <tbody>
        ${rows.map(({ lead: l, aging }) => `
          <tr class="client-row" data-lead-id="${escapeHtml(l.id)}">
            <td>${nameCell(l.id, l.name, l.whatsapp || 'sem whatsapp')}</td>
            <td data-label="Interesse"><span class="combo-tag">${l.combo ? comboLabel(l.combo) : 'Não decidiu'}</span></td>
            <td data-label="Contato inicial" class="mono dim">${fmtDate(l.contactDate)}</td>
            <td data-label="Status"><span class="aging-badge ${aging.level}">${aging.label}</span></td>
            <td data-label="Observação" class="cell-sub cell-notes">${escapeHtml(l.notes || '—')}</td>
          </tr>`).join('')}
      </tbody>
    </table>` : emptyState('Nenhum lead guardado pra chamar depois.', { action:'new-lead', label:'+ Novo lead', icon:ICON_CLOCK });
}

wrap.addEventListener('click', e => {
  const row = e.target.closest('.client-row');
  if(row) openLeadModal(state.leads.find(l => l.id === row.dataset.leadId));
});
