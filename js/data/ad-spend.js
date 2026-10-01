/* Gasto com tráfego pago por mês */
async function loadAdSpend(){
  try{
    const { data, error } = await supabaseClient.from('ad_spend').select('month, amount');
    if(error) throw error;
    adSpend = {};
    (data || []).forEach(r=>{ adSpend[r.month] = Number(r.amount) || 0; });
  }catch(e){
    console.error('Falha ao carregar gasto com tráfego', e);
    adSpend = {};
    toast('Não foi possível carregar o gasto com tráfego: ' + dbErrorMessage(e), 'error');
  }
}
async function saveAdSpend(){
  try{
    const rows = Object.keys(adSpend).map(m=>({ month: m, amount: parseFloat(adSpend[m]) || 0 }));
    if(rows.length){
      const { error } = await supabaseClient.from('ad_spend').upsert(rows, { onConflict: 'month' });
      if(error) throw error;
    }
    const { data: existing, error: selErr } = await supabaseClient.from('ad_spend').select('month');
    if(selErr) throw selErr;
    const localMonths = new Set(Object.keys(adSpend));
    const toDelete = (existing || []).map(r=>r.month).filter(m=>!localMonths.has(m));
    if(toDelete.length){
      const { error: delErr } = await supabaseClient.from('ad_spend').delete().in('month', toDelete);
      if(delErr) throw delErr;
    }
    return true;
  }catch(e){
    console.error('Falha ao salvar gasto com tráfego', e);
    toast('Não foi possível salvar o gasto com tráfego: ' + dbErrorMessage(e), 'error');
    return false;
  }
}
