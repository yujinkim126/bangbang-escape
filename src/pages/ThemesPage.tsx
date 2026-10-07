import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../lib/data';
import { difficultyText, fearText, playersText } from '../lib/format';
import { areaOf, cityOf, searchThemes } from '../lib/theme-search';
import ThemePoster from '../components/ThemePoster';
import ThemeSheet from '../components/ThemeSheet';
import Icon from '../components/Icon';
import { Seal, ViewToggle } from '../components/Bits';

export default function ThemesPage() {
  const { themes, catalog, records } = useApp();
  const [params, setParams] = useSearchParams();
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if(value) next.set(key,value); else next.delete(key);
    setParams(next,{replace:key==='q'});
  };
  const city=params.get('city') ?? '';
  const q=params.get('q') ?? '', area=params.get('area') ?? '', genre=params.get('genre') ?? '';
  const maxDifficulty=Number(params.get('difficulty')) || 5, players=Number(params.get('players')) || 0;
  const noFear=params.get('fear')==='0', unplayed=params.get('unplayed')==='1';
  const sort=params.get('sort') ?? 'name', storeId=params.get('store');
  const played=useMemo(()=>new Set(records.map(r=>r.theme_id)),[records]);
  const results=useMemo(()=>{const m=new Map<string,boolean>();for(const r of records)m.set(r.theme_id,(m.get(r.theme_id)??false)||r.success);return m;},[records]);
  const list=useMemo(()=>searchThemes(themes,catalog.stores,played,{query:q,city,area,genre,maxDifficulty,players,noFear,unplayed,sort,storeId}),[themes,catalog,played,q,city,area,genre,maxDifficulty,players,noFear,unplayed,sort,storeId]);
  const genres=useMemo(()=>[...new Set(themes.flatMap(t=>t.genres))].sort((a,b)=>a.localeCompare(b,'ko')),[themes]);
  const cities=useMemo(()=>[...new Set(themes.filter(t=>t.status==='open').map(t=>cityOf(catalog.stores.get(t.store_id))))].sort((a,b)=>['서울','부산','대구','대전','광주','인천','울산','경기','경북','전북'].indexOf(a)-['서울','부산','대구','대전','광주','인천','울산','경기','경북','전북'].indexOf(b)),[themes,catalog]);
  const areas=useMemo(()=>[...new Set(themes.filter(t=>t.status==='open'&&(!city||cityOf(catalog.stores.get(t.store_id))===city)).map(t=>areaOf(catalog.stores.get(t.store_id))))],[themes,catalog,city]);
  const count=(a:string)=>themes.filter(t=>t.status==='open' && catalog.stores.get(t.store_id)?.status!=='closed' && (!a||cityOf(catalog.stores.get(t.store_id))===a)).length;
  const opened=catalog.themes.get(params.get('theme') ?? '');
  const active=Boolean(q||city||area||genre||players||maxDifficulty<5||noFear||unplayed||storeId);
  const reset=()=>{const next=new URLSearchParams();if(params.get('theme'))next.set('theme',params.get('theme')!);setParams(next);};
  return <div className="page discover-page">
    <header className="discover-heading">
      <div><span className="eyebrow">다음 방탈출을 찾는 시간</span><h1>어떤 이야기를 만나볼까?</h1><p>지역부터 고르고, 나에게 맞는 테마를 찾아보세요.</p></div><ViewToggle />
    </header>
    <div className="area-tabs" aria-label="지역 선택">{['',...cities].map(a=><button key={a} className={city===a?'selected':''} aria-pressed={city===a} onClick={()=>{const n=new URLSearchParams(params);n.delete('store');n.delete('area');a?n.set('city',a):n.delete('city');setParams(n);}}>{a||'전국'}<span>{count(a)}</span></button>)}</div>
    <div className="discovery-layout">
      <aside className="search-panel">
        <div className="search-panel-heading"><h2>테마 찾기</h2><button className="link-btn" onClick={reset} disabled={!active}>초기화</button></div>
        <label className="search-box"><Icon name="search"/><input className="input" aria-label="테마, 매장 검색" placeholder="테마 또는 매장 이름" value={q} onChange={e=>set('q',e.target.value)}/></label>
        <label className="filter-field">세부 지역<select className="input" value={area} onChange={e=>set('area',e.target.value)}><option value="">{city || '전국'} 전체</option>{areas.map(a=><option key={a}>{a}</option>)}</select></label>
        <label className="filter-field">장르<select className="input" value={genre} onChange={e=>set('genre',e.target.value)}><option value="">모든 장르</option>{genres.map(g=><option key={g}>{g}</option>)}</select></label>
        <label className="filter-field">함께할 인원<select className="input" value={players} onChange={e=>set('players',e.target.value==='0'?'':e.target.value)}><option value={0}>인원 전체</option>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}명</option>)}</select></label>
        <label className="filter-field">난이도<select className="input" value={maxDifficulty} onChange={e=>set('difficulty',e.target.value==='5'?'':e.target.value)}><option value={5}>난이도 전체</option><option value={2.5}>쉬운 테마</option><option value={3.5}>보통까지</option><option value={4}>어려움까지</option></select></label>
        <div className="filter-checks"><label><input type="checkbox" checked={noFear} onChange={e=>set('fear',e.target.checked?'0':'')}/>공포 없음으로 확인된 테마</label><label><input type="checkbox" checked={unplayed} onChange={e=>set('unplayed',e.target.checked?'1':'')}/>아직 안 해본 테마</label></div>
        <p className="filter-help">인원·공포도 조건을 고르면 해당 정보가 없는 테마는 제외돼요.</p>
      </aside>
      <section className="search-results" aria-label="테마 검색 결과">
        <div className="results-toolbar"><div><h2>{storeId ? catalog.stores.get(storeId)?.name : area||city||'전국'} <span>{list.length}</span></h2><p>매장 공식 사이트 기준 · 정보는 순차적으로 보충 중이에요.</p></div><select aria-label="정렬" value={sort} onChange={e=>set('sort',e.target.value)}><option value="name">이름순</option><option value="difficulty">쉬운 순</option><option value="duration">짧은 시간순</option></select></div>
        {storeId&&<div className="store-filter">이 매장의 테마를 보고 있어요.<button className="link-btn" onClick={()=>set('store','')}>전체 매장 보기</button></div>}
        <div className="theme-grid" aria-live="polite">{list.map(t=>{const s=catalog.stores.get(t.store_id);const result=results.get(t.id);return <button key={t.id} className="theme-card card" onClick={()=>set('theme',t.id)}>
          <ThemePoster theme={t} /><div className="theme-card-top"><span className="area-label">{areaOf(s)}</span>{result!==undefined?<Seal success={result}/>:<span className="card-arrow" aria-hidden="true">↗</span>}</div>
          <div className="theme-name" title={t.name}>{t.name}</div><div className="theme-store">{s?.name}</div>
          <div className="tags">{t.genres.length?t.genres.map(g=><span key={g} className="tag">{g}</span>):<span className="tag">장르 정보 준비 중</span>}</div>
          <div className="theme-facts"><div><span>플레이 시간</span><strong>{t.duration_min?`${t.duration_min}분`:'미확인'}</strong></div><div><span>추천 인원</span><strong>{playersText(t.players_min,t.players_max)||'미확인'}</strong></div><div><span>난이도</span><strong>{difficultyText(t.difficulty)}</strong></div></div>
          <div className={`fear-line ${t.fear!=null&&t.fear>0?'has-fear':''}`}>{fearText(t.fear)||'공포도 미확인'}</div>
        </button>})}</div>
        {!list.length&&<div className="empty card"><h3>조건에 맞는 테마가 없어요</h3><p>지역이나 필터를 바꿔서 다시 찾아보세요.</p><button className="btn" onClick={reset}>전체 테마 보기</button></div>}
      </section>
    </div>
    {opened&&<ThemeSheet theme={opened} onClose={()=>set('theme','')}/>}
  </div>;
}
