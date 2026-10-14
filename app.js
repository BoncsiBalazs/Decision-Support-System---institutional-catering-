import {EXPORT_HEADERS, AGE_GROUPS, ATTRIBUTES,flattenEntry,newEventId, normalizedQuantity} from './schema.js';
import {createWorkbook,zipFiles,downloadBlob,blobBytes,csvText} from './excel.js';
const DB_NAME='zerowaste-entry-en-v1',STORE='meal_entries';
let dbPromise,editingId=null;
const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
function escapeHTML(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}
function notify(target,message,error=false){const el=$(target);el.textContent=message;el.style.color=error?'#b53d2f':'#14694c';}
function dbOpen(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);
 req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});return dbPromise;}
async function transaction(mode,callback){const db=await dbOpen();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE),req=callback(store);
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.onerror=()=>reject(tx.error);
});}
const listEvents=()=>transaction('readonly',s=>s.getAll());
const getEvent=id=>transaction('readonly',s=>s.get(id));
const saveEvent=e=>transaction('readwrite',s=>s.put(e));
const deleteEvent=id=>transaction('readwrite',s=>s.delete(id));
function input(name,description,type='text',extra='') {return `<label>${description}<input name="${name}" type="${type}" ${extra}></label>`;}
function select(name,label,choices){return `<label>${label}<select name="${name}">${choices.map(([v,t])=>`<option value="${escapeHTML(v)}">${escapeHTML(t)}</option>`).join('')}</select></label>`;}
function textArea(name,label){return `<label class="full">${label}<textarea name="${name}" rows="2"></textarea></label>`;}
function formSection(type,title,number){const isSoup=type==='soup'; const unitOptions=isSoup?[
 ['L','Litres (L)'],['dL','Decilitres (dL)'],['mL','Millilitres (mL)'],['portions','Number of portions']]:[
 ['kg','Kilograms (kg)'],['dkg','Decagrams (dkg)'],['g','Grams (g)'],['portions','Number of portions'],['pieces','Number of pieces']];
 return `<div class="section"><div class="section-heading course-heading"><div style="display:flex;gap:13px"><span class="section-number">${number}</span><div><h2>${title}</h2><p>Enter measurements for this course. Leave this course disabled if it was not served.</p></div></div><label class="toggle"><input type="checkbox" id="${type}Enabled" ${isSoup?'checked':''}>Include ${isSoup?'soup':'main course'}</label></div>
 <div class="course-body" id="${type}Body" ${isSoup?'':'hidden'}>
 <div class="form-grid">${input('dish','Dish name <em>required when included</em>','text','required maxlength="220" placeholder="Enter the dish name as listed on the menu"')}
 ${input('servedQty','Served quantity (numeric)','number','min="0" step="any" placeholder="e.g. 250"')}
 ${select('servedUnit','Original unit',unitOptions)}
 ${input('factor',isSoup?'Verified litres per portion (if using portion counts)':'Verified kg per portion or piece (if applicable)','number','min="0" step="any" placeholder="Only if known"')}
 <label class="full">Standardised quantity <span class="helper">Calculated; used by ZeroWaste to derive g/L or kg/kg. No guessed conversion factors.</span><input class="converted" disabled placeholder="Enter an original quantity and its unit"></label>
 ${input('wasteKg','Total returned plate waste (kg)','number','min="0" step="any" placeholder="e.g. 1.2"')}
 ${input('temperature','Serving temperature of '+(isSoup?'soup':'main component')+' (°C)','number','step="0.1" placeholder="e.g. 65.0"')}
 ${!isSoup?input('temperatureSide','Serving temperature of side dish (°C)','number','step="0.1" placeholder="Optional"'):''}
 ${!isSoup?input('wasteMain','Plate waste: main component (kg)','number','min="0" step="any" placeholder="Optional"'):''}
 ${!isSoup?input('wasteSide','Plate waste: side dish (kg)','number','min="0" step="any" placeholder="Optional"'):''}
 ${!isSoup?input('wasteOther','Plate waste: other components (kg)','number','min="0" step="any" placeholder="Optional"'):''}
 </div><p class="subhead">Staff sensory assessment · 1 very poor to 5 very good</p>
 <div class="sensory-grid"><span class="heading">Attribute</span><span class="heading">Rating (1–5)</span><span class="heading">Optional observation</span>
 ${ATTRIBUTES.map(([key,label])=>`<label for="${type}_${key}">${label}</label><select id="${type}_${key}" name="rating_${key}"><option value="">Not assessed</option>${[1,2,3,4,5].map(n=>`<option value="${n}">${n}</option>`).join('')}</select><input name="comment_${key}" maxlength="400" placeholder="Additional comment (optional)">`).join('')}
 </div>
 <p class="subhead">Other observations</p><div class="form-grid">${textArea('improvement','Recommended improvement / corrective action')}${textArea('staffNotes','Additional staff observations')}
 ${textArea('consumerNotes','Consumer comments received by the kitchen staff')}
 ${select('repeat','Was a second serving available?',[['','Not recorded'],['yes','Yes'],['no','No']])}
 <label>Meal photograph <span class="helper">Stored locally with the entry; exported as a separate file.</span><input type="file" name="photo" accept="image/jpeg,image/png,image/webp"><span class="photo-info small"></span></label>
 </div></div></div>`;}
