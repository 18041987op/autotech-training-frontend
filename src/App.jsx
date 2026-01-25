/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';
import { api } from './api';
import {
  LayoutGrid, GraduationCap, BookOpen, BadgeCheck, MessageSquare, BarChart3,
  Users, FolderKanban, HardDrive, LogOut, Globe, Plus, CheckCircle2, AlertTriangle,
  Search, ExternalLink
} from 'lucide-react';

// -------------------------
// Auth helpers
// -------------------------
function setToken(token) {
  localStorage.setItem('token', token);
}
function clearToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
}
function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('authToken');
}

function useAuth() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      setReady(true);
      return;
    }
    api.verify()
      .then((d) => setUser(d.user))
      .catch(() => clearToken())
      .finally(() => setReady(true));
  }, []);

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return { user, setUser, ready, logout };
}

function RequireAuth({ user, children }) {
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function RequireAdmin({ user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// -------------------------
// UI building blocks
// -------------------------
function Card({ title, right, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/20">
      {(title || right) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="text-sm font-semibold text-white/90">{title}</div>
          <div>{right}</div>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function Pill({ children }) {
  return <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/80 border border-white/10">{children}</span>;
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold hover:bg-white/90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ''}`}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-xl bg-white/5 text-white px-4 py-2 text-sm font-semibold hover:bg-white/10 border border-white/10 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${props.className || ''}`}
    >
      {children}
    </button>
  );
}

function TextField({ label, value, onChange, type = 'text', placeholder, autoComplete }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-white/70 mb-2">{label}</div>
      <input
        className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-white/70 mb-2">{label}</div>
      <select
        className="w-full rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0b1020]">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// -------------------------
// Layout
// -------------------------
function AppShell({ user, onLogout, children }) {
  const { t } = useTranslation();
  const location = useLocation();

  const nav = useMemo(() => {
    const base = [
      { to: '/', label: t('dashboard'), icon: LayoutGrid },
      { to: '/onboarding', label: t('onboarding'), icon: GraduationCap },
      { to: '/training', label: t('training'), icon: BookOpen },
      { to: '/culture', label: t('culture'), icon: BadgeCheck },
      { to: '/evaluations', label: t('evaluations'), icon: BadgeCheck },
      { to: '/ai', label: t('aiCoach'), icon: MessageSquare },
      { to: '/progress', label: t('myProgress'), icon: BarChart3 }
    ];
    const admin = [
      { to: '/admin/users', label: t('adminUsers'), icon: Users },
      { to: '/admin/content', label: t('adminContent'), icon: FolderKanban },
      { to: '/admin/drive', label: t('adminDrive'), icon: HardDrive }
    ];
    return user?.role === 'admin' ? [...base, ...admin] : base;
  }, [t, user?.role]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          {/* Sidebar */}
          <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/20 p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold tracking-tight">{t('appName')}</div>
              <Pill>{user?.role}</Pill>
            </div>

            <div className="mt-4 space-y-1">
              {nav.map((item) => {
                const active = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm border ${
                      active ? 'bg-white text-black border-white' : 'bg-transparent text-white/85 border-transparent hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
              <div className="text-xs text-white/60">{user?.email}</div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Globe size={16} />
                  {t('language')}
                </div>
                <div className="flex gap-2">
                  <button
                    className={`rounded-lg px-2 py-1 text-xs border ${i18n.language === 'en' ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10'}`}
                    onClick={() => { i18n.changeLanguage('en'); localStorage.setItem('lang', 'en'); }}
                  >
                    EN
                  </button>
                  <button
                    className={`rounded-lg px-2 py-1 text-xs border ${i18n.language === 'es' ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10'}`}
                    onClick={() => { i18n.changeLanguage('es'); localStorage.setItem('lang', 'es'); }}
                  >
                    ES
                  </button>
                </div>
              </div>

              <GhostButton className="w-full justify-center" onClick={onLogout}>
                <LogOut size={16} /> {t('logout')}
              </GhostButton>
            </div>
          </div>

          {/* Main */}
          <div className="space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------
// Pages
// -------------------------
function LoginPage({ onLoggedIn }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setToken(data.token);
      onLoggedIn(data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card
          title={t('login')}
          right={<Link className="text-sm text-white/70 hover:text-white" to="/register">{t('register')}</Link>}
        >
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <AlertTriangle size={16} className="mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <TextField label={t('email')} value={email} onChange={setEmail} type="email" autoComplete="email" />
            <TextField label={t('password')} value={password} onChange={setPassword} type="password" autoComplete="current-password" />
            <PrimaryButton disabled={loading} className="w-full justify-center" type="submit">
              {loading ? t('loading') : t('login')}
            </PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [role, setRole] = useState('technician');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    setLoading(true);
    try {
      await api.register({ name, email, password, role });
      setOk('Account created. Pending approval by an administrator.');
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      setError(err.message || 'Register failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card
          title={t('register')}
          right={<Link className="text-sm text-white/70 hover:text-white" to="/login">{t('login')}</Link>}
        >
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <AlertTriangle size={16} className="mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          {ok && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              <CheckCircle2 size={16} className="mt-0.5" />
              <div>{ok}</div>
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <TextField label={t('name')} value={name} onChange={setName} autoComplete="name" />
            <TextField label={t('email')} value={email} onChange={setEmail} type="email" autoComplete="email" />
            <TextField label={t('password')} value={password} onChange={setPassword} type="password" autoComplete="new-password" />
            <SelectField
              label={t('role')}
              value={role}
              onChange={setRole}
              options={[
                { value: 'technician', label: t('role_technician') },
                { value: 'administrative', label: t('role_administrative') }
              ]}
            />
            <PrimaryButton disabled={loading} className="w-full justify-center" type="submit">
              {loading ? t('loading') : t('register')}
            </PrimaryButton>
          </form>
        </Card>
      </div>
    </div>
  );
}

function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <Card title="Today">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/60 mb-1">Required this week</div>
            <div className="text-2xl font-bold">3</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/60 mb-1">Onboarding items</div>
            <div className="text-2xl font-bold">2</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/60 mb-1">Knowledge checks pending</div>
            <div className="text-2xl font-bold">1</div>
          </div>
        </div>
      </Card>

      <Card title="What this app is for">
        <div className="text-sm text-white/80 leading-relaxed">
          Training, onboarding and company culture in one place — controlled by role, with required knowledge checks and progress tracking.
        </div>
      </Card>
    </div>
  );
}

function ModuleListPage({ title, categoryFilter }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getUserModules()
      .then((d) => {
        if (!mounted) return;
        setModules(d.modules || []);
      })
      .catch((e) => mounted && setErr(e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const base = modules.filter((m) => {
      if (!categoryFilter) return true;
      return m.category === categoryFilter;
    });
    const ql = q.trim().toLowerCase();
    if (!ql) return base;
    return base.filter((m) => (m.title || '').toLowerCase().includes(ql) || (m.description || '').toLowerCase().includes(ql));
  }, [modules, q, categoryFilter]);

  return (
    <Card
      title={title}
      right={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              className="rounded-xl bg-black/20 border border-white/10 pl-9 pr-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
              placeholder={t('search')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      }
    >
      {loading && <div className="text-sm text-white/70">{t('loading')}</div>}
      {err && <div className="text-sm text-red-200">{t('error')}: {err}</div>}

      {!loading && filtered.length === 0 && (
        <div className="text-sm text-white/70">No modules found.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((m) => (
          <div key={m.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">{m.title}</div>
                <div className="text-sm text-white/70 mt-1">{m.description}</div>
              </div>
              <Pill>{m.category}</Pill>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {m.required ? <Pill>{t('required')}</Pill> : <Pill>{t('optional')}</Pill>}
              <Pill>{Math.round(m.completionRate || 0)}%</Pill>
            </div>

            <div className="mt-4 flex gap-2">
              <PrimaryButton onClick={() => navigate(`/modules/${m.id}`)}>
                {t('open')}
              </PrimaryButton>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ModuleDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();

  const [module, setModule] = useState(null);
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const [coachQ, setCoachQ] = useState('');
  const [coachMsgs, setCoachMsgs] = useState([]);

  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr('');
    Promise.all([api.getModule(id), api.getModuleResources(id)])
      .then(([m, r]) => {
        if (!mounted) return;
        setModule(m.module);
        setFiles(r.files || []);
      })
      .catch((e) => mounted && setErr(e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  const askAI = async () => {
    const q = coachQ.trim();
    if (!q) return;
    setCoachQ('');
    setCoachMsgs((p) => [...p, { role: 'user', content: q }]);
    try {
      const data = await api.aiChat(q);
      setCoachMsgs((p) => [...p, { role: 'assistant', content: data.response }]);
    } catch (e) {
      setCoachMsgs((p) => [...p, { role: 'assistant', content: `Error: ${e.message}` }]);
    }
  };

  const startAssessment = async () => {
    if (!module) return;
    setScore(null);
    setAnswers({});
    try {
      const data = await api.aiGenerateAssessment(module.title, module.id);
      setAssessment(data.quiz);
    } catch (e) {
      alert(e.message);
    }
  };

  const submitAssessment = () => {
    if (!assessment?.questions?.length) return;
    let correct = 0;
    for (const q of assessment.questions) {
      if (answers[q.id] === q.correct) correct += 1;
    }
    const pct = Math.round((correct / assessment.questions.length) * 100);
    setScore(pct);
  };

  return (
    <div className="space-y-5">
      <Card title="Module">
        {loading && <div className="text-sm text-white/70">{t('loading')}</div>}
        {err && <div className="text-sm text-red-200">{t('error')}: {err}</div>}
        {!loading && module && (
          <div>
            <div className="text-2xl font-bold">{module.title}</div>
            <div className="text-white/70 mt-2">{module.description}</div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>{module.category}</Pill>
              {module.required ? <Pill>{t('required')}</Pill> : <Pill>{t('optional')}</Pill>}
            </div>
          </div>
        )}
      </Card>

      <Card title={t('resources')}>
        {files.length === 0 ? (
          <div className="text-sm text-white/70">No files yet. Upload PDFs/docs into the module folder in Drive.</div>
        ) : (
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{f.name}</div>
                  <div className="text-xs text-white/60 truncate">{f.mimeType}</div>
                </div>
                {f.webViewLink && (
                  <a
                    href={f.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                  >
                    <ExternalLink size={16} /> Open
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title={t('assessment')}
        right={<PrimaryButton onClick={startAssessment}>{t('startAssessment')}</PrimaryButton>}
      >
        {!assessment && <div className="text-sm text-white/70">Start a short knowledge check to confirm understanding.</div>}

        {assessment && (
          <div className="space-y-4">
            {assessment.questions?.map((q) => (
              <div key={q.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="font-semibold">{q.id}. {q.question}</div>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, idx) => (
                    <label key={idx} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 cursor-pointer hover:bg-white/10">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === idx}
                        onChange={() => setAnswers((p) => ({ ...p, [q.id]: idx }))}
                        className="mt-1"
                      />
                      <div className="text-sm">{opt}</div>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <PrimaryButton onClick={submitAssessment}>Submit</PrimaryButton>
              {score !== null && <Pill>Score: {score}%</Pill>}
            </div>
          </div>
        )}
      </Card>

      <Card title={t('aiCoach')}>
        <div className="space-y-3">
          <div className="text-sm text-white/70">Ask about procedures, safety, customer handling, or this module content.</div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4 h-[240px] overflow-auto space-y-3">
            {coachMsgs.length === 0 ? (
              <div className="text-sm text-white/50">No messages yet.</div>
            ) : coachMsgs.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === 'user' ? 'text-white' : 'text-white/80'}`}>
                <span className="font-semibold">{m.role === 'user' ? 'You' : 'AI'}:</span> {m.content}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
              value={coachQ}
              onChange={(e) => setCoachQ(e.target.value)}
              placeholder="Type your question..."
            />
            <PrimaryButton onClick={askAI}>{t('askAI')}</PrimaryButton>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProgressPage() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getMyProgress()
      .then((d) => mounted && setData(d.progress || []))
      .catch((e) => mounted && setErr(e.message))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <Card title={t('myProgress')}>
      {loading && <div className="text-sm text-white/70">{t('loading')}</div>}
      {err && <div className="text-sm text-red-200">{t('error')}: {err}</div>}
      {!loading && (
        <div className="space-y-2">
          {data.length === 0 ? (
            <div className="text-sm text-white/70">No progress records yet.</div>
          ) : data.map((p) => (
            <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-sm font-semibold">{p.modules?.title || 'Module'}</div>
              <div className="text-xs text-white/60 mt-1">Completion: {p.completion_rate}% — Quiz: {p.quiz_score ?? 'N/A'}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AICoachPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [msgs, setMsgs] = useState([]);

  const send = async () => {
    const text = q.trim();
    if (!text) return;
    setQ('');
    setMsgs((p) => [...p, { role: 'user', content: text }]);
    try {
      const d = await api.aiChat(text);
      setMsgs((p) => [...p, { role: 'assistant', content: d.response }]);
    } catch (e) {
      setMsgs((p) => [...p, { role: 'assistant', content: `Error: ${e.message}` }]);
    }
  };

  return (
    <Card title={t('aiCoach')}>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 h-[360px] overflow-auto space-y-3">
        {msgs.length === 0 ? (
          <div className="text-sm text-white/50">Ask anything about shop procedures, OSHA, customer service, or culture.</div>
        ) : msgs.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-white' : 'text-white/80'}`}>
            <span className="font-semibold">{m.role === 'user' ? 'You' : 'AI'}:</span> {m.content}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Type your question..."
        />
        <PrimaryButton onClick={send}>{t('askAI')}</PrimaryButton>
      </div>
    </Card>
  );
}

// -------------------------
// Admin pages
// -------------------------
function AdminDrivePage() {
  const { t } = useTranslation();
  const [msg, setMsg] = useState('');
  const [anchors, setAnchors] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setMsg('');
    try {
      const d = await api.adminBootstrapDrive();
      setMsg(d.message || t('driveReady'));
      setAnchors(d.anchors || {});
    } catch (e) {
      setMsg(`${t('error')}: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={t('adminDrive')} right={<PrimaryButton disabled={loading} onClick={run}>{t('initDrive')}</PrimaryButton>}>
      {msg && <div className="text-sm text-white/80 mb-3">{msg}</div>}
      {anchors && (
        <div className="space-y-2">
          {Object.entries(anchors).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <span className="font-semibold">{k}</span>: <span className="text-white/70">{v}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  // create form
  const [openCreate, setOpenCreate] = useState(false);
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cPassword, setCPassword] = useState('');
  const [cRole, setCRole] = useState('technician');
  const [cApproved, setCApproved] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setErr('');
    try {
      const d = await api.adminListUsers();
      setUsers(d.users || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const approve = async (id) => {
    try {
      await api.adminApproveUser(id);
      await refresh();
    } catch (e) {
      alert(e.message);
    }
  };

  const createUser = async () => {
    try {
      await api.adminCreateUser({
        name: cName,
        email: cEmail,
        password: cPassword,
        role: cRole,
        approved: cApproved
      });
      setOpenCreate(false);
      setCName(''); setCEmail(''); setCPassword('');
      setCRole('technician'); setCApproved(true);
      await refresh();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <Card
      title={t('adminUsers')}
      right={
        <PrimaryButton onClick={() => setOpenCreate(true)}>
          <Plus size={16} /> {t('createUser')}
        </PrimaryButton>
      }
    >
      {loading && <div className="text-sm text-white/70">{t('loading')}</div>}
      {err && <div className="text-sm text-red-200">{t('error')}: {err}</div>}

      {!loading && (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{u.name} <span className="text-white/50">({u.role})</span></div>
                <div className="text-xs text-white/60 truncate">{u.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {u.approved ? <Pill>{t('approved')}</Pill> : <Pill>{t('pending')}</Pill>}
                {!u.approved && (
                  <PrimaryButton onClick={() => approve(u.id)}>
                    {t('approve')}
                  </PrimaryButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {openCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1020] shadow-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">{t('createUser')}</div>
              <button className="text-white/70 hover:text-white" onClick={() => setOpenCreate(false)}>✕</button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextField label={t('name')} value={cName} onChange={setCName} />
              <TextField label={t('email')} value={cEmail} onChange={setCEmail} type="email" />
              <TextField label={t('password')} value={cPassword} onChange={setCPassword} type="password" />
              <SelectField
                label={t('role')}
                value={cRole}
                onChange={setCRole}
                options={[
                  { value: 'technician', label: t('role_technician') },
                  { value: 'administrative', label: t('role_administrative') },
                  { value: 'admin', label: t('role_admin') }
                ]}
              />
              <label className="flex items-center gap-2 text-sm text-white/80 mt-2">
                <input type="checkbox" checked={cApproved} onChange={(e) => setCApproved(e.target.checked)} />
                {t('approved')}
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <GhostButton onClick={() => setOpenCreate(false)}>{t('cancel')}</GhostButton>
              <PrimaryButton onClick={createUser}>{t('create')}</PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function AdminContentPage() {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDesc] = useState('');
  const [category, setCategory] = useState('universal');
  const [required, setRequired] = useState(true);

  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    setMsg('');
    try {
      const d = await api.adminCreateModule({ title, description, category, required });
      setMsg(`Created: ${d.module?.title || title}`);
      setTitle(''); setDesc('');
      setCategory('universal'); setRequired(true);
    } catch (e) {
      setMsg(`${t('error')}: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={t('adminContent')}>
      <div className="text-sm text-white/70 mb-4">
        Create modules and automatically generate the Drive folder for resources.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label={t('moduleTitle')} value={title} onChange={setTitle} />
        <SelectField
          label={t('category')}
          value={category}
          onChange={setCategory}
          options={[
            { value: 'universal', label: t('category_universal') },
            { value: 'technician', label: t('category_technician') },
            { value: 'administrative', label: t('category_administrative') }
          ]}
        />
        <div className="md:col-span-2">
          <TextField label={t('moduleDescription')} value={description} onChange={setDesc} />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          {t('required')}
        </label>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <PrimaryButton disabled={loading} onClick={create}>
          <Plus size={16} /> {t('createModule')}
        </PrimaryButton>
        {msg && <div className="text-sm text-white/80">{msg}</div>}
      </div>
    </Card>
  );
}

// -------------------------
// App root
// -------------------------
export default function App() {
  const auth = useAuth();

  if (!auth.ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/80">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={auth.user ? <Navigate to="/" replace /> : <LoginPage onLoggedIn={auth.setUser} />}
        />
        <Route
          path="/register"
          element={auth.user ? <Navigate to="/" replace /> : <RegisterPage />}
        />

        <Route
          path="/*"
          element={
            <RequireAuth user={auth.user}>
              <AppShell user={auth.user} onLogout={auth.logout}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/onboarding" element={<ModuleListPage title="Onboarding" categoryFilter={null} />} />
                  <Route path="/training" element={<ModuleListPage title="Training" categoryFilter={null} />} />
                  <Route path="/culture" element={<ModuleListPage title="Culture" categoryFilter={null} />} />
                  <Route path="/evaluations" element={<ModuleListPage title="Evaluations" categoryFilter={null} />} />
                  <Route path="/ai" element={<AICoachPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/modules/:id" element={<ModuleDetailPage />} />

                  <Route
                    path="/admin/drive"
                    element={
                      <RequireAdmin user={auth.user}>
                        <AdminDrivePage />
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <RequireAdmin user={auth.user}>
                        <AdminUsersPage />
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/content"
                    element={
                      <RequireAdmin user={auth.user}>
                        <AdminContentPage />
                      </RequireAdmin>
                    }
                  />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
