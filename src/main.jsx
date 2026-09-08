import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import './styles.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

const money = (value) =>
  new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const number = (value) =>
  new Intl.NumberFormat('ar-SA', {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))

const date = (value) =>
  value
    ? new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(value))
    : '—'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setError(`خطأ Supabase: ${error.message}`)
    }

    setLoading(false)
  }

  const sendRecovery = async () => {
    const cleanEmail = email.trim()

    if (!cleanEmail) {
      setError('اكتب البريد الإلكتروني أولًا.')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
    })

    if (error) {
      if (error.message?.toLowerCase().includes('rate limit')) {
        setError(
          'تم تجاوز حد إرسال رسائل الاستعادة مؤقتًا. انتظر قليلًا ثم حاول مرة واحدة.'
        )
      } else {
        setError(`تعذر إرسال رابط الاستعادة: ${error.message}`)
      }
    } else {
      setInfo('تم إرسال رابط الاستعادة إلى بريدك. افتح أحدث رسالة فقط.')
    }

    setLoading(false)
  }

  return (
    <main className="login-page">
      <section className="brand-area">
        <div className="logo">L</div>
        <div>
          <div className="eyebrow">LOVICA BEAUTY</div>
          <h1>لوحة التحليلات</h1>
          <p>المبيعات، العملاء، المنتجات والمرتجعات في مكان واحد.</p>
        </div>
      </section>

      <section className="login-card">
        <div className="eyebrow">دخول آمن</div>
        <h2>تسجيل الدخول</h2>
        <p className="muted">استخدم حسابك المعتمد في لوفيكا.</p>

        <form onSubmit={login}>
          <label>البريد الإلكتروني</label>

          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
          />

          <label>كلمة المرور</label>

          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          {error && <div className="error">{error}</div>}
          {info && <div className="info">{info}</div>}

          <button disabled={loading}>
            {loading ? 'جاري التنفيذ...' : 'دخول'}
          </button>

          <button
            type="button"
            onClick={sendRecovery}
            disabled={loading}
            style={{
              marginTop: 0,
              background: '#f3f1ed',
              color: '#222',
              border: '1px solid #e1ddd7',
            }}
          >
            نسيت كلمة المرور؟
          </button>
        </form>

        <div className="security">اتصال آمن عبر Supabase Auth</div>
      </section>
    </main>
  )
}

function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  const updatePassword = async (e) => {
    e.preventDefault()

    setError('')
    setInfo('')

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.')
      return
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setError(`تعذر تحديث كلمة المرور: ${error.message}`)
      setLoading(false)
      return
    }

    setInfo('تم تغيير كلمة المرور بنجاح. جاري إعادتك لتسجيل الدخول...')

    await supabase.auth.signOut()

    if (window.location.hash) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      )
    }

    setTimeout(() => {
      onDone()
    }, 900)
  }

  return (
    <main className="login-page">
      <section className="brand-area">
        <div className="logo">L</div>
        <div>
          <div className="eyebrow">LOVICA BEAUTY</div>
          <h1>تعيين كلمة مرور جديدة</h1>
          <p>اختر كلمة مرور جديدة لحسابك المعتمد في لوحة لوفيكا.</p>
        </div>
      </section>

      <section className="login-card">
        <div className="eyebrow">استعادة الحساب</div>
        <h2>كلمة المرور الجديدة</h2>
        <p className="muted">اكتب كلمة مرور جديدة ثم أكدها.</p>

        <form onSubmit={updatePassword}>
          <label>كلمة المرور الجديدة</label>

          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 أحرف على الأقل"
            required
          />

          <label>تأكيد كلمة المرور</label>

          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
            required
          />

          {error && <div className="error">{error}</div>}
          {info && <div className="info">{info}</div>}

          <button disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
          </button>
        </form>

        <div className="security">
          لن يتم حفظ كلمة المرور داخل GitHub أو Vercel.
        </div>
      </section>
    </main>
  )
}

