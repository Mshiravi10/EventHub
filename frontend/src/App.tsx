import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import conferenceImage from './assets/auth-conference.png'
import {
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CircleAlert,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
  Users,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Role = 'admin' | 'organizer' | 'instructor' | 'participant'
type User = { id: number; name: string; email: string; role: Role; phone?: string | null; organization?: string | null; is_active: boolean; event_registrations_count?: number }
type Session = { token: string; user: User }
type EventSession = { id: number; title: string; type: string; instructor_name?: string | null; room?: string | null; starts_at: string; ends_at: string; capacity: number; registered_count: number; instructor?: Pick<User, 'id' | 'name'> | null }
type EventRecord = { id: number; title: string; slug: string; description?: string | null; location?: string | null; starts_at: string; ends_at: string; capacity: number; status: string; sessions: EventSession[]; primary_registrations_count?: number }
type Registration = { id: number; registration_code: string; status: string; attendance_status: string; checked_in_at?: string | null; event_session_id?: number | null; user?: User; event: EventRecord; session?: EventSession | null }
type Voucher = { id: number; title: string; type: string; code: string; status: string; redeemed_at?: string | null; user?: User; event: EventRecord; session?: EventSession | null }
type Certificate = { id: number; type: string; serial_number: string; status: string; issued_at?: string | null; user?: User; event: EventRecord; session?: EventSession | null }
type Metric = { label: string; value: number; detail: string; tone: 'blue' | 'green' | 'amber' | 'violet' }
type Dashboard = { mode: Role | 'organizer'; event?: EventRecord | null; metrics: Metric[]; sessions?: EventSession[]; registrations?: Registration[]; vouchers?: Voucher[]; certificates?: Certificate[] }
type Report = { events: Array<EventRecord & { registrations_count: number; attendance_count: number; vouchers_count: number; redeemed_vouchers_count: number; certificates_count: number }>; totals: { events: number; registrations: number; attendance: number; vouchers: number; redeemed_vouchers: number; certificates: number } }

class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>
  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

function getStoredToken(): string | null {
  return localStorage.getItem('eventhub_token') ?? sessionStorage.getItem('eventhub_token')
}

function normalizeDigits(value: string): string {
  const persian = '۰۱۲۳۴۵۶۷۸۹'
  const arabic = '٠١٢٣٤٥٦٧٨٩'

  return value.replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit))).replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`/api${path}`, { ...options, headers })
  if (response.status === 204) return undefined as T
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    const message = typeof payload.message === 'string' ? payload.message : 'درخواست با خطا روبه‌رو شد.'
    throw new ApiError(response.status, message, payload.errors as Record<string, string[]> | undefined)
  }
  return payload as T
}

function getError(error: unknown): string {
  if (error instanceof ApiError) {
    const first = error.errors ? Object.values(error.errors).flat()[0] : undefined
    return first ?? error.message
  }
  return 'ارتباط با سامانه برقرار نشد.'
}

function number(value: number): string { return new Intl.NumberFormat('fa-IR').format(value) }
function date(value?: string | null): string { return value ? new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—' }
function roleTitle(role: Role): string { return ({ admin: 'مدیر سامانه', organizer: 'دبیر رویداد', instructor: 'مدرس', participant: 'شرکت‌کننده' })[role] }
function sessionType(type: string): string { return ({ session: 'نشست', workshop: 'کارگاه', keynote: 'سخنرانی', panel: 'پنل', networking: 'شبکه‌سازی' })[type] ?? type }

function useData<T>(path: string): { data: T | null; loading: boolean; error: string; reload: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setData(await api<T>(path)) } catch (reason) { setError(getError(reason)) } finally { setLoading(false) }
  }, [path])

  useEffect(() => { void reload() }, [reload])
  return { data, loading, error, reload }
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <Card className="empty mx-auto mt-6 max-w-xl border-border/80 shadow-sm"><CardContent><Sparkles size={24} /><h3>{title}</h3><p>{detail}</p></CardContent></Card>
}

function Loading() { return <div className="loading"><Skeleton className="size-5 rounded-full" /> در حال دریافت اطلاعات…</div> }

function PageHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">فَرا رویداد</p><h1>{title}</h1><p>{subtitle}</p></div>{children && <div className="page-actions">{children}</div>}</div>
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (session: Session) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const requestData = Object.fromEntries(form.entries())
    for (const field of ['phone', 'national_code']) {
      if (typeof requestData[field] === 'string') requestData[field] = normalizeDigits(requestData[field])
    }
    setBusy(true); setMessage('')
    try {
      const payload = await api<Session>(mode === 'login' ? '/auth/login' : '/auth/register', {
        method: 'POST',
        body: JSON.stringify(requestData),
      })
      localStorage.removeItem('eventhub_token')
      sessionStorage.removeItem('eventhub_token')
      const shouldRemember = mode === 'register' || form.get('remember') === 'on'
      ;(shouldRemember ? localStorage : sessionStorage).setItem('eventhub_token', payload.token)
      onAuthenticated(payload)
    } catch (reason) { setMessage(getError(reason)) } finally { setBusy(false) }
  }

  const switchMode = (nextMode: 'login' | 'register') => { setMode(nextMode); setMessage('') }

  return (
    <main className="auth-reference">
      <section className="auth-visual" style={{ backgroundImage: `url(${conferenceImage})` }}>
        <div className="auth-visual-overlay" />
        <div className="auth-visual-body">
          <div className="auth-identity">
            <div className="auth-identity-copy"><strong>فَرا رویداد</strong><span>سامانه هوشمند مدیریت رویداد</span></div>
          </div>
          <div className="auth-hero-copy">
            <span className="auth-kicker">پلتفرم مدیریت رویدادهای علمی</span>
            <h1>یک تجربه منظم،<br />برای رویدادهای حرفه‌ای.</h1>
            <p>ثبت‌نام، مدیریت نشست‌ها و گواهی‌ها؛ در یک فضای آرام و یکپارچه.</p>
          </div>
          <div className="auth-visual-footer"><span>برای رویدادهایی که جزئیات‌شان مهم است</span><span>EventHub</span></div>
        </div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-panel-help"><span>فَرا رویداد</span><span>پشتیبانی رویداد</span></div>
        <Card className="auth-reference-card">
          <CardContent>
            <form onSubmit={submit}>
              <Tabs value={mode} onValueChange={(value) => switchMode(value as 'login' | 'register')}>
                <TabsList className="auth-mode-tabs"><TabsTrigger value="login">ورود به حساب</TabsTrigger><TabsTrigger value="register">ایجاد حساب</TabsTrigger></TabsList>
              </Tabs>
              <div className="auth-form-heading">
                <span className="auth-form-eyebrow">فضای کاربری</span>
                <h2>{mode === 'login' ? 'خوش آمدید' : 'ایجاد حساب کاربری'}</h2>
                <p>{mode === 'login' ? 'برای ادامه، اطلاعات حساب خود را وارد کنید.' : 'اطلاعات هویتی خود را برای ثبت‌نام وارد کنید.'}</p>
              </div>
              {mode === 'login' ? (
                <div className="auth-form-fields">
                  <div className="auth-role-list" aria-label="نقش‌های پشتیبانی‌شده"><span>دبیر رویداد</span><span>مدرس</span><span className="active">شرکت‌کننده</span></div>
                  <Label className="auth-field"><span>ایمیل</span><Input name="email" type="email" required autoComplete="email" placeholder="name@example.com" /></Label>
                  <Label className="auth-field"><span>گذرواژه</span><Input name="password" type="password" required minLength={8} autoComplete="current-password" placeholder="گذرواژه خود را وارد کنید" /></Label>
                  <div className="auth-login-options"><Button type="button" variant="link" size="sm" disabled>فراموشی گذرواژه</Button><Label className="auth-remember"><Input name="remember" type="checkbox" defaultChecked /> <span>مرا به خاطر بسپار</span></Label></div>
                </div>
              ) : (
                <div className="auth-form-fields">
                  <p className="auth-account-type">حساب‌های جدید با نقش شرکت‌کننده ایجاد می‌شوند؛ نقش‌های دیگر توسط مدیر سامانه فعال می‌شوند.</p>
                  <div className="auth-register-grid">
                    <Label className="auth-field"><span>نام و نام خانوادگی</span><Input name="name" required minLength={2} placeholder="مثال: محمد شریفی" /></Label>
                    <Label className="auth-field"><span>شماره همراه</span><Input name="phone" type="tel" inputMode="tel" required placeholder="۰۹۱۲۱۲۳۴۵۶۷" /></Label>
                    <Label className="auth-field"><span>ایمیل</span><Input name="email" type="email" required autoComplete="email" placeholder="name@example.com" /></Label>
                    <Label className="auth-field"><span>کد ملی</span><Input name="national_code" inputMode="numeric" required placeholder="۱۰ رقم" /></Label>
                    <Label className="auth-field"><span>گذرواژه</span><Input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="حداقل ۸ کاراکتر" /></Label>
                    <Label className="auth-field"><span>تکرار گذرواژه</span><Input name="password_confirmation" type="password" required minLength={8} autoComplete="new-password" placeholder="تکرار گذرواژه" /></Label>
                  </div>
                  <Label className="auth-field"><span>دانشگاه یا سازمان <small>اختیاری</small></span><Input name="organization" placeholder="نام دانشگاه یا سازمان" /></Label>
                </div>
              )}
              {message && <Alert variant="destructive" className="auth-alert"><CircleAlert size={16} /><AlertTitle>انجام نشد</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>}
              <Button className="auth-submit" size="lg" disabled={busy}>{busy ? 'لطفاً صبر کنید…' : mode === 'login' ? 'ورود به سامانه' : 'ثبت‌نام و ورود'}</Button>
              <div className="auth-divider"><span /> <small>یا</small> <span /></div>
              <div className="auth-switch"><span>{mode === 'login' ? 'حساب کاربری ندارید؟' : 'قبلاً ثبت‌نام کرده‌اید؟'}</span><Button type="button" variant="link" size="sm" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'ایجاد حساب کاربری' : 'ورود به حساب'}</Button></div>
            </form>
          </CardContent>
        </Card>
        <div className="auth-security">ارتباط شما با سامانه رمزنگاری و محافظت می‌شود</div>
      </section>
    </main>
  )
}

