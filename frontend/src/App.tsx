import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowUpLeft,
  Award,
  BadgeCheck,
  Bell,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  LayoutDashboard,
  MoreHorizontal,
  Presentation,
  QrCode,
  ScanLine,
  Sparkles,
  Ticket,
  UserRound,
  Users,
} from 'lucide-react'

type Tone = 'blue' | 'green' | 'amber' | 'violet'

type Metric = { label: string; value: number; detail: string; tone: Tone }
type Session = {
  id: number
  title: string
  type: string
  instructor_name: string | null
  room: string | null
  starts_at: string
  ends_at: string
  capacity: number
  registered_count: number
}
type Voucher = { id: number; title: string; type: string; code: string; status: string }
type Certificate = { id: number; type: string; serial_number: string; status: string }
type DashboardData = {
  event: { title: string; location: string; starts_at: string; ends_at: string }
  metrics: Metric[]
  sessions: Session[]
  vouchers: Voucher[]
  certificates: Certificate[]
  notices: { title: string; body: string; tone: Tone }[]
}

const sampleDashboard: DashboardData = {
  event: {
    title: 'همایش ملی آینده علم و فناوری',
    location: 'مرکز همایش‌های دانشگاه تهران',
    starts_at: '2026-10-15T08:30:00',
    ends_at: '2026-10-16T18:00:00',
  },
  metrics: [
    { label: 'ثبت‌نام کل', value: 316, detail: 'نفر ثبت‌نام‌شده', tone: 'blue' },
    { label: 'حضور تأییدشده', value: 194, detail: 'نفر در محل رویداد', tone: 'green' },
    { label: 'ظرفیت کارگاه‌ها', value: 79, detail: '267 از 338 صندلی', tone: 'amber' },
    { label: 'بن‌های مصرف‌شده', value: 128, detail: 'از 316 بن فعال', tone: 'violet' },
  ],
  sessions: [
    { id: 1, title: 'افتتاحیه و سخنرانی کلیدی', type: 'keynote', instructor_name: 'دکتر نادر فرهمند', room: 'سالن اصلی', starts_at: '2026-10-15T09:00:00', ends_at: '2026-10-15T10:30:00', capacity: 420, registered_count: 316 },
    { id: 2, title: 'کارگاه کاربردهای هوش مصنوعی', type: 'workshop', instructor_name: 'دکتر لیلا رستگار', room: 'تالار نوآوری', starts_at: '2026-10-15T11:00:00', ends_at: '2026-10-15T13:00:00', capacity: 80, registered_count: 63 },
    { id: 3, title: 'پنل داده و سیاست‌گذاری علمی', type: 'panel', instructor_name: 'دکتر پیمان کیانی', room: 'سالن ابن‌سینا', starts_at: '2026-10-15T14:00:00', ends_at: '2026-10-15T15:30:00', capacity: 150, registered_count: 118 },
  ],
  vouchers: [
    { id: 1, title: 'بن پذیرایی روز اول', type: 'food', code: 'FOOD-1405-01', status: 'redeemed' },
    { id: 2, title: 'بن پذیرایی روز دوم', type: 'food', code: 'FOOD-1405-02', status: 'active' },
    { id: 3, title: 'ورود به کارگاه هوش مصنوعی', type: 'workshop', code: 'WS-AI-1405', status: 'active' },
  ],
  certificates: [
    { id: 1, type: 'حضور در رویداد', serial_number: 'CERT-AT-1405-0001', status: 'issued' },
  ],
  notices: [
    { title: 'آماده‌سازی گواهی‌ها', body: 'گواهی شرکت پس از ثبت حضور برای شرکت‌کنندگان صادر می‌شود.', tone: 'blue' },
    { title: 'درگاه حضور و غیاب فعال است', body: 'کد ورود شرکت‌کنندگان را در پنل حضور و غیاب اسکن کنید.', tone: 'green' },
  ],
}

