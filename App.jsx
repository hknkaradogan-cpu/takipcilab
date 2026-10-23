import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Activity, ArrowUpRight, Check, ChevronRight, CircleUserRound,
  ClipboardCheck, Flame, Hash, Lightbulb, LogOut, Menu, Plus,
  ShieldCheck, Sparkles, Target, TrendingUp, Video, X
} from 'lucide-react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const initialTasks = [
  { id: 'idea', title: 'Bugün için 3 video fikri yaz', detail: 'İzleyicinin ilgisini çekecek kısa fikirler hazırla.', points: 5, icon: Lightbulb },
  { id: 'profile', title: 'Profilini gözden geçir', detail: 'Profil fotoğrafı, biyografi ve sabit videolarını kontrol et.', points: 10, icon: CircleUserRound },
  { id: 'post', title: 'Bir paylaşım planla', detail: 'Bir video taslağı hazırla veya yayın takvimine ekle.', points: 10, icon: Video },
  { id: 'review', title: 'Bir videonu değerlendir', detail: 'İlk 3 saniye, başlık ve izleyiciye verdiği değeri kontrol et.', points: 5, icon: ClipboardCheck }
]

const ideas = [
  '“Bunu daha önce bilseydim…” diye başlayan 20 saniyelik bir video çek.',
  'Bir soruya hızlı cevap ver: İlk cümlede sonucu söyle, sonra 2 örnek göster.',
  'Önce/sonra formatında bir değişimi veya süreci anlat.',
  'Yorumlardan bir soruyu seç ve yeni videoda yanıtla.',
  'Üç maddelik mini liste hazırla; her maddeyi ekranda kısa yazıyla göster.'
]

function readLocal(key, fallback) {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback } catch { return fallback }
}