const iconForTone: Record<Metric['tone'], LucideIcon> = { blue: Users, green: ClipboardCheck, amber: CalendarDays, violet: Award }

function DashboardPage({ user }: { user: User }) {
  const { data, loading, error, reload } = useData<Dashboard>('/dashboard')
  if (loading) return <Loading />
  if (error) return <Empty title="دریافت داشبورد ممکن نشد" detail={error} />
  const metrics = data?.metrics ?? []
  return <><PageHeader title="نمای کلی" subtitle={`خوش آمدید، ${user.name}`}><Button variant="outline" onClick={() => void reload()}><RefreshCw size={16} /> بروزرسانی</Button></PageHeader>{metrics.length === 0 ? <Empty title="هنوز داده‌ای ثبت نشده است" detail={user.role === 'admin' || user.role === 'organizer' ? 'از بخش رویدادها اولین رویداد واقعی خود را ایجاد کنید.' : 'هنوز رویداد یا ثبت‌نامی برای حساب شما وجود ندارد.'} /> : <><section className="metric-grid">{metrics.map((metric) => { const Icon = iconForTone[metric.tone]; return <Card className={`metric-card ${metric.tone}`} key={metric.label}><CardContent><div className="metric-icon"><Icon size={20} /></div><p>{metric.label}</p><strong>{number(metric.value)}{metric.label.includes('ظرفیت') ? '٪' : ''}</strong><span>{metric.detail}</span></CardContent></Card> })}</section>{data?.event && <Card className="panel dashboard-event"><CardContent className="flex items-center justify-between"><div><Badge className="status published">{data.event.status === 'published' ? 'منتشرشده' : data.event.status}</Badge><h2>{data.event.title}</h2><p>{data.event.location ?? 'مکان ثبت نشده'} · {date(data.event.starts_at)}</p></div><CalendarDays size={38} /></CardContent></Card>}{(data?.sessions?.length ?? 0) > 0 && <Card className="panel"><CardContent><div className="panel-heading"><div><h2>نشست‌ها</h2><p>برنامه‌های ثبت‌شده در سامانه</p></div></div><div className="list">{data?.sessions?.map((session) => <div className="row" key={session.id}><div><b>{session.title}</b><span>{sessionType(session.type)} · {session.room ?? 'بدون سالن'}</span></div><div className="row-meta">{number(session.registered_count)} از {number(session.capacity)} نفر</div></div>)}</div></CardContent></Card>}</>}</>
}

function EventForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setMessage(''); try { await api('/events', { method: 'POST', body: JSON.stringify(Object.fromEntries(form.entries())) }); await onCreated(); setOpen(false); event.currentTarget.reset() } catch (reason) { setMessage(getError(reason)) } finally { setBusy(false) } }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus size={17} /> ایجاد رویداد</Button></DialogTrigger><DialogContent className="max-w-3xl" dir="rtl"><DialogHeader><DialogTitle>رویداد جدید</DialogTitle><DialogDescription>جزئیات اولیهٔ رویداد را با دادهٔ واقعی ثبت کنید.</DialogDescription></DialogHeader><form className="inline-form mt-0 border-0 bg-transparent p-0" onSubmit={submit}><Label>عنوان<Input name="title" required /></Label><Label>مکان<Input name="location" /></Label><Label>شروع<Input name="starts_at" type="datetime-local" required /></Label><Label>پایان<Input name="ends_at" type="datetime-local" required /></Label><Label>ظرفیت<Input name="capacity" type="number" min="1" required /></Label><Label>وضعیت<select name="status" defaultValue="draft"><option value="draft">پیش‌نویس</option><option value="published">منتشرشده</option><option value="archived">بایگانی</option></select></Label><Label className="wide">توضیحات<textarea name="description" rows={3} /></Label>{message && <Alert variant="destructive" className="wide"><CircleAlert size={16} /><AlertDescription>{message}</AlertDescription></Alert>}<div className="form-buttons wide"><Button type="button" variant="outline" onClick={() => setOpen(false)}>انصراف</Button><Button disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره رویداد'}</Button></div></form></DialogContent></Dialog>
}