const navigation: { label: string; icon: LucideIcon }[] = [
  { label: 'نمای کلی', icon: LayoutDashboard },
  { label: 'رویدادها و نشست‌ها', icon: CalendarDays },
  { label: 'شرکت‌کنندگان', icon: Users },
  { label: 'بن‌ها و خدمات', icon: Ticket },
  { label: 'حضور و غیاب', icon: ScanLine },
  { label: 'گواهی‌ها', icon: BadgeCheck },
  { label: 'گزارش‌ها', icon: ChartNoAxesCombined },
]

const metricIcons: Record<Tone, LucideIcon> = {
  blue: Users,
  green: CheckCircle2,
  amber: Presentation,
  violet: Ticket,
}

function number(value: number): string {
  return new Intl.NumberFormat('fa-IR').format(value)
}

function time(value: string): string {
  return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function sessionKind(type: string): string {
  return ({ keynote: 'سخنرانی', workshop: 'کارگاه', panel: 'پنل', networking: 'شبکه‌سازی' })[type] ?? 'نشست'
}

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardData>(sampleDashboard)
  const [activePage, setActivePage] = useState('نمای کلی')
  const [status, setStatus] = useState('در حال بارگذاری اطلاعات رویداد')

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/dashboard', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable')
        return response.json() as Promise<DashboardData>
      })
      .then((data) => {
        setDashboard(data)
        setStatus('داده‌ها با سامانه رویداد همگام است')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setStatus('نمایش نسخهٔ نمایشی تا راه‌اندازی API')
      })

    return () => controller.abort()
  }, [])

  const notify = (message: string) => setStatus(message)

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Sparkles size={21} strokeWidth={2.4} /></div>
          <div><strong>فَرا رویداد</strong><span>مدیریت رویداد علمی</span></div>
        </div>

        <div className="event-switcher">
          <div className="event-avatar">ع</div>
          <div><b>همایش آینده علم</b><span>رویداد فعال</span></div>
          <ChevronDown size={16} />
        </div>

        <nav aria-label="منوی اصلی">
          <p className="nav-caption">مدیریت رویداد</p>
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} type="button" className={`nav-item ${activePage === label ? 'active' : ''}`} onClick={() => { setActivePage(label); notify(`${label} انتخاب شد`) }}>
              <Icon size={19} /><span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button type="button" className="help-link" onClick={() => notify('مرکز راهنما به‌زودی در دسترس است')}><CircleHelp size={18} /> راهنما و پشتیبانی</button>
          <div className="profile">
            <div className="profile-avatar">س</div>
            <div><b>دکتر سارا فولادی</b><span>دبیر رویداد</span></div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><Sparkles size={18} /> فَرا رویداد</div>
          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="اعلان‌ها" onClick={() => notify('اعلان جدیدی ندارید')}><Bell size={20} /><i /></button>
            <div className="topbar-divider" />
            <div className="date-chip"><CalendarDays size={18} /> ۱۵ و ۱۶ مهر ۱۴۰۵</div>
          </div>
        </header>

        <div className="content">
          <section className="hero-row">
            <div>
              <p className="eyebrow">{activePage}</p>
              <h1>صبح بخیر، دکتر فولادی <span>👋</span></h1>
              <p className="subtitle">نمایی سریع از وضعیت «{dashboard.event.title}»</p>
            </div>
            <button type="button" className="primary-button" onClick={() => notify('فرم ایجاد نشست آماده است')}><CalendarDays size={19} /> ایجاد نشست جدید</button>
          </section>

          <div className="sync-line"><span className="live-dot" />{status}</div>

          <section className="metric-grid" aria-label="شاخص‌های کلیدی">
            {dashboard.metrics.map((metric) => {
              const Icon = metricIcons[metric.tone]
              return <article className={`metric-card ${metric.tone}`} key={metric.label}>
                <div className="metric-icon"><Icon size={22} /></div>
                <p>{metric.label}</p>
                <strong>{number(metric.value)}{metric.label === 'ظرفیت کارگاه‌ها' ? '٪' : ''}</strong>
                <span>{metric.detail}</span>
              </article>
            })}
          </section>

          <section className="main-grid">
            <article className="panel sessions-panel">
              <div className="panel-heading">
                <div><h2>نشست‌ها و کارگاه‌های پیش‌رو</h2><p>برنامهٔ رویداد و وضعیت ظرفیت</p></div>
                <button className="text-button" type="button" onClick={() => notify('فهرست کامل نشست‌ها باز شد')}>مشاهده همه <ArrowUpLeft size={16} /></button>
              </div>
              <div className="session-list">
                {dashboard.sessions.slice(0, 4).map((session) => {
                  const fill = Math.min(100, Math.round((session.registered_count / session.capacity) * 100))
                  return <div className="session-row" key={session.id}>
                    <div className="time-block"><b>{time(session.starts_at)}</b><span>{time(session.ends_at)}</span></div>
                    <div className="session-divider" />
                    <div className="session-info"><div><span className="session-tag">{sessionKind(session.type)}</span><h3>{session.title}</h3></div><p><UserRound size={14} /> {session.instructor_name ?? 'دبیرخانه رویداد'} <span>•</span> {session.room ?? 'تعیین نشده'}</p></div>
                    <div className="seat-info"><b>{number(session.registered_count)}<small> / {number(session.capacity)}</small></b><div className="progress"><i style={{ width: `${fill}%` }} /></div><span>ظرفیت تکمیل‌شده</span></div>
                  </div>
                })}
              </div>
            </article>

            <div className="side-stack">
              <article className="panel attendance-card">
                <div className="attendance-icon"><QrCode size={26} /></div>
                <div><span>عملیات سریع</span><h2>ثبت حضور شرکت‌کننده</h2><p>کد ورود یا QR را اسکن کنید.</p></div>
                <button type="button" onClick={() => notify('اسکنر حضور و غیاب فعال شد')}><ScanLine size={18} /> شروع اسکن</button>
              </article>

              <article className="panel voucher-panel">
                <div className="panel-heading compact"><div><h2>گردش بن هوشمند</h2><p>آخرین وضعیت بن‌های خدماتی</p></div><Ticket size={22} /></div>
                <div className="voucher-list">
                  {dashboard.vouchers.slice(0, 3).map((voucher) => <div key={voucher.id} className="voucher-row"><div className="voucher-icon"><Ticket size={17} /></div><div><b>{voucher.title}</b><span>{voucher.code}</span></div><em className={voucher.status === 'redeemed' ? 'redeemed' : ''}>{voucher.status === 'redeemed' ? 'مصرف شد' : 'فعال'}</em></div>)}
                </div>
              </article>
            </div>
          </section>

          <section className="bottom-grid">
            <article className="panel certificate-panel">
              <div className="panel-heading compact"><div><h2>مرکز گواهی‌ها</h2><p>صدور و پیگیری گواهی‌های رویداد</p></div><Award size={22} /></div>
              <div className="certificate-content"><div className="certificate-seal"><Award size={30} /></div><div><h3>{number(dashboard.certificates.length)} گواهی در جریان</h3><p>گواهی حضور، کارگاه، ارائه و سخنرانی به‌صورت خودکار مدیریت می‌شوند.</p></div><button type="button" className="outline-button" onClick={() => notify('فهرست گواهی‌ها باز شد')}><Download size={16} /> مرکز گواهی</button></div>
            </article>
            <article className="notices">
              {dashboard.notices.map((notice) => <div key={notice.title} className={`notice ${notice.tone}`}><Clock3 size={19} /><div><b>{notice.title}</b><p>{notice.body}</p></div></div>)}
            </article>
          </section>
        </div>
      </section>
    </main>
  )
}