export default function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!supabase)
  const [authMode, setAuthMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('home')
  const [done, setDone] = useState(() => readLocal('tl_done', []))
  const [followers, setFollowers] = useState(() => readLocal('tl_followers', 0))
  const [goal, setGoal] = useState(() => readLocal('tl_goal', 1000))
  const [showGoal, setShowGoal] = useState(false)
  const [goalInput, setGoalInput] = useState(String(readLocal('tl_goal', 1000)))
  const [ideaIndex, setIdeaIndex] = useState(0)
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    }).catch(() => setAuthReady(true))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => { localStorage.setItem('tl_done', JSON.stringify(done)) }, [done])
  useEffect(() => { localStorage.setItem('tl_followers', JSON.stringify(followers)) }, [followers])
  useEffect(() => { localStorage.setItem('tl_goal', JSON.stringify(goal)) }, [goal])

  const points = useMemo(() => initialTasks.filter(t => done.includes(t.id)).reduce((sum, t) => sum + t.points, 0), [done])
  const progress = Math.min(100, Math.round((Number(followers || 0) / Math.max(1, Number(goal || 1))) * 100))
  const completedCount = initialTasks.filter(t => done.includes(t.id)).length

  async function submitAuth(e) {
    e.preventDefault()
    setError(''); setMessage('')
    if (!supabase) return
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı.'); return }
    setAuthBusy(true)
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw error
        if (data.session) setMessage('Hesabın oluşturuldu, giriş yaptın.')
        else setMessage('Kayıt isteği oluşturuldu. E-posta doğrulaması açıksa gelen kutunu kontrol et.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        setMessage('Giriş başarılı.')
      }
    } catch (err) { setError(err.message || 'İşlem tamamlanamadı.') }
    finally { setAuthBusy(false) }
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
    setSession(null)
    setMessage('Çıkış yapıldı.')
  }

  function toggleTask(id) {
    setDone(old => old.includes(id) ? old.filter(item => item !== id) : [...old, id])
  }

  function saveGoal(e) {
    e.preventDefault()
    const value = Math.max(1, Number(goalInput) || 1)
    setGoal(value); setShowGoal(false)
  }

  const navItems = [
    { id: 'home', label: 'Genel Bakış', icon: Activity },
    { id: 'tasks', label: 'Görevler', icon: ClipboardCheck },
    { id: 'ideas', label: 'AI İçerik Fikirleri', icon: Sparkles },
    { id: 'stats', label: 'İstatistikler', icon: TrendingUp }
  ]

  if (!authReady) return <div className="loading-screen"><div className="logo-mark">T</div><p>TakipçiLab hazırlanıyor…</p></div>

  if (!supabase) return <SetupScreen />

  if (!session) return (
    <div className="auth-shell">
      <div className="auth-art">
        <div className="brand"><div className="logo-mark">T</div><span>Takipçi<span className="brand-light">Lab</span></span></div>
        <div className="auth-art-copy">
          <div className="eyebrow"><Sparkles size={15}/> İÇERİK ÜRETİCİSİ ASİSTANI</div>
          <h1>İçeriğini geliştir.<br/><span>Gerçek topluluğunu</span> büyüt.</h1>
          <p>Fikirlerini planla, görevlerini tamamla ve büyüme hedefini takip et.</p>
          <div className="floating-stat"><TrendingUp size={18}/><div><b>Her gün bir adım</b><small>İstikrarlı içerik planı</small></div></div>
        </div>
        <div className="auth-glow glow-one"/><div className="auth-glow glow-two"/>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <div className="brand mobile-brand"><div className="logo-mark">T</div><span>Takipçi<span className="brand-light">Lab</span></span></div>
          <div className="auth-tag">HESABIN</div>
          <h2>{authMode === 'signup' ? 'Hesabını oluştur' : 'Tekrar hoş geldin'}</h2>
          <p className="muted">{authMode === 'signup' ? 'Ücretsiz hesabını oluştur ve planına başla.' : 'Devam etmek için hesabına giriş yap.'}</p>
          <form onSubmit={submitAuth} className="auth-form">
            <label>E-posta adresi<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@mail.com" autoComplete="email" required/></label>
            <label>Şifre<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 6 karakter" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} minLength="6" required/></label>
            {error && <div className="notice error">{error}</div>}
            {message && <div className="notice success">{message}</div>}
            <button className="primary-btn full" disabled={authBusy}>{authBusy ? 'Lütfen bekle…' : authMode === 'signup' ? 'Hesap oluştur' : 'Giriş yap'} <ChevronRight size={18}/></button>
          </form>
          <div className="auth-switch">{authMode === 'signup' ? 'Zaten hesabın var mı?' : 'Henüz hesabın yok mu?'} <button onClick={() => {setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setError(''); setMessage('')}}>{authMode === 'signup' ? 'Giriş yap' : 'Hesap oluştur'}</button></div>
          <div className="secure-note"><ShieldCheck size={15}/> Kimlik doğrulama Supabase üzerinden yapılır.</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'open' : ''}`}>
        <div className="brand sidebar-brand"><div className="logo-mark">T</div><span>Takipçi<span className="brand-light">Lab</span></span><button className="icon-btn close-menu" onClick={() => setMobileMenu(false)}><X size={18}/></button></div>
        <div className="workspace-label">ÇALIŞMA ALANI</div>
        <nav>{navItems.map(item => <button key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => {setActiveTab(item.id); setMobileMenu(false)}}><item.icon size={19}/><span>{item.label}</span>{activeTab === item.id && <span className="nav-dot"/>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="mini-tip"><div className="tip-icon"><Flame size={17}/></div><b>İstikrar kazanır</b><p>Küçük ama düzenli adımlar, sürdürülebilir bir içerik alışkanlığı oluşturur.</p></div>
          <div className="user-row"><div className="avatar">{(session.user.email || 'T').slice(0,1).toUpperCase()}</div><div className="user-meta"><b>{session.user.email?.split('@')[0]}</b><small>{session.user.email}</small></div><button className="icon-btn" title="Çıkış yap" onClick={signOut}><LogOut size={17}/></button></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar"><button className="icon-btn menu-btn" onClick={() => setMobileMenu(true)}><Menu size={21}/></button><div className="breadcrumb">Çalışma Alanı <ChevronRight size={14}/> <b>{navItems.find(n => n.id === activeTab)?.label}</b></div><div className="topbar-right"><span className="status-dot"/> <span className="live-label">Kişisel çalışma alanın</span><div className="avatar small-avatar">{(session.user.email || 'T').slice(0,1).toUpperCase()}</div></div></header>
        <div className="page-content">
          {message && <div className="notice success global-notice">{message}<button className="icon-btn" onClick={() => setMessage('')}><X size={15}/></button></div>}
          {activeTab === 'home' && <HomePage followers={followers} setFollowers={setFollowers} goal={goal} progress={progress} points={points} completedCount={completedCount} setShowGoal={setShowGoal} setActiveTab={setActiveTab} done={done}/>}
          {activeTab === 'tasks' && <TasksPage done={done} toggleTask={toggleTask} points={points}/>}
          {activeTab === 'ideas' && <IdeasPage ideaIndex={ideaIndex} setIdeaIndex={setIdeaIndex}/>}
          {activeTab === 'stats' && <StatsPage followers={followers} goal={goal} progress={progress} points={points} completedCount={completedCount} setShowGoal={setShowGoal}/>}
          <footer className="footer-note">TakipçiLab · İçerik üreticileri için yardımcı araç <span>•</span> Takipçi veya gelir garantisi vermez.</footer>
        </div>
      </main>
      {mobileMenu && <button className="scrim" aria-label="Menüyü kapat" onClick={() => setMobileMenu(false)}/>}
      {showGoal && <div className="modal-backdrop" onClick={() => setShowGoal(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="icon-btn modal-close" onClick={() => setShowGoal(false)}><X size={18}/></button><div className="modal-icon"><Target size={22}/></div><h3>Takipçi hedefini düzenle</h3><p className="muted">Mevcut takipçi sayını ve ulaşmak istediğin hedefi gir.</p><form onSubmit={e => {e.preventDefault(); const f = Math.max(0, Number(document.getElementById('followerInput').value) || 0); setFollowers(f); saveGoal(e)}}><label>Mevcut takipçi sayısı<input id="followerInput" type="number" min="0" defaultValue={followers}/></label><label>Hedef takipçi sayısı<input type="number" min="1" value={goalInput} onChange={e => setGoalInput(e.target.value)} required/></label><button className="primary-btn full">Kaydet <ArrowUpRight size={17}/></button></form></div></div>}
    </div>
  )
}

function SetupScreen() {
  return <div className="setup-wrap"><div className="setup-card"><div className="brand"><div className="logo-mark">T</div><span>Takipçi<span className="brand-light">Lab</span></span></div><div className="setup-icon"><ShieldCheck size={28}/></div><h1>Bir kurulum adımı kaldı</h1><p>Uygulama çalışıyor ancak Supabase bağlantısı henüz ayarlanmamış. GitHub deposunda <code>.env.example</code> dosyasını okuyup aynı değişkenleri dağıtım ortamına ekle.</p><ol><li>Supabase projesi oluştur.</li><li>Project URL ve anon/publishable key değerlerini al.</li><li>GitHub deposunda <b>Settings → Secrets and variables → Actions</b> bölümünden <code>VITE_SUPABASE_URL</code> ve <code>VITE_SUPABASE_ANON_KEY</code> değişkenlerini ekle.</li><li>Workflow'u yeniden çalıştır.</li></ol><p className="warning-line">Service role key kullanma; bu anahtar gizli kalmalıdır.</p></div></div>
}

function HomePage({ followers, setFollowers, goal, progress, points, completedCount, setShowGoal, setActiveTab, done }) {
  return <>
    <div className="welcome-row"><div><div className="eyebrow">BUGÜNÜN PLANI</div><h1>Selam, üretici! <span className="wave">✦</span></h1><p className="muted">Küçük adımlarla içerik hedeflerine yaklaş.</p></div><button className="secondary-btn" onClick={() => setShowGoal(true)}><Target size={17}/> Hedefi düzenle</button></div>
    <div className="hero-card"><div className="hero-content"><div className="hero-chip"><Sparkles size={14}/> BÜYÜME YOLCULUĞUN</div><h2>İçeriğini geliştir,<br/><span>topluluğunu büyüt.</span></h2><p>Bugün bir fikir üret, bir görevi tamamla ve yarın için ivme kazan.</p><button className="hero-btn" onClick={() => setActiveTab('tasks')}>Günlük görevleri gör <ChevronRight size={17}/></button></div><div className="hero-visual"><div className="orb orb-a"/><div className="orb orb-b"/><div className="growth-card"><div className="growth-top"><span>HEDEF İLERLEMESİ</span><TrendingUp size={17}/></div><div className="growth-number">%{progress}</div><div className="progress-track"><div className="progress-fill" style={{width: `${progress}%`}}/></div><div className="growth-foot"><span>{Number(followers).toLocaleString('tr-TR')} takipçi</span><span>{Number(goal).toLocaleString('tr-TR')} hedef</span></div></div><div className="floating-bubble bubble-one"><Flame size={16}/> Her gün devam</div><div className="floating-bubble bubble-two"><Check size={16}/> {completedCount}/4 görev</div></div></div>
    <div className="metric-grid"><Metric icon={Target} label="Takipçi hedefi" value={`${Number(followers).toLocaleString('tr-TR')} / ${Number(goal).toLocaleString('tr-TR')}`} sub={`Hedefin %${progress}'i`} tone="pink"/><Metric icon={Sparkles} label="Toplanan puan" value={points} sub="Uygulama içi puan" tone="purple"/><Metric icon={ClipboardCheck} label="Tamamlanan görev" value={`${completedCount}/4`} sub="Günlük görev listesi" tone="blue"/></div>
    <div className="section-heading"><div><h2>Bugünkü görevler</h2><p className="muted">Kısa, uygulanabilir ve içerik odaklı.</p></div><button className="text-btn" onClick={() => setActiveTab('tasks')}>Tüm görevler <ChevronRight size={16}/></button></div>
    <div className="task-preview-grid">{initialTasks.slice(0,3).map(task => <TaskCard key={task.id} task={task} isDone={done.includes(task.id)} onToggle={() => {}} compact/>)}</div>
  </>
}