function Overview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadOverview() {
      setLoading(true)
      setError('')

      const { data, error } = await supabase.rpc('dashboard_overview_v1')

      if (!active) return

      if (error) {
        setError(`تعذر تحميل المؤشرات: ${error.message}`)
        setLoading(false)
        return
      }

      setData(data?.[0] || null)
      setLoading(false)
    }

    loadOverview()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return (
      <section className="panel">
        جاري تحميل مؤشرات الداشبورد...
      </section>
    )
  }

  if (error) {
    return <section className="panel error">{error}</section>
  }

  if (!data) {
    return (
      <section className="panel">
        لا توجد بيانات متاحة حاليًا.
      </section>
    )
  }

  return (
    <>
      <section className="panel">
        <div className="eyebrow">OVERVIEW</div>
        <h2>ملخص المتجر</h2>
        <p className="muted">
          هذه الأرقام حاليًا مبنية على جميع الطلبات المستوردة. سنضيف لاحقًا
          تعريفًا محاسبيًا أدق للمبيعات حسب حالات الطلب والمرتجعات.
        </p>
      </section>

      <section className="cards">
        <div className="card">
          <span>إجمالي الطلبات</span>
          <strong>{number(data.total_orders)}</strong>
        </div>

        <div className="card">
          <span>إجمالي العملاء</span>
          <strong>{number(data.total_customers)}</strong>
        </div>

        <div className="card">
          <span>إجمالي قيمة الطلبات</span>
          <strong>{money(data.total_sales)}</strong>
        </div>

        <div className="card">
          <span>متوسط قيمة الطلب</span>
          <strong>{money(data.average_order_value)}</strong>
        </div>
      </section>

      <section className="cards">
        <div className="card">
          <span>إجمالي المسترجع</span>
          <strong>{money(data.total_refunded)}</strong>
        </div>

        <div className="card">
          <span>طلبات بها استرجاع</span>
          <strong>{number(data.refunded_orders)}</strong>
        </div>

        <div className="card">
          <span>أول طلب في البيانات</span>
          <strong>{date(data.first_order_at)}</strong>
        </div>

        <div className="card">
          <span>آخر طلب في البيانات</span>
          <strong>{date(data.last_order_at)}</strong>
        </div>
      </section>

      <section className="panel">
        <h2>حالة النسخة الحالية</h2>
        <div className="details">
          <div>
            <span>المصدر</span>
            <strong>Supabase</strong>
          </div>
          <div>
            <span>التحديث الحي من سلة</span>
            <strong>لم يُفعّل بعد</strong>
          </div>
          <div>
            <span>احتساب الربح التاريخي</span>
            <strong>بانتظار بيانات التكلفة</strong>
          </div>
        </div>
      </section>
    </>
  )
}

function CustomerSearch() {
  const [phone, setPhone] = useState('')
  const [customer, setCustomer] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const search = async (e) => {
    e.preventDefault()

    setLoading(true)
    setMessage('')
    setCustomer(null)

    const { data, error } = await supabase.rpc('search_customer_by_phone', {
      p_phone: phone.trim(),
    })

    if (error) {
      setMessage(`خطأ البحث: ${error.message}`)
    } else if (!data?.length) {
      setMessage('لم يتم العثور على عميل بهذا الرقم.')
    } else {
      setCustomer(data[0])
    }

    setLoading(false)
  }

  return (
    <>
      <section className="panel">
        <h2>بحث العملاء</h2>
        <p className="muted">ابحث باستخدام رقم جوال العميل.</p>

        <form className="search" onSubmit={search}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05XXXXXXXX"
            inputMode="tel"
            required
          />

          <button disabled={loading}>
            {loading ? 'جاري البحث...' : 'بحث'}
          </button>
        </form>

        {message && <div className="info">{message}</div>}
      </section>

      {customer && (
        <>
          <section className="panel customer">
            <div className="customer-icon">👤</div>

            <div>
              <h2>{customer.customer_name || 'عميل'}</h2>

              <div className="customer-details">
                <span>📱 {customer.mobile || '—'}</span>
                <span>✉️ {customer.email || '—'}</span>
                <span>📍 {customer.city || '—'}</span>
              </div>
            </div>
          </section>

          <section className="cards">
            <div className="card">
              <span>عدد الطلبات</span>
              <strong>{number(customer.total_orders)}</strong>
            </div>

            <div className="card">
              <span>إجمالي المشتريات</span>
              <strong>{money(customer.total_spent)}</strong>
            </div>

            <div className="card">
              <span>متوسط الطلب</span>
              <strong>{money(customer.average_order_value)}</strong>
            </div>

            <div className="card">
              <span>طلبات بها استرجاع</span>
              <strong>{number(customer.refunded_orders)}</strong>
            </div>
          </section>

          <section className="panel details">
            <div>
              <span>أول طلب</span>
              <strong>{date(customer.first_order_at)}</strong>
            </div>

            <div>
              <span>آخر طلب</span>
              <strong>{date(customer.last_order_at)}</strong>
            </div>

            <div>
              <span>إجمالي المسترجع</span>
              <strong>{money(customer.total_refunded)}</strong>
            </div>
          </section>
        </>
      )}
    </>
  )
}

