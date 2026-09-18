import { getSettings, saveSettings } from "../utils/storage.js";
const ids = ["provider","apiKey","model","customEndpoint","language","contextLength","customPrompt","floatingButton","screenshotFallback"];
const $ = (id) => document.getElementById(id);
async function load() { const s=await getSettings(); ids.forEach((id) => { const el=$(id); el[el.type === "checkbox" ? "checked" : "value"] = s[id]; }); updateRange(); }
function updateRange(){ $("context-output").textContent = `${Number($("contextLength").value).toLocaleString()} characters`; }
$("contextLength").oninput=updateRange;
$("reveal").onclick=()=>{ const input=$("apiKey"); input.type=input.type==="password"?"text":"password"; $("reveal").textContent=input.type==="password"?"Show":"Hide"; };
$("form").onsubmit=async(e)=>{e.preventDefault();const data={};ids.forEach((id)=>{const el=$(id);data[id]=el.type==="checkbox"?el.checked:el.value.trim();});data.contextLength=Number(data.contextLength);await saveSettings(data);$("saved").textContent="Saved";setTimeout(()=>$("saved").textContent="",1500);};
$("test").onclick=async()=>{ $("test-result").textContent="Testing…"; await $("form").onsubmit(new Event("submit")); const r=await chrome.runtime.sendMessage({type:"TEST_CONNECTION"}); $("test-result").textContent=r.ok?"Connected successfully":"Failed: "+r.error; };
load();
