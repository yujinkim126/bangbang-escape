import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/data';
import RecordForm from '../components/RecordForm';
import ThemePoster from '../components/ThemePoster';
import { areaOf } from '../lib/theme-search';

const PAGE = 24;

export default function RecordPage() {
  const { themes, catalog, session } = useApp();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const navigate = useNavigate();
  const theme = catalog.themes.get(params.get('theme') ?? '');
  const matches = themes.filter(t => `${t.name} ${catalog.stores.get(t.store_id)?.name ?? ''}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <div className="page record-page">
    <header className="page-head"><div><span className="eyebrow">나의 방탈출 이야기</span><h1>기록하기</h1><p>플레이한 테마를 고르고 오늘의 경험을 남겨보세요.</p></div><Link className="btn-ghost" to="/">내 기록 보기</Link></header>
    {!session ? <div className="card empty"><p>로그인하면 나의 기록을 남길 수 있어요.</p><Link to="/login" className="btn">로그인</Link></div> : theme ?
      <section className="card record-page-form"><div className="record-selection"><span>{catalog.stores.get(theme.store_id)?.name}</span><button className="link-btn" onClick={() => { if (confirm('테마를 바꾸면 작성 중인 내용이 사라져요. 바꿀까요?')) setParams({}); }}>테마 변경</button></div><RecordForm key={theme.id} theme={theme} onDone={() => navigate('/')} /></section> :
      <section className="card record-picker"><h2>어떤 테마를 했나요?</h2><label className="field">테마 또는 매장 검색<input autoFocus className="input" value={query} onChange={e => { setQuery(e.target.value); setLimit(PAGE); }} placeholder="테마 이름, 매장 이름" /></label><p className="muted">{matches.length}개 테마</p><div className="record-options">{matches.slice(0, limit).map(t => { const s = catalog.stores.get(t.store_id); return <button key={t.id} className="record-option card" onClick={() => setParams({theme:t.id})}><ThemePoster theme={t} /><span className="area-label">{areaOf(s)}</span><strong className="theme-name" title={t.name}>{t.name}</strong><small className="theme-store">{s?.name}</small></button>; })}</div>{matches.length > limit && <button className="btn-ghost record-more" onClick={() => setLimit(limit + PAGE)}>더 보기 ({matches.length - limit}개 남음)</button>}{!matches.length && <p>검색 결과가 없어요. 다른 이름으로 찾아보세요.</p>}</section>}
  </div>;
}