function initForm(){for(const [v,t] of AGE_GROUPS)$('#ageGroup').insertAdjacentHTML('beforeend',`<option value="${v}">${t}</option>`);
 $('#course-sections').innerHTML=formSection('soup','Soup','02')+formSection('main','Main course and side dish','03');
 $('#ageGroup').addEventListener('change',()=>{$('#otherAgeGroupWrap').hidden=$('#ageGroup').value!=='0';});
 for(const type of ['soup','main']){const body=$(`#${type}Body`),toggle=$(`#${type}Enabled`);toggle.addEventListener('change',()=>{body.hidden=!toggle.checked;$$('input,select,textarea',body).forEach(x=>{if(x.name==='dish')x.required=toggle.checked;});});
  const recalc=()=>{const qty=$('[name=servedQty]',body).value,unit=$('[name=servedUnit]',body).value,factor=$('[name=factor]',body).value;
   const r=normalizedQuantity(qty,unit,factor,type);$('.converted',body).value=r.value!==''?`${r.value} ${type==='soup'?'L':'kg'} (${r.note})`:r.note;};
  for(const name of ['servedQty','servedUnit','factor'])$(`[name=${name}]`,body).addEventListener('input',recalc);
 }
 resetForm();}
function switchTab(tab){$$('.tab').forEach(x=>{x.classList.toggle('active',x.dataset.tab===tab);x.setAttribute('aria-current',x.dataset.tab===tab?'page':'false');});
 $$('.tab-page').forEach(x=>x.classList.toggle('active',x.id==='panel-'+tab));if(tab==='saved')refreshEntries();window.scrollTo({top:0,behavior:'smooth'});}
function resetForm(){editingId=null;$('#entryForm').reset();$('#mealDate').value=new Date().toLocaleDateString('en-CA');$('#soupEnabled').checked=true;$('#mainEnabled').checked=false;
 $('#soupBody').hidden=false;$('#mainBody').hidden=true;$('#otherAgeGroupWrap').hidden=true;$$('.photo-info').forEach(x=>x.textContent='');$$('.converted').forEach(x=>x.value='');notify('#formStatus','');}
function readNumeric(form,key){const node=form.querySelector(`[name="${key}"]`);const v=node?.value??'';return v===''?'':Number(v);}
async function photoDataFromFile(file){if(!file||!file.size)return null;if(file.size>12*1024*1024)throw Error('Photo exceeds the 12 MB upload limit. Please resize it first.');
 const image=await createImageBitmap(file);let w=image.width,h=image.height;let scale=Math.min(1,1600/Math.max(w,h));
 const canvas=document.createElement('canvas');canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);image.close();return canvas.toDataURL('image/jpeg',0.8);}
async function captureCourse(type,previous){const form=$(`#${type}Body`);if(!$(`#${type}Enabled`).checked)return null;
 const get=k=>String(form.querySelector(`[name="${k}"]`)?.value??'').trim();const ratings={},comments={};for(const [key] of ATTRIBUTES){ratings[key]=get('rating_'+key);comments[key]=get('comment_'+key);}
 const file=$('[name=photo]',form).files[0];let photoData=previous?.photoData||null;if(file)photoData=await photoDataFromFile(file);
 return {dish:get('dish'),servedQty:readNumeric(form,'servedQty'),servedUnit:get('servedUnit'),factor:readNumeric(form,'factor'),wasteKg:readNumeric(form,'wasteKg'),
 temperature:readNumeric(form,'temperature'),temperatureSide:readNumeric(form,'temperatureSide'),wasteMain:readNumeric(form,'wasteMain'),wasteSide:readNumeric(form,'wasteSide'),
 wasteOther:readNumeric(form,'wasteOther'),ratings,comments,improvement:get('improvement'),staffNotes:get('staffNotes'),consumerNotes:get('consumerNotes'),repeat:get('repeat'),photoData};}