function SessionForm({ eventId, onCreated }: { eventId: number; onCreated: () => Promise<void> }) {
  const { data: users } = useData<User[]>('/users')
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const body: Record<string, unknown> = Object.fromEntries(form.entries()); body.attendance_required = true; setBusy(true); setMessage(''); try { await api(`/events/${eventId}/sessions`, { method: 'POST', body: JSON.stringify(body) }); await onCreated(); setOpen(false); event.currentTarget.reset() } catch (reason) { setMessage(getError(reason)) } finally { setBusy(false) } }
  return <div>{!open ? <button className="text-button" onClick={() => setOpen(true)}><Plus size={15} /> افزودن نشست</button> : <form className="inline-form compact-form" onSubmit={submit}><h3>نشست جدید</h3><label>عنوان<input name="title" required /></label><label>نوع<select name="type"><option value="session">نشست</option><option value="workshop">کارگاه</option><option value="keynote">سخنرانی</option><option value="panel">پنل</option><option value="networking">شبکه‌سازی</option></select></label><label>مدرس حساب‌دار<select name="instructor_id" defaultValue=""><option value="">بدون حساب مدرس</option>{users?.filter((item) => item.role === 'instructor').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>نام مدرس<input name="instructor_name" placeholder="برای نمایش عمومی" /></label><label>سالن<input name="room" /></label><label>شروع<input name="starts_at" type="datetime-local" required /></label><label>پایان<input name="ends_at" type="datetime-local" required /></label><label>ظرفیت<input name="capacity" type="number" min="1" required /></label>{message && <p className="form-error"><CircleAlert size={16} />{message}</p>}<div className="form-buttons"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>انصراف</button><button className="primary-button" disabled={busy}>ذخیره</button></div></form>}</div>
}

function EventsPage({ user }: { user: User }) {
  const { data, loading, error, reload } = useData<EventRecord[]>('/events')
  const [message, setMessage] = useState('')
  const staff = user.role === 'admin' || user.role === 'organizer'
  async function register(eventId: number, sessionId?: number) { setMessage(''); try { await api('/registrations', { method: 'POST', body: JSON.stringify({ event_id: eventId, ...(sessionId ? { event_session_id: sessionId } : {}) }) }); setMessage('ثبت‌نام با موفقیت انجام شد.') } catch (reason) { setMessage(getError(reason)) } }
  return <><PageHeader title="رویدادها و نشست‌ها" subtitle={staff ? 'ایجاد، انتشار و برنامه‌ریزی رویدادهای واقعی' : 'رویدادهای منتشرشده و امکان ثبت‌نام'}>{staff && <EventForm onCreated={reload} />}<Button variant="outline" size="icon" onClick={() => void reload()}><RefreshCw size={16} /></Button></PageHeader>{message && <Alert variant={message.includes('موفقیت') ? 'default' : 'destructive'} className="mb-4"><AlertDescription>{message}</AlertDescription></Alert>}{loading ? <Loading /> : error ? <Empty title="فهرست رویدادها در دسترس نیست" detail={error} /> : data?.length === 0 ? <Empty title="رویدادی وجود ندارد" detail={staff ? 'با «ایجاد رویداد» اولین رویداد را بسازید.' : 'دبیرخانه هنوز رویدادی منتشر نکرده است.'} /> : <div className="event-grid">{data?.map((event) => <Card className="event-card" key={event.id}><CardContent><div className="event-card-top"><Badge variant="secondary" className={`status ${event.status}`}>{event.status === 'published' ? 'منتشرشده' : event.status === 'draft' ? 'پیش‌نویس' : 'بایگانی'}</Badge><span>{date(event.starts_at)}</span></div><h2>{event.title}</h2><p>{event.description || 'توضیحی ثبت نشده است.'}</p><div className="event-details"><span><Building2 size={15} /> {event.location ?? 'بدون مکان'}</span><span><Users size={15} /> {number(event.primary_registrations_count ?? 0)} از {number(event.capacity)}</span></div>{!staff && <Button className="mt-3 w-full" disabled={event.status !== 'published'} onClick={() => void register(event.id)}>ثبت‌نام در رویداد</Button>}{staff && <SessionForm eventId={event.id} onCreated={reload} />}<div className="session-list">{event.sessions.map((session) => <div className="session-row" key={session.id}><div><b>{session.title}</b><span>{sessionType(session.type)} · {session.instructor?.name ?? session.instructor_name ?? 'مدرس تعیین نشده'}</span></div><div>{!staff && <Button size="xs" variant="outline" onClick={() => void register(event.id, session.id)}>انتخاب نشست</Button>}<small>{number(session.registered_count)}/{number(session.capacity)}</small></div></div>)}</div></CardContent></Card>)}</div>}</>
}

