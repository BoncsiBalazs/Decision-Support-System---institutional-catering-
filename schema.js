// ZeroWaste input compatibility schema. The internal identifiers must remain unchanged.
export const EXPORT_HEADERS = [
  'entry_event_id','sorszam','adatrögzítő_neve','intezmeny_neve','kitoltes_datuma','bekuldes_idopontja','korosztaly','korosztaly_megj',
  'leves_nev','leves_adag','leves_adag_eredeti','leves_adag_egyseg_eredeti','leves_adag_konverzio','leves_hom','leves_moslek','leves_moslek_eredeti','leves_moslek_egyseg_eredeti',
  'leves_kulso','leves_kulso_megj','leves_illat','leves_illat_megj','leves_iz','leves_iz_megj','leves_allomany','leves_allomany_megj','leves_osszkedv','leves_osszkedv_megj',
  'leves_javitas','leves_megjegyzes','leves_foto_rogzitve','leves_fogy_megj','leves_repeta',
  'masodik_nev','masodik_adag','masodik_adag_eredeti','masodik_adag_egyseg_eredeti','masodik_adag_konverzio','masodik_homerseklet1','masodik_homerseklet2',
  'masodik_moslek','masodik_moslek_foetel','masodik_moslek_koret','masodik_moslek_egyeb','masodik_moslek_eredeti','masodik_moslek_egyseg_eredeti',
  'masodik_kulso','masodik_kulso_megj','masodik_illat','masodik_illat_megj','masodik_iz','masodik_iz_megj','masodik_allomany','masodik_allomany_megj',
  'masodik_osszkedv','masodik_osszkedv_megj','masodik_javitas','masodik_megjegyzes','masodik_foto_rogzitve','masodik_fogy_megj','masodik_repeta'
];
export const AGE_GROUPS = [
  ['1','Nursery (0–3 years)'],['2','Kindergarten (4–6 years)'],['3','Primary school — lower grades'],['4','Primary school — upper grades'],
  ['5','Secondary school'],['6','Older adult meal service'],['0','Other recipient group']
];
export const ATTRIBUTES = [
  ['appearance','Appearance','kulso'], ['odour','Odour','illat'], ['taste','Taste','iz'],
  ['texture','Texture','allomany'], ['overall','Overall liking','osszkedv']
];
export const SOURCE_LABELS = {
  entry_event_id:'Stable entry identifier',sorszam:'Source record identifier', 'adatrögzítő_neve':'Recorder (optional)', intezmeny_neve:'Institution / serving site',
  kitoltes_datuma:'Measurement date', bekuldes_idopontja:'Submission timestamp',korosztaly:'Recipient age group code',korosztaly_megj:'Other group description',
  leves_nev:'Soup name',leves_adag:'Soup quantity served (L)',leves_adag_eredeti:'Soup quantity as recorded',leves_adag_egyseg_eredeti:'Original soup unit',
  leves_adag_konverzio:'Soup unit conversion evidence',leves_hom:'Soup serving temperature (°C)',leves_moslek:'Soup returned plate waste (kg)',
  leves_moslek_eredeti:'Original soup plate waste',leves_moslek_egyseg_eredeti:'Original soup waste unit',
  leves_kulso:'Soup appearance (1–5)',leves_kulso_megj:'Soup appearance comment',leves_illat:'Soup odour (1–5)',leves_illat_megj:'Soup odour comment',
  leves_iz:'Soup taste (1–5)',leves_iz_megj:'Soup taste comment',leves_allomany:'Soup texture (1–5)',leves_allomany_megj:'Soup texture comment',
  leves_osszkedv:'Soup overall liking (1–5)',leves_osszkedv_megj:'Soup overall liking comment',leves_javitas:'Soup improvement recommendation',
  leves_megjegyzes:'Soup staff observations',leves_foto_rogzitve:'Soup photo recorded (yes/no)',leves_fogy_megj:'Soup consumer feedback',leves_repeta:'Second serving of soup available (yes/no)',
  masodik_nev:'Main course / side dish name',masodik_adag:'Main course served quantity (kg)',masodik_adag_eredeti:'Main quantity as recorded',
  masodik_adag_egyseg_eredeti:'Original main unit',masodik_adag_konverzio:'Main unit conversion evidence',
  masodik_homerseklet1:'Main component serving temperature (°C)',masodik_homerseklet2:'Side component serving temperature (°C)',
  masodik_moslek:'Main course total returned plate waste (kg)',masodik_moslek_foetel:'Returned main component (kg)',masodik_moslek_koret:'Returned side component (kg)',
  masodik_moslek_egyeb:'Other returned meal components (kg)',masodik_moslek_eredeti:'Original main plate waste',
  masodik_moslek_egyseg_eredeti:'Original main waste unit',masodik_kulso:'Main appearance (1–5)',masodik_kulso_megj:'Main appearance comment',
  masodik_illat:'Main odour (1–5)',masodik_illat_megj:'Main odour comment',masodik_iz:'Main taste (1–5)',masodik_iz_megj:'Main taste comment',
  masodik_allomany:'Main texture (1–5)',masodik_allomany_megj:'Main texture comment',masodik_osszkedv:'Main overall liking (1–5)',
  masodik_osszkedv_megj:'Main overall liking comment',masodik_javitas:'Main improvement recommendation',masodik_megjegyzes:'Main staff observations',
  masodik_foto_rogzitve:'Main photo recorded (yes/no)',masodik_fogy_megj:'Main consumer feedback',masodik_repeta:'Second helping of main course available (yes/no)'
};
export function normalizedQuantity(qty,unit,portionSize,course){
  if(qty===''||qty===null||!Number.isFinite(Number(qty))||Number(qty)<0)return {value:'',note:'Missing served quantity'};
  const q=Number(qty); let value=null;let note='';
  if(course==='soup'){
    if(unit==='L'){value=q;note='Direct measured volume (L)';}
    else if(unit==='dL'){value=q/10;note='dL converted to L (×0.1)';}
    else if(unit==='mL'){value=q/1000;note='mL converted to L (×0.001)';}
    else if(unit==='portions'&&Number(portionSize)>0){value=q*Number(portionSize);note=`${q} portions × ${portionSize} L per portion (user-provided)`;}
  } else {
    if(unit==='kg'){value=q;note='Direct measured mass (kg)';}
    else if(unit==='dkg'){value=q/100;note='dkg converted to kg (×0.01)';}
    else if(unit==='g'){value=q/1000;note='g converted to kg (×0.001)';}
    else if((unit==='portions'||unit==='pieces')&&Number(portionSize)>0){value=q*Number(portionSize);note=`${q} ${unit} × ${portionSize} kg per ${unit==='pieces'?'piece':'portion'} (user-provided)`;}
  }
  if(value===null)return {value:'',note:`Original: ${q} ${unit}; no verified L/kg conversion`};
  return {value:Number(value.toFixed(6)),note};
}
export function newEventId(){
  const now=new Date();let d=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('');
  const t=[now.getHours(),now.getMinutes(),now.getSeconds()].map(x=>String(x).padStart(2,'0')).join('');
  const random=(typeof crypto!=='undefined'&&crypto.getRandomValues)?(crypto.getRandomValues(new Uint32Array(1))[0]%9000+1000):Math.floor(Math.random()*9000+1000);
  return `ZWE-${d}${t}-${random}`;
}
export function flattenEntry(e){
 const out=Object.fromEntries(EXPORT_HEADERS.map(h=>[h,'']));
 const date=e.mealDate||'';
 Object.assign(out,{entry_event_id:e.id,sorszam:e.id,'adatrögzítő_neve':e.recorder||'',intezmeny_neve:e.institution||'',kitoltes_datuma:date,
 bekuldes_idopontja:e.savedAt||'',korosztaly:e.ageGroup||'',korosztaly_megj:e.ageGroupOther||''});
 for(const [type,prefix] of [['soup','leves'],['main','masodik']]){
  const d=e[type]||{};if(!d.dish?.trim())continue;
  const conv=normalizedQuantity(d.servedQty,d.servedUnit,d.factor,type);
  out[prefix+'_nev']=d.dish.trim();out[prefix+'_adag']=conv.value;out[prefix+'_adag_eredeti']=d.servedQty??'';
  out[prefix+'_adag_egyseg_eredeti']=d.servedUnit||'';out[prefix+'_adag_konverzio']=conv.note;
  if(type==='soup')out['leves_hom']=d.temperature??'';else {out['masodik_homerseklet1']=d.temperature??'';out['masodik_homerseklet2']=d.temperatureSide??'';}
  out[prefix+'_moslek']=d.wasteKg??'';out[prefix+'_moslek_eredeti']=d.wasteKg??'';out[prefix+'_moslek_egyseg_eredeti']='kg';
  if(type==='main'){out['masodik_moslek_foetel']=d.wasteMain??'';out['masodik_moslek_koret']=d.wasteSide??'';out['masodik_moslek_egyeb']=d.wasteOther??'';}
  for(const [key,_,field] of ATTRIBUTES){out[prefix+'_'+field]=d.ratings?.[key]??'';out[prefix+'_'+field+'_megj']=d.comments?.[key]??'';}
  out[prefix+'_javitas']=d.improvement||'';out[prefix+'_megjegyzes']=d.staffNotes||'';
  out[prefix+'_fogy_megj']=d.consumerNotes||'';out[prefix+'_repeta']=d.repeat??'';
  out[prefix+'_foto_rogzitve']=d.photoData?'yes':'no';
 }
 return out;
}