async function saveForm(e){e.preventDefault();notify('#formStatus','Saving entry…');try{
 const institution=$('#institution').value.trim(),mealDate=$('#mealDate').value,ageGroup=$('#ageGroup').value;
 if(!institution||!mealDate||!ageGroup)throw Error('Institution, measurement date and recipient group are required.');
 if(!$('#soupEnabled').checked&&!$('#mainEnabled').checked)throw Error('Include at least one course.');
 const previous=editingId?await getEvent(editingId):null;
 const soup=await captureCourse('soup',previous?.soup),main=await captureCourse('main',previous?.main);
 if((soup&&!soup.dish)||(main&&!main.dish))throw Error('Provide a dish name for every included course.');
 for(const course of [soup,main])if(course){for(const k of ['servedQty','wasteKg','temperature','temperatureSide','wasteMain','wasteSide','wasteOther'])if(course[k]!==''&&(course[k]<0||!Number.isFinite(course[k])))throw Error(`Invalid number in ${k}.`);}
 const event={id:previous?.id||newEventId(),institution,mealDate,ageGroup,ageGroupOther:$('[name=ageGroupOther]').value.trim(),recorder:$('#recorder').value.trim(),
 createdAt:previous?.createdAt||new Date().toISOString(),savedAt:new Date().toISOString(),soup,main};await saveEvent(event);editingId=event.id;
 notify('#formStatus','Entry saved locally. Export a backup or Excel file when ready.');await updateCount();
 }catch(err){notify('#formStatus',err.message||String(err),true);}}
function fillCourse(type,data){const body=$(`#${type}Body`);const toggle=$(`#${type}Enabled`);toggle.checked=!!data;toggle.dispatchEvent(new Event('change'));
 if(!data)return;for(const key of ['dish','servedQty','servedUnit','factor','wasteKg','temperature','temperatureSide','wasteMain','wasteSide','wasteOther','improvement','staffNotes','consumerNotes','repeat']){
 const node=$(`[name=${key}]`,body);if(node)node.value=data[key]??'';
 }for(const [key]of ATTRIBUTES){$(`[name=rating_${key}]`,body).value=data.ratings?.[key]??'';$(`[name=comment_${key}]`,body).value=data.comments?.[key]??'';}
 $('.photo-info',body).textContent=data.photoData?'Previously stored photo will be retained unless you select a new file.':'';
 $('[name=servedQty]',body).dispatchEvent(new Event('input'));
}
async function editEvent(id){const e=await getEvent(id);if(!e)return;resetForm();editingId=id;
 $('#institution').value=e.institution;$('#mealDate').value=e.mealDate;$('#ageGroup').value=e.ageGroup;$('#ageGroup').dispatchEvent(new Event('change'));
 $('[name=ageGroupOther]').value=e.ageGroupOther||'';$('#recorder').value=e.recorder||'';fillCourse('soup',e.soup);fillCourse('main',e.main);switchTab('entry');notify('#formStatus','Editing an existing entry. Save to update it.');}