function Metric({ icon: Icon, label, value, sub, tone }) {
  return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19}/></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-sub">{sub}</div></div>
}

function TasksPage({ done, toggleTask, points }) {
  return <><div className="page-title-row"><div><div className="eyebrow">İLERLEME SİSTEMİ</div><h1>Günlük görevler</h1><p className="muted">Tamamladığın görevleri işaretle. Puanlar yalnızca uygulama içi ilerleme içindir.</p></div><div className="points-pill"><Sparkles size={17}/><b>{points} puan</b></div></div><div className="task-list">{initialTasks.map(task => <TaskCard key={task.id} task={task} isDone={done.includes(task.id)} onToggle={() => toggleTask(task.id)}/>)}</div><div className="info-banner"><ShieldCheck size={20}/><div><b>Gerçek etkileşim, sağlıklı büyüme</b><p>Görevler içerik üretimi ve profil geliştirme içindir; takipçi, beğeni veya izlenme satın alma ya da takas etme amacı taşımaz.</p></div></div></>
}

function TaskCard({ task, isDone, onToggle, compact = false }) {
  const Icon = task.icon
  return <div className={`task-card ${isDone ? 'task-done' : ''} ${compact ? 'compact' : ''}`}><div className="task-icon"><Icon size={20}/></div><div className="task-copy"><h3>{task.title}</h3><p>{task.detail}</p></div><div className="task-reward">+{task.points} <span>puan</span></div>{!compact && <button className={`task-check ${isDone ? 'checked' : ''}`} onClick={onToggle} aria-label={isDone ? 'Görevi geri al' : 'Görevi tamamla'}>{isDone ? <Check size={18}/> : <Plus size={18}/>}</button>}</div>
}

