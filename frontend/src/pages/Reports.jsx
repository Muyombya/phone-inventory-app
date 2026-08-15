import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

const BRAND = "GadgetShop";

const todayKey = () => new Date().toISOString().slice(0, 10);
const dateDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

function money(value) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function dateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB");
}

function dateOnly(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

function KPI({ title, value, detail, accent = "text-gray-900" }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{title}</p>
      <p className={`mt-1 text-xl font-black ${accent}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs text-gray-500">{detail}</p> : null}
    </div>
  );
}

function Section({ title, subtitle, children, className = "" }) {
  return (
    <section className={`rounded-xl border bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function drillUrl(item) {
  const drill = item?.drillDown;
  if (!drill?.path) return null;
  const query = new URLSearchParams(drill.params || {}).toString();
  return query ? `${drill.path}?${query}` : drill.path;
}

function DrillLink({ item, label = "Drill into this" }) {
  const url = drillUrl(item);
  if (!url) return null;
  return (
    <Link
      to={url}
      className="inline-flex items-center rounded-md border border-[#6b0f1a]/20 bg-[#6b0f1a]/5 px-2.5 py-1 text-[11px] font-bold text-[#6b0f1a] hover:bg-[#6b0f1a]/10"
    >
      {label} →
    </Link>
  );
}

function Reports() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isManager = user?.role === "manager";

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "overview");
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [quickRange, setQuickRange] = useState("7days");
  const [startDate, setStartDate] = useState(dateDaysAgo(6));
  const [endDate, setEndDate] = useState(todayKey());

  const [dashboard, setDashboard] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [error, setError] = useState("");

  const branchQuery = branchId ? `&branchId=${encodeURIComponent(branchId)}` : "";
  const scopeLabel = dashboard?.scope?.branchName ||
    (branchId ? branches.find((b) => b._id === branchId)?.name : "All Branches") ||
    "Your Branch";

  async function loadBranches() {
    if (!isManager) return;
    try {
      const response = await api.get("/branches");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.branches || [];
      setBranches(data);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(
        `/reports?startDate=${startDate}&endDate=${endDate}${branchQuery}`
      );
      setDashboard(response.data);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Unable to load management intelligence.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSales() {
    setLoadingTab(true);
    try {
      const response = await api.get(
        `/reports/branch-sales?startDate=${startDate}&endDate=${endDate}${branchQuery}`
      );
      setSalesReport(response.data);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Unable to load branch sales.");
    } finally {
      setLoadingTab(false);
    }
  }

  async function loadAI() {
    setLoadingTab(true);
    setError("");
    try {
      const response = await api.get(
        `/reports/ai?startDate=${startDate}&endDate=${endDate}${branchQuery}`
      );
      setAiReport(response.data);
    } catch (err) {
      console.log(err);

      // The management report already contains deterministic GadgetShop
      // intelligence. If the dedicated AI endpoint is temporarily
      // unavailable, keep that intelligence visible instead of showing
      // a contradictory red error banner.
      if (dashboard?.ai) {
        setAiReport(dashboard.ai);
        return;
      }

      setError(err.response?.data?.message || "Unable to load Business AI.");
    } finally {
      setLoadingTab(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [startDate, endDate, branchId]);

  useEffect(() => {
    if (tab === "sales") loadSales();
    if (tab === "ai") loadAI();
  }, [tab, startDate, endDate, branchId]);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (requestedTab && ["overview", "sales", "ai"].includes(requestedTab) && requestedTab !== tab) {
      setTab(requestedTab);
    }
  }, [searchParams]);

  function applyQuickRange(value) {
    setQuickRange(value);
    const today = todayKey();
    if (value === "today") {
      setStartDate(today);
      setEndDate(today);
    } else if (value === "7days") {
      setStartDate(dateDaysAgo(6));
      setEndDate(today);
    } else if (value === "30days") {
      setStartDate(dateDaysAgo(29));
      setEndDate(today);
    } else if (value === "month") {
      const d = new Date();
      setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10));
      setEndDate(today);
    }
  }

  function printReport() {
    window.print();
  }

  if (loading && !dashboard) {
    return <div className="p-6 text-sm text-gray-500">Loading GadgetShop Business Intelligence...</div>;
  }

  const summary = dashboard?.summary || {};
  const sales = salesReport || dashboard?.sales || null;
  const ai = aiReport || dashboard?.ai;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-5">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          html, body { background: white !important; }
          .gadgetshop-screen-only { display: none !important; }
          .gadgetshop-print { display: block !important; }
          table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; break-inside: auto; page-break-inside: auto; }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
          tr { break-inside: avoid !important; page-break-inside: avoid !important; }
          th, td { padding: 3px 4px !important; font-size: 8px !important; vertical-align: top !important; white-space: normal !important; overflow: visible !important; }
          .print-section { break-inside: auto; page-break-inside: auto; }
          .shadow-sm { box-shadow: none !important; }
          .border { border-color: #d1d5db !important; }
        }
        .gadgetshop-print { display: none; }
      `}</style>

      <div className="gadgetshop-print text-black">
        <div className="border-b-2 border-[#6b0f1a] pb-3 mb-4">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">{BRAND}</p>
              <h1 className="text-3xl font-black text-[#6b0f1a]">Executive Sales Performance Report</h1>
              <p className="text-xs text-gray-600 mt-1">Detailed permanent sales history and management performance.</p>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p><strong>Branch:</strong> {scopeLabel}</p>
              <p><strong>Period:</strong> {dateOnly(startDate)} – {dateOnly(endDate)}</p>
              <p><strong>Generated:</strong> {dateTime(new Date())}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          <KPI title="Units Sold" value={summary.unitsSold || 0} detail={`${summary.transactions || 0} transactions`} />
          <KPI title="Gross Revenue" value={money(summary.grossRevenue)} />
          <KPI title="Discounts" value={money(summary.discounts)} />
          <KPI title="Returns" value={money(summary.returnedRevenue)} accent="text-red-700" />
          <KPI title="Net Revenue" value={money(summary.netRevenue)} accent="text-green-700" />
        </div>

        <section className="print-section mb-5">
          <h2 className="text-lg font-black border-b pb-2 mb-2">Sales Performance by Product</h2>
          <table>
            <thead><tr className="border-b-2 text-left"><th>Rank</th><th>Product</th><th className="text-right">Units</th><th className="text-right">Revenue</th>{isManager && <th className="text-right">Profit</th>}</tr></thead>
            <tbody>{(sales?.topProducts || []).map((item, index) => <tr key={`${item.brand}-${item.model}`} className="border-b"><td>{index + 1}</td><td className="font-semibold">{item.brand} {item.model}</td><td className="text-right">{item.unitsSold}</td><td className="text-right">{money(item.revenue)}</td>{isManager && <td className="text-right">{money(item.profit)}</td>}</tr>)}</tbody>
          </table>
        </section>

        <section className="print-section mb-5">
          <h2 className="text-lg font-black border-b pb-2 mb-2">Detailed Sales Transactions</h2>
          <table>
            <thead><tr className="border-b-2 text-left"><th>Date</th><th>Receipt</th><th>Product</th><th>IMEI</th><th>Colour</th><th>RAM</th><th>Storage</th><th>Branch</th><th>Attendant</th><th className="text-right">Final Price</th><th className="text-right">Discount</th>{isManager && <th className="text-right">Profit</th>}<th>Payment</th></tr></thead>
            <tbody>{(sales?.transactions || []).map((row, index) => <tr key={`${row.saleId}-${row.imei}-${index}`} className="border-b"><td>{dateTime(row.date)}</td><td>{row.receiptNumber}</td><td className="font-semibold">{row.brand} {row.model}</td><td>{row.imei}</td><td>{row.color}</td><td>{row.ram}</td><td>{row.storage}</td><td>{row.branch}</td><td>{row.attendant}</td><td className="text-right">{money(row.finalPrice)}</td><td className="text-right">{row.discount}%</td>{isManager && <td className="text-right">{money(row.profit)}</td>}<td>{row.paymentMethod}</td></tr>)}</tbody>
          </table>
        </section>

        <div className="grid grid-cols-2 gap-5 print-section">
          <section>
            <h2 className="text-lg font-black border-b pb-2 mb-2">Attendant Performance</h2>
            <table><thead><tr className="border-b-2 text-left"><th>Attendant</th><th className="text-right">Units</th><th className="text-right">Revenue</th></tr></thead><tbody>{(sales?.attendants || []).map((row) => <tr key={row.attendant} className="border-b"><td>{row.attendant}</td><td className="text-right">{row.unitsSold}</td><td className="text-right">{money(row.revenue)}</td></tr>)}</tbody></table>
          </section>
          <section>
            <h2 className="text-lg font-black border-b pb-2 mb-2">Payment Performance</h2>
            <table><thead><tr className="border-b-2 text-left"><th>Payment Method</th><th className="text-right">Units</th><th className="text-right">Revenue</th></tr></thead><tbody>{(sales?.payments || []).map((row) => <tr key={row.paymentMethod} className="border-b"><td>{row.paymentMethod}</td><td className="text-right">{row.units}</td><td className="text-right">{money(row.revenue)}</td></tr>)}</tbody></table>
          </section>
        </div>

        <section className="mt-6 print-section">
          <h2 className="text-lg font-black border-b pb-2 mb-2">AI Business Intelligence</h2>
          {ai?.summary ? <p className="text-sm leading-6 mb-3">{ai.summary}</p> : null}
          {(ai?.insights || []).map((item, index) => (
            <div key={`print-ai-${index}`} className="mb-3">
              <p className="font-bold">{item.title}</p>
              <p className="text-sm">{item.message}</p>
              {Array.isArray(item.evidence) && item.evidence.length ? <ul className="list-disc pl-5 text-xs text-gray-600">{item.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul> : null}
            </div>
          ))}
          {ai?.recommendedActions?.length ? <div className="mt-3"><p className="font-bold">Recommended Actions</p><ul className="list-disc pl-5 text-sm">{ai.recommendedActions.map((item, index) => <li key={`print-action-${index}`}>{item}</li>)}</ul></div> : null}
        </section>

        <div className="mt-5 border-t pt-2 text-[10px] text-gray-500 flex justify-between"><span>GadgetShop • Executive Sales Performance</span><span>Confidential business report</span></div>
      </div>

      <div className="gadgetshop-screen-only space-y-5">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">{BRAND} • Reporting & Business Intelligence</p>
            <h1 className="mt-1 text-3xl font-black text-[#6b0f1a]">Management Intelligence</h1>
            <p className="mt-1 text-sm text-gray-500">Facts first. Historical context. AI-assisted interpretation.</p>
          </div>
          <button onClick={printReport} className="rounded-lg bg-[#6b0f1a] px-5 py-3 text-sm font-bold text-white shadow-sm hover:opacity-90">Print Executive Report</button>
        </header>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <label className="text-sm font-semibold">From<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
            <label className="text-sm font-semibold">To<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
            {isManager ? (
              <label className="text-sm font-semibold">Branch<select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2"><option value="">All Branches</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></label>
            ) : (
              <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs font-bold uppercase text-gray-500">Branch Scope</p><p className="mt-1 font-semibold">{scopeLabel}</p></div>
            )}
            <label className="text-sm font-semibold">Quick Range<select value={quickRange} onChange={(e) => applyQuickRange(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2"><option value="today">Today</option><option value="7days">Last 7 Days</option><option value="30days">Last 30 Days</option><option value="month">This Month</option><option value="custom">Custom</option></select></label>
            <button onClick={loadDashboard} className="self-end rounded-lg bg-gray-900 px-4 py-2 font-bold text-white">Refresh Intelligence</button>
          </div>
        </div>

        {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div> : null}

        <nav className="flex flex-wrap gap-2">
          {[["overview", "Management Overview"], ["sales", "Branch Sales"], ["ai", "AI Insights"]].map(([value, label]) => (
            <button key={value} onClick={() => { setTab(value); setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set("tab", value); return next; }); }} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === value ? "bg-[#6b0f1a] text-white" : "border bg-white text-gray-800"}`}>{label}</button>
          ))}
        </nav>

        {tab === "overview" && (
          <>
            <Section title="Executive Summary" subtitle={`${scopeLabel} • ${dateOnly(startDate)} – ${dateOnly(endDate)}`}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <KPI title="Phones Sold" value={summary.unitsSold || 0} detail={`${summary.transactions || 0} transactions`} />
                <KPI title="Net Revenue" value={money(summary.netRevenue)} accent="text-green-700" />
                <KPI title="Returns" value={money(summary.returnedRevenue)} accent="text-red-700" />
              </div>
            </Section>

            <Section title="Sales Performance" subtitle="Detailed performance from permanent sales history for the selected period.">
              <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left"><th className="px-3 py-2">Product</th><th className="px-3 py-2 text-right">Units</th><th className="px-3 py-2 text-right">Revenue</th>{isManager && <th className="px-3 py-2 text-right">Profit</th>}</tr></thead><tbody>{(sales?.topProducts || []).map((item) => <tr key={`${item.brand}-${item.model}`} className="border-b"><td className="px-3 py-2 font-semibold"><div>{item.brand} {item.model}</div><Link className="text-[11px] font-bold text-[#6b0f1a] hover:underline" to={`/stock-lookup?search=${encodeURIComponent(`${item.brand} ${item.model}`)}`}>View stock →</Link></td><td className="px-3 py-2 text-right">{item.unitsSold}</td><td className="px-3 py-2 text-right">{money(item.revenue)}</td>{isManager && <td className="px-3 py-2 text-right">{money(item.profit)}</td>}</tr>)}</tbody></table></div>
            </Section>
          </>
        )}

        {tab === "sales" && (
          <Section title="Branch Sales Report" subtitle={salesReport ? `${salesReport.scope.branchName} • ${dateOnly(startDate)} – ${dateOnly(endDate)}` : "Detailed permanent sales history."}>
            {loadingTab && !salesReport ? <p className="text-sm text-gray-500">Loading sales report...</p> : <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-6"><KPI title="Units Sold" value={salesReport?.summary?.unitsSold || 0} /><KPI title="Transactions" value={salesReport?.summary?.transactions || 0} /><KPI title="Gross Revenue" value={money(salesReport?.summary?.grossRevenue)} /><KPI title="Returns" value={money(salesReport?.summary?.returnedRevenue)} accent="text-red-700" /><KPI title="Net Revenue" value={money(salesReport?.summary?.netRevenue)} accent="text-green-700" /><KPI title="Models" value={salesReport?.summary?.modelsSold || 0} /></div>
              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">{salesReport?.narrative}</div>
              <div className="mt-5 overflow-x-auto"><table className="min-w-[1450px] text-sm"><thead><tr className="border-b bg-gray-50 text-left"><th className="px-2 py-2">Date</th><th className="px-2 py-2">Receipt</th><th className="px-2 py-2">Model</th><th className="px-2 py-2">IMEI</th><th className="px-2 py-2">Colour</th><th className="px-2 py-2">RAM</th><th className="px-2 py-2">Storage</th><th className="px-2 py-2 text-right">Final Price</th><th className="px-2 py-2 text-right">Discount</th>{isManager && <th className="px-2 py-2 text-right">Profit</th>}<th className="px-2 py-2">Attendant</th><th className="px-2 py-2">Payment</th></tr></thead><tbody>{(salesReport?.transactions || []).map((row, index) => <tr key={`${row.saleId}-${row.imei}-${index}`} className="border-b"><td className="px-2 py-2">{dateTime(row.date)}</td><td className="px-2 py-2">{row.receiptNumber}</td><td className="px-2 py-2 font-semibold">{row.brand} {row.model}</td><td className="px-2 py-2">{row.imei}</td><td className="px-2 py-2">{row.color}</td><td className="px-2 py-2">{row.ram}</td><td className="px-2 py-2">{row.storage}</td><td className="px-2 py-2 text-right">{money(row.finalPrice)}</td><td className="px-2 py-2 text-right">{row.discount}%</td>{isManager && <td className="px-2 py-2 text-right">{money(row.profit)}</td>}<td className="px-2 py-2">{row.attendant}</td><td className="px-2 py-2">{row.paymentMethod}</td></tr>)}</tbody></table></div>
            </>}
          </Section>
        )}

        {tab === "ai" && (
          <Section title="AI Business Intelligence" subtitle="Interpretation is deliberately separated from the deterministic reporting facts.">
            {loadingTab && !aiReport ? <p className="text-sm text-gray-500">Loading Business AI...</p> : <>
              {ai?.summary ? <div className="rounded-lg border bg-gray-50 p-4 text-sm leading-6">{ai.summary}</div> : null}
              <div className="mt-4 space-y-3">{(ai?.insights || []).map((item, index) => <div key={index} className="rounded-lg border bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="font-bold">{item.title}</p><span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-bold uppercase">{item.type}</span></div><p className="mt-1 text-sm text-gray-600">{item.message}</p>{Array.isArray(item.evidence) && item.evidence.length ? <ul className="mt-2 list-disc pl-5 text-xs text-gray-500">{item.evidence.map((e, i) => <li key={i}>{typeof e === "string" ? e : JSON.stringify(e)}</li>)}</ul> : null}<div className="mt-3"><DrillLink item={item} label={item?.drillDown?.label || "Drill into this insight"} /></div></div>)}</div>
              {ai?.recommendedActions?.length ? <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4"><p className="font-bold text-blue-900">Recommended Actions</p><ul className="mt-2 list-disc pl-5 text-sm text-blue-900">{ai.recommendedActions.map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null}
              <p className="mt-4 text-xs text-gray-500">Provider: {ai?.provider || "local-rules-v1"}. Business facts remain generated by the Reporting Engine.</p>
            </>}
          </Section>
        )}
      </div>
    </div>
  );
}

export default Reports;
