import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile, mkdir} from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'pt-BR',timezoneId:'America/Sao_Paulo'}),page=await context.newPage();const errors=[],apiRequests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))apiRequests.push(r.url());});
 await page.goto('http://127.0.0.1:4173');await page.getByRole('heading',{name:'Encontre seu lugar.'}).waitFor();
 const moduleUrl=await page.evaluate(()=>performance.getEntriesByType('resource').find(x=>x.name.includes('/assets/demo-api-')).name);
 const call=(path,method='GET',body)=>page.evaluate(async({moduleUrl,path,method,body})=>(await import(moduleUrl)).demoApi(path,method,body),{moduleUrl,path,method,body});
 let state=await call('/state');assert.equal(state.resources.length,14);
 const resource=state.resources[0],start=new Date(Date.now()+3600000).toISOString(),end=new Date(Date.now()+7200000).toISOString();
 const reservation=await call('/reservations','POST',{resourceId:resource.id,start,end,title:'Reserva de teste'});
 await assert.rejects(()=>call('/reservations','POST',{resourceId:resource.id,start,end}),/reservado/);
 await assert.rejects(()=>call('/blocks','POST',{resourceId:resource.id,start,end,reason:'Manutenção'}),/reservas/);
 await page.reload();await page.getByRole('heading',{name:'Encontre seu lugar.'}).waitFor();assert.equal((await call('/state')).reservations[0].id,reservation.id);
 await page.getByRole('navigation').getByRole('button',{name:'Minhas reservas',exact:true}).click();await page.getByRole('button',{name:'Cancelar',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Confirmar',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});
 assert.equal((await call('/state')).reservations[0].status,'cancelled');
 await call('/blocks','POST',{resourceId:resource.id,start,end,reason:'Manutenção'});await assert.rejects(()=>call('/reservations','POST',{resourceId:resource.id,start,end}),/bloqueado/);
 await page.getByRole('button',{name:'Testar como colaborador',exact:true}).click();await page.getByRole('button',{name:'Testar como administrador',exact:true}).waitFor();assert.equal(await page.getByRole('navigation').getByRole('button').count(),2);await assert.rejects(()=>call('/settings','PATCH',{checkinMinutes:20}),/administrador/);
 await page.getByRole('button',{name:'Testar como administrador',exact:true}).click();await page.getByRole('navigation').getByRole('button',{name:'Plantas e espaços',exact:true}).click();await page.getByRole('button',{name:'Cadastrar planta',exact:true}).click();
 const dialog=page.getByRole('dialog');await dialog.getByLabel('Unidade',{exact:true}).fill('Teste local');await dialog.getByLabel('Andar / nome da planta').fill('Upload de demonstração');await dialog.locator('input[type=file]').setInputFiles('public/share-cover.png');await dialog.getByRole('button',{name:'Cadastrar planta',exact:true}).click();await dialog.waitFor({state:'hidden'});assert.ok((await call('/state')).floors.some(f=>f.name==='Upload de demonstração'&&f.image.startsWith('data:image/png')));
 await page.getByRole('navigation').getByRole('button',{name:'Explorar espaços',exact:true}).click();await page.getByRole('combobox').selectOption(state.floors[0].id);
 await page.screenshot({path:'test-results/demo-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/demo-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);assert.deepEqual(apiRequests,[]);
 const report={checks:['Loads demo without login or backend','Rejects overlapping reservation','Rejects block conflicting with reservation','Persists after reload','Cancels via interface','Blocked periods cannot be booked','Switches member profile and enforces demo permissions','Uploads and persists floor image','Responsive viewport without page overflow','No runtime errors or API requests'],passed:10};await writeFile('test-results/demo-report.json',JSON.stringify(report,null,2));console.log(report);
} finally {await browser.close();}
