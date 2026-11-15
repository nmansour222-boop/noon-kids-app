import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width":430,"height":880})
        pg = await ctx.new_page(); errs=[]; bad=[]
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("response", lambda r: bad.append(r.url) if r.status>=400 and 'localhost' in r.url else None)
        await pg.goto("http://localhost:8080/noon/index.html?qa=1"); await pg.wait_for_timeout(1500)
        R={}
        R['cards']=await pg.locator('.track-card').count()
        R['globals']=await pg.evaluate("['Lessons','Store','CURRICULUM','A3'].every(k=>!!window[k])")
        R['meta_ar']=await pg.locator('.track-card').first.locator('.tc-meta').inner_text()
        # XSS
        R['xss']=await pg.evaluate("""()=>{Store.get().childName='<img src=x onerror=window.__x=1>';__app.parent();__app.openReport();return new Promise(r=>setTimeout(()=>r(!window.__x && !!document.querySelector('.rep-child')),400))}""")
        # back relocks parent
        await pg.go_back(); await pg.wait_for_timeout(300)
        await pg.go_back(); await pg.wait_for_timeout(400)
        R['relocked']=await pg.evaluate("!__app.isParentUnlocked() && __app.current()")
        # reward once
        R['reward']=await pg.evaluate("""()=>{const u=SYLLABUS.forTrack('ar')[0];const a=Store.claimUnitReward(u.id);const b=Store.claimUnitReward(u.id);return a===true&&b===false}""")
        R['plan_ha']=await pg.evaluate("Lessons._test.arWordPlan(CURRICULUM.letterById('ha')).prompt")
        R['plan_ta']=await pg.evaluate("Lessons._test.arWordPlan(CURRICULUM.letterById('ta')).word.w")
        R['count37']=await pg.evaluate("Lessons._test.countVisual(37).querySelectorAll('.count-dot').length")
        R['num21']=await pg.evaluate("NUMBERS.name(21)")
        R['enThink']=await pg.evaluate("SYLLABUS.forTrack('en').filter(u=>u.kind==='think').every(u=>Thinking.setForCached(u.id,u.order,'en').every(q=>/^[A-Za-z]/.test(q.q)))")
        R['ooDistinct']=await pg.evaluate("SYLLABUS.forTrack('en').filter(u=>u.sound&&u.sound.disp==='oo').map(u=>u.title)")
        R['enPick']=await pg.evaluate("SYLLABUS.forTrack('en')[0].lessons.map(l=>l.type).join(',')")
        R['badImport']=await pg.evaluate("Store.importJSON({app:'x'})===false")
        # run every lesson type once, count tracer leaks
        R['types']=await pg.evaluate("""async()=>{const seen={};const all=SYLLABUS.all();for(const u of all){for(const l of u.lessons){if(seen[l.type])continue;seen[l.type]=1;const h=document.getElementById('lessonHost');Lessons.run(h,l,u,()=>{});await new Promise(r=>setTimeout(r,2100));Lessons.stopAll();}}return Object.keys(seen).length+' types, live tracers='+(Tracer.live||0)}""")
        R['errors']=errs; R['http_errors']=[u for u in bad if 'islamic' not in u][:5]
        print(json.dumps(R,ensure_ascii=False,indent=1))
        await b.close()
asyncio.run(main())
