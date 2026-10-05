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
/* Um mês por vez, mesmo motivo de saveClient(). */
async function saveAdSpendMonth(month, amount){
  try{
    const { error } = await supabaseClient.from('ad_spend')
      .upsert({ month, amount: parseFloat(amount) || 0 }, { onConflict: 'month' });
    if(error) throw error;
    return true;
  }catch(e){
    console.error('Falha ao salvar gasto com tráfego', e);
    toast('Não foi possível salvar o gasto com tráfego: ' + dbErrorMessage(e), 'error');
    return false;
  }
}

async function deleteAdSpendMonth(month){
  try{
    const { error } = await supabaseClient.from('ad_spend').delete().eq('month', month);
    if(error) throw error;
    return true;
  }catch(e){
    console.error('Falha ao remover o mês', e);
    toast('Não foi possível remover o mês: ' + dbErrorMessage(e), 'error');
    return false;
  }
}
