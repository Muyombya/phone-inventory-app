import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const KAMPALA = "Africa/Kampala";
const SALES_LOOKBACK_DAYS = 30;
const SLOW_MOVING_DAYS = 30;
const AGEING_DAYS = 60;

function dateKey(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KAMPALA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}
function dateDaysAgo(days) { const date = new Date(); date.setDate(date.getDate() - days); return dateKey(date); }
function money(value) { return `UGX ${Number(value || 0).toLocaleString()}`; }
function daysSince(value) { const date = value ? new Date(value) : null; return !date || Number.isNaN(date.getTime()) ? null : Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000)); }
function humanDate(value) { const date = value ? new Date(value) : null; return !date || Number.isNaN(date.getTime()) ? "an unknown time" : new Intl.DateTimeFormat("en-UG", { timeZone: KAMPALA, month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date); }
function list(value) { return Array.isArray(value) ? value : []; }
function modelName(item) { return [item?.brand, item?.model, item?.ram, item?.storage].filter(Boolean).join(" ") || item?.itemName || item?.name || "Unknown model"; }
function stockLink(item, inventory = false) { const search = encodeURIComponent(modelName(item)); return inventory ? `/inventory?tab=history&search=${search}` : `/stock-lookup?search=${search}`; }
function auditNeedsAttention(log) { const action = String(log?.action || "").toUpperCase(); return ["DELETE", "DELETE_SALE", "UPDATE", "ADJUSTMENT", "RETURN", "RETURN_SALE"].some((key) => action.includes(key)); }
function auditSentence(log) { return log?.description || `${log?.itemName || log?.entityType || "Inventory"} activity was recorded.`; }

export default function DailyIntelligenceBrief({ compact = false, startDate, endDate }) {
  const user = useMemo(() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } }, []);
  const [report, setReport] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const branchId = user?.role === "manager" ? null : user?.branch?._id || user?.branch;
      const params = new URLSearchParams({ startDate: startDate || dateDaysAgo(SALES_LOOKBACK_DAYS), endDate: endDate || dateKey() });
      if (branchId) params.append("branchId", branchId);
      const catalogUrl = `/reports/product-catalog?limit=200${branchId ? `&branchId=${encodeURIComponent(branchId)}` : ""}`;
      const [dashboardResponse, catalogResponse, auditResponse] = await Promise.all([
        api.get(`/reports?${params.toString()}`), api.get(catalogUrl).catch(() => null), api.get("/audits").catch(() => ({ data: [] })),
      ]);
      if (!active) return;
      setReport(dashboardResponse?.data || null); setCatalog(list(catalogResponse?.data?.products)); setAudits(list(auditResponse?.data)); setLoading(false);
    }
    load().catch((error) => { console.error("Management Brief load failed:", error); if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, startDate, endDate]);

  const stock = report?.stock;
  const stockModels = list(stock?.models);
  const critical = stockModels.filter((item) => item.status === "Critical");
  const low = stockModels.filter((item) => item.status === "Low");
  const finished = catalog.filter((item) => item.status === "Historical / Sold Out");
  const topSellers = list(report?.topProducts).slice(0, 3);
  const transfers = list(report?.ai?.insights).filter((item) => item?.title === "Internal transfer opportunity");
  const recentAudits = [...audits].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
  const attentionAudits = audits.filter(auditNeedsAttention).slice(0, 3);
  const slowMoving = catalog.filter((item) => item?.currentStock && (!item.lastSoldAt || daysSince(item.lastSoldAt) >= SLOW_MOVING_DAYS)).sort((a, b) => (daysSince(b.lastSoldAt) ?? Infinity) - (daysSince(a.lastSoldAt) ?? Infinity)).slice(0, 4);
  const ageing = stockModels.map((item) => {
    const oldest = list(item.phones).map((phone) => daysSince(phone.addedAt)).filter((days) => days !== null).sort((a, b) => b - a)[0];
    return oldest >= AGEING_DAYS ? { ...item, oldestDays: oldest } : null;
  }).filter(Boolean).sort((a, b) => b.oldestDays - a.oldestDays).slice(0, 4);
  const actions = [
    ...finished.map((item) => ({ priority: 1, text: `Replenish finished model: ${modelName(item)}.`, to: stockLink(item) })),
    ...critical.map((item) => ({ priority: 1, text: `Protect or replenish critical stock: ${modelName(item)} (${item.total} unit${item.total === 1 ? "" : "s"}).`, to: stockLink(item) })),
    ...transfers.map((item) => ({ priority: 2, text: item.message, to: item.drillDown?.path || "/stock-lookup" })),
    ...slowMoving.map((item) => ({ priority: 3, text: `Review slow/no movement: ${modelName(item)}${item.lastSoldAt ? `; last sold ${daysSince(item.lastSoldAt)} days ago` : "; no recorded sale"}.`, to: stockLink(item, true) })),
    ...attentionAudits.map((item) => ({ priority: 2, text: `Review recorded activity: ${auditSentence(item)}`, to: "/audit-logs" })),
    ...low.map((item) => ({ priority: 4, text: `Plan replenishment for low stock: ${modelName(item)} (${item.total} units).`, to: stockLink(item) })),
  ].sort((a, b) => a.priority - b.priority).slice(0, 6);

  if (loading) return <section className="rounded-2xl border bg-white p-4 shadow-sm animate-pulse"><div className="h-5 w-56 rounded bg-gray-200" /><div className="mt-3 h-20 rounded bg-gray-100" /></section>;
  const scope = report?.scope?.branchName || "your current scope";
  const periodLabel = startDate && endDate ? `${startDate} to ${endDate}` : `the last ${SALES_LOOKBACK_DAYS} days`;
  return <section className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${compact ? "" : "mb-5"}`}>
    <div className="border-b bg-gradient-to-r from-[#6b0f1a] to-[#8b1e2d] px-4 py-3 text-white"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs uppercase tracking-[0.18em] opacity-80">GadgetShop manager view</div><h2 className="text-lg font-black">Management Brief</h2><p className="text-xs opacity-85">{scope} • sales activity from {periodLabel}</p></div><div className="self-start rounded-full bg-white/15 px-3 py-1 text-xs">{actions.length ? `${actions.length} action${actions.length === 1 ? "" : "s"} to review` : "No management actions identified"}</div></div></div>
    <div className="grid grid-cols-2 gap-3 border-b bg-gray-50 p-4 lg:grid-cols-4"><Metric title="Current stock" value={`${stock?.summary?.units || 0} units`} detail={`${stock?.summary?.models || 0} model variants`} to="/inventory" /><Metric title="Retail stock value" value={money(stock?.summary?.stockValue)} detail={stock?.summary?.stockCostValue ? `Cost basis: ${money(stock.summary.stockCostValue)}` : null} to="/inventory" /><Metric title="Units sold" value={report?.summary?.unitsSold || 0} detail={periodLabel} to="/reports" /><Metric title="Net sales" value={money(report?.summary?.netRevenue)} detail={periodLabel} to="/reports" /></div>
    <div className="grid gap-3 p-4 xl:grid-cols-2">
      <Card title="What needs my action today" tone="red" link={{ to: "/reports", label: "Open full BI" }}>{actions.length ? <ul className="space-y-2">{actions.map((action, index) => <li key={`${action.text}-${index}`} className="text-sm text-gray-700"><Link to={action.to} className="font-semibold text-[#6b0f1a] hover:underline">{index + 1}. {action.text}</Link></li>)}</ul> : <p className="text-sm text-gray-700">No urgent stock, movement, or sales action is identified from the available records.</p>}</Card>
      <Card title="Top sellers" tone="green" link={{ to: "/reports", label: "Open sales report" }}>{topSellers.length ? <ModelList items={topSellers} render={(item) => `${modelName(item)} — ${item.unitsSold} sold • ${money(item.revenue)}`} /> : <p className="text-sm text-gray-700">No completed phone sales were recorded in the last {SALES_LOOKBACK_DAYS} days.</p>}</Card>
      <Card title="Stock by model" tone="amber" link={{ to: "/inventory", label: "Review inventory" }}>{critical.length || low.length || finished.length ? <div className="space-y-2 text-sm text-gray-700"><StatusModels label="Finished" items={finished} /><StatusModels label="Critical" items={critical} count /><StatusModels label="Low" items={low} count /></div> : <p className="text-sm text-gray-700">No critical, low, or finished models are identified.</p>}</Card>
      <Card title="Branch stock & transfer opportunity" tone="purple" link={{ to: "/stock-lookup", label: "Compare branch stock" }}>{transfers.length ? <ModelList items={transfers} render={(item) => item.message} /> : <><p className="text-sm text-gray-700">No supported transfer opportunity is currently identified.</p><div className="mt-2 grid grid-cols-2 gap-2 text-xs">{list(stock?.branches).slice(0, 4).map((branch) => <div key={branch.id} className="rounded border bg-white p-2"><b>{branch.name}</b><br />{branch.units} units • {money(branch.stockValue)}</div>)}</div></>}</Card>
      {slowMoving.length > 0 && <Card title="Slow or no movement" tone="blue" link={{ to: "/inventory?tab=history", label: "Review product history" }}><ModelList items={slowMoving} inventory render={(item) => `${modelName(item)} — ${item.currentStock} in stock${item.lastSoldAt ? `; last sold ${daysSince(item.lastSoldAt)} days ago` : "; no recorded sale"}`} /></Card>}
      {ageing.length > 0 && <Card title="Stock ageing" tone="blue" link={{ to: "/inventory?tab=history", label: "Inspect ageing stock" }}><p className="mb-2 text-xs text-gray-600">Current units held for {AGEING_DAYS}+ days, based on their recorded intake date.</p><ModelList items={ageing} inventory render={(item) => `${modelName(item)} — oldest current unit held ${item.oldestDays} days`} /></Card>}
      <Card title="Recent stock movement" tone="gray" link={{ to: "/audit-logs", label: "Open audit logs" }}>{recentAudits.length ? <ul className="space-y-2">{recentAudits.map((item) => <li key={item._id} className="text-sm text-gray-700"><b>{humanDate(item.createdAt)}:</b> {auditSentence(item)}</li>)}</ul> : <p className="text-sm text-gray-700">No recent stock movement was found in the audit log.</p>}</Card>
    </div>
  </section>;
}

function Metric({ title, value, detail, to }) { return <Link to={to} className="rounded-xl border bg-white p-3 shadow-sm hover:border-[#6b0f1a]"><p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{title}</p><p className="mt-1 text-lg font-black">{value}</p>{detail && <p className="mt-1 text-xs text-gray-500">{detail}</p>}</Link>; }
function Card({ title, tone, children, link }) { const tones = { red: "border-red-200 bg-red-50", green: "border-emerald-200 bg-emerald-50", amber: "border-amber-200 bg-amber-50", purple: "border-purple-200 bg-purple-50", blue: "border-blue-200 bg-blue-50", gray: "border-gray-200 bg-gray-50" }; return <div className={`rounded-xl border p-3 ${tones[tone] || tones.gray}`}><h3 className="font-bold text-gray-900">{title}</h3><div className="mt-2">{children}</div><Link to={link.to} className="mt-3 inline-flex text-xs font-bold text-[#6b0f1a] underline underline-offset-2">{link.label} →</Link></div>; }
function ModelList({ items, render, inventory = false }) { return <ul className="space-y-1.5">{items.map((item, index) => <li key={`${modelName(item)}-${index}`} className="text-sm text-gray-700"><Link to={item.drillDown?.path || stockLink(item, inventory)} className="hover:text-[#6b0f1a] hover:underline">{render(item)}</Link></li>)}</ul>; }
function StatusModels({ label, items, count = false }) { if (!items.length) return null; return <div><span className="font-bold">{label}:</span> {items.slice(0, 4).map((item, index) => <span key={`${modelName(item)}-${index}`}><Link className="text-[#6b0f1a] hover:underline" to={stockLink(item)}>{modelName(item)}{count ? ` (${item.total})` : ""}</Link>{index < Math.min(items.length, 4) - 1 ? ", " : ""}</span>)}{items.length > 4 ? ` +${items.length - 4} more` : ""}</div>; }
