"use strict";
const digits=v=>String(v).replace(/[0-9]/g,d=>"۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const menu=document.querySelector(".menu"),nav=document.querySelector(".nav");
if(menu&&nav){menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open))});nav.addEventListener("click",e=>{if(e.target instanceof HTMLAnchorElement){nav.classList.remove("open");menu.setAttribute("aria-expanded","false")}})}
const examples=[["سخم","سلام"],["خئثپ","خوب"],["فردوسي","فردوسی"],["مي روم","می‌روم"]];
const source=document.querySelector("[data-source]"),result=document.querySelector("[data-result]");
if(source&&result){let i=0;window.setInterval(()=>{i=(i+1)%examples.length;source.textContent=examples[i][0];result.textContent=examples[i][1]},3200)}
const root=document.querySelector("[data-history-root]");
if(root&&window.FARSI_SMART_HISTORY){
 const data=window.FARSI_SMART_HISTORY;
 const releases=root.querySelector("[data-releases]"),list=root.querySelector("[data-activities]");
 const el=(name,cls,text)=>{const n=document.createElement(name);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 data.releases.forEach((r,i)=>{
  const article=el("article","release-card"),order=el("div","release-order",digits(i+1)),body=el("div","release-body"),meta=el("div","release-meta");
  meta.append(el("span","release-version","نسخهٔ "+r.version),el("time","",r.date));
  meta.lastChild.dateTime=r.datetime;
  body.append(meta,el("h3","",r.title),el("p","",r.summary));
  const ul=el("ul");r.bullets.forEach(x=>ul.append(el("li","",x)));body.append(ul);
  const foot=el("div","release-foot");foot.append(el("span","",r.count+" ثبت توسعه تا این انتشار"),el("span","","انتشار ثبت‌شده در گیت‌هاب"));body.append(foot);
  article.append(order,body);releases.append(article);
 });
 data.activities.forEach(a=>{
  const article=el("article","activity");article.dataset.category=a.category;article.dataset.search=a.title;
  const index=el("div","activity-index",a.index),main=el("div"),meta=el("div","activity-meta"),time=el("time","",a.date);time.dateTime=a.datetime;
  meta.append(time,el("span","",a.category),el("span","","مسیر نسخهٔ "+a.version));
  if(a.release)meta.append(el("span","release-tag","انتشار نسخهٔ "+a.release));
  const foot=el("div","activity-foot");foot.append(el("span","",a.files+" فایل تغییر کرده"),el("span","",a.merge?"ثبت ادغام":"ثبت مستقیم"));
  main.append(meta,el("h3","",a.title),foot);article.append(index,main);list.append(article);
 });
 const items=[...root.querySelectorAll(".activity")],buttons=[...root.querySelectorAll(".filter")],search=root.querySelector(".search"),count=root.querySelector(".count"),more=root.querySelector(".more"),empty=root.querySelector(".empty");
 let category="همه",limit=30;
 const update=()=>{const q=search.value.trim();let matched=0,shown=0;items.forEach(item=>{const ok=(category==="همه"||item.dataset.category===category)&&(!q||item.dataset.search.includes(q));if(ok)matched++;const show=ok&&shown<limit;item.hidden=!show;if(show)shown++});count.textContent=digits(shown)+" از "+digits(matched)+" مورد";more.hidden=shown>=matched;empty.hidden=matched!==0};
 buttons.forEach(b=>b.addEventListener("click",()=>{category=b.dataset.filter||"همه";limit=30;buttons.forEach(x=>x.classList.toggle("active",x===b));update()}));
 search.addEventListener("input",()=>{limit=30;update()});more.addEventListener("click",()=>{limit+=30;update()});update();
}