function IdeasPage({ ideaIndex, setIdeaIndex }) {
  const idea = ideas[ideaIndex % ideas.length]
  return <><div className="page-title-row"><div><div className="eyebrow">İÇERİK ATÖLYESİ</div><h1>Video fikirleri</h1><p className="muted">Başlangıç fikirleri oluştur ve kendi tarzına göre uyarla.</p></div><div className="ai-badge"><Sparkles size={16}/> Fikir asistanı</div></div><div className="idea-hero"><div className="idea-glow"/><div className="idea-label"><Lightbulb size={16}/> BUGÜNÜN FİKRİ</div><h2>{idea}</h2><p>İpucu: İlk 1–3 saniyede izleyicinin neden izlemeye devam etmesi gerektiğini açıkça göster.</p><button className="primary-btn" onClick={() => setIdeaIndex((ideaIndex + 1) % ideas.length)}>Başka fikir üret <Sparkles size={17}/></button></div><div className="section-heading"><div><h2>İçerik kontrol listesi</h2><p className="muted">Paylaşmadan önce hızlıca kontrol et.</p></div></div><div className="checklist-grid">{['İlk saniyelerde merak uyandırıyor mu?','Ses ve görüntü anlaşılır mı?','Tek bir ana fikir anlatıyor mu?','Başlık içerikle uyumlu mu?'].map((item, i) => <div className="checklist-item" key={item}><span>{String(i+1).padStart(2,'0')}</span>{item}</div>)}</div><div className="hashtag-note"><Hash size={18}/><div><b>Hashtag önerisi</b><p>Çok genel etiketlere yığılmak yerine videonun konusu, hedef kitlesi ve nişiyle ilgili 3–5 alakalı etiket seç.</p></div></div></>
}