async function updateCount(){const events=await listEvents();$('#entryCount').textContent=events.length;return events;}
async function refreshEntries(){const events=(await updateCount()).sort((a,b)=>b.savedAt.localeCompare(a.savedAt)),q=$('#searchEntries').value.toLowerCase().trim();
 const filtered=events.filter(e=>[e.institution,e.mealDate,e.soup?.dish,e.main?.dish].some(x=>String(x||'').toLowerCase().includes(q)));
 const wrap=$('#entriesTableWrap');if(!filtered.length){wrap.innerHTML='<p class="empty">No matching saved entries. Create an entry on the first tab.</p>';return;}
 wrap.innerHTML='<table><thead><tr><th>Measurement date</th><th>Institution</th><th>Recipient group</th><th>Soup</th><th>Main course</th><th>Last saved</th><th>Actions</th></tr></thead><tbody>'+filtered.map(e=>`<tr><td>${escapeHTML(e.mealDate)}</td><td>${escapeHTML(e.institution)}</td><td>${escapeHTML(AGE_GROUPS.find(x=>x[0]===e.ageGroup)?.[1]||'Other')}</td><td>${escapeHTML(e.soup?.dish||'—')}</td><td>${escapeHTML(e.main?.dish||'—')}</td><td>${escapeHTML(new Date(e.savedAt).toLocaleString('en-GB'))}</td><td><button class="table-action edit" data-id="${escapeHTML(e.id)}">Edit</button><button class="table-action danger delete" data-id="${escapeHTML(e.id)}">Delete</button></td></tr>`).join('')+'</tbody></table>';
 $$('.edit',wrap).forEach(b=>b.onclick=()=>editEvent(b.dataset.id));$$('.delete',wrap).forEach(b=>b.onclick=async()=>{if(confirm('Permanently delete this locally stored entry?')){await deleteEvent(b.dataset.id);await refreshEntries();}});
}
function fileSafe(s){return String(s).normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/_+/g,'_').slice(0,55)||'record';}
function dataURLbytes(s){const b64=s.split(',')[1]||'';const binary=atob(b64),b=new Uint8Array(binary.length);for(let i=0;i<b.length;i++)b[i]=binary.charCodeAt(i);return b;}
async function getRecords(){const events=await listEvents();if(!events.length)throw Error('No saved entries. Create an entry first.');return events;}
async function exportExcel(){try{notify('#exportStatus','Preparing Excel workbook…');const events=await getRecords(),xlsx=createWorkbook(EXPORT_HEADERS,events.map(flattenEntry));downloadBlob(xlsx,'raw_entry_events.xlsx');notify('#exportStatus',`Excel generated successfully: ${events.length} meal events.`);}catch(err){notify('#exportStatus',err.message,true);}}
async function exportPackage(){try{notify('#exportStatus','Preparing import-ready ZIP…');const events=await getRecords(),files=[{name:'data_raw/raw_entry_events.xlsx',data:new Uint8Array(await createWorkbook(EXPORT_HEADERS,events.map(flattenEntry)).arrayBuffer())}];
 const photos=[],manifest=[];
 for(const e of events){for(const [type,course]of [['soup',e.soup],['main',e.main]])if(course?.photoData){const name=`${fileSafe(e.id)}_${type}.jpg`,rel=`entry_photos/${fileSafe(e.id)}/${name}`;
 files.push({name:'data_media/'+rel,data:dataURLbytes(course.photoData)});
 manifest.push([`${e.id}__${type}__served`,e.id,type==='soup'?'Leves':'Második fogás','served',e.mealDate,course.dish,e.institution,rel,e.savedAt,'english-entry-1.0',rel]);
 }}
 const headers=['photo_id','entry_event_id','course','photo_role','meal_date','dish_name','institution_name','filename','stored_at','app_version','local_rel_path'];
 files.push({name:'data_media/entry_media.csv',data:csvText(headers,manifest)});
 files.push({name:'IMPORT_INSTRUCTIONS.txt',data:'ZeroWaste Entry export. Copy data_raw/raw_entry_events.xlsx to the ZeroWaste/data_raw folder. If present, copy data_media/entry_media.csv and the entry_photos folder to ZeroWaste/data_media. Keep an untouched backup of the original files. The R/Shiny pipeline must be run separately. This package contains locally recorded data; treat it as confidential.\n'});
 downloadBlob(zipFiles(files),'ZeroWaste_Entry_Import.zip');notify('#exportStatus',`ZIP generated: ${events.length} entries, ${manifest.length} photos.`);
 }catch(err){notify('#exportStatus',err.message||String(err),true);}}
async function exportBackup(){try{const data=await getRecords();downloadBlob(new Blob([JSON.stringify({format:'ZeroWasteEntryBackup',version:1,exportedAt:new Date().toISOString(),entries:data},null,2)],{type:'application/json'}),'ZeroWaste_Entry_Private_Backup.json');notify('#exportStatus','Local backup generated. Keep this file private.');}catch(err){notify('#exportStatus',err.message,true);}}
async function restoreBackup(file){if(!file)return;try{const data=JSON.parse(await file.text());if(data.format!=='ZeroWasteEntryBackup'||!Array.isArray(data.entries))throw Error('Not a recognised ZeroWaste Entry backup.');
 if(!confirm(`Restore ${data.entries.length} entries? Matching IDs will be overwritten.`))return;
 for(const e of data.entries){if(!e.id||!e.institution||!e.mealDate)throw Error('The backup contains an invalid meal event.');await saveEvent(e);}await updateCount();notify('#exportStatus',`Restored ${data.entries.length} locally stored entries.`);
 }catch(err){notify('#exportStatus',err.message||String(err),true);}finally{$('#restoreBackup').value='';}}
async function init(){try{if(!('indexedDB' in window))throw Error('This browser does not support IndexedDB. Use a modern browser.');await dbOpen();initForm();await updateCount();
 $$('.tab').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));$('#entryForm').addEventListener('submit',saveForm);
 $('#newEntry').onclick=resetForm;$('#refreshEntries').onclick=refreshEntries;$('#searchEntries').addEventListener('input',refreshEntries);
 $('#downloadExcel').onclick=exportExcel;$('#downloadPackage').onclick=exportPackage;$('#downloadBackup').onclick=exportBackup;
 $('#restoreBackup').onchange=e=>restoreBackup(e.target.files[0]);
 $('#storageState').textContent='Local-only storage active';
 }catch(err){$('#storageState').textContent='Storage unavailable';notify('#formStatus',err.message||String(err),true);}}
init();
