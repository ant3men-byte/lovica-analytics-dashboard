import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import './styles.css'
import './styles-v4.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

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

const decimal = (value) =>
  new Intl.NumberFormat('ar-SA', {
    maximumFractionDigits: 2,
  }).format(Number(value || 0))

const date = (value) =>
  value
    ? new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(value))
    : '—'

const isoDay = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
  return d.toISOString().slice(0, 10)
}

const todayIso = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const first = (obj, keys, fallback = null) => {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key]
    }
  }
  return fallback
}

const numeric = (obj, keys, fallback = 0) => {
  const value = first(obj, keys, fallback)
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const normalizeProductRow = (row, index = 0) => ({
  id: first(row, ['product_id', 'id', 'item_id', 'sku'], index),
  name: first(row, ['product_name', 'name', 'item_name', 'title', 'product'], 'منتج بدون اسم'),
  sku: first(row, ['sku', 'product_sku', 'variant_sku'], '—'),
  quantity: numeric(row, ['quantity_sold', 'quantity', 'qty', 'sold_qty', 'units'], 0),
  orders: numeric(row, ['orders_count', 'orders', 'order_count'], 0),
  revenue: numeric(row, ['revenue', 'total_revenue', 'sales', 'total', 'line_total', 'amount'], 0),
})

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

    if (error) setError(`خطأ Supabase: ${error.message}`)
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

    if (error) setError(`تعذر إرسال رابط الاستعادة: ${error.message}`)
    else setInfo('تم إرسال رابط الاستعادة إلى بريدك.')

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
            required
          />

          <label>كلمة المرور</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="error">{error}</div>}
          {info && <div className="info">{info}</div>}

          <button disabled={loading}>
            {loading ? 'جاري التنفيذ...' : 'دخول'}
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={sendRecovery}
            disabled={loading}
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
  const [loading, setLoading] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.')
      return
    }
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    window.history.replaceState({}, document.title, window.location.pathname)
    onDone()
  }

  return (
    <main className="login-page">
      <section className="brand-area">
        <div className="logo">L</div>
        <div>
          <div className="eyebrow">LOVICA BEAUTY</div>
          <h1>كلمة مرور جديدة</h1>
        </div>
      </section>

      <section className="login-card">
        <form onSubmit={save}>
          <label>كلمة المرور الجديدة</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <label>تأكيد كلمة المرور</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <div className="error">{error}</div>}
          <button disabled={loading}>{loading ? 'جاري الحفظ...' : 'حفظ'}</button>
        </form>
      </section>
    </main>
  )
}