function RegistrationsPage({ user }: { user: User }) {
  const { data, loading, error, reload } = useData<Registration[]>('/registrations')
  const staff = user.role === 'admin' || user.role === 'organizer'
  return <><PageHeader title={staff ? 'شرکت‌کنندگان و ثبت‌نام‌ها' : 'ثبت‌نام‌های من'} subtitle={staff ? 'فهرست ثبت‌نام‌های ثبت‌شده در سامانه' : 'کد ورود و وضعیت حضور خود را پیگیری کنید.'}><button className="secondary-button" onClick={() => void reload()}><RefreshCw size={16} /></button></PageHeader>{loading ? <Loading /> : error ? <Empty title="اطلاعات در دسترس نیست" detail={error} /> : data?.length === 0 ? <Empty title="ثبت‌نامی وجود ندارد" detail="پس از انتخاب رویداد، رکورد ثبت‌نام اینجا نمایش داده می‌شود." /> : <div className="panel table-wrap"><table><thead><tr>{staff && <th>شرکت‌کننده</th>}<th>رویداد</th><th>نشست</th><th>کد ورود</th><th>حضور</th></tr></thead><tbody>{data?.map((item) => <tr key={item.id}>{staff && <td>{item.user?.name}<small>{item.user?.email}</small></td>}<td>{item.event.title}</td><td>{item.session?.title ?? 'ثبت‌نام اصلی رویداد'}</td><td className="mono">{item.registration_code}</td><td><span className={`status ${item.attendance_status === 'attended' ? 'published' : 'draft'}`}>{item.attendance_status === 'attended' ? 'حاضر' : 'ثبت نشده'}</span></td></tr>)}</tbody></table></div>}</>
}

function VoucherIssueForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const { data: users } = useData<User[]>('/users')
  const { data: events } = useData<EventRecord[]>('/events')
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  const [eventId, setEventId] = useState('')
  const currentEvent = events?.find((event) => event.id === Number(eventId))
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { await api('/vouchers', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) }); await onCreated(); setOpen(false); event.currentTarget.reset() } catch (reason) { setMessage(getError(reason)) } finally { setBusy(false) } }
  if (!open) return <button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> صدور بن</button>
  return <form className="inline-form issue-form" onSubmit={submit}><h3>صدور بن جدید</h3><label>شرکت‌کننده<select name="user_id" required defaultValue=""><option value="" disabled>انتخاب کاربر</option>{users?.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.email}</option>)}</select></label><label>رویداد<select name="event_id" required value={eventId} onChange={(event) => setEventId(event.target.value)}><option value="" disabled>انتخاب رویداد</option>{events?.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>نشست<select name="event_session_id" defaultValue=""><option value="">بدون نشست</option>{currentEvent?.sessions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>نوع<select name="type"><option value="food">پذیرایی</option><option value="workshop">کارگاه</option><option value="service">خدمت</option><option value="gift">هدیه</option></select></label><label>عنوان بن<input name="title" required placeholder="مثال: پذیرایی روز اول" /></label>{message && <p className="form-error wide"><CircleAlert size={16} />{message}</p>}<div className="form-buttons wide"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>انصراف</button><button className="primary-button" disabled={busy}>{busy ? 'در حال صدور…' : 'صدور بن'}</button></div></form>
}

function CertificateIssueForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const { data: users } = useData<User[]>('/users')
  const { data: events } = useData<EventRecord[]>('/events')
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  const [eventId, setEventId] = useState('')
  const currentEvent = events?.find((event) => event.id === Number(eventId))
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { await api('/certificates', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) }); await onCreated(); setOpen(false); event.currentTarget.reset() } catch (reason) { setMessage(getError(reason)) } finally { setBusy(false) } }
  if (!open) return <button className="primary-button" onClick={() => setOpen(true)}><Plus size={17} /> صدور گواهی</button>
  return <form className="inline-form issue-form" onSubmit={submit}><h3>صدور گواهی جدید</h3><label>شرکت‌کننده<select name="user_id" required defaultValue=""><option value="" disabled>انتخاب کاربر</option>{users?.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.email}</option>)}</select></label><label>رویداد<select name="event_id" required value={eventId} onChange={(event) => setEventId(event.target.value)}><option value="" disabled>انتخاب رویداد</option>{events?.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>نشست<select name="event_session_id" defaultValue=""><option value="">بدون نشست</option>{currentEvent?.sessions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>نوع<select name="type"><option value="attendance">حضور</option><option value="workshop">کارگاه</option><option value="presentation">ارائه</option><option value="speaker">سخنرانی</option></select></label><label>وضعیت<select name="status"><option value="pending">در انتظار</option><option value="issued">صادرشده</option></select></label>{message && <p className="form-error wide"><CircleAlert size={16} />{message}</p>}<div className="form-buttons wide"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>انصراف</button><button className="primary-button" disabled={busy}>{busy ? 'در حال صدور…' : 'صدور گواهی'}</button></div></form>
}

function VouchersPage({ user }: { user: User }) {
  const { data, loading, error, reload } = useData<Voucher[]>('/vouchers')
  const staff = user.role === 'admin' || user.role === 'organizer'
  const [code, setCode] = useState(''); const [message, setMessage] = useState('')
  async function redeem(event: FormEvent) { event.preventDefault(); setMessage(''); try { await api('/vouchers/redeem', { method: 'POST', body: JSON.stringify({ code }) }); setCode(''); setMessage('بن با موفقیت مصرف شد.'); await reload() } catch (reason) { setMessage(getError(reason)) } }
  return <><PageHeader title="بن‌ها و خدمات" subtitle={staff ? 'صدور، مصرف و پیگیری بن‌های تخصیص‌یافته' : 'بن‌های تخصیص‌یافته به حساب شما'}>{staff && <VoucherIssueForm onCreated={reload} />} {staff && <form className="redeem" onSubmit={redeem}><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="کد بن" required /><button className="primary-button">مصرف بن</button></form>}<button className="secondary-button" onClick={() => void reload()}><RefreshCw size={16} /></button></PageHeader>{message && <p className={message.includes('موفقیت') ? 'notice success' : 'notice error'}>{message}</p>}{loading ? <Loading /> : error ? <Empty title="بن‌ها در دسترس نیستند" detail={error} /> : data?.length === 0 ? <Empty title="بنی صادر نشده است" detail={staff ? 'برای صدور بن، ابتدا شرکت‌کننده و رویداد ثبت کنید.' : 'هر بن پس از تخصیص دبیرخانه در این بخش ظاهر می‌شود.'} /> : <div className="cards">{data?.map((voucher) => <article className="voucher-card" key={voucher.id}><Ticket size={23} /><div><span>{voucher.type}</span><h3>{voucher.title}</h3><p>{voucher.event.title}</p><code>{voucher.code}</code></div><b className={voucher.status === 'active' ? 'active-state' : ''}>{voucher.status === 'active' ? 'فعال' : 'مصرف‌شده'}</b></article>)}</div>}</>
}

function CertificatesPage({ user }: { user: User }) {
  const { data, loading, error, reload } = useData<Certificate[]>('/certificates')
  const staff = user.role === 'admin' || user.role === 'organizer'
  return <><PageHeader title="مرکز گواهی‌ها" subtitle={staff ? 'صدور و وضعیت گواهی‌های رویداد' : 'گواهی‌های صادرشده و در حال صدور شما'}>{staff && <CertificateIssueForm onCreated={reload} />}<button className="secondary-button" onClick={() => void reload()}><RefreshCw size={16} /></button></PageHeader>{loading ? <Loading /> : error ? <Empty title="گواهی‌ها در دسترس نیستند" detail={error} /> : data?.length === 0 ? <Empty title="گواهی‌ای وجود ندارد" detail={staff ? 'پس از برگزاری رویداد می‌توانید گواهی صادر کنید.' : 'گواهی‌های صادرشده توسط دبیرخانه اینجا قرار می‌گیرند.'} /> : <div className="cards">{data?.map((certificate) => <article className="certificate-card" key={certificate.id}><Award size={25} /><div><span>{certificate.type}</span><h3>{certificate.event.title}</h3><p>{staff ? certificate.user?.name : certificate.session?.title ?? 'گواهی رویداد'}</p><code>{certificate.serial_number}</code></div><b className={certificate.status === 'issued' ? 'active-state' : ''}>{certificate.status === 'issued' ? 'صادرشده' : certificate.status === 'revoked' ? 'باطل‌شده' : 'در انتظار'}</b></article>)}</div>}</>
}

function AttendancePage() {
  const { data, loading, error, reload } = useData<Registration[]>('/attendance')
  const [code, setCode] = useState(''); const [message, setMessage] = useState('')
  async function submit(event: FormEvent) { event.preventDefault(); setMessage(''); try { const response = await api<{ message: string }>('/attendance', { method: 'POST', body: JSON.stringify({ registration_code: code }) }); setMessage(response.message); setCode(''); await reload() } catch (reason) { setMessage(getError(reason)) } }
  return <><PageHeader title="حضور و غیاب" subtitle="کد ورود شرکت‌کننده را وارد یا اسکن کنید."><form className="redeem" onSubmit={submit}><QrCode size={19} /><input value={code} onChange={(event) => setCode(event.target.value)} placeholder="EVT-…" required /><button className="primary-button">ثبت حضور</button></form></PageHeader>{message && <p className={message.includes('موفقیت') ? 'notice success' : 'notice error'}>{message}</p>}{loading ? <Loading /> : error ? <Empty title="سوابق حضور در دسترس نیست" detail={error} /> : <div className="panel table-wrap"><table><thead><tr><th>شرکت‌کننده</th><th>رویداد</th><th>کد ورود</th><th>زمان ثبت</th></tr></thead><tbody>{data?.map((item) => <tr key={item.id}><td>{item.user?.name}</td><td>{item.event.title}</td><td className="mono">{item.registration_code}</td><td>{date(item.checked_in_at)}</td></tr>)}</tbody></table>{data?.length === 0 && <Empty title="هنوز حضوری ثبت نشده است" detail="پس از ثبت ورود، سوابق در همین جدول دیده می‌شوند." />}</div>}</>
}

function PeoplePage({ user }: { user: User }) {
  const { data, loading, error, reload } = useData<User[]>('/users')
  const canManage = user.role === 'admin'
  async function changeRole(id: number, role: Role) { try { await api(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }); await reload() } catch (reason) { window.alert(getError(reason)) } }
  return <><PageHeader title="کاربران سامانه" subtitle="شرکت‌کنندگان، مدرس‌ها و اعضای دبیرخانه"><button className="secondary-button" onClick={() => void reload()}><RefreshCw size={16} /></button></PageHeader>{loading ? <Loading /> : error ? <Empty title="کاربران در دسترس نیستند" detail={error} /> : data?.length === 0 ? <Empty title="کاربری ثبت‌نام نکرده است" detail="ثبت‌نام کاربران در صفحه ورود انجام می‌شود." /> : <div className="panel table-wrap"><table><thead><tr><th>نام</th><th>ایمیل</th><th>نقش</th><th>رویدادها</th></tr></thead><tbody>{data?.map((person) => <tr key={person.id}><td>{person.name}</td><td>{person.email}</td><td>{canManage ? <select value={person.role} onChange={(event) => void changeRole(person.id, event.target.value as Role)}>{(['participant', 'instructor', 'organizer', 'admin'] as Role[]).map((role) => <option key={role} value={role}>{roleTitle(role)}</option>)}</select> : roleTitle(person.role)}</td><td>{number(person.event_registrations_count ?? 0)}</td></tr>)}</tbody></table></div>}</>
}

