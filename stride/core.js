export const VERSION=1;
export const equipLabels={bar:'操场单杠',gym:'健身房场地',track:'操场 / 跑道',pulldown:'高位下拉机',row:'坐姿划船机',chest:'坐姿推胸机',legpress:'坐姿蹬腿机',bike:'固定自行车',treadmill:'跑步机',band:'弹力带',box:'稳固踏台 / 辅助台'};
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function initialState(){return {version:VERSION,profile:{height:172,weight:66,gender:'男',stage:'大一',age:null,frequency:4,startDate:null,sessionTime:null,goal:'balanced',equipment:['bar','gym','track'],health:''},activeWeek:1,plans:{},logs:[],drafts:{},pullStage:0,tests:[{id:'baseline',date:null,kind:'初始记录',run1000:240,runApprox:true,jump:247,sprint50:null,sprintNote:'7秒多',pullups:0,weight:66,notes:'本人提供：1000米约4分钟；50米约7秒多。既往体测日期未知，引体向上摆荡完成不计入标准次数。'}]};}
export function isoDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!isNaN(new Date(value+'T12:00:00').getTime())&&new Date(value+'T12:00:00').toISOString().slice(0,10)===value;}
export function weekStart(state,week=state.activeWeek){if(!state.profile.startDate)return null;let d=new Date(state.profile.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+7*(week-1));return d.toISOString().slice(0,10);}
export function dayDate(state,offset,week=state.activeWeek){let x=weekStart(state,week);if(!x)return null;let d=new Date(x+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);}
const ex=(id,sets,reps,rest,minutes,category='strength')=>({id,sets,reps,rest,minutes,category});
export function buildPlan(state,week,adjust={factor:1,mode:'base',reason:'先建立规律，校准轻松强度。'}){
  const p=state.profile,eq=p.equipment,f=adjust.factor??1,deload=week%4===0;
  const cardio=n=>Math.max(10,Math.round(n*f*(deload?.8:1)));
  const select=(machine,body)=>eq.includes(machine)?machine:body;
  const easy=id=>ex('easy',1,`${cardio(id)} 分钟`,'可随时步行调整',cardio(id),'cardio');
  const pull=[['hang',2,'10–20 秒','60–90 秒',4],['scap',2,'4–6 次','60–90 秒',4],['assisted',2,'4–6 次','90 秒',5],['negative',2,'2–3 次','120 秒',5],['strict',3,'1 次','120 秒',6]][state.pullStage]||['hang',2,'10–20 秒','60–90 秒',4];
  const pullEx=eq.includes('bar')?ex(...pull):ex(select('pulldown','prone'),2,'8–12 次','75 秒',5);
  // Higher-intensity endurance is introduced only after two weeks of feedback and good recovery.
  const canQuality=week>2&&adjust.mode==='progress'&&!deload&&!adjust.returningFromRecovery;
  let sessions=[
    {id:'A',title:'轻松有氧 + 基础力量',tag:'建立节奏',offset:0,focus:'心肺 · 下肢 · 上肢',intro:'跑走结合也算完成。保持能说完整句子的强度，力量动作还留 2–3 次余力。',exercises:[ex('warmup',1,'6 分钟','连续轻松完成',6,'mobility'),ex(select('legpress','squat'),2,'8–12 次','75 秒',5),ex(select('chest','pushup'),2,'8–12 次','75 秒',5),ex('bridge',2,'10–12 次','60 秒',4),easy(28),ex('mobility',1,'5 分钟','每侧间隔 10 秒',5,'mobility')]},
    {id:'B',title:'有氧节奏 + 单杠基础',tag:'心肺优先',offset:2,focus:'心肺 · 背部 · 核心',intro:canQuality?'今天只有有氧主段提高一点强度，不加速跑冲刺。':'前两周先做轻松跑走。心肺适应后，再由反馈决定是否加入中等节奏段。',exercises:[ex('warmup',1,'6 分钟','连续轻松完成',6,'mobility'),pullEx,ex(select('row','prone'),2,'8–12 次','75 秒',5),ex('deadbug',2,'每侧 6–8 次','45 秒',4),...(canQuality?[ex('interval',4,'1 分钟快 + 2 分钟走 / 慢跑','每轮含 2 分钟恢复',12,'cardio'),easy(16)]:[easy(28)]),ex('mobility',1,'5 分钟','每侧间隔 10 秒',5,'mobility')]},
    {id:'C',title:'速度跳跃 + 全身力量',tag:'动作质量',offset:4,focus:'速度 · 弹跳 · 力量',intro:'充分热身后再做加速与跳跃。每次都充分恢复，动作变慢或落地不稳就停止这一模块。',exercises:[ex('warmup',1,'8 分钟','连续轻松完成',8,'mobility'),ex('accel',deload||adjust.returningFromRecovery?2:4,'20 米 · 约 80–90% 努力','90–120 秒，走回',deload||adjust.returningFromRecovery?4:7,'speed'),ex('jump',2,'3 次 · 次最大用力','90 秒，组内重置',5,'speed'),ex(select('legpress','squat'),2,'8–12 次','75 秒',5),ex(select('chest','pushup'),2,'8–12 次','75 秒',5),ex('bridge',2,'10–12 次','60 秒',4),easy(20),ex('mobility',1,'5 分钟','每侧间隔 10 秒',5,'mobility')]},
    {id:'D',title:'长一点的轻松有氧',tag:'积累耐力',offset:6,focus:'心肺 · 单杠 · 活动度',intro:'以轻松、能持续为标准。无需追配速；呼吸急促时改为快走。',exercises:[ex('warmup',1,'5 分钟','连续轻松完成',5,'mobility'),easy(35),pullEx,ex(select('row','prone'),2,'8–12 次','75 秒',5),ex('mobility',1,'6 分钟','每侧间隔 10 秒',6,'mobility')]}
  ];
  if(p.frequency===3){sessions=sessions.filter(s=>s.id!=='D');const e=sessions[1].exercises.find(e=>e.id==='easy');if(e){e.minutes+=5;e.reps=`${e.minutes} 分钟`;}}
  if(p.frequency===5){sessions.push({id:'E',title:'低冲击恢复有氧',tag:'恢复为主',offset:1,focus:'轻松心肺 · 活动度',intro:'第五次只增加轻松活动。可用快走；确认自行车可用后也可选择骑行。',exercises:[ex('warmup',1,'5 分钟','轻松完成',5,'mobility'),easy(20),ex('mobility',1,'5 分钟','每侧间隔 10 秒',5,'mobility')]});sessions.sort((a,b)=>a.offset-b.offset);}
  if(p.goal==='cardio')sessions.forEach(s=>s.exercises.filter(e=>e.id==='easy').forEach(e=>{e.minutes+=3;e.reps=`${e.minutes} 分钟`;}));
  if(p.goal==='pullups'&&eq.includes('bar'))sessions[0].exercises.splice(1,0,{...pullEx});
  if(adjust.mode==='recover')sessions.forEach(s=>{s.exercises=s.exercises.filter(e=>!['speed'].includes(e.category)&&!['negative','strict'].includes(e.id)&&!(adjust.pain&&['hang','scap','assisted'].includes(e.id)));s.intro='只在无痛范围内进行轻松活动；引发疼痛的动作暂停。'+s.intro;s.exercises.forEach(e=>{if(e.category==='strength'){e.sets=1;e.minutes=Math.max(2,Math.round(e.minutes*.6));}});});
  sessions.forEach(s=>{s.duration=s.exercises.reduce((n,e)=>n+e.minutes,0);s.cardio=s.exercises.filter(e=>e.category==='cardio').reduce((n,e)=>n+e.minutes,0);});
  return {week,frequency:p.frequency,adjust:{...adjust,deload},createdAt:today(),sessions};
}
export function getPlan(state,week=state.activeWeek){return state.plans[week]||(state.plans[week]=buildPlan(state,week));}
export function feedback(state,week=state.activeWeek){
 const plan=getPlan(state,week),logs=state.logs.filter(l=>l.week===week),done=logs.filter(l=>l.status==='completed'),ratio=done.length/plan.sessions.length;
 const avg=k=>{const source=k==='rpe'?logs.filter(l=>l.status!=='skipped'&&l.minutes>0):logs;return source.length?source.reduce((a,l)=>a+l[k],0)/source.length:null;};
 const pain=logs.some(l=>l.pain>0),high=logs.some(l=>l.fatigue>=7||l.rpe>=9);
 if(pain||high)return {mode:'recover',pain,factor:.75,label:'恢复周 · 降低负荷',reason:pain?'记录了疼痛：暂停速度、跳跃和单杠训练，减少约 25% 有氧量；任何引发疼痛的活动都先暂停，不适持续时先找专业人员评估。':'疲劳达到 7 或用力达到 9：减少约 25% 有氧量，力量减组，暂停速度与跳跃。',ratio,avgRpe:avg('rpe'),avgFatigue:avg('fatigue')};
 if(logs.length<Math.min(3,plan.sessions.length))return {mode:'hold',factor:1,label:'数据不足 · 保持原量',reason:'至少记录 3 次训练反馈后才考虑增加；未记录的日子不会被当作轻松完成。',ratio,avgRpe:avg('rpe'),avgFatigue:avg('fatigue')};
 if(ratio>=.75&&avg('rpe')<=6&&avg('fatigue')<=4)return {mode:'progress',factor:1.05,label:'小步进阶 · 有氧 +5%',reason:'完成率至少 75%，平均用力 ≤6、疲劳 ≤4，且无疼痛。仅增加轻松有氧时间，力量与速度不同时加量。',ratio,avgRpe:avg('rpe'),avgFatigue:avg('fatigue')};
 return {mode:'hold',factor:1,label:'巩固一周 · 保持负荷',reason:ratio<.75?'完成率不足 75%，先让训练频率稳定；不补做错过的高强度训练。':'完成了训练，但恢复或用力尚未达到进阶条件。本周先巩固，不追加负荷。',ratio,avgRpe:avg('rpe'),avgFatigue:avg('fatigue')};
}
export function nextPlan(state){
 const w=state.activeWeek,a=feedback(state,w),prev=getPlan(state,w);
 if(prev.adjust.mode==='recover'&&a.mode==='hold'){a.mode='recover';a.pain=!!prev.adjust.pain;a.factor=1;a.label='继续恢复 · 等待反馈';a.reason='上一周为恢复安排，当前尚无足够的良好恢复反馈，继续保持恢复结构，不自动恢复速度与跳跃。';}
 const prevFactor=prev.adjust.cumulativeFactor??1;
 const cumulativeFactor=Math.min(1.5,Math.max(.6,prevFactor*a.factor));
 const adjust={...a,factor:cumulativeFactor,cumulativeFactor,returningFromRecovery:prev.adjust.mode==='recover'&&a.mode==='progress'};
 const plan=buildPlan(state,w+1,adjust);
 if(plan.adjust.deload){plan.adjust.reason+=' 每第 4 周主动减量，复测分日替代训练，不叠加。';}
 return plan;
}
export function totals(plan){return plan.sessions.flatMap(s=>s.exercises).reduce((a,e)=>(a[e.category]=(a[e.category]||0)+e.minutes,a.total+=e.minutes,a),{total:0,cardio:0,strength:0,speed:0,mobility:0});}
export function validBackup(v){
 if(!v||v.version!==1||!v.profile||!Array.isArray(v.logs)||!Array.isArray(v.tests)||typeof v.plans!=='object'||!v.plans||Array.isArray(v.plans))return false;
 const p=v.profile,num=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
 if(!num(p.height,100,250)||!num(p.weight,25,250)||![3,4,5].includes(p.frequency)||!['balanced','cardio','pullups'].includes(p.goal)||!Array.isArray(p.equipment)||p.equipment.some(e=>!Object.hasOwn(equipLabels,e))||!(p.startDate===null||isoDate(p.startDate))||!(p.sessionTime===null||num(p.sessionTime,20,180))||!num(v.activeWeek,1,999)||!num(v.pullStage,0,4)||!v.drafts||typeof v.drafts!=='object')return false;
 if(v.logs.length>10000||v.tests.length>5000||!v.tests.length||v.tests[0].id!=='baseline'||v.tests.filter(t=>t.id==='baseline').length!==1)return false;
 if(!v.logs.every(l=>num(l.week,1,999)&&['A','B','C','D','E'].includes(l.sessionId)&&['completed','partial','skipped'].includes(l.status)&&num(l.rpe,0,10)&&num(l.fatigue,0,10)&&num(l.pain,0,10)&&num(l.minutes,0,300)&&isoDate(l.date)&&Array.isArray(l.checked)&&typeof l.notes==='string'&&typeof l.id==='string'))return false;
 if(new Set(v.logs.map(l=>`${l.week}-${l.sessionId}`)).size!==v.logs.length)return false;
 if(!v.tests.every(t=>typeof t.id==='string'&&(t.date===null||isoDate(t.date))&&['run1000','jump','sprint50','pullups','weight'].every(k=>t[k]===null||num(t[k],0,10000))))return false;
 // Plans are regenerated from valid settings after import; retained plan prescriptions are not trusted.
 return true;
}
export function normalizeBackup(v){
 if(!validBackup(v))throw Error('不是有效的训练系统备份');
 const safe=initialState();
 safe.profile={...safe.profile,height:v.profile.height,weight:v.profile.weight,age:Number.isFinite(v.profile.age)?v.profile.age:null,frequency:v.profile.frequency,startDate:v.profile.startDate,sessionTime:v.profile.sessionTime,goal:v.profile.goal,equipment:v.profile.equipment.filter(e=>Object.hasOwn(equipLabels,e)),health:String(v.profile.health||'').slice(0,3000)};
 safe.activeWeek=v.activeWeek;safe.pullStage=v.pullStage;
 safe.logs=v.logs.map(l=>({id:l.id,week:l.week,sessionId:l.sessionId,date:l.date,status:l.status,minutes:l.minutes,rpe:l.rpe,fatigue:l.fatigue,pain:l.pain,notes:l.notes.slice(0,3000),checked:l.checked.filter(i=>Number.isInteger(i)&&i>=0&&i<50)}));
 safe.tests=v.tests.map(t=>({id:t.id,date:t.date,kind:t.id==='baseline'?'初始记录':'阶段复测',run1000:t.run1000,jump:t.jump,sprint50:t.sprint50,pullups:t.pullups,weight:t.weight,runApprox:!!t.runApprox,sprintNote:String(t.sprintNote||'').slice(0,100),notes:String(t.notes||'').slice(0,2000)}));
 const allowedIds=new Set(['warmup','easy','interval','squat','pushup','bridge','prone','deadbug','accel','jump','mobility','hang','scap','assisted','negative','strict','pulldown','row','chest','legpress','bike','treadmill']);
 for(let week=1;week<=safe.activeWeek;week++){
  const old=v.plans[week],frequency=[3,4,5].includes(old?.frequency)?old.frequency:safe.profile.frequency;
  const validModes=['base','hold','progress','recover'];
  const adjust={mode:validModes.includes(old?.adjust?.mode)?old.adjust.mode:'hold',pain:!!old?.adjust?.pain,returningFromRecovery:!!old?.adjust?.returningFromRecovery,factor:Math.min(1.5,Math.max(.6,Number(old?.adjust?.cumulativeFactor)||Number(old?.adjust?.factor)||1)),reason:typeof old?.adjust?.reason==='string'?old.adjust.reason.slice(0,1500).replace(/[<>]/g,''):'从备份恢复的训练安排。下周会根据已保存的日志重新评估。'};
  adjust.cumulativeFactor=adjust.factor;
  const p=buildPlan({...safe,profile:{...safe.profile,frequency}},week,adjust);
  if(old&&Array.isArray(old.sessions))p.sessions=p.sessions.map(s=>{
   const src=old.sessions.find(x=>x.id===s.id);if(!src||!Array.isArray(src.exercises)||src.exercises.length>30)return s;
   if(!src.exercises.every(e=>allowedIds.has(e.id)&&Number.isFinite(e.sets)&&e.sets>=1&&e.sets<=20&&typeof e.reps==='string'&&e.reps.length<100&&typeof e.rest==='string'&&e.rest.length<100&&Number.isFinite(e.minutes)&&e.minutes>=0&&e.minutes<=180&&['cardio','strength','speed','mobility'].includes(e.category)))return s;
   const clean=src.exercises.map(e=>({id:e.id,sets:e.sets,reps:e.reps.replace(/[<>]/g,''),rest:e.rest.replace(/[<>]/g,''),minutes:e.minutes,category:e.category}));
   return {...s,exercises:clean,duration:clean.reduce((n,e)=>n+e.minutes,0),cardio:clean.filter(e=>e.category==='cardio').reduce((n,e)=>n+e.minutes,0)};
  });
  safe.plans[week]=p;
 }
 for(const [k,values]of Object.entries(v.drafts))if(/^\d{1,3}-[ABCDE]$/.test(k)&&Array.isArray(values))safe.drafts[k]=values.filter(i=>Number.isInteger(i)&&i>=0&&i<50);
 return safe;
}
