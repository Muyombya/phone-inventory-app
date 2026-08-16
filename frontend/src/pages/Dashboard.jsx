import DailyIntelligenceBrief from "./DailyIntelligenceBrief";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function money(value) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgoISO(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function startOfMonthISO() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function welcomeMessage(name) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${greeting}${name ? `, ${name}` : ""}`;
}

function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const today = todayISO();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("today");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  useEffect(() => {
    let active = true;

    async function loadReport() {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/reports", { params: { startDate, endDate } });
        if (active) setReport(response.data);
      } catch (err) {
        console.error(err);
        if (active) setError(err?.response?.data?.message || "Unable to load GadgetShop dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadReport();
    return () => { active = false; };
  }, [startDate, endDate]);

  function applyRange(value) {
    const currentDay = todayISO();
    setRange(value);
    if (value === "today") {
      setStartDate(currentDay);
      setEndDate(currentDay);
    } else if (value === "7days") {
      setStartDate(daysAgoISO(6));
      setEndDate(currentDay);
    } else if (value === "30days") {
      setStartDate(daysAgoISO(29));
      setEndDate(currentDay);
    } else if (value === "month") {
      setStartDate(startOfMonthISO());
      setEndDate(currentDay);
    }
  }

  const stock = report?.stock;
  const summary = report?.summary;
  const insights = report?.ai?.insights || [];
  const branches = stock?.branches || [];

  const health = useMemo(() => {
    const models = stock?.models || [];

    return {
      healthy: models.filter((m) => m.status === "Healthy").length,
      low: models.filter((m) => m.status === "Low").length,
      critical: models.filter((m) => m.status === "Critical").length,
      finished: models.filter((m) => m.status === "Out of Stock").length,
    };
  }, [stock]);

  if (loading) {
    return (
      <div className="p-6 text-gray-500">
        Loading GadgetShop command center...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-5">
      {/* =========================
          COMMAND CENTER HEADER
      ========================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6b0f1a]">
            GadgetShop
          </p>

          <h1 className="text-3xl font-black mt-1">{welcomeMessage(user?.name || user?.username)}</h1>

          <p className="text-gray-500 mt-1">
            Command Center · What is happening and what needs attention.
          </p>
        </div>

        <Link
          to="/reports"
          className="inline-flex items-center justify-center rounded-lg bg-[#6b0f1a] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Open Business Intelligence →
        </Link>
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold">Business Intelligence period</h2>
            <p className="text-sm text-gray-500">Choose a quick view or set an exact reporting window.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[["today", "Today"], ["7days", "Last 7 days"], ["30days", "Last 30 days"], ["month", "This month"]].map(([value, label]) => (
              <button key={value} type="button" onClick={() => applyRange(value)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${range === value ? "bg-[#6b0f1a] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <label className="text-sm font-medium text-gray-700">From<input type="date" value={startDate} max={endDate} onChange={(event) => { setRange("custom"); setStartDate(event.target.value); }} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
          <label className="text-sm font-medium text-gray-700">To<input type="date" value={endDate} min={startDate} max={todayISO()} onChange={(event) => { setRange("custom"); setEndDate(event.target.value); }} className="mt-1 block w-full rounded-lg border px-3 py-2" /></label>
        </div>
      </section>

      {/* =========================
          DAILY INTELLIGENCE BRIEF
          Full-width attention layer
      ========================= */}
      <DailyIntelligenceBrief startDate={startDate} endDate={endDate} />

      {/* =========================
          CORE KPI STRIP
      ========================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs text-gray-500">
            Today's Sales
          </p>
          <p className="text-xl font-black mt-1">
            {money(summary?.netRevenue)}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs text-gray-500">
            Phones Sold
          </p>
          <p className="text-2xl font-black mt-1">
            {summary?.unitsSold || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs text-gray-500">
            Current Stock
          </p>
          <p className="text-2xl font-black mt-1">
            {stock?.summary?.units || 0}
          </p>
        </div>

        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs text-gray-500">
            Stock Value
          </p>
          <p className="text-xl font-black mt-1">
            {money(stock?.summary?.stockValue)}
          </p>
        </div>

        <Link
          to="/reports"
          className="bg-white rounded-xl border p-4 shadow-sm hover:border-[#6b0f1a] transition-colors"
        >
          <p className="text-xs text-gray-500">
            Management Attention
          </p>
          <p className="text-2xl font-black mt-1">
            {insights.length}
          </p>
          <p className="text-xs font-semibold text-[#6b0f1a] mt-1">
            Review in BI →
          </p>
        </Link>
      </div>

      {/* =========================
          STOCK HEALTH
      ========================= */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-lg font-bold">
              Stock Health
            </h2>

            <p className="text-sm text-gray-500">
              A quick company or branch-scoped view of current stock.
            </p>
          </div>

          <Link
            to="/inventory"
            className="text-sm font-semibold text-[#6b0f1a]"
          >
            Open Inventory →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg bg-emerald-50 p-3">
            <p className="text-xs text-emerald-700">
              Healthy
            </p>
            <p className="text-2xl font-black text-emerald-800">
              {health.healthy}
            </p>
          </div>

          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-xs text-amber-700">
              Low
            </p>
            <p className="text-2xl font-black text-amber-800">
              {health.low}
            </p>
          </div>

          <div className="rounded-lg bg-red-50 p-3">
            <p className="text-xs text-red-700">
              Critical
            </p>
            <p className="text-2xl font-black text-red-800">
              {health.critical}
            </p>
          </div>

          <div className="rounded-lg bg-gray-100 p-3">
            <p className="text-xs text-gray-600">
              Finished
            </p>
            <p className="text-2xl font-black text-gray-800">
              {health.finished}
            </p>
          </div>
        </div>
      </div>

      {/* =========================
          BRANCH PULSE
      ========================= */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold">
              Branch Pulse
            </h2>

            <p className="text-sm text-gray-500">
              Current stock position at a glance.
            </p>
          </div>

          <Link
            to="/reports"
            className="text-sm font-semibold text-[#6b0f1a]"
          >
            Analyze →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="rounded-lg border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold truncate">
                  {branch.name}
                </p>

                <span className="text-sm font-black">
                  {branch.units}
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-1">
                {branch.models} model variants
              </p>

              <p className="text-sm font-semibold mt-2">
                {money(branch.stockValue)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
