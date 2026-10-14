// Dependency-free ZIP / XLSX writer for static GitHub Pages hosting.
const encoder=new TextEncoder();
function bytes(v){return v instanceof Uint8Array?v:encoder.encode(String(v));}
function crc32(data){let c=-1;for(let i=0;i<data.length;i++){c^=data[i];for(let j=0;j<8;j++)c=(c>>>1)^(0xEDB88320&-(c&1));}return(c^-1)>>>0;}
function dosTime(date){return (date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1);}
function dosDate(date){return ((Math.max(1980,date.getFullYear())-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate();}
export function zipFiles(files){
 const stamp=new Date();const entries=[];let pos=0;const local=[];
 for(const file of files){const name=bytes(file.name),data=bytes(file.data),crc=crc32(data),localHeader=new Uint8Array(30+name.length),v=new DataView(localHeader.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint16(8,0,true);
  v.setUint16(10,dosTime(stamp),true);v.setUint16(12,dosDate(stamp),true);v.setUint32(14,crc,true);
  v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);
  localHeader.set(name,30);local.push(localHeader,data);entries.push({name,data,crc,offset:pos});pos+=localHeader.length+data.length;
 }
 const central=[];let centralSize=0;
 for(const e of entries){const h=new Uint8Array(46+e.name.length),v=new DataView(h.buffer);
  v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x0800,true);v.setUint16(10,0,true);
  v.setUint16(12,dosTime(stamp),true);v.setUint16(14,dosDate(stamp),true);v.setUint32(16,e.crc,true);v.setUint32(20,e.data.length,true);v.setUint32(24,e.data.length,true);
  v.setUint16(28,e.name.length,true);v.setUint32(42,e.offset,true);h.set(e.name,46);central.push(h);centralSize+=h.length;
 }
 const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);
 v.setUint32(12,centralSize,true);v.setUint32(16,pos,true);return new Blob([...local,...central,end],{type:'application/zip'});
}
const escapeXml=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
function column(n){let s='';for(n++;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
function worksheet(headers,rows){
 let x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetData>';
 for(const [r,row] of [headers,...rows].entries()){
  x+=`<row r="${r+1}">`;
  row.forEach((cell,c)=>{if(cell===null||cell===undefined||cell==='')return;
   const ref=column(c)+(r+1);const val=String(cell);
   if(r>0&&typeof cell==='number'&&Number.isFinite(cell))x+=`<c r="${ref}"><v>${cell}</v></c>`;
   else x+=`<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(val)}</t></is></c>`;
  }); x+='</row>';
 }
 return x+'</sheetData></worksheet>';
}
function uniqueSheetName(value,used){let base=String(value||'Site').replace(/[\\/*?:\[\]]/g,' ').replace(/[\x00-\x1f]/g,'').trim().slice(0,31)||'Site';
 let result=base,n=2;while(used.has(result.toLowerCase())){result=base.slice(0,26)+' '+n;n++;}used.add(result.toLowerCase());return result;}
export function createWorkbook(headers,objects){
 const groups=new Map();for(const obj of objects){const key=obj.intezmeny_neve||'Unspecified site';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(headers.map(h=>obj[h]??''));}
 if(!groups.size)groups.set('Records',[]);
 const used=new Set(),sheets=[...groups].map(([name,rows])=>({name:uniqueSheetName(name,used),rows}));
 let wb='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>';
 let rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
 let ct='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>';
 const files=[{name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'}];
 for(let i=0;i<sheets.length;i++){let n=i+1;wb+=`<sheet name="${escapeXml(sheets[i].name)}" sheetId="${n}" r:id="rId${n}"/>`;
  rels+=`<Relationship Id="rId${n}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${n}.xml"/>`;
  ct+=`<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  files.push({name:`xl/worksheets/sheet${n}.xml`,data:worksheet(headers,sheets[i].rows)});
 }
 files.push({name:'xl/workbook.xml',data:wb+'</sheets></workbook>'},{name:'xl/_rels/workbook.xml.rels',data:rels+'</Relationships>'},{name:'[Content_Types].xml',data:ct+'</Types>'});
 return zipFiles(files);
}
export function downloadBlob(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
export async function blobBytes(blob){return new Uint8Array(await blob.arrayBuffer());}
export function csvText(headers,rows){const q=x=>'"'+String(x??'').replace(/"/g,'""')+'"';return '\ufeff'+[headers,...rows].map(row=>row.map(q).join(',')).join('\r\n');}
