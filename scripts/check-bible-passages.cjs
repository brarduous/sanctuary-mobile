const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
function load(filename) {
 const module={exports:{}};
 const js=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',filename),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(js,{module,exports:module.exports,require:name=>name.startsWith('@/assets/') ? require(path.join(__dirname,'..',name.slice(2))):require(name)});
 return module.exports;
}
const {getPassageHtml,parseScriptureReference}=load('lib/bibleUtils.ts');
const {resolveBibleReaderPreferences}=load('lib/bibleReaderPreferences.ts');
assert.match(getPassageHtml('Genesis 9:13','WEB').html,/rainbow/);
assert.match(getPassageHtml('Genesis 9:13','KJV').html,/bow/);
assert.doesNotMatch(getPassageHtml('Genesis 9:13','KJV').html,/rainbow/);
for(const version of ['WEB','ASV','NIV','KJV']) {
 const passage=getPassageHtml('John 3:16-18',version);
 assert.ok(passage,version);
 assert.equal((passage.html.match(/<sup/g)||[]).length,3);
 assert.match(passage.html,/<sup class="v">16<\/sup>/);
 assert.match(passage.html,/<sup class="v">18<\/sup>/);
 assert.doesNotMatch(passage.html,/<sup class="v">19<\/sup>/);
 assert.match(getPassageHtml('John 3',version).html,/<sup class="v">36<\/sup>/);
 assert.equal(getPassageHtml('John 3:999',version),null);
 assert.equal(resolveBibleReaderPreferences(version,'large').version,version);
}
assert.equal(getPassageHtml('Matthew 17:21','NIV'),null,'an omitted verse must not become a whole chapter');
assert.equal(getPassageHtml('John 3:16-18','unknown'),null,'do not label a WEB fallback as another edition');
assert.equal(parseScriptureReference('John 3:18-16'),null);
assert.equal(parseScriptureReference('John 0:1'),null);
assert.equal(parseScriptureReference('John 3:0'),null);
assert.ok(getPassageHtml('Psalm 23:1','WEB'));
assert.equal(resolveBibleReaderPreferences('unknown','unknown').version,'WEB');
assert.equal(resolveBibleReaderPreferences(null,null).textSize,'normal');
assert.equal(resolveBibleReaderPreferences('KJV','extra').textSize,'extra');
console.log('Verified preferred Bible editions, exact verse boundaries, complete chapters, missing-verse refusal, aliases, and reader setting defaults.');
