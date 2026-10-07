import {describe,expect,it} from 'vitest';
import {searchThemes,cityOf,areaOf,type ThemeFilters} from './theme-search';
import data from './demo-catalog.json';
import type {Store,Theme} from './types';
const stores=new Map((data.stores as Store[]).map(s=>[s.id,s]));
const themes=data.themes as Theme[];
const f:ThemeFilters={query:'',area:'',genre:'',maxDifficulty:5,players:0,noFear:false,unplayed:false,sort:'name',storeId:null};
describe('theme search',()=>{
 it('finds new Seoul areas',()=>{for(const area of ['강남','건대']) expect(searchThemes(themes,stores,new Set(),{...f,area}).length).toBeGreaterThan(10);});
 it('excludes unknown fear',()=>{expect(searchThemes([{...themes[0],fear:null},{...themes[0],id:'safe',fear:0,genres:[]}],stores,new Set(),{...f,noFear:true}).map(t=>t.id)).toEqual(['safe']);});
 it('requires known player limits',()=>{const r=searchThemes(themes,stores,new Set(),{...f,players:4});expect(r.length).toBeGreaterThan(0);expect(r.every(t=>t.players_min!=null&&t.players_max!=null&&t.players_min<=4&&t.players_max>=4)).toBe(true);});
 it('has unique themes and valid references',()=>{expect(new Set(themes.map(t=>t.id)).size).toBe(themes.length);expect(new Set(themes.map(t=>t.store_id+'|'+t.name)).size).toBe(themes.length);expect(themes.every(t=>stores.has(t.store_id))).toBe(true);});
 it('excludes played themes',()=>{const done=new Set([themes[0].id]);expect(searchThemes(themes,stores,done,{...f,unplayed:true}).some(t=>done.has(t.id))).toBe(false);});
});

describe('nationwide regions',()=>{
 it('normalizes official city names',()=>{expect(cityOf({...data.stores[0],address:'부산광역시 중구 중앙대로'} as Store)).toBe('부산');expect(cityOf({...data.stores[0],address:'광주광역시 서구 상무대로'} as Store)).toBe('광주');});
 it('keeps districts in different cities separate',()=>{const busan={...data.stores[0],address:'부산 중구 중앙대로'} as Store;const daegu={...busan,address:'대구 중구 동성로'};expect(areaOf(busan)).toBe('부산 중구');expect(areaOf(daegu)).toBe('대구 중구');});
 it('filters all priority cities without mixing their themes',()=>{for(const city of ['부산','대구','대전','광주','인천']){const found=searchThemes(themes,stores,new Set(),{...f,city});expect(found.length).toBeGreaterThan(0);expect(found.every(t=>cityOf(stores.get(t.store_id))===city)).toBe(true);}});
 it('combines city and area filters',()=>{const found=searchThemes(themes,stores,new Set(),{...f,city:'부산',area:'부산 중구'});expect(found.length).toBeGreaterThan(0);expect(found.every(t=>areaOf(stores.get(t.store_id))==='부산 중구')).toBe(true);expect(searchThemes(themes,stores,new Set(),{...f,city:'대구',area:'부산 중구'})).toHaveLength(0);});
 it('hides officially unavailable themes while retaining their IDs',()=>{const unavailable=themes.find(t=>t.name==='혜화애(야외테마)');expect(unavailable?.status).toBe('closed');expect(searchThemes(themes,stores,new Set(),{...f,query:'혜화애'})).toHaveLength(0);});
});