function Dashboard({ profile }) {
  const [page, setPage] = useState('overview')

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const canSearchCustomers = ['owner', 'admin', 'customer_service'].includes(
    profile.role
  )

  const pageTitle = page === 'overview' ? 'الرئيسية' : 'بحث العملاء'

  return (
    <div className="dashboard">
      <aside>
        <div className="side-logo">
          <div className="logo small">L</div>

          <div>
            <strong>لوفيكا</strong>
            <span>Analytics</span>
          </div>
        </div>

        <nav style={{ display: 'grid', gap: 8 }}>
          <button
            type="button"
            onClick={() => setPage('overview')}
            className={page === 'overview' ? 'nav-active' : ''}
            style={{
              width: '100%',
              textAlign: 'right',
              background: page === 'overview' ? '#252525' : 'transparent',
              color: '#fff',
              padding: '13px',
            }}
          >
            ◫ الرئيسية
          </button>

          {canSearchCustomers && (
            <button
              type="button"
              onClick={() => setPage('customers')}
              className={page === 'customers' ? 'nav-active' : ''}
              style={{
                width: '100%',
                textAlign: 'right',
                background: page === 'customers' ? '#252525' : 'transparent',
                color: '#fff',
                padding: '13px',
              }}
            >
              ⌕ بحث العملاء
            </button>
          )}
        </nav>

        <div className="user">
          <strong>{profile.full_name || 'مستخدم'}</strong>
          <span>{profile.role}</span>

          <button className="logout" onClick={logout}>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="main">
        <header>
          <div>
            <div className="eyebrow">LOVICA ANALYTICS</div>
            <h1>{pageTitle}</h1>
          </div>

          <div className="safe">✓ جلسة محمية</div>
        </header>

        {page === 'overview' && <Overview />}

        {page === 'customers' && canSearchCustomers && <CustomerSearch />}
      </main>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    let active = true

    const hash = window.location.hash || ''

    const looksLikeRecovery =
      hash.includes('type=recovery') ||
      new URLSearchParams(window.location.search).get('type') === 'recovery'

    if (looksLikeRecovery) {
      setRecoveryMode(true)
    }

    async function load(user) {
      if (!user) {
        if (active) {
          setProfile(null)
          setLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, role, active')
        .eq('user_id', user.id)
        .single()

      if (!active) return

      if (error) {
        console.error('Profile load error:', error)
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile(data)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return

      if (error) {
        console.error('Session error:', error)
        setLoading(false)
        return
      }

      setSession(data.session)

      if (looksLikeRecovery && data.session) {
        setRecoveryMode(true)
        setLoading(false)
        return
      }

      load(data.session?.user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!active) return

      setSession(nextSession)

      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
        setLoading(false)
        return
      }

      if (recoveryMode) {
        setLoading(false)
        return
      }

      setLoading(true)
      await load(nextSession?.user)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [recoveryMode])

  if (loading) {
    return <div className="loading">جاري تحميل لوحة لوفيكا...</div>
  }

  if (recoveryMode && session) {
    return <ResetPassword onDone={() => setRecoveryMode(false)} />
  }

  if (!session) {
    return <Login />
  }

  if (!profile?.active) {
    return <div className="loading">الحساب غير مخوّل أو غير نشط.</div>
  }

  return <Dashboard profile={profile} />
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
