import { describe, expect, it } from 'vitest';
import { readRecords, saveRecords, RECORDS_KEY } from './local-records';
import type { EscapeRecord } from './types';

const record = { id:'local-1', user_id:'local', theme_id:'t0', played_at:'2026-10-01T01:00:00Z', success:true, remaining_sec:120, hints_used:1, rating:4, felt_difficulty:3, felt_fear:0, companions:['친구'], memo:'좋았어요', created_at:'2026-10-01T01:00:00Z' } satisfies EscapeRecord;
const storage = () => { const data = new Map<string,string>(); return {getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}}; };
describe('personal record storage',()=>{
  it('starts empty and restores saved records from storage',()=>{const s=storage();expect(readRecords(s)).toEqual([]);saveRecords(s,[record]);expect(readRecords(s)).toEqual([record]);});
  it('preserves activity including zero and supports older records',()=>{const s=storage();saveRecords(s,[{...record,felt_activity:0}]);expect(readRecords(s)[0].felt_activity).toBe(0);saveRecords(s,[record]);expect(readRecords(s)[0].felt_activity).toBeUndefined();});
  it('keeps a deletion after reloading',()=>{const s=storage();saveRecords(s,[record]);saveRecords(s,[]);expect(readRecords(s)).toEqual([]);});
  it('does not replace corrupt stored content',()=>{const s=storage();s.setItem(RECORDS_KEY,'broken');expect(()=>readRecords(s)).toThrow();expect(s.getItem(RECORDS_KEY)).toBe('broken');});
  it('reports failed writes instead of claiming success',()=>{expect(()=>saveRecords({getItem:()=>null,setItem:()=>{throw Error('quota');}},[record])).toThrow('저장하지 못했어요');});
});
