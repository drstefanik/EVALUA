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
  incorrectStreak: number;
  askedByLevel: Record<Level, number>;
  askedIds: Set<string>;
  askedCount: number;
  lastSkill?: Skill;
  // per stima/confidenza
  history: { level: Level; correct: boolean }[];
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
    incorrectStreak: 0,
    askedByLevel: {A1:0,A2:0,B1:0,B2:0,C1:0,C2:0},
    askedIds: new Set(),
    askedCount: 0,
    history: []
  };
}

export function gradeAnswer(st: State, item: Item, chosenIndex: number) {
  const correct = chosenIndex === item.correctIndex;

  // aggiorna streak simmetrici
  if (correct) {
    st.correctStreak += 1;
    st.incorrectStreak = 0;
  } else {
    st.incorrectStreak += 1;
    st.correctStreak = 0;
  }

  // promozione: 2 corrette di fila
  if (st.correctStreak >= 2) {
    st.current = up(st.current);
    st.correctStreak = 0;
    st.incorrectStreak = 0; // reset dopo cambio livello
  }

  // retrocessione: 2 errate di fila
  if (st.incorrectStreak >= 2) {
    st.current = down(st.current);
    st.incorrectStreak = 0;
    st.correctStreak = 0; // reset dopo cambio livello
  }

  st.history.push({ level: item.level, correct });
}

export function pickNextItem(st: State, pool: Item[]): Item | null {
  // stop se loop a livello
  if (st.askedByLevel[st.current] >= 7) return null;
  if (st.askedCount >= 22) return null; // cap globale prudenziale

  // alternanza skill (se possibile)
  const desired: Skill | undefined =
    st.lastSkill === "listening" ? "reading" :
    st.lastSkill === "reading"  ? "listening" : undefined;

  const byLevel = pool.filter(i => i.level === st.current && !st.askedIds.has(i.id));
  const candidates = desired ? byLevel.filter(i => i.skill === desired) : byLevel;
  const list = candidates.length ? candidates : byLevel;
  if (!list.length) return null;

  const chosen = list[Math.floor(Math.random() * list.length)];
  st.askedIds.add(chosen.id);
  st.askedByLevel[st.current] += 1;
  st.askedCount += 1;
  st.lastSkill = chosen.skill;
  return chosen;
}

/**
 * Stima del livello:
 * 1) Base: il livello corrente (dove il test è “convergente”).
 * 2) Se il test termina per cap/assenza item senza convergenza forte, usiamo
 *    una media pesata dalle visite ai livelli (peso maggiore agli ultimi step).
 */
export function computeResult(st: State) {
  // stima base = livello corrente
  let estimated: Level = st.current;

  // robustezza: controlla se la distribuzione è “piatta”.
  const counts = st.askedByLevel;
  const maxCount = Math.max(...LEVELS.map(L => counts[L]));
  const total = LEVELS.reduce((s,L)=>s+counts[L],0);

  // Se il livello corrente ha meno del 30% degli item somministrati
  // e c’è un vicino con conteggio simile, usa una stima pesata sugli ultimi 10 step
  if (total > 0) {
    const currShare = counts[st.current] / total;
    if (currShare < 0.3 && st.history.length >= 5) {
      const tail = st.history.slice(-10);
      const avgIdx =
        tail.reduce((s,h, j)=> s + idx(h.level) * (j+1), 0) /
        tail.reduce((s, _ , j)=> s + (j+1), 0);
      estimated = LEVELS[clamp(Math.round(avgIdx))];
    }
  }

  // confidenza: più item nello stesso livello ⇒ più alta, con bonus se ultimi 4 step nello stesso/contiguo
  const stableBonus = st.history.slice(-4).every(h => Math.abs(idx(h.level) - idx(estimated)) <= 0) ? 0.08 : 0;
  const baseConf = Math.min(0.92, 0.55 + 0.05 * counts[estimated]);
  const confidence = Math.min(0.97, baseConf + stableBonus);

  return { estimatedLevel: estimated, confidence, askedByLevel: counts };
}
