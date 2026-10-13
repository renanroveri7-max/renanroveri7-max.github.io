export type Tab = 'hoje' | 'treinos' | 'alimentacao' | 'evolucao' | 'perfil';
export type Goal = 'massa' | 'gordura' | 'recomposicao' | 'condicionamento' | 'consistencia';
export type Place = 'academia' | 'casa' | 'ar_livre';
export interface Profile {
  name: string;
  goal: Goal;
  place: Place;
  days: number;
  minutes: number;
  dark: boolean;
}
export interface ExerciseSet { id: string; exercise: string; reps: number; load: number | null; }
export interface Workout { id: string; date: string; createdAt: string; sets: ExerciseSet[]; }
export interface Meal { id: string; date: string; title: string; items: string[]; portion: string; createdAt: string; }
export interface Weight { id: string; date: string; value: number; }
export interface UserData {
  profile: Profile;
  workouts: Workout[];
  meals: Meal[];
  weights: Weight[];
  water: Record<string,number>;
}
export const defaultData = (): UserData => ({
  profile:{name:'',goal:'consistencia',place:'academia',days:3,minutes:45,dark:true},
  workouts:[],meals:[],weights:[],water:{}
});
export const tabLabels: Record<Tab,string> = {hoje:'Hoje',treinos:'Treinos',alimentacao:'Alimentação',evolucao:'Evolução',perfil:'Perfil'};
export const goalLabels: Record<Goal,string> = {massa:'Ganhar massa',gordura:'Reduzir gordura',recomposicao:'Recomposição corporal',condicionamento:'Condicionamento',consistencia:'Criar consistência'};
export function localDay(d = new Date()): string {
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
export function beginningOfWeek(d=new Date()) {
  const start=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  start.setDate(start.getDate()-((start.getDay()+6)%7));
  return localDay(start);
}
export const makeId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
