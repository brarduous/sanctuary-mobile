#!/usr/bin/env node
// Emit structured progress only. Local EAS job arguments/logs can contain
// encoded signing credentials and must never be forwarded verbatim.
const fs=require('node:fs'),path=require('node:path');

function buildStatus(root,platform){
  if(!['ios','android'].includes(platform))throw Error('Choose ios or android');
  const folder=path.join(root,'.local-builds');
  const file=path.join(folder,'logs',`${platform}-production.log`);
  if(!fs.existsSync(file))return {platform,phase:'preparing local build workspace'};
  const raw=fs.readFileSync(file,'utf8'),text=raw.replace(/\u001b\[[0-9;]*m/g,''),lines=text.split('\n');
  const phases=lines.map(line=>line.match(/^\[([A-Z_]+)\]/)?.[1]).filter(Boolean);
  const result={platform,phase:phases.at(-1)||'EAS local preparation',logBytes:Buffer.byteLength(raw),compilerErrorLines:lines.filter(line=>/\b(?:fatal )?error:\s/.test(line)).length,succeeded:/\bBuild (?:succeeded|successful)\b/.test(text),failed:/\bBuild failed\b/.test(text)};
  const jobs=text.match(/xcodebuild[^\n]*-jobs\s+(\d+)/)?.[1];
  if(jobs)result.xcodeJobs=Number(jobs);
  const retries=[...text.matchAll(/Command timed out after (\d+) seconds/g)].map(m=>Number(m[1]));
  if(retries.length)result.settingsQueryTimeouts=retries;
  const nativeFolder=path.join(folder,`${platform}-work`,'logs');
  if(platform==='ios'&&fs.existsSync(nativeFolder)){
    result.nativeLogs=[];
    for(const name of fs.readdirSync(nativeFolder).filter(name=>name.endsWith('.log')).slice(0,2)){
      const file=path.join(nativeFolder,name),stat=fs.statSync(file),length=Math.min(stat.size,262144),data=Buffer.alloc(length),fd=fs.openSync(file,'r');
      try{fs.readSync(fd,data,0,length,stat.size-length);}finally{fs.closeSync(fd);}
      const tail=data.toString('utf8');
      const targets=[...tail.matchAll(/\(in target '([A-Za-z0-9_. -]{1,80})' from project/g)].map(m=>m[1]);
      result.nativeLogs.push({bytes:stat.size,currentTarget:targets.at(-1),recentCompilerErrorLines:(tail.match(/\b(?:fatal )?error:\s/g)||[]).length,archiveSucceeded:tail.includes('** ARCHIVE SUCCEEDED **')});
    }
  }
  return result;
}

if(require.main===module){
  try{console.log(JSON.stringify(buildStatus(path.resolve(__dirname,'..'),process.argv[2]),null,2));}
  catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={buildStatus};