function MetricCard({ label, value, note, tone = '', featured = false }) {
  return (
    <div className={`card metric-card ${featured ? 'featured-card' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small className={tone}>{note}</small>}
    </div>
  )
}

function ProductTable({ rows, mode = 'quantity' }) {
  if (!rows.length) {
    return <div className="empty-state">لا توجد بيانات منتجات متاحة لهذه الفترة.</div>
  }

  return (
    <div className="table-scroll">
      <table className="analytics-table">
        <thead>
          <tr>
            <th>#</th>
            <th>المنتج</th>
            <th>SKU</th>
            <th>الكمية</th>
            <th>الطلبات</th>
            <th>الإيراد</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.id}-${index}`}>
              <td><span className="rank">{index + 1}</span></td>
              <td><strong>{row.name}</strong></td>
              <td>{row.sku}</td>
              <td>{number(row.quantity)}</td>
              <td>{number(row.orders)}</td>
              <td className={mode === 'revenue' ? 'emphasis' : ''}>{money(row.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Overview() {
  const [days, setDays] = useState(30)
  const [trend, setTrend] = useState([])
  const [compare, setCompare] = useState(null)
  const [products, setProducts] = useState([])
  const [productSource, setProductSource] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadProducts() {
      // 1) الأفضل: RPC مخصصة إذا كانت موجودة.
      const rpc = await supabase.rpc('dashboard_top_products_v1', {
        p_days: days,
        p_limit: 20,
      })

      if (!rpc.error && Array.isArray(rpc.data)) {
        return {
          rows: rpc.data.map(normalizeProductRow),
          source: 'rpc',
        }
      }

      // 2) fallback ذكي من الجداول العامة إن كانت RLS تسمح.
      const [itemsResult, ordersResult] = await Promise.all([
        supabase.from('order_items').select('*').limit(10000),
        supabase.from('orders').select('*').limit(10000),
      ])

      if (itemsResult.error || !Array.isArray(itemsResult.data)) {
        return { rows: [], source: 'unavailable' }
      }

      const orderRows = Array.isArray(ordersResult.data) ? ordersResult.data : []
      const start = new Date()
      start.setDate(start.getDate() - Math.max(days - 1, 0))
      start.setHours(0, 0, 0, 0)

      const orderMeta = new Map()
      for (const order of orderRows) {
        const id = String(first(order, ['id', 'order_id', 'salla_order_id', 'reference_id'], ''))
        const created = first(order, ['created_at', 'order_date', 'date', 'created_date', 'ordered_at'])
        if (id) orderMeta.set(id, { created, order })
      }

      const grouped = new Map()

      for (const item of itemsResult.data) {
        const orderId = String(first(item, ['order_id', 'orders_id', 'salla_order_id'], ''))
        const meta = orderMeta.get(orderId)
        const itemDate = first(item, ['created_at', 'order_date', 'date'])
        const candidateDate = meta?.created || itemDate

        if (candidateDate) {
          const d = new Date(candidateDate)
          if (!Number.isNaN(d.getTime()) && d < start) continue
        }

        const productId = String(first(item, ['product_id', 'variant_id', 'id', 'sku'], 'unknown'))
        const name = first(item, ['product_name', 'name', 'item_name', 'title'], 'منتج بدون اسم')
        const sku = first(item, ['sku', 'product_sku', 'variant_sku'], '—')
        const qty = numeric(item, ['quantity', 'qty', 'quantity_sold'], 1)
        const revenue = numeric(item, ['total', 'line_total', 'total_amount', 'amount'], 0) ||
          numeric(item, ['price', 'unit_price'], 0) * qty

        const key = `${productId}|${name}`
        const current = grouped.get(key) || {
          id: productId,
          name,
          sku,
          quantity: 0,
          revenue: 0,
          orderIds: new Set(),
        }

        current.quantity += qty
        current.revenue += revenue
        if (orderId) current.orderIds.add(orderId)
        grouped.set(key, current)
      }

      const rows = [...grouped.values()].map((x) => ({
        ...x,
        orders: x.orderIds.size,
      }))

      return { rows, source: 'tables' }
    }

    async function load() {
      setLoading(true)
      setError('')

      const [trendResult, compareResult, productsResult] = await Promise.all([
        supabase.rpc('dashboard_daily_trend_v1', { p_days: days }),
        supabase.rpc('dashboard_period_compare_v1', { p_days: days }),
        loadProducts(),
      ])

      if (!active) return

      if (trendResult.error || compareResult.error) {
        setError(
          `تعذر تحميل التحليلات: ${
            trendResult.error?.message ||
            compareResult.error?.message ||
            'Unknown error'
          }`
        )
        setLoading(false)
        return
      }

      setTrend(trendResult.data || [])
      setCompare(compareResult.data?.[0] || null)
      setProducts(productsResult.rows || [])
      setProductSource(productsResult.source)
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [days])

  const pct = (value) => {
    if (value === null || value === undefined) return '—'
    const n = Number(value)
    return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`
  }

  const changeClass = (value) => {
    const n = Number(value)
    if (!Number.isFinite(n) || n === 0) return ''
    return n > 0 ? 'positive' : 'negative'
  }

  const trendSorted = useMemo(
    () => [...trend].sort((a, b) => String(a.day).localeCompare(String(b.day))),
    [trend]
  )

  const todayKey = todayIso()
  const todayRow =
    trendSorted.find((row) => isoDay(row.day) === todayKey) ||
    (trendSorted.length && isoDay(trendSorted[trendSorted.length - 1].day) === todayKey
      ? trendSorted[trendSorted.length - 1]
      : null)

  const todayOrders = numeric(todayRow, ['orders_count', 'orders', 'order_count'], 0)
  const todayValue = numeric(todayRow, ['order_value', 'value', 'sales', 'revenue', 'total_value'], 0)
  const todayRefunded = numeric(todayRow, ['refunded', 'refunded_value', 'refund_value'], 0)
  const todayNet = numeric(todayRow, ['net', 'net_value', 'net_sales'], todayValue - todayRefunded)
  const todayCustomers = numeric(todayRow, ['customers_count', 'customers', 'unique_customers'], 0)
  const todayAov = todayOrders ? todayValue / todayOrders : 0

  const currentAov = Number(compare?.current_orders || 0)
    ? Number(compare?.current_value || 0) / Number(compare.current_orders)
    : 0

  const previousAov = Number(compare?.previous_orders || 0)
    ? Number(compare?.previous_value || 0) / Number(compare.previous_orders)
    : 0

  const aovChange = previousAov
    ? ((currentAov - previousAov) / previousAov) * 100
    : null

  const maxValue = Math.max(1, ...trendSorted.map((r) => numeric(r, ['order_value', 'value'], 0)))
  const maxOrders = Math.max(1, ...trendSorted.map((r) => numeric(r, ['orders_count', 'orders'], 0)))

  const topByQty = [...products]
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 10)

  const topByRevenue = [...products]
    .sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity)
    .slice(0, 10)

  const periodDates = useMemo(() => {
    if (!trendSorted.length) return { current: '—', previous: '—' }
    const start = new Date(trendSorted[0].day)
    const end = new Date(trendSorted[trendSorted.length - 1].day)
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - days + 1)
    return {
      current: `${date(start)} — ${date(end)}`,
      previous: `${date(prevStart)} — ${date(prevEnd)}`,
    }
  }, [trendSorted, days])

  return (
    <>
      <section className="panel hero-panel">
        <div>
          <div className="eyebrow">LOVICA LIVE PERFORMANCE</div>
          <h2>أداء المتجر</h2>
          <p className="muted">اليوم أولًا، ثم مقارنة الفترة المختارة، ثم أداء المنتجات.</p>
        </div>

        <div className="period-buttons">
          {[7, 30, 90, 365].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={days === option ? 'active' : 'inactive'}
            >
              {option === 365 ? 'سنة' : `${option} يوم`}
            </button>
          ))}
        </div>
      </section>

      {loading && <section className="panel">جاري تحميل التحليلات...</section>}
      {error && <section className="panel error">{error}</section>}

      {!loading && !error && (
        <>
          <section className="section-heading">
            <div>
              <div className="eyebrow">TODAY</div>
              <h2>اليوم</h2>
            </div>
            <span className="date-chip">{date(new Date())}</span>
          </section>

          <section className="cards today-cards">
            <MetricCard label="طلبات اليوم" value={number(todayOrders)} featured />
            <MetricCard label="مبيعات اليوم" value={money(todayValue)} featured />
            <MetricCard label="متوسط الطلب اليوم" value={money(todayAov)} />
            <MetricCard label="عملاء اليوم" value={number(todayCustomers)} />
            <MetricCard label="المسترجع اليوم" value={money(todayRefunded)} />
            <MetricCard label="صافي اليوم" value={money(todayNet)} featured />
          </section>

          {compare && (
            <>
              <section className="section-heading">
                <div>
                  <div className="eyebrow">PERIOD PERFORMANCE</div>
                  <h2>الفترة المختارة</h2>
                </div>
              </section>

              <section className="period-range">
                <div>
                  <span>الفترة الحالية</span>
                  <strong>{periodDates.current}</strong>
                </div>
                <div>
                  <span>الفترة السابقة</span>
                  <strong>{periodDates.previous}</strong>
                </div>
              </section>

              <section className="cards">
                <MetricCard
                  label="الطلبات"
                  value={number(compare.current_orders)}
                  note={`${pct(compare.orders_change_pct)} عن الفترة السابقة`}
                  tone={changeClass(compare.orders_change_pct)}
                />
                <MetricCard
                  label="العملاء"
                  value={number(compare.current_customers)}
                  note={`${pct(compare.customers_change_pct)} عن الفترة السابقة`}
                  tone={changeClass(compare.customers_change_pct)}
                />
                <MetricCard
                  label="قيمة الطلبات"
                  value={money(compare.current_value)}
                  note={`${pct(compare.value_change_pct)} عن الفترة السابقة`}
                  tone={changeClass(compare.value_change_pct)}
                />
                <MetricCard
                  label="متوسط قيمة الطلب"
                  value={money(currentAov)}
                  note={aovChange === null ? '—' : `${pct(aovChange)} عن الفترة السابقة`}
                  tone={changeClass(aovChange)}
                />
                <MetricCard
                  label="المسترجع"
                  value={money(compare.current_refunded)}
                />
                <MetricCard
                  label="الصافي بعد المسترجع"
                  value={money(compare.current_net)}
                  featured
                />
              </section>
            </>
          )}

          <section className="analytics-grid">
            <section className="panel">
              <div className="panel-title-row">
                <div>
                  <div className="eyebrow">SALES TREND</div>
                  <h2>قيمة الطلبات عبر الزمن</h2>
                </div>
              </div>
              <div className="bar-chart">
                {trendSorted.map((row) => {
                  const value = numeric(row, ['order_value', 'value'], 0)
                  return (
                    <div className="bar-column" key={`value-${row.day}`} title={`${date(row.day)} — ${money(value)}`}>
                      <div className="bar value-bar" style={{ height: `${Math.max(3, value / maxValue * 100)}%` }} />
                    </div>
                  )
                })}
              </div>
              <div className="chart-caption">
                <span>{trendSorted.length ? date(trendSorted[0].day) : '—'}</span>
                <span>{trendSorted.length ? date(trendSorted[trendSorted.length - 1].day) : '—'}</span>
              </div>
            </section>

            <section className="panel">
              <div className="panel-title-row">
                <div>
                  <div className="eyebrow">ORDERS TREND</div>
                  <h2>عدد الطلبات عبر الزمن</h2>
                </div>
              </div>
              <div className="bar-chart">
                {trendSorted.map((row) => {
                  const value = numeric(row, ['orders_count', 'orders'], 0)
                  return (
                    <div className="bar-column" key={`orders-${row.day}`} title={`${date(row.day)} — ${number(value)} طلب`}>
                      <div className="bar orders-bar" style={{ height: `${Math.max(3, value / maxOrders * 100)}%` }} />
                    </div>
                  )
                })}
              </div>
              <div className="chart-caption">
                <span>{trendSorted.length ? date(trendSorted[0].day) : '—'}</span>
                <span>{trendSorted.length ? date(trendSorted[trendSorted.length - 1].day) : '—'}</span>
              </div>
            </section>
          </section>

          <section className="section-heading products-heading">
            <div>
              <div className="eyebrow">PRODUCT INTELLIGENCE</div>
              <h2>أداء المنتجات</h2>
            </div>
            <span className="source-chip">
              {productSource === 'rpc'
                ? 'بيانات محسوبة من Supabase'
                : productSource === 'tables'
                ? 'بيانات محسوبة من الطلبات'
                : 'بيانات المنتجات غير متاحة'}
            </span>
          </section>

          {productSource === 'unavailable' && (
            <section className="panel info">
              واجهة المنتجات جاهزة، لكن صلاحيات RLS الحالية لا تسمح بقراءة بيانات المنتجات مباشرة
              ولا توجد RPC باسم dashboard_top_products_v1. بقية الداشبورد تعمل بشكل طبيعي.
            </section>
          )}

          <section className="panel">
            <div className="panel-title-row">
              <div>
                <h2>الأكثر مبيعًا</h2>
                <p className="muted">ترتيب المنتجات حسب عدد القطع المباعة.</p>
              </div>
              <span className="count-chip">TOP 10</span>
            </div>
            <ProductTable rows={topByQty} mode="quantity" />
          </section>

          <section className="panel">
            <div className="panel-title-row">
              <div>
                <h2>أفضل المنتجات من حيث الإيراد</h2>
                <p className="muted">المنتجات التي حققت أعلى قيمة مبيعات في الفترة المختارة.</p>
              </div>
              <span className="count-chip">TOP 10</span>
            </div>
            <ProductTable rows={topByRevenue} mode="revenue" />
          </section>

          {compare && (
            <section className="panel">
              <h2>مقارنة مختصرة</h2>
              <div className="details comparison-details">
                <div>
                  <span>قيمة الفترة الحالية</span>
                  <strong>{money(compare.current_value)}</strong>
                </div>
                <div>
                  <span>قيمة الفترة السابقة</span>
                  <strong>{money(compare.previous_value)}</strong>
                </div>
                <div>
                  <span>الصافي الحالي</span>
                  <strong>{money(compare.current_net)}</strong>
                </div>
                <div>
                  <span>متوسط الطلب الحالي</span>
                  <strong>{money(currentAov)}</strong>
                </div>
              </div>
            </section>
          )}
        </>
      )}
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

    if (error) setMessage(`خطأ البحث: ${error.message}`)
    else if (!data?.length) setMessage('لم يتم العثور على عميل بهذا الرقم.')
    else setCustomer(data[0])

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
          <button disabled={loading}>{loading ? 'جاري البحث...' : 'بحث'}</button>
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
            <MetricCard label="عدد الطلبات" value={number(customer.total_orders)} />
            <MetricCard label="إجمالي المشتريات" value={money(customer.total_spent)} />
            <MetricCard label="متوسط الطلب" value={money(customer.average_order_value)} />
            <MetricCard label="طلبات بها استرجاع" value={number(customer.refunded_orders)} />
          </section>

          <section className="panel details">
            <div><span>أول طلب</span><strong>{date(customer.first_order_at)}</strong></div>
            <div><span>آخر طلب</span><strong>{date(customer.last_order_at)}</strong></div>
            <div><span>إجمالي المسترجع</span><strong>{money(customer.total_refunded)}</strong></div>
          </section>
        </>
      )}
    </>
  )
}

function Dashboard({ profile }) {
  const [page, setPage] = useState('overview')
  const canSearchCustomers = ['owner', 'admin', 'customer_service'].includes(profile.role)

  return (
    <div className="dashboard">
      <aside>
        <div className="side-logo">
          <div className="logo small">L</div>
          <div><strong>لوفيكا</strong><span>Analytics V4</span></div>
        </div>

        <nav className="side-nav">
          <button
            type="button"
            onClick={() => setPage('overview')}
            className={page === 'overview' ? 'nav-active' : ''}
          >
            ◫ الرئيسية
          </button>

          {canSearchCustomers && (
            <button
              type="button"
              onClick={() => setPage('customers')}
              className={page === 'customers' ? 'nav-active' : ''}
            >
              ⌕ بحث العملاء
            </button>
          )}
        </nav>

        <div className="user">
          <strong>{profile.full_name || 'مستخدم'}</strong>
          <span>{profile.role}</span>
          <button className="logout" onClick={() => supabase.auth.signOut()}>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="main">
        <header>
          <div>
            <div className="eyebrow">LOVICA ANALYTICS</div>
            <h1>{page === 'overview' ? 'الرئيسية' : 'بحث العملاء'}</h1>
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

    if (looksLikeRecovery) setRecoveryMode(true)

    async function loadProfile(user) {
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
      } else {
        setProfile(data)
      }
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) {
        setLoading(false)
        return
      }

      setSession(data.session)

      if (looksLikeRecovery && data.session) {
        setRecoveryMode(true)
        setLoading(false)
        return
      }

      loadProfile(data.session?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
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
        await loadProfile(nextSession?.user)
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [recoveryMode])

  if (loading) return <div className="loading">جاري تحميل لوحة لوفيكا...</div>
  if (recoveryMode && session) return <ResetPassword onDone={() => setRecoveryMode(false)} />
  if (!session) return <Login />
  if (!profile?.active) return <div className="loading">الحساب غير مخوّل أو غير نشط.</div>

  return <Dashboard profile={profile} />
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
