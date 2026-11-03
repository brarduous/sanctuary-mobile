const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {buildStatus}=require('./build-status.cjs');

test('build status reports progress without forwarding credential payloads or raw diagnostics',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sanctuary-build-status-'));
  try{
    const logs=path.join(root,'.local-builds','logs'),native=path.join(root,'.local-builds','ios-work','logs');
    fs.mkdirSync(logs,{recursive:true});fs.mkdirSync(native,{recursive:true});
    fs.writeFileSync(path.join(logs,'ios-production.log'),'[START_BUILD] '+Buffer.from('FAKE_PRIVATE_SIGNING_VALUE').toString('base64')+'\nclientToken=FAKE_CLIENT_TOKEN\n[RUN_FASTLANE] xcodebuild archive -jobs 2\n');
    fs.writeFileSync(path.join(native,'app.log'),"CompileC source (in target 'RevenueCat' from project 'Pods')\nerror: FAKE_PRIVATE_ERROR_DETAIL\n");
    const status=buildStatus(root,'ios'),output=JSON.stringify(status);
    assert.equal(status.phase,'RUN_FASTLANE');assert.equal(status.xcodeJobs,2);assert.equal(status.nativeLogs[0].currentTarget,'RevenueCat');assert.equal(status.nativeLogs[0].recentCompilerErrorLines,1);
    for(const value of ['FAKE_PRIVATE_SIGNING_VALUE',Buffer.from('FAKE_PRIVATE_SIGNING_VALUE').toString('base64'),'FAKE_CLIENT_TOKEN','FAKE_PRIVATE_ERROR_DETAIL'])assert.equal(output.includes(value),false);
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('status handles the gap while a local build workspace is being recreated',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sanctuary-build-empty-'));
  try{assert.equal(buildStatus(root,'ios').phase,'preparing local build workspace');assert.throws(()=>buildStatus(root,'all'),/Choose ios or android/);}
  finally{fs.rmSync(root,{recursive:true,force:true});}
});
