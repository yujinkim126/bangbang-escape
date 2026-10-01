import {describe,expect,it} from 'vitest';
import {searchThemes,type ThemeFilters} from './theme-search';
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
