type Level = "A1"|"A2"|"B1"|"B2"|"C1"|"C2";
type Skill = "listening"|"reading";
export interface Item {
  id:string; skill:Skill; level:Level; prompt:string;
  passage?:string; audioUrl?:string; options:string[]; correctIndex:number;
  tags?:string[]; source?:string;
}
export interface State {
  current: Level;
  correctStreak: number;
  askedByLevel: Record<Level, number>;
  askedIds: Set<string>;
  askedCount: number;
  lastSkill?: Skill;
}
const LEVELS: Level[] = ["A1","A2","B1","B2","C1","C2"];
const idx = (L: Level) => LEVELS.indexOf(L);
const clamp = (n:number)=>Math.max(0,Math.min(LEVELS.length-1,n));
const up = (L:Level):Level => LEVELS[clamp(idx(L)+1)];
const down = (L:Level):Level => LEVELS[clamp(idx(L)-1)];

export function initState(): State {
  return {
    current: "B1",
    correctStreak: 0,
    askedByLevel: {A1:0,A2:0,B1:0,B2:0,C1:0,C2:0},
    askedIds: new Set(),
    askedCount: 0
  };
}

export function gradeAnswer(st: State, item: Item, chosenIndex: number) {
  const correct = chosenIndex === item.correctIndex;
  if (correct) {
    st.correctStreak += 1;
    if (st.correctStreak >= 2) { st.current = up(st.current); st.correctStreak = 0; }
  } else {
    st.current = down(st.current);
    st.correctStreak = 0;
  }
}

export function pickNextItem(st: State, pool: Item[]): Item | null {
  if (st.askedByLevel[st.current] >= 7) return null;  // loop guard
  if (st.askedCount >= 22) return null;               // cap globale

  const desiredSkill: Skill | undefined =
    st.lastSkill === "listening" ? "reading" :
    st.lastSkill === "reading"  ? "listening" : undefined;

  const byLevel = pool.filter(i => i.level === st.current && !st.askedIds.has(i.id));
  const candidates = desiredSkill ? byLevel.filter(i => i.skill === desiredSkill) : byLevel;
  const list = candidates.length ? candidates : byLevel;
  if (!list.length) return null;

  const chosen = list[Math.floor(Math.random()*list.length)];
  st.askedIds.add(chosen.id);
  st.askedByLevel[st.current] += 1;
  st.askedCount += 1;
  st.lastSkill = chosen.skill;
  return chosen;
}

export function computeResult(st: State) {
  const stableCount = st.askedByLevel[st.current];
  const confidence = Math.min(0.95, 0.5 + 0.05*stableCount);
  return { estimatedLevel: st.current, confidence, askedByLevel: st.askedByLevel };
}