function ReportsPage() {
  const { data, loading, error, reload } = useData<Report>('/reports')
  return <><PageHeader title="گزارش‌ها" subtitle="آمار واقعی ثبت‌شده در پایگاه‌داده"><button className="secondary-button" onClick={() => void reload()}><RefreshCw size={16} /></button></PageHeader>{loading ? <Loading /> : error ? <Empty title="گزارش در دسترس نیست" detail={error} /> : <><section className="metric-grid report-metrics">{Object.entries(data?.totals ?? {}).map(([label, value]) => <article className="metric-card blue" key={label}><p>{({ events: 'رویدادها', registrations: 'ثبت‌نام‌ها', attendance: 'حضورها', vouchers: 'بن‌ها', redeemed_vouchers: 'بن مصرف‌شده', certificates: 'گواهی‌ها' } as Record<string, string>)[label]}</p><strong>{number(value)}</strong></article>)}</section>{data?.events.length === 0 ? <Empty title="داده‌ای برای گزارش نیست" detail="پس از ایجاد رویداد و ثبت فعالیت، گزارش‌ها به‌روزرسانی می‌شوند." /> : <div className="panel table-wrap"><table><thead><tr><th>رویداد</th><th>ثبت‌نام</th><th>حضور</th><th>بن مصرف‌شده</th><th>گواهی</th></tr></thead><tbody>{data?.events.map((event) => <tr key={event.id}><td>{event.title}</td><td>{number(event.registrations_count)}</td><td>{number(event.attendance_count)}</td><td>{number(event.redeemed_vouchers_count)}/{number(event.vouchers_count)}</td><td>{number(event.certificates_count)}</td></tr>)}</tbody></table></div>}</>}</>
}

function ProfilePage({ user, onUpdated }: { user: User; onUpdated: (user: User) => void }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setMessage(''); try { const updated = await api<User>('/profile', { method: 'PUT', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())) }); onUpdated(updated); setMessage('اطلاعات با موفقیت ذخیره شد.') } catch (reason) { setMessage(getError(reason)) } finally { setBusy(false) } }
  return <><PageHeader title="حساب کاربری" subtitle="اطلاعات شخصی و نقش فعلی شما" /><form className="panel profile-form" onSubmit={submit}><div className="role-pill"><ShieldCheck size={18} /> {roleTitle(user.role)}</div><label>نام و نام خانوادگی<input name="name" defaultValue={user.name} required /></label><label>ایمیل<input value={user.email} disabled /></label><label>شماره همراه<input name="phone" defaultValue={user.phone ?? ''} /></label><label>دانشگاه یا سازمان<input name="organization" defaultValue={user.organization ?? ''} /></label>{message && <p className={message.includes('موفقیت') ? 'notice success wide' : 'notice error wide'}>{message}</p>}<button className="primary-button" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره تغییرات'}</button></form></>
}

