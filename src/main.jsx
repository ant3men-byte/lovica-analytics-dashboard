import React, { useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { createClient } from '@supabase/supabase-js'
import './styles.css'

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
  new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(Number(value || 0))

const decimal = (value) =>
  new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 2 }).format(Number(value || 0))

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
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key]
  }
  return fallback
}

const numeric = (obj, keys, fallback = 0) => {
  const n = Number(first(obj, keys, fallback))
  return Number.isFinite(n) ? n : fallback
}

const pct = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const n = Number(value)
  return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`
}

const changeClass = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return ''
  return n > 0 ? 'positive' : 'negative'
}

const normalizeProductRow = (row, index = 0) => ({
  id: first(row, ['product_id', 'id', 'item_id', 'sku'], index),
  name: first(row, ['product_name', 'name', 'item_name', 'title', 'product'], 'منتج بدون اسم'),
  sku: first(row, ['sku', 'product_sku', 'variant_sku'], '—'),
  quantity: numeric(row, ['quantity_sold', 'quantity', 'qty', 'sold_qty', 'units'], 0),
  orders: numeric(row, ['orders_count', 'orders', 'order_count'], 0),
  revenue: numeric(row, ['revenue', 'total_revenue', 'sales', 'total', 'line_total', 'amount'], 0),
  avgPrice: numeric(row, ['avg_sale_price', 'average_price'], 0),
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
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError(`خطأ Supabase: ${error.message}`)
    setLoading(false)
  }

  const sendRecovery = async () => {
    const cleanEmail = email.trim()
    if (!cleanEmail) return setError('اكتب البريد الإلكتروني أولًا.')
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
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>كلمة المرور</label>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <div className="error">{error}</div>}
          {info && <div className="info">{info}</div>}
          <button disabled={loading}>{loading ? 'جاري التنفيذ...' : 'دخول'}</button>
          <button type="button" className="secondary-button" onClick={sendRecovery} disabled={loading}>نسيت كلمة المرور؟</button>
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
    if (password.length < 8) return setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل.')
    if (password !== confirmPassword) return setError('كلمتا المرور غير متطابقتين.')
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
        <div><div className="eyebrow">LOVICA BEAUTY</div><h1>كلمة مرور جديدة</h1></div>
      </section>
      <section className="login-card">
        <form onSubmit={save}>
          <label>كلمة المرور الجديدة</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label>تأكيد كلمة المرور</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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
      <span>{label}</span><strong>{value}</strong>{note && <small className={tone}>{note}</small>}
    </div>
  )
}

function ProductTable({ rows, mode = 'quantity' }) {
  if (!rows.length) return <div className="empty-state">لا توجد بيانات منتجات متاحة لهذه الفترة.</div>
  return (
    <div className="table-scroll">
      <table className="analytics-table">
        <thead><tr><th>#</th><th>المنتج</th><th>SKU</th><th>الكمية</th><th>الطلبات</th><th>الإيراد</th><th>متوسط السعر</th></tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.id}-${index}`}>
              <td><span className="rank">{index + 1}</span></td><td><strong>{row.name}</strong></td><td>{row.sku}</td>
              <td>{number(row.quantity)}</td><td>{number(row.orders)}</td><td className={mode === 'revenue' ? 'emphasis' : ''}>{money(row.revenue)}</td>
              <td>{money(row.avgPrice || (row.quantity ? row.revenue / row.quantity : 0))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SimpleTable({ columns, rows, emptyText = 'لا توجد بيانات متاحة لهذه الفترة.' }) {
  if (!rows?.length) return <div className="empty-state">{emptyText}</div>
  return (
    <div className="table-scroll">
      <table className="analytics-table">
        <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || row.customer_id || row.city || `${row.status_slug}-${i}` || i}>
              {columns.map((c) => <td key={c.key}>{c.render ? c.render(row, i) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Overview() {
  const [days, setDays] = useState(30)
  const [periodMode, setPeriodMode] = useState('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [snapshot, setSnapshot] = useState(null)
  const [trend, setTrend] = useState([])
  const [compare, setCompare] = useState(null)
  const [products, setProducts] = useState([])
  const [customerSummary, setCustomerSummary] = useState(null)
  const [topCustomers, setTopCustomers] = useState([])
  const [cities, setCities] = useState([])
  const [orderStatuses, setOrderStatuses] = useState([])
  const [timeData, setTimeData] = useState([])
  const [productPerformance, setProductPerformance] = useState([])
  const [unsoldProducts, setUnsoldProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const selectPreset = (mode, value) => {
    setPeriodMode(mode)
    setDays(value)
  }

  useEffect(() => {
    let active = true
    async function loadSnapshot() {
      const result = await supabase.rpc('dashboard_store_snapshot_v1')
      if (!active) return
      if (result.error) {
        setError(`تعذر تحميل صورة المتجر: ${result.error.message}`)
        return
      }
      setSnapshot(result.data || null)
    }
    loadSnapshot()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      if (periodMode === 'custom' && (!customStart || !customEnd)) return
      if (periodMode === 'custom' && customStart > customEnd) {
        setError('تاريخ البداية يجب أن يكون قبل تاريخ النهاية.')
        return
      }

      setLoading(true)
      setError('')

      if (periodMode === 'custom') {
        const rangeR = await supabase.rpc('dashboard_date_range_bundle_v1', {
          p_start_date: customStart,
          p_end_date: customEnd,
        })
        if (!active) return
        if (rangeR.error) {
          setError(`تعذر تحميل الفترة المحددة: ${rangeR.error.message}`)
          setLoading(false)
          return
        }
        const d = rangeR.data || {}
        setTrend(d.trend || [])
        setCompare(d.compare || null)
        setProducts((d.products || []).map(normalizeProductRow))
        setCustomerSummary(d.customer_summary || null)
        setTopCustomers(d.top_customers || [])
        setCities(d.cities || [])
        setOrderStatuses(d.order_statuses || [])
        setTimeData(d.time_data || d.trend || [])
        setProductPerformance(d.product_performance || [])
        setUnsoldProducts(d.unsold_products || [])
        setLoading(false)
        return
      }

      const results = await Promise.all([
        supabase.rpc('dashboard_daily_trend_v1', { p_days: days }),
        supabase.rpc('dashboard_period_compare_v1', { p_days: days }),
        supabase.rpc('dashboard_top_products_v1', { p_days: days, p_limit: 30 }),
        supabase.rpc('dashboard_customers_summary_v1', { p_days: days }),
        supabase.rpc('dashboard_top_customers_v1', { p_days: days, p_limit: 20 }),
        supabase.rpc('dashboard_cities_v1', { p_days: days, p_limit: 20 }),
        supabase.rpc('dashboard_orders_v1', { p_days: days }),
        supabase.rpc('dashboard_time_v1', { p_days: days }),
        supabase.rpc('dashboard_product_performance_v1', { p_days: days, p_limit: 30 }),
        supabase.rpc('dashboard_unsold_products_v1', { p_days: days, p_limit: 30 }),
      ])

      if (!active) return
      const [trendR, compareR, productsR, summaryR, topCustomersR, citiesR, statusesR, timeR, performanceR, unsoldR] = results
      const criticalError = trendR.error || compareR.error || productsR.error
      if (criticalError) {
        setError(`تعذر تحميل التحليلات: ${criticalError.message}`)
        setLoading(false)
        return
      }

      setTrend(trendR.data || [])
      setCompare(compareR.data?.[0] || null)
      setProducts((productsR.data || []).map(normalizeProductRow))
      setCustomerSummary(summaryR.error ? null : summaryR.data?.[0] || null)
      setTopCustomers(topCustomersR.error ? [] : topCustomersR.data || [])
      setCities(citiesR.error ? [] : citiesR.data || [])
      setOrderStatuses(statusesR.error ? [] : statusesR.data || [])
      setTimeData(timeR.error ? [] : timeR.data || [])
      setProductPerformance(performanceR.error ? [] : performanceR.data || [])
      setUnsoldProducts(unsoldR.error ? [] : unsoldR.data || [])
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [days, periodMode, customStart, customEnd])

  const trendSorted = useMemo(() => [...trend].sort((a, b) => String(a.day).localeCompare(String(b.day))), [trend])
  const todayKey = todayIso()
  const todayRow = trendSorted.find((row) => isoDay(row.day) === todayKey) || null
  const todayOrders = numeric(todayRow, ['orders_count', 'orders'], 0)
  const todayValue = numeric(todayRow, ['order_value', 'value'], 0)
  const todayRefunded = numeric(todayRow, ['refunded', 'refunded_value'], 0)
  const todayNet = numeric(todayRow, ['net', 'net_value', 'net_sales'], todayValue - todayRefunded)
  const todayCustomers = numeric(todayRow, ['customers_count', 'customers'], 0)
  const todayAov = todayOrders ? todayValue / todayOrders : 0

  const currentAov = Number(compare?.current_orders || 0) ? Number(compare.current_value || 0) / Number(compare.current_orders) : 0
  const previousAov = Number(compare?.previous_orders || 0) ? Number(compare.previous_value || 0) / Number(compare.previous_orders) : 0
  const aovChange = previousAov ? ((currentAov - previousAov) / previousAov) * 100 : null
  const maxValue = Math.max(1, ...trendSorted.map((r) => numeric(r, ['order_value', 'value'], 0)))
  const maxOrders = Math.max(1, ...trendSorted.map((r) => numeric(r, ['orders_count', 'orders'], 0)))
  const topByQty = [...products].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue).slice(0, 10)
  const topByRevenue = [...products].sort((a, b) => b.revenue - a.revenue || b.quantity - a.quantity).slice(0, 10)

  const periodDates = useMemo(() => {
    if (periodMode === 'custom' && customStart && customEnd) {
      const start = new Date(`${customStart}T00:00:00`)
      const end = new Date(`${customEnd}T00:00:00`)
      const length = Math.round((end - start) / 86400000) + 1
      const prevEnd = new Date(start); prevEnd.setDate(prevEnd.getDate() - 1)
      const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - length + 1)
      return { current: `${date(start)} — ${date(end)}`, previous: `${date(prevStart)} — ${date(prevEnd)}` }
    }
    if (!trendSorted.length) return { current: '—', previous: '—' }
    const start = new Date(trendSorted[0].day)
    const end = new Date(trendSorted[trendSorted.length - 1].day)
    const prevEnd = new Date(start); prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - days + 1)
    return { current: `${date(start)} — ${date(end)}`, previous: `${date(prevStart)} — ${date(prevEnd)}` }
  }, [trendSorted, days, periodMode, customStart, customEnd])

  const bestDay = useMemo(() => {
    if (!timeData.length) return null
    return [...timeData].sort((a, b) => Number(b.order_value || 0) - Number(a.order_value || 0))[0]
  }, [timeData])

  return (
    <>
      <section className="section-heading store-snapshot-heading">
        <div><div className="eyebrow">ALL-TIME STORE SNAPSHOT</div><h2>صورة المتجر بالكامل</h2><p className="muted">إجماليات ثابتة من أول طلب مسجل حتى اليوم، ولا تتأثر بفلتر الفترة.</p></div>
      </section>

      {snapshot && <>
        <section className="cards store-total-cards">
          <MetricCard label="إجمالي الطلبات" value={number(snapshot.total_orders)} featured />
          <MetricCard label="العملاء بدون تكرار" value={number(snapshot.unique_customers)} />
          <MetricCard label="إجمالي الإيرادات" value={money(snapshot.total_revenue)} featured />
        </section>

        <section className="analytics-grid store-breakdowns">
          <section className="panel">
            <div className="panel-title-row"><div><h2>الشحن</h2><p className="muted">توزيع جميع الطلبات حسب شركة / نوع الشحن.</p></div></div>
            <SimpleTable rows={snapshot.shipping || []} columns={[
              { key: 'shipping_method', label: 'شركة / نوع الشحن' },
              { key: 'orders_count', label: 'عدد الطلبات', render: (r) => number(r.orders_count) },
              { key: 'cod_fees', label: 'رسوم الدفع عند الاستلام', render: (r) => money(r.cod_fees) },
              { key: 'total_fees', label: 'الإجمالي', render: (r) => money(r.total_fees) },
            ]} />
          </section>
          <section className="panel">
            <div className="panel-title-row"><div><h2>طرق الدفع</h2><p className="muted">توزيع جميع الطلبات حسب طريقة الدفع.</p></div></div>
            <SimpleTable rows={snapshot.payments || []} columns={[
              { key: 'payment_method', label: 'طريقة الدفع' },
              { key: 'orders_count', label: 'الطلبات', render: (r) => number(r.orders_count) },
              { key: 'revenue', label: 'الإيرادات', render: (r) => money(r.revenue) },
            ]} />
          </section>
        </section>
      </>}

      <section className="panel period-filter-panel">
        <div>
          <div className="eyebrow">PERIOD FILTER</div>
          <h2>تحليل الفترة</h2>
          <p className="muted">الفلتر يؤثر فقط على التحليلات الموجودة أسفله.</p>
        </div>
        <div className="period-buttons period-main-buttons">
          <button type="button" onClick={() => selectPreset('today', 1)} className={periodMode === 'today' ? 'active' : 'inactive'}>اليوم</button>
          <button type="button" onClick={() => selectPreset('week', 7)} className={periodMode === 'week' ? 'active' : 'inactive'}>أسبوع</button>
          <button type="button" onClick={() => selectPreset('month', 30)} className={periodMode === 'month' ? 'active' : 'inactive'}>شهر</button>
          <button type="button" onClick={() => setPeriodMode('custom')} className={periodMode === 'custom' ? 'active' : 'inactive'}>تحديد فترة</button>
        </div>
        {periodMode === 'custom' && (
          <div className="custom-date-range">
            <label><span>من</span><input type="date" value={customStart} max={customEnd || todayIso()} onChange={(e) => setCustomStart(e.target.value)} /></label>
            <label><span>إلى</span><input type="date" value={customEnd} min={customStart || undefined} max={todayIso()} onChange={(e) => setCustomEnd(e.target.value)} /></label>
          </div>
        )}
      </section>

      {loading && <section className="panel">جاري تحميل التحليلات...</section>}
      {error && <section className="panel error">{error}</section>}

      {!loading && !error && (
        <>
          <section className="section-heading"><div><div className="eyebrow">TODAY</div><h2>اليوم</h2></div><span className="date-chip">{date(new Date())}</span></section>
          <section className="cards today-cards">
            <MetricCard label="طلبات اليوم" value={number(todayOrders)} featured />
            <MetricCard label="مبيعات اليوم" value={money(todayValue)} featured />
            <MetricCard label="متوسط الطلب اليوم" value={money(todayAov)} />
            <MetricCard label="عملاء اليوم" value={number(todayCustomers)} />
            <MetricCard label="المسترجع اليوم" value={money(todayRefunded)} />
            <MetricCard label="صافي اليوم" value={money(todayNet)} featured />
          </section>

          {compare && <>
            <section className="section-heading"><div><div className="eyebrow">PERIOD PERFORMANCE</div><h2>الفترة المختارة</h2></div></section>
            <section className="period-range"><div><span>الفترة الحالية</span><strong>{periodDates.current}</strong></div><div><span>الفترة السابقة</span><strong>{periodDates.previous}</strong></div></section>
            <section className="cards">
              <MetricCard label="الطلبات" value={number(compare.current_orders)} note={`${pct(compare.orders_change_pct)} عن الفترة السابقة`} tone={changeClass(compare.orders_change_pct)} />
              <MetricCard label="العملاء" value={number(compare.current_customers)} note={`${pct(compare.customers_change_pct)} عن الفترة السابقة`} tone={changeClass(compare.customers_change_pct)} />
              <MetricCard label="قيمة الطلبات" value={money(compare.current_value)} note={`${pct(compare.value_change_pct)} عن الفترة السابقة`} tone={changeClass(compare.value_change_pct)} />
              <MetricCard label="متوسط قيمة الطلب" value={money(currentAov)} note={aovChange === null ? '—' : `${pct(aovChange)} عن الفترة السابقة`} tone={changeClass(aovChange)} />
              <MetricCard label="المسترجع" value={money(compare.current_refunded)} />
              <MetricCard label="الصافي بعد المسترجع" value={money(compare.current_net)} featured />
            </section>
          </>}

          <section className="analytics-grid">
            <section className="panel"><div className="panel-title-row"><div><div className="eyebrow">SALES TREND</div><h2>قيمة الطلبات عبر الزمن</h2></div></div>
              <div className="bar-chart">{trendSorted.map((row) => { const value = numeric(row, ['order_value', 'value'], 0); return <div className="bar-column" key={`value-${row.day}`} title={`${date(row.day)} — ${money(value)}`}><div className="bar value-bar" style={{ height: `${Math.max(3, value / maxValue * 100)}%` }} /></div> })}</div>
              <div className="chart-caption"><span>{trendSorted.length ? date(trendSorted[0].day) : '—'}</span><span>{trendSorted.length ? date(trendSorted[trendSorted.length - 1].day) : '—'}</span></div>
            </section>
            <section className="panel"><div className="panel-title-row"><div><div className="eyebrow">ORDERS TREND</div><h2>عدد الطلبات عبر الزمن</h2></div></div>
              <div className="bar-chart">{trendSorted.map((row) => { const value = numeric(row, ['orders_count', 'orders'], 0); return <div className="bar-column" key={`orders-${row.day}`} title={`${date(row.day)} — ${number(value)} طلب`}><div className="bar orders-bar" style={{ height: `${Math.max(3, value / maxOrders * 100)}%` }} /></div> })}</div>
              <div className="chart-caption"><span>{trendSorted.length ? date(trendSorted[0].day) : '—'}</span><span>{trendSorted.length ? date(trendSorted[trendSorted.length - 1].day) : '—'}</span></div>
            </section>
          </section>

          <section className="section-heading products-heading"><div><div className="eyebrow">CUSTOMER INTELLIGENCE</div><h2>العملاء</h2></div></section>
          {customerSummary && <section className="cards">
            <MetricCard label="عملاء الفترة" value={number(customerSummary.total_customers)} />
            <MetricCard label="عملاء جدد" value={number(customerSummary.new_customers)} />
            <MetricCard label="عملاء عائدون" value={number(customerSummary.returning_customers)} />
            <MetricCard label="عملاء مكررون" value={number(customerSummary.repeat_customers)} />
            <MetricCard label="نسبة تكرار الشراء" value={pct(customerSummary.repeat_rate)} featured />
            <MetricCard label="متوقفون +90 يوم" value={number(customerSummary.lapsed_90_days)} />
            <MetricCard label="متوسط إنفاق العميل" value={money(customerSummary.avg_customer_spend)} />
          </section>}
          <section className="panel"><div className="panel-title-row"><div><h2>أفضل العملاء</h2><p className="muted">حسب إجمالي المشتريات في الفترة المختارة.</p></div><span className="count-chip">TOP 20</span></div>
            <SimpleTable rows={topCustomers} columns={[
              { key: 'customer_name', label: 'العميل' },
              { key: 'orders_count', label: 'الطلبات', render: (r) => number(r.orders_count) },
              { key: 'total_spent', label: 'المشتريات', render: (r) => money(r.total_spent) },
              { key: 'avg_order_value', label: 'متوسط الطلب', render: (r) => money(r.avg_order_value) },
              { key: 'customer_type', label: 'النوع', render: (r) => r.customer_type === 'new' ? 'جديد' : 'عائد' },
              { key: 'last_order_at', label: 'آخر طلب', render: (r) => date(r.last_order_at) },
            ]} />
          </section>

          <section className="section-heading products-heading"><div><div className="eyebrow">PRODUCT INTELLIGENCE</div><h2>أداء المنتجات</h2></div><span className="source-chip">بيانات محسوبة من Supabase</span></section>
          <section className="panel"><div className="panel-title-row"><div><h2>الأكثر مبيعًا</h2><p className="muted">ترتيب المنتجات حسب عدد القطع المباعة.</p></div><span className="count-chip">TOP 10</span></div><ProductTable rows={topByQty} mode="quantity" /></section>
          <section className="panel"><div className="panel-title-row"><div><h2>أفضل المنتجات من حيث الإيراد</h2><p className="muted">المنتجات الأعلى قيمة مبيعات.</p></div><span className="count-chip">TOP 10</span></div><ProductTable rows={topByRevenue} mode="revenue" /></section>

          <section className="panel"><div className="panel-title-row"><div><h2>صعود وهبوط المنتجات</h2><p className="muted">مقارنة أداء كل منتج بالفترة السابقة.</p></div></div>
            <SimpleTable rows={productPerformance.slice(0, 20)} columns={[
              { key: 'product_name', label: 'المنتج' },
              { key: 'current_quantity', label: 'الكمية', render: (r) => number(r.current_quantity) },
              { key: 'quantity_change_pct', label: 'تغير الكمية', render: (r) => <span className={changeClass(r.quantity_change_pct)}>{pct(r.quantity_change_pct)}</span> },
              { key: 'current_revenue', label: 'الإيراد', render: (r) => money(r.current_revenue) },
              { key: 'revenue_change_pct', label: 'تغير الإيراد', render: (r) => <span className={changeClass(r.revenue_change_pct)}>{pct(r.revenue_change_pct)}</span> },
            ]} />
          </section>

          <section className="panel"><div className="panel-title-row"><div><h2>منتجات لم تبع</h2><p className="muted">منتجات لم تسجل مبيعات خلال الفترة المختارة.</p></div></div>
            <SimpleTable rows={unsoldProducts.slice(0, 20)} columns={[
              { key: 'product_name', label: 'المنتج' }, { key: 'sku', label: 'SKU' },
              { key: 'stock_quantity', label: 'المخزون', render: (r) => number(r.stock_quantity) },
              { key: 'current_price', label: 'السعر', render: (r) => money(r.current_price) },
              { key: 'last_sale_at', label: 'آخر بيع', render: (r) => date(r.last_sale_at) },
            ]} />
          </section>

          <section className="section-heading products-heading"><div><div className="eyebrow">CITY PERFORMANCE</div><h2>المدن</h2></div></section>
          <section className="panel"><SimpleTable rows={cities} columns={[
            { key: 'city', label: 'المدينة' }, { key: 'orders_count', label: 'الطلبات', render: (r) => number(r.orders_count) },
            { key: 'customers_count', label: 'العملاء', render: (r) => number(r.customers_count) },
            { key: 'revenue', label: 'المبيعات', render: (r) => money(r.revenue) },
            { key: 'net_sales', label: 'الصافي', render: (r) => money(r.net_sales) },
            { key: 'avg_order_value', label: 'متوسط الطلب', render: (r) => money(r.avg_order_value) },
          ]} /></section>

          <section className="section-heading products-heading"><div><div className="eyebrow">ORDER OPERATIONS</div><h2>حالات الطلبات</h2></div></section>
          <section className="panel"><SimpleTable rows={orderStatuses} columns={[
            { key: 'status_name', label: 'الحالة' }, { key: 'orders_count', label: 'الطلبات', render: (r) => number(r.orders_count) },
            { key: 'revenue', label: 'القيمة', render: (r) => money(r.revenue) }, { key: 'refunded', label: 'المسترجع', render: (r) => money(r.refunded) },
            { key: 'net_sales', label: 'الصافي', render: (r) => money(r.net_sales) }, { key: 'avg_order_value', label: 'متوسط الطلب', render: (r) => money(r.avg_order_value) },
            { key: 'avg_items', label: 'متوسط القطع', render: (r) => decimal(r.avg_items) },
          ]} /></section>

          <section className="section-heading products-heading"><div><div className="eyebrow">TIME INTELLIGENCE</div><h2>التحليل الزمني</h2></div></section>
          <section className="cards">
            <MetricCard label="أفضل يوم" value={bestDay ? date(bestDay.day) : '—'} featured />
            <MetricCard label="مبيعات أفضل يوم" value={bestDay ? money(bestDay.order_value) : money(0)} />
            <MetricCard label="طلبات أفضل يوم" value={bestDay ? number(bestDay.orders_count) : '0'} />
          </section>
          <section className="panel"><SimpleTable rows={[...timeData].sort((a, b) => Number(b.order_value || 0) - Number(a.order_value || 0)).slice(0, 10)} columns={[
            { key: 'day', label: 'اليوم', render: (r) => date(r.day) }, { key: 'orders_count', label: 'الطلبات', render: (r) => number(r.orders_count) },
            { key: 'customers_count', label: 'العملاء', render: (r) => number(r.customers_count) }, { key: 'order_value', label: 'المبيعات', render: (r) => money(r.order_value) },
            { key: 'net_sales', label: 'الصافي', render: (r) => money(r.net_sales) }, { key: 'avg_order_value', label: 'متوسط الطلب', render: (r) => money(r.avg_order_value) },
          ]} /></section>
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
    e.preventDefault(); setLoading(true); setMessage(''); setCustomer(null)
    const { data, error } = await supabase.rpc('search_customer_by_phone', { p_phone: phone.trim() })
    if (error) setMessage(`خطأ البحث: ${error.message}`)
    else if (!data?.length) setMessage('لم يتم العثور على عميل بهذا الرقم.')
    else setCustomer(data[0])
    setLoading(false)
  }
  return <>
    <section className="panel"><h2>بحث العملاء</h2><p className="muted">ابحث باستخدام رقم جوال العميل.</p><form className="search" onSubmit={search}>
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XXXXXXXX" inputMode="tel" required /><button disabled={loading}>{loading ? 'جاري البحث...' : 'بحث'}</button>
    </form>{message && <div className="info">{message}</div>}</section>
    {customer && <><section className="panel customer"><div className="customer-icon">👤</div><div><h2>{customer.customer_name || 'عميل'}</h2><div className="customer-details"><span>📱 {customer.mobile || '—'}</span><span>✉️ {customer.email || '—'}</span><span>📍 {customer.city || '—'}</span></div></div></section>
      <section className="cards"><MetricCard label="عدد الطلبات" value={number(customer.total_orders)} /><MetricCard label="إجمالي المشتريات" value={money(customer.total_spent)} /><MetricCard label="متوسط الطلب" value={money(customer.average_order_value)} /><MetricCard label="طلبات بها استرجاع" value={number(customer.refunded_orders)} /></section>
      <section className="panel details"><div><span>أول طلب</span><strong>{date(customer.first_order_at)}</strong></div><div><span>آخر طلب</span><strong>{date(customer.last_order_at)}</strong></div><div><span>إجمالي المسترجع</span><strong>{money(customer.total_refunded)}</strong></div></section></>}
  </>
}

function Dashboard({ profile }) {
  const [page, setPage] = useState('overview')
  const canSearchCustomers = ['owner', 'admin', 'customer_service'].includes(profile.role)
  return <div className="dashboard">
    <aside><div className="side-logo"><div className="logo small">L</div><div><strong>لوفيكا</strong><span>Analytics V5</span></div></div>
      <nav className="side-nav"><button type="button" onClick={() => setPage('overview')} className={page === 'overview' ? 'nav-active' : ''}>◫ الرئيسية</button>
        {canSearchCustomers && <button type="button" onClick={() => setPage('customers')} className={page === 'customers' ? 'nav-active' : ''}>⌕ بحث العملاء</button>}</nav>
      <div className="user"><strong>{profile.full_name || 'مستخدم'}</strong><span>{profile.role}</span><button className="logout" onClick={() => supabase.auth.signOut()}>تسجيل الخروج</button></div>
    </aside>
    <main className="main"><header><div><div className="eyebrow">LOVICA ANALYTICS</div><h1>{page === 'overview' ? 'الرئيسية' : 'بحث العملاء'}</h1></div><div className="safe">✓ جلسة محمية</div></header>
      {page === 'overview' && <Overview />}{page === 'customers' && canSearchCustomers && <CustomerSearch />}
    </main>
  </div>
}

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    let active = true
    const hash = window.location.hash || ''
    const looksLikeRecovery = hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('type') === 'recovery'
    if (looksLikeRecovery) setRecoveryMode(true)

    async function loadProfile(user) {
      if (!user) { if (active) { setProfile(null); setLoading(false) }; return }
      const { data, error } = await supabase.from('profiles').select('user_id, full_name, role, active').eq('user_id', user.id).single()
      if (!active) return
      if (error) { console.error('Profile load error:', error); setProfile(null) } else setProfile(data)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) { setLoading(false); return }
      setSession(data.session)
      if (looksLikeRecovery && data.session) { setRecoveryMode(true); setLoading(false); return }
      loadProfile(data.session?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') { setRecoveryMode(true); setLoading(false); return }
      if (recoveryMode) { setLoading(false); return }
      setLoading(true)
      await loadProfile(nextSession?.user)
    })

    return () => { active = false; subscription.unsubscribe() }
  }, [recoveryMode])

  if (loading) return <div className="loading">جاري تحميل لوحة لوفيكا...</div>
  if (recoveryMode && session) return <ResetPassword onDone={() => setRecoveryMode(false)} />
  if (!session) return <Login />
  if (!profile?.active) return <div className="loading">الحساب غير مخوّل أو غير نشط.</div>
  return <Dashboard profile={profile} />
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
