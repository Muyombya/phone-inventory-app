import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const KAMPALA = "Africa/Kampala";

function dateKey(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KAMPALA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function humanDate(value) {
  return new Intl.DateTimeFormat("en-UG", {
    timeZone: KAMPALA,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function modelName(item) {
  if (!item) return "Unknown model";
  return [item.brand, item.model].filter(Boolean).join(" ") || item.itemName || "Unknown model";
}

function aiLists(ai) {
  return {
    critical: normalizeArray(ai?.criticalModels || ai?.critical || ai?.stock?.criticalModels),
    low: normalizeArray(ai?.lowStockModels || ai?.low || ai?.stock?.lowStockModels),
    finished: normalizeArray(ai?.finishedModels || ai?.finished || ai?.stock?.finishedModels),
    transfers: normalizeArray(ai?.transferRecommendations || ai?.recommendedTransfers || ai?.transfers),
  };
}

function auditNeedsAttention(log) {
  const action = String(log?.action || "").toUpperCase();
  return ["DELETE", "DELETE_SALE", "UPDATE", "ADJUSTMENT", "RETURN", "RETURN_SALE"].some((key) => action.includes(key));
}

function auditSentence(log, branchName) {
  const action = String(log?.action || "").toUpperCase();
  const item = log?.itemName || log?.entityType || "record";
  const user = log?.user?.username || "a user";
  const source = log?.sourceBranch?.name;
  const destination = log?.destinationBranch?.name;

  if (action.includes("TRANSFER") && destination && source === branchName) {
    return `You made a transfer involving ${item} to ${destination}, recorded by ${user}.`;
  }
  if (action.includes("TRANSFER") && source && destination === branchName) {
    return `You received ${item} from ${source}, transferred by ${user}.`;
  }
  return log?.description || `${item} activity was recorded by ${user}.`;
}

export default function DailyIntelligenceBrief({ compact = false }) {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [stock, setStock] = useState(null);
  const [ai, setAi] = useState(null);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const branchId = user?.role === "manager" ? null : user?.branch?._id || user?.branch;

      const requests = [
        api.get(`/reports/current-stock${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ""}`),
        api.get("/reports/ai").catch(() => null),
        api.get("/audits").catch(() => ({ data: [] })),
      ];

      const [stockResponse, aiResponse, auditResponse] = await Promise.all(requests);
      if (!active) return;

      setStock(stockResponse?.data || null);
      setAi(aiResponse?.data || null);
      const auditData = normalizeArray(auditResponse?.data);
      const today = dateKey();
      setAudits(auditData.filter((log) => dateKey(log.createdAt) === today));
      setLoading(false);
    }

    load().catch(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user]);

  const lists = useMemo(() => aiLists(ai), [ai]);
  const attentionAudits = useMemo(() => audits.filter(auditNeedsAttention), [audits]);
  const transferAudits = useMemo(
    () => audits.filter((log) => String(log?.action || "").toUpperCase().includes("TRANSFER")),
    [audits]
  );

  const critical = lists.critical.length || Number(stock?.summary?.criticalModelsCount || 0);
  const low = lists.low.length || Number(stock?.summary?.lowStockModelsCount || 0);
  const finished = lists.finished.length;
  const attentionCount = critical + finished + attentionAudits.length;

  if (loading) {
    return (
      <section className="bg-white border rounded-2xl p-4 shadow-sm animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
        <div className="h-4 w-full bg-gray-100 rounded" />
      </section>
    );
  }

  return (
    <section className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${compact ? "" : "mb-5"}`}>
      <div className="px-4 py-3 border-b bg-gradient-to-r from-[#6b0f1a] to-[#8b1e2d] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] opacity-80">GadgetShop Business Intelligence</div>
            <h2 className="text-lg font-black">Today's Management Brief</h2>
          </div>
          <div className="text-xs bg-white/15 rounded-full px-3 py-1 self-start">
            {attentionCount ? `${attentionCount} item${attentionCount === 1 ? "" : "s"} require attention` : "No immediate attention required"}
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
        <BriefCard
          tone="red"
          title="Stock attention"
          body={
            critical || finished
              ? `${critical} critical, ${low} low-stock and ${finished} finished model${finished === 1 ? "" : "s"} identified.`
              : "Current stock is not reporting an immediate critical or finished position."
          }
          items={[...lists.finished, ...lists.critical].slice(0, 4).map(modelName)}
          link={{ to: "/inventory", label: "Review stock" }}
        />

        <BriefCard
          tone="purple"
          title="Transfers"
          body={
            lists.transfers.length
              ? `${lists.transfers.length} transfer recommendation${lists.transfers.length === 1 ? "" : "s"} are available.`
              : transferAudits.length
                ? `${transferAudits.length} transfer event${transferAudits.length === 1 ? "" : "s"} recorded today.`
                : "No transfer recommendation is currently available."
          }
          items={lists.transfers.slice(0, 3).map((item) => item?.statement || item?.reason || modelName(item))}
          link={{ to: "/audit-logs", label: "Review movement" }}
        />

        <BriefCard
          tone="amber"
          title="Operational attention"
          body={
            attentionAudits.length
              ? `${attentionAudits.length} audit activit${attentionAudits.length === 1 ? "y" : "ies"} may require review.`
              : "No audit activity has been flagged for management attention today."
          }
          items={attentionAudits.slice(0, 3).map((log) => auditSentence(log, user?.branch?.name))}
          link={{ to: "/audit-logs", label: "Review audit activity" }}
        />

        <BriefCard
          tone="blue"
          title="Daily intelligence"
          body="Use the full BI workspace for deeper stock, sales, movement and management recommendations."
          items={[]}
          link={{ to: "/reports", label: "Open Business Intelligence" }}
        />
      </div>

      {transferAudits.length > 0 && !compact && (
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-gray-50 border p-3">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">Today's movement</div>
            <div className="space-y-2">
              {transferAudits.slice(0, 3).map((log) => (
                <div key={log._id} className="text-sm text-gray-700">
                  <span className="font-semibold">{humanDate(log.createdAt)}:</span>{" "}
                  {auditSentence(log, user?.branch?.name)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function BriefCard({ tone, title, body, items, link }) {
  const toneMap = {
    red: "border-red-200 bg-red-50",
    purple: "border-purple-200 bg-purple-50",
    amber: "border-amber-200 bg-amber-50",
    blue: "border-blue-200 bg-blue-50",
  };

  return (
    <div className={`rounded-xl border p-3 ${toneMap[tone] || "bg-gray-50 border-gray-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-700 mt-1">{body}</p>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-gray-700">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="truncate">• {item}</li>
          ))}
        </ul>
      )}

      <Link to={link.to} className="inline-flex mt-3 text-xs font-bold underline underline-offset-2 text-gray-900">
        {link.label} →
      </Link>
    </div>
  );
}