type Page = 'dashboard' | 'events' | 'registrations' | 'people' | 'vouchers' | 'attendance' | 'certificates' | 'reports' | 'profile'
const navigation: Array<{ page: Page; label: string; icon: LucideIcon; staff?: boolean }> = [
  { page: 'dashboard', label: 'نمای کلی', icon: LayoutDashboard }, { page: 'events', label: 'رویدادها و نشست‌ها', icon: CalendarDays }, { page: 'registrations', label: 'ثبت‌نام‌ها', icon: ClipboardCheck }, { page: 'people', label: 'کاربران', icon: Users, staff: true }, { page: 'vouchers', label: 'بن‌ها و خدمات', icon: Ticket }, { page: 'attendance', label: 'حضور و غیاب', icon: ScanLine, staff: true }, { page: 'certificates', label: 'گواهی‌ها', icon: BadgeCheck }, { page: 'reports', label: 'گزارش‌ها', icon: ChartNoAxesCombined, staff: true }, { page: 'profile', label: 'حساب کاربری', icon: UserRound },
]

function Shell({ session, onSessionChange }: { session: Session; onSessionChange: (session: Session | null) => void }) {
  const [page, setPage] = useState<Page>(() => (location.hash.slice(1) as Page) || 'dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const staff = session.user.role === 'admin' || session.user.role === 'organizer'
  useEffect(() => { const update = () => setPage((location.hash.slice(1) as Page) || 'dashboard'); addEventListener('hashchange', update); return () => removeEventListener('hashchange', update) }, [])
  function navigate(next: Page) { location.hash = next; setPage(next); setMobileOpen(false) }
  async function logout() { try { await api('/auth/logout', { method: 'POST' }) } finally { localStorage.removeItem('eventhub_token'); sessionStorage.removeItem('eventhub_token'); onSessionChange(null) } }
  const current = useMemo(() => { const props = { user: session.user }; if (page === 'events') return <EventsPage {...props} />; if (page === 'registrations') return <RegistrationsPage {...props} />; if (page === 'people' && staff) return <PeoplePage {...props} />; if (page === 'vouchers') return <VouchersPage {...props} />; if (page === 'attendance' && staff) return <AttendancePage />; if (page === 'certificates') return <CertificatesPage {...props} />; if (page === 'reports' && staff) return <ReportsPage />; if (page === 'profile') return <ProfilePage user={session.user} onUpdated={(user) => onSessionChange({ ...session, user })} />; return <DashboardPage {...props} /> }, [page, session, staff, onSessionChange])
  return <main className="app-shell"><Button variant="outline" size="icon" className="mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="باز کردن منو"><Menu size={21} /></Button><aside className={`sidebar ${mobileOpen ? 'open' : ''}`}><div className="brand"><div className="brand-mark"><Sparkles size={21} /></div><div><strong>فَرا رویداد</strong><span>مدیریت رویداد علمی</span></div></div><div className="profile-card"><Avatar className="profile-avatar"><AvatarFallback>{session.user.name.slice(0, 1)}</AvatarFallback></Avatar><div><b>{session.user.name}</b><span>{roleTitle(session.user.role)}</span></div></div><nav>{navigation.filter((item) => !item.staff || staff).map(({ page: target, label, icon: Icon }) => <Button key={target} variant={page === target ? 'secondary' : 'ghost'} className={`nav-item ${page === target ? 'active' : ''}`} onClick={() => navigate(target)}><Icon size={18} />{label}</Button>)}</nav><Button variant="ghost" className="logout" onClick={() => void logout()}><LogOut size={18} /> خروج از حساب</Button></aside><section className="workspace"><header className="topbar"><span className="topbar-title">{navigation.find((item) => item.page === page)?.label ?? 'نمای کلی'}</span><span className="topbar-user"><UserRound size={17} /> {session.user.name}</span></header><div className="content">{current}</div></section></main>
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  useEffect(() => { const token = getStoredToken(); if (!token) { setChecking(false); return } api<User>('/profile').then((user) => setSession({ token, user })).catch(() => { localStorage.removeItem('eventhub_token'); sessionStorage.removeItem('eventhub_token') }).finally(() => setChecking(false)) }, [])
  if (checking) return <main className="auth-screen"><Loading /></main>
  return session ? <Shell session={session} onSessionChange={setSession} /> : <AuthScreen onAuthenticated={setSession} />
}
