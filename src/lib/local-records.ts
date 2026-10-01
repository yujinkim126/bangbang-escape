import type { EscapeRecord } from './types';

export const RECORDS_KEY = 'bangbang.records.v1';
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;

export function readRecords(storage: StorageAccess): EscapeRecord[] {
  const raw = storage.getItem(RECORDS_KEY);
  if (!raw) return [];
  const value = JSON.parse(raw);
  if (!Array.isArray(value) || value.some(r => !r || typeof r.id !== 'string' || typeof r.theme_id !== 'string' || typeof r.success !== 'boolean' || !Array.isArray(r.companions) || !Number.isFinite(Date.parse(r.played_at)))) {
    throw new Error('저장된 기록을 읽지 못했어요. 기존 데이터는 그대로 보존했어요.');
  }
  return value.sort((a, b) => Date.parse(b.played_at) - Date.parse(a.played_at));
}

export function saveRecords(storage: StorageAccess, records: EscapeRecord[]) {
  try { storage.setItem(RECORDS_KEY, JSON.stringify(records)); }
  catch { throw new Error('기록을 저장하지 못했어요. 브라우저 저장 공간과 설정을 확인해 주세요.'); }
}
