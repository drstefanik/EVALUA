
const API="https://api.airtable.com/v0/"; const BASE=import.meta.env.VITE_AT_BASE_ID; const KEY=import.meta.env.VITE_AT_API_KEY;
async function req(path, init={}){
  const r = await fetch(`${API}${BASE}/${path}`, { ...init, headers:{ Authorization:`Bearer ${KEY}`,"Content-Type":"application/json",...(init.headers||{}) } });
  if(!r.ok) throw new Error(await r.text()); return r.json();
}
export const at={
  list:(t,p={})=>{const qs=new URLSearchParams(p).toString();return req(`${t}?${qs}`)},
  create:(t,f)=>req(`${t}`,{method:"POST",body:JSON.stringify({records:[{fields:f}]})}),
  update:(t,id,f)=>req(`${t}`,{method:"PATCH",body:JSON.stringify({records:[{id,fields:f}]})}),
};