function StatsPage({ followers, goal, progress, points, completedCount, setShowGoal }) {
  return <><div className="page-title-row"><div><div className="eyebrow">HEDEFLERİN</div><h1>İstatistikler</h1><p className="muted">Bu ilk sürümde takipçi sayısını manuel güncelleyebilirsin.</p></div><button className="secondary-btn" onClick={() => setShowGoal(true)}>Verileri güncelle <ArrowUpRight size={17}/></button></div><div className="stats-main"><div className="stats-card"><div className="stat-card-head"><div><span className="metric-label">Mevcut takipçi</span><div className="big-stat">{Number(followers).toLocaleString('tr-TR')}</div></div><div className="metric-icon pink"><TrendingUp size={20}/></div></div><div className="progress-track large"><div className="progress-fill" style={{width: `${progress}%`}}/></div><div className="growth-foot"><span>Hedefin %{progress}'i tamamlandı</span><span>{Number(goal).toLocaleString('tr-TR')} hedef</span></div></div><div className="stats-card"><div className="stat-card-head"><div><span className="metric-label">Görev puanları</span><div className="big-stat">{points}</div></div><div className="metric-icon purple"><Sparkles size={20}/></div></div><p className="muted">Tamamlanan görev: {completedCount} / {initialTasks.length}</p><div className="progress-track large"><div className="progress-fill purple-fill" style={{width: `${completedCount / initialTasks.length * 100}%`}}/></div></div></div><div className="info-banner"><Activity size={20}/><div><b>Sonraki geliştirme</b><p>Resmî TikTok izinleri mevcut olduğunda hesap verileri bağlanabilir. Şimdilik buradaki değerler otomatik doğrulanmış TikTok verisi değildir.</p></div></div></>
}
