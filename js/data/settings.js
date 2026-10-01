/* Configurações do app (SLA) */
async function loadSettings(){
  try{
    const { data, error } = await supabaseClient.from('app_settings').select('sla_days').eq('id', 1).maybeSingle();
    if(error) throw error;
    slaDays = data?.sla_days || 3;
  }catch(e){
    console.error('Falha ao carregar configurações', e);
    slaDays = 3;
    toast('Não foi possível carregar as configurações: ' + dbErrorMessage(e), 'error');
  }
}
async function saveSettings(){
  try{
    const { error } = await supabaseClient.from('app_settings').upsert({ id: 1, sla_days: slaDays }, { onConflict: 'id' });
    if(error) throw error;
    return true;
  }catch(e){
    console.error('Falha ao salvar config', e);
    toast('Não foi possível salvar a configuração: ' + dbErrorMessage(e), 'error');
    return false;
  }
}
