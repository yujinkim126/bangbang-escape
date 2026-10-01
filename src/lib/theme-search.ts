import type { Store, Theme } from './types';
export function areaOf(store?: Store): string {
  const a=store?.address ?? '';
  if(a.includes('마포구')) return '홍대';
  if(/강남구|서초구/.test(a)) return '강남';
  if(a.includes('광진구')) return '건대';
  return a.split(' ')[1] || '기타';
}
export interface ThemeFilters {query:string;area:string;genre:string;maxDifficulty:number;players:number;noFear:boolean;unplayed:boolean;sort:string;storeId:string|null;}
export function searchThemes(themes:Theme[],stores:Map<string,Store>,played:Set<string>,f:ThemeFilters) {
  const q=f.query.trim().toLocaleLowerCase();
  return themes.filter(t=>{
    const s=stores.get(t.store_id);
    return t.status==='open' && s?.status!=='closed'
      && (!f.storeId||t.store_id===f.storeId) && (!f.area||areaOf(s)===f.area)
      && (!f.genre||t.genres.includes(f.genre))
      && (f.maxDifficulty===5||(t.difficulty!=null&&t.difficulty<=f.maxDifficulty))
      && (!f.players||(t.players_min!=null&&t.players_max!=null&&t.players_min<=f.players&&t.players_max>=f.players))
      && (!f.noFear||(t.fear===0&&!t.genres.includes('공포')))
      && (!f.unplayed||!played.has(t.id))
      && (!q||`${t.name} ${s?.name??''} ${s?.brand?.name??''} ${s?.address??''}`.toLocaleLowerCase().includes(q));
  }).sort((a,b)=>{
    if(f.sort==='difficulty') return (a.difficulty??99)-(b.difficulty??99)||a.name.localeCompare(b.name,'ko');
    if(f.sort==='duration') return (a.duration_min??999)-(b.duration_min??999)||a.name.localeCompare(b.name,'ko');
    return a.name.localeCompare(b.name,'ko');
  });
}
