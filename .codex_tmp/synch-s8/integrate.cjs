const fs=require('fs');const file='modules/music.js';const full=fs.readFileSync(file,'latin1'), start=full.indexOf('function initSynchronicityArchiveDrawer'), end=full.indexOf('function renderMusicShowsArchive(options'); let s=full.slice(start,end);
const replace=(a,b)=>{if(s.split(a).length!==2)throw Error('Nonunique/missing '+a.slice(0,80));s=s.replace(a,b)};
replace('const change = (open, immediate = false, restoreFocus = true) => {','const change = (open, immediate = false, restoreFocus = true, afterClose = null) => {');
replace('        synchronicityMemoriesSession?.sync?.();\n      }\n    };\n    if (immediate', '        if (available()) afterClose?.();\n        synchronicityMemoriesSession?.sync?.();\n      }\n    };\n    if (immediate');
replace('  state.syncRoute = () => {', '  state.selectShow = show => {\n    if (!available() || !state.open) return;\n    const entry = state.entry;\n    change(false, false, false, () => {\n      if (state.entry === entry) synchronicityMemoriesSession?.selectShow?.(show);\n    });\n  };\n  state.syncRoute = () => {');
replace('    selection.memory.frame.focus({ preventScroll: true });','    const returnTarget = selection.fromTimeline ? viewport.querySelector("[data-synchronicity-explore]") : selection.memory.frame;\n    returnTarget?.focus({ preventScroll: true });');
replace('  const selectMemory = memory => {\n    if (!current() || viewport.inert || session.selection || !session.results.includes(memory)) return;\n    const selection = { id: memory.id, memory, scrollTop: viewport.scrollTop };',
'  const selectMemory = (memory, fromTimeline = false) => {\n    if (!current() || viewport.inert || (!fromTimeline && (session.selection || !session.results.includes(memory)))) return;\n    const previous = session.selection;\n    previous?.panel.remove();\n    const selection = { id: memory.id, memory, fromTimeline, scrollTop: previous?.scrollTop ?? viewport.scrollTop };');
replace('    for (const item of session.results) item.frame.inert = true;','    for (const item of session.results) if (item.frame) item.frame.inert = true;');
replace('    for (const memory of session.results) memory.frame.inert = false;','    for (const memory of session.results) if (memory.frame) memory.frame.inert = false;');
replace('    artwork.className = "synchronicity-show-artwork";','    artwork.className = "synchronicity-show-artwork";\n    artwork.textContent = "Image unavailable";');
replace('    date.textContent = getMusicShowDateLabel(memory.show);','    date.textContent = getSynchronicityTimelineDate(memory.show) ? getMusicShowDateLabel(memory.show) : "Date unavailable";');
replace('    if (memory.kind !== "poster" && usable(poster) && poster !== memory.image.src) {','    if ((!memory.image || memory.kind !== "poster") && usable(poster) && poster !== memory.image?.src) {');
replace('  document.addEventListener("visibilitychange", session.sync);','  // Timeline selections share the existing display and source records, without album requests.\n  session.selectShow = show => {\n    const id = getMusicShowIdValue(show);\n    if (!current() || !id || !source.some(record => getMusicShowIdValue(record) === id)) return;\n    const memory = session.results.find(item => item.id === id) || { id, show, image: null, kind: "poster" };\n    selectMemory(memory, true);\n  };\n\n  document.addEventListener("visibilitychange", session.sync);');
replace('      frame.dataset.memoryShowId = id;','      frame.inert = Boolean(session.selection);\n      frame.dataset.memoryShowId = id;');
replace('    stage.replaceChildren(fragment);\n    session.sync();','    stage.replaceChildren(fragment);\n    if (session.selection) stage.append(session.selection.panel);\n    session.sync();');
fs.writeFileSync(file,full.slice(0,start)+s+full.slice(end),'latin1');console.log('Selection integration written');



