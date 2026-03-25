// app.js - MaxIT OTP WebView app
const API_URL = "https://maxit.orangemali.com/api/v1/mob/common/otp/generate";
const HISTORY_KEY = "maxit_otp_history_v1";

function log(msg){
  const el = document.getElementById('log');
  const t = new Date().toLocaleTimeString();
  el.textContent = `${t} - ${msg}\n` + el.textContent;
}

function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function uuid16(){ return (crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(16)+Math.random().toString(16).slice(2)).replace(/-/g,'').slice(0,16); }
const DEVICE_DATA = { type:["android","iPhone"], manufacturer:["Samsung","Tecno","Redmi"], model:["SM-J00","SM-A08"], version:["11","12","13"] };

function randomDevice(uuid){ return { uuid, type: rand(DEVICE_DATA.type), manufacturer: rand(DEVICE_DATA.manufacturer), model: rand(DEVICE_DATA.model), version: rand(DEVICE_DATA.version) }; }
function buildHeaders(device){ return { "User-Agent":"Dart/3.6 (dart:io)", "Accept-Encoding":"gzip", "appversion":"6.1.1-164", "__app_key__":"z256gNY4Njz9y1zkNggTyYkGzN4bb9m14YzygNjkZY9yZmGTyT1ayZYm9NakYZ4kjZjgaYaZ4j91ybYYNb14b4mbb41yzkm9ya9z4NymkygzkGGTzNYNamyabbb94ZGyzT1ya9T9YNjbyk1aymaGymZzyjkZyZG919jggjkgY9aYj14YzjZYN1y1kky4k9yaZZgj4agjgz9m1Y1b94Tb4NjgjyYgT9z41maakbbYgzYaGzz99ZYa4GgGz9j1bYNgNGma20__3", "content-type":"application/json; charset=utf-8", "__package_name__":"com.oml.dsi.orangemobile", "__app_version_name__":"Max it", "__oms_user_language__":"fr", "__oms_terminal_manufacturer__":device.manufacturer, "__oms_terminal_os__":device.type, "__oms_terminal_uuid__":device.uuid, "__oms_terminal_version__":device.version, "__oms_terminal_model__":device.model }; }
function buildPayload(num, device){ return { disableCount:0, useLinkSystem:'yes', msisdn:num, deviceId:device.uuid, deviceType:device.type }; }

function saveHistory(entry){
  try {
    const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    hist.push(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
  } catch(e){ console.error(e); }
}

async function sendOtpSingle(num){
  const uuid = uuid16();
  const device = randomDevice(uuid);
  try{
    const res = await fetch(API_URL, { method:'POST', headers: buildHeaders(device), body: JSON.stringify(buildPayload(num, device)) });
    const json = await res.json().catch(()=>({}));
    log(`[✔] ${num} - HTTP ${res.status}`);
    saveHistory({number:num,date:new Date().toISOString(),status:res.ok?'SUCCESS':'ERROR',device,response:json});
    return {ok:res.ok,json};
  }catch(e){
    log(`[✖] ${num} - ${e.message}`);
    saveHistory({number:num,date:new Date().toISOString(),status:'ERROR',device,error:e.message});
    return {ok:false,error:e.message};
  }
}

async function sendAll(){
  const primary = document.getElementById('numInput').value.trim();
  const second = document.getElementById('secondary').value.trim();
  const notifyOpt = document.getElementById('notifyOpt').checked;
  const saveFileOpt = document.getElementById('saveFileOpt').checked;

  if(!/^\d{8}$/.test(primary)){ alert('Numéro principal invalide (8 chiffres)'); return; }
  const targets = [primary];
  if(second){
    second.split(/\r?\n/).map(s=>s.trim()).filter(s=>s.match(/^\d{8}$/)).forEach(s=>targets.push(s));
  }

  log(`Envoi vers ${targets.length} numéro(s)`);

  const results = [];
  for(const t of targets){
    const r = await sendOtpSingle(t);
    results.push({num:t,ok:r.ok});
  }

  log('Envoi terminé.');
  if(notifyOpt){
    if(window.Notification && Notification.permission==='granted'){ Notification.requestPermission(()=>{}); }
    try{
      if(Notification){ new Notification('MaxIT OTP', {body:`Envoi terminé: ${results.length} numéros`}); }
    }catch(e){ alert('Envoi terminé'); }
  }
  if(saveFileOpt){
    // keep in localStorage already; also prepare downloadable file
    const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    const blob = new Blob([JSON.stringify(hist,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'otp_history.json'; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },1500);
  }
}

document.getElementById('sendBtn').addEventListener('click', sendAll);
document.getElementById('downloadHistory').addEventListener('click', ()=>{
  const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  const blob = new Blob([JSON.stringify(hist,null,2)],{type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'otp_history.json'; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); },1500);
});

// ask notification permission early
if(window.Notification && Notification.permission!=='granted') Notification.requestPermission().catch(()=>{});
