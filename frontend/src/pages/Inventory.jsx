import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";
import { saveAs } from "file-saver";
import PhoneCatalogue from "./PhoneCatalogue";

const LOW_STOCK_LIMIT = 3;

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

function Badge({ status }) {
  const styles = {
    "In Stock": "bg-green-100 text-green-700",
    Low: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700",
    "Historical / Sold Out": "bg-gray-100 text-gray-700",
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${styles[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
}

function KPI({ title, value, detail }) {
  return <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{title}</p><p className="mt-1 text-xl font-black">{value}</p>{detail ? <p className="mt-1 text-xs text-gray-500">{detail}</p> : null}</div>;
}

function Inventory() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isManager = user?.role === "manager";

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "current");
  const [phones, setPhones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [stockScope, setStockScope] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stockReport, setStockReport] = useState(null);
  const [stockReportLoading, setStockReportLoading] = useState(false);

  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productHistory, setProductHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyTab, setHistoryTab] = useState("summary");

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    const requestedSearch = searchParams.get("search");
    const requestedProduct = searchParams.get("product");

    if (requestedTab === "history") {
      setTab("history");
      if (requestedSearch && !catalogSearch) setCatalogSearch(requestedSearch);
      if (requestedProduct && !catalogSearch) setCatalogSearch(requestedProduct);
    } else if (requestedTab === "current") {
      setTab("current");
      if (requestedSearch) setSearch(requestedSearch);
    } else if (requestedTab === "balancing" && isManager) {
      setTab("balancing");
    } else if (requestedTab === "catalogue") {
      setTab("catalogue");
    }
  }, [searchParams]);

  function changeTab(nextTab) {
    setTab(nextTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", nextTab);
      return next;
    });
  }

  async function fetchPhones() {
    try {
      setLoading(true);
      const res = await api.get("/phones");
      setPhones(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // PHONE ACTIONS
  // =========================
  async function deletePhone(id) {
    const confirmDelete = window.confirm("Delete this phone?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/phones/${id}`);
      await fetchPhones();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to delete phone");
    }
  }

  async function fetchCurrentStockReport(scope = stockScope) {
    setStockReportLoading(true);
    try {
      const query = scope ? `?branchId=${encodeURIComponent(scope)}` : "";
      const response = await api.get(`/reports/current-stock${query}`);
      setStockReport(response.data || null);
    } catch (error) {
      console.log(error);
      setStockReport(null);
    } finally {
      setStockReportLoading(false);
    }
  }

  async function fetchBranches() {
    if (!isManager) return;
    try {
      const response = await api.get("/branches");
      const data = Array.isArray(response.data) ? response.data : response.data?.branches || [];
      setBranches(data);
    } catch (error) {
      console.log(error);
    }
  }

  async function loadCatalog(searchValue = "") {
    setCatalogLoading(true);
    try {
      const scopeQuery = stockScope ? `&branchId=${encodeURIComponent(stockScope)}` : "";
      const response = await api.get(`/reports/product-catalog?search=${encodeURIComponent(searchValue)}&limit=120${scopeQuery}`);
      setCatalog(response.data?.products || []);
    } catch (error) {
      console.log(error);
    } finally {
      setCatalogLoading(false);
    }
  }

  async function loadProductHistory(product) {
    setSelectedProduct(product);
    setHistoryLoading(true);
    setHistoryError("");
    setHistoryTab("summary");
    try {
      const params = new URLSearchParams({ brand: product.brand, model: product.model });
      if (product.ram) params.set("ram", product.ram);
      if (product.storage) params.set("storage", product.storage);
      if (stockScope) params.set("branchId", stockScope);
      const response = await api.get(`/reports/product-history?${params.toString()}`);
      setProductHistory(response.data);
    } catch (error) {
      console.log(error);
      setHistoryError(error.response?.data?.message || "Unable to load product history.");
      setProductHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    fetchPhones();
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchCurrentStockReport(stockScope);
  }, [stockScope]);

  useEffect(() => {
    if (tab === "history") loadCatalog(catalogSearch);
  }, [tab, stockScope]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tab === "history") loadCatalog(catalogSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [catalogSearch, tab, stockScope]);

  const filteredPhones = useMemo(() => {
    const scoped = stockScope
      ? phones.filter((phone) => String(phone.branch?._id || phone.branch || "") === String(stockScope))
      : phones;
    const query = search.toLowerCase().trim();
    if (!query) return scoped;
    return scoped.filter((phone) => [phone.brand, phone.model, phone.storage, phone.ram, phone.color, phone.imei, phone.branch?.name].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [phones, search, stockScope]);

  // =========================
  // CURRENT STOCK VALUATION
  // =========================
  // Total Stock Value means the current retail value of physical stock,
  // matching the value used by the management dashboard.
  // Cost basis is kept separately and is only shown when recorded.
  const totalStockValue = useMemo(() => {
    return filteredPhones.reduce(
      (sum, phone) => sum + Number(phone.sellingPrice || 0),
      0
    );
  }, [filteredPhones]);

  const totalCostValue = useMemo(() => {
    return filteredPhones.reduce(
      (sum, phone) => sum + Number(phone.buyingPrice || 0),
      0
    );
  }, [filteredPhones]);

  const totalSellingValue = totalStockValue;
  const hasCostBasis = isManager && totalCostValue > 0;
  const totalPotentialProfit = hasCostBasis
    ? totalStockValue - totalCostValue
    : null;

  const stockMap = {};
  filteredPhones.forEach((phone) => {
    const key = `${phone.brand} ${phone.model}`;
    stockMap[key] ||= { brand: phone.brand, model: phone.model, count: 0 };
    stockMap[key].count += 1;
  });

  const lowStockModels = Object.values(stockMap).filter((item) => item.count <= LOW_STOCK_LIMIT).sort((a, b) => a.count - b.count);

  const branchSummary = useMemo(() => {
    if (Array.isArray(stockReport?.branches) && stockReport.branches.length) {
      return stockReport.branches
        .map((branch) => ({
          name: branch.name,
          units: Number(branch.units || 0),
          models: Number(branch.models || 0),
          stockValue: Number(branch.stockValue || 0),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const map = {};
    phones.forEach((phone) => {
      const branchName = phone.branch?.name || "Unknown Branch";
      map[branchName] ||= { name: branchName, units: 0, models: new Set(), stockValue: 0 };
      map[branchName].units += 1;
      map[branchName].models.add(`${phone.brand}|${phone.model}|${phone.ram}|${phone.storage}`);
      map[branchName].stockValue += Number(phone.sellingPrice || 0);
    });
    return Object.values(map)
      .map((row) => ({ ...row, models: row.models.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stockReport, phones]);

  const scopeLabel = stockScope
    ? branches.find((branch) => String(branch._id) === String(stockScope))?.name || "Selected Branch"
    : isManager ? "Company • All Branches" : "Your Branch";

  const balancingRows = useMemo(() => {
    if (!isManager || !Array.isArray(stockReport?.models) || !Array.isArray(stockReport?.branches)) return [];
    const branchNames = stockReport.branches.map((b) => String(b.name || "").trim()).filter(Boolean);
    const rows = [];
    for (const model of stockReport.models) {
      const positions = branchNames.map((branchName) => {
        const units = Number(model.branches?.[branchName] || 0);
        const status = units === 0 ? "OUT" : units === 1 ? "CRITICAL" : units <= LOW_STOCK_LIMIT ? "LOW" : "HEALTHY";
        return { branchName, units, status };
      });
      const destinations = positions.filter((p) => p.status !== "HEALTHY").sort((a,b) => a.units-b.units);
      const donors = positions.filter((p) => p.units > LOW_STOCK_LIMIT).sort((a,b) => b.units-a.units);
      for (const destination of destinations) {
        const donor = donors.find((p) => p.branchName !== destination.branchName);
        if (!donor) continue;
        rows.push({ key: `${model.brand}|${model.model}|${model.ram}|${model.storage}|${destination.branchName}|${donor.branchName}`, brand:model.brand, model:model.model, ram:model.ram, storage:model.storage, destination:destination.branchName, destinationUnits:destination.units, destinationStatus:destination.status, source:donor.branchName, sourceUnits:donor.units, quantity:1, priority:destination.status === "OUT" || destination.status === "CRITICAL" ? "HIGH" : "REVIEW" });
      }
    }
    return rows.sort((a,b) => ({HIGH:0,REVIEW:1}[a.priority]-({HIGH:0,REVIEW:1}[b.priority]) || a.destinationUnits-b.destinationUnits || b.sourceUnits-a.sourceUnits));
  }, [isManager, stockReport]);

  const balancingSummary = useMemo(() => ({
    opportunities: balancingRows.length,
    high: balancingRows.filter((r) => r.priority === "HIGH").length,
    review: balancingRows.filter((r) => r.priority === "REVIEW").length,
    destinations: new Set(balancingRows.map((r) => r.destination)).size,
  }), [balancingRows]);

  async function exportToExcel() {
    const XLSX = await import("xlsx");
    const data = filteredPhones.map((phone) => ({
      Brand: phone.brand,
      Model: phone.model,
      Storage: phone.storage,
      RAM: phone.ram,
      Colour: phone.color,
      IMEI: phone.imei,
      Branch: phone.branch?.name || "",
      DateAdded: phone.createdAt ? new Date(phone.createdAt).toLocaleString("en-GB") : "",
      SellingPrice: phone.sellingPrice,
      ...(isManager ? { BuyingPrice: phone.buyingPrice, Profit: Number(phone.sellingPrice || 0) - Number(phone.buyingPrice || 0) } : {}),
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Current Stock");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" }), "GadgetShop_Current_Stock.xlsx");
  }

  function printInventory() {
    window.print();
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading GadgetShop inventory...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-5">
      <style>{`@media print { @page { size: A4 landscape; margin: 9mm; } body { background:white!important; } .inventory-screen-only { display:none!important; } .inventory-print { display:block!important; } .product-history-print { display:block!important; } table { width:100%!important; table-layout:auto!important; border-collapse:collapse!important; } thead { display:table-header-group!important; } tr { break-inside:avoid!important; page-break-inside:avoid!important; } th,td { padding:3px 4px!important; font-size:8px!important; vertical-align:top!important; white-space:normal!important; overflow:visible!important; } .print-section { break-inside:auto; page-break-inside:auto; } } .inventory-print { display:none; } .product-history-print { display:none; }`}</style>

      {tab === "current" ? <div className="inventory-print text-black">
        <div className="border-b-2 border-[#6b0f1a] pb-3 mb-4 flex justify-between items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">GadgetShop</p><h1 className="text-2xl font-black text-[#6b0f1a]">Current Inventory Report</h1><p className="text-xs text-gray-500 mt-1">{scopeLabel} • Physical stock position at time of printing</p></div>
          <div className="text-right text-xs text-gray-600"><p><strong>Generated:</strong> {dateTime(new Date())}</p><p><strong>Units:</strong> {filteredPhones.length}</p><p><strong>Models:</strong> {Object.keys(stockMap).length}</p>{isManager ? <p><strong>Stock Value:</strong> {money(totalStockValue)}</p> : null}</div>
        </div>
        <table className="w-full text-xs"><thead><tr className="border-b-2 text-left"><th className="py-2">Brand</th><th className="py-2">Model</th><th className="py-2">RAM</th><th className="py-2">Storage</th><th className="py-2">Colour</th><th className="py-2">IMEI</th><th className="py-2">Branch</th><th className="py-2">Date Added</th><th className="py-2 text-right">Selling Price</th></tr></thead><tbody>{filteredPhones.map((phone) => <tr key={phone._id} className="border-b"><td className="py-1">{phone.brand}</td><td className="py-1">{phone.model}</td><td className="py-1">{phone.ram}</td><td className="py-1">{phone.storage}</td><td className="py-1">{phone.color}</td><td className="py-1">{phone.imei}</td><td className="py-1">{phone.branch?.name || "—"}</td><td className="py-1">{dateTime(phone.createdAt)}</td><td className="py-1 text-right">{money(phone.sellingPrice)}</td></tr>)}</tbody></table>
        <div className="mt-4 border-t pt-2 text-[10px] text-gray-500 flex justify-between"><span>GadgetShop • Inventory • {scopeLabel}</span><span>Confidential business report</span></div>
      </div> : null}

      {tab === "history" && productHistory ? <div className="product-history-print text-black">
        <div className="border-b-2 border-[#6b0f1a] pb-3 mb-4 flex justify-between items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">GadgetShop</p><h1 className="text-2xl font-black text-[#6b0f1a]">Product Lifetime History</h1><p className="text-sm font-bold mt-1">{productHistory.product.brand} {productHistory.product.model}</p><p className="text-xs text-gray-500 mt-1">{productHistory.product.ram || "Any RAM"} • {productHistory.product.storage || "Any Storage"}</p></div>
          <div className="text-right text-xs text-gray-600"><p><strong>Generated:</strong> {dateTime(new Date())}</p><p><strong>Current Stock:</strong> {productHistory.lifecycle.currentStock}</p></div>
        </div>
        <div className="grid grid-cols-6 gap-2 mb-5"><KPI title="First Stocked" value={dateOnly(productHistory.lifecycle.firstStockedAt)} /><KPI title="First Purchased" value={dateOnly(productHistory.lifecycle.firstPurchasedAt)} /><KPI title="Purchased" value={productHistory.lifecycle.totalPurchased} /><KPI title="Sold" value={productHistory.lifecycle.totalSold} /><KPI title="Returned" value={productHistory.lifecycle.totalReturned} /><KPI title="Current Stock" value={productHistory.lifecycle.currentStock} /></div>
        <h2 className="text-lg font-black border-b pb-2 mb-3">Sales History</h2>
        <table className="w-full text-xs"><thead><tr className="border-b-2 text-left"><th>Date</th><th>Receipt</th><th>IMEI</th><th>Colour</th><th>Branch</th><th>Attendant</th><th className="text-right">Final Price</th>{isManager && <th className="text-right">Profit</th>}</tr></thead><tbody>{(productHistory.salesHistory || []).map((sale,index) => <tr key={`${sale.receiptNumber}-${sale.imei}-${index}`} className="border-b"><td>{dateTime(sale.date)}</td><td>{sale.receiptNumber}</td><td>{sale.imei}</td><td>{sale.color}</td><td>{sale.branch}</td><td>{sale.attendant}</td><td className="text-right">{money(sale.finalPrice)}</td>{isManager && <td className="text-right">{money(sale.profit)}</td>}</tr>)}</tbody></table>
        <h2 className="text-lg font-black border-b pb-2 mb-3 mt-6">Inventory Events</h2>
        <table className="w-full text-xs"><thead><tr className="border-b-2 text-left"><th>Date</th><th>Event</th><th className="text-right">Qty</th><th>Source</th><th>Reference</th><th>Notes</th></tr></thead><tbody>{(productHistory.eventHistory || []).map((event,index) => <tr key={`${event.occurredAt}-${index}`} className="border-b"><td>{dateTime(event.occurredAt)}</td><td className="font-bold">{event.type}</td><td className="text-right">{event.quantity}</td><td>{event.source || "—"}</td><td>{event.reference || "—"}</td><td>{event.notes || "—"}</td></tr>)}</tbody></table>
        <h2 className="text-lg font-black border-b pb-2 mb-3 mt-6">Branch Performance</h2>
        <table className="w-full text-xs"><thead><tr className="border-b-2 text-left"><th>Branch</th><th className="text-right">Units Sold</th><th className="text-right">Revenue</th>{isManager && <th className="text-right">Profit</th>}</tr></thead><tbody>{(productHistory.branchPerformance || []).map((row) => <tr key={row.branchName} className="border-b"><td>{row.branchName}</td><td className="text-right">{row.unitsSold}</td><td className="text-right">{money(row.revenue)}</td>{isManager && <td className="text-right">{money(row.profit)}</td>}</tr>)}</tbody></table>
        <div className="mt-6 border-t pt-2 text-[10px] text-gray-500 flex justify-between"><span>GadgetShop • Product Lifetime History</span><span>Historical record remains available even at zero stock</span></div>
      </div> : null}

      <div className="inventory-screen-only space-y-5">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">GadgetShop • Inventory</p><h1 className="mt-1 text-3xl font-black text-[#6b0f1a]">Inventory</h1><p className="mt-1 text-sm text-gray-500">Current stock by company or branch, traceability and complete product history.</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={exportToExcel} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white">Export Excel</button><button onClick={printInventory} className="rounded-lg bg-[#6b0f1a] px-4 py-2 text-sm font-bold text-white">Print Inventory Report</button></div>
        </header>

        <nav className="flex flex-wrap gap-2">
          <button onClick={() => changeTab("current")} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "current" ? "bg-[#6b0f1a] text-white" : "border bg-white"}`}>Current Stock</button>
          <button onClick={() => changeTab("history")} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "history" ? "bg-[#6b0f1a] text-white" : "border bg-white"}`}>Product History</button>
          {isManager && <button onClick={() => changeTab("balancing")} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "balancing" ? "bg-[#6b0f1a] text-white" : "border bg-white"}`}>Stock Balancing</button>}
          <button onClick={() => changeTab("catalogue")} className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === "catalogue" ? "bg-[#f97316] text-white" : "border bg-white"}`}>Phone Catalogue</button>
        </nav>

        {tab === "current" && (
          <>
            <section className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Stock View</p><h2 className="mt-1 text-xl font-black text-gray-900">{scopeLabel}</h2><p className="mt-1 text-sm text-gray-500">Switch automatically between the complete company position and an individual branch.</p></div>
                {isManager ? <label className="w-full md:w-80 text-sm font-semibold">View Stock<select value={stockScope} onChange={(e) => setStockScope(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-3"><option value="">Company • All Branches</option>{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}</select></label> : <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-semibold">{scopeLabel}</div>}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <KPI title="Total Phones" value={filteredPhones.length} detail={scopeLabel} />
              <KPI title="Total Stock Value" value={money(totalStockValue)} detail="Current retail value" />
              {isManager && <KPI title="Cost Basis" value={hasCostBasis ? money(totalCostValue) : "Not recorded"} detail={hasCostBasis ? "Current acquisition cost" : "Buying prices are unavailable"} />}
              {isManager && <KPI title="Potential Margin" value={hasCostBasis ? money(totalPotentialProfit) : "—"} detail={hasCostBasis ? "Stock value less cost basis" : "Requires buying prices"} />}
              <KPI title="Low Stock Models" value={lowStockModels.length} />
            </div>

            {isManager && !stockScope && branchSummary.length > 0 && <section className="rounded-xl border bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div><h2 className="font-black">Branch Stock Position</h2><p className="mt-0.5 text-xs text-gray-500">Company stock summarised by branch.</p></div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {branchSummary.map((branch) => <button key={branch.name} onClick={() => setStockScope(branches.find((b) => b.name === branch.name)?._id || "")} className="rounded-lg border bg-white px-3 py-2 text-left transition hover:border-[#6b0f1a] hover:bg-red-50">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-black">{branch.name}</p>
                    <span className="text-lg font-black text-[#6b0f1a]">{branch.units}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-gray-500">
                    <span>{branch.models} model variants</span>
                    <span className="font-semibold">{money(branch.stockValue)}</span>
                  </div>
                </button>)}
              </div>
            </section>}

            {lowStockModels.length > 0 && <section className="rounded-xl border border-orange-200 bg-orange-50 p-4"><h2 className="font-bold text-orange-900">Low Stock Models</h2><div className="mt-2 flex flex-wrap gap-2">{lowStockModels.slice(0, 20).map((item) => <span key={`${item.brand}-${item.model}`} className="rounded-full border bg-white px-3 py-1 text-sm font-semibold">{item.brand} {item.model} • {item.count}</span>)}</div></section>}

            <section className="rounded-xl border bg-white p-3 shadow-sm"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brand, model, RAM, storage, colour, IMEI or branch..." className="w-full rounded-lg border px-3 py-3" /></section>

            <section className="rounded-xl border bg-white shadow-sm overflow-hidden"><div className="border-b p-4"><h2 className="font-black">Current Inventory • {scopeLabel}</h2><p className="mt-1 text-sm text-gray-500">Every physical unit currently held in the selected scope.</p></div><div className="overflow-x-auto"><table className="min-w-[1250px] w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left"><th className="px-3 py-2">Brand</th><th className="px-3 py-2">Model</th><th className="px-3 py-2">RAM</th><th className="px-3 py-2">Storage</th><th className="px-3 py-2">Colour</th><th className="px-3 py-2">IMEI</th><th className="px-3 py-2">Branch</th><th className="px-3 py-2">Date Added</th><th className="px-3 py-2 text-right">Selling Price</th>{isManager && <th className="px-3 py-2 text-right">Buying Price</th>}{isManager && <th className="px-3 py-2">Actions</th>}</tr></thead><tbody>{filteredPhones.map((phone) => <tr key={phone._id} className="border-b"><td className="px-3 py-2">{phone.brand}</td><td className="px-3 py-2 font-semibold">{phone.model}</td><td className="px-3 py-2">{phone.ram}</td><td className="px-3 py-2">{phone.storage}</td><td className="px-3 py-2">{phone.color}</td><td className="px-3 py-2">{phone.imei}</td><td className="px-3 py-2">{phone.branch?.name || "—"}</td><td className="px-3 py-2">{dateTime(phone.createdAt)}</td><td className="px-3 py-2 text-right">{money(phone.sellingPrice)}</td>{isManager && <td className="px-3 py-2 text-right">{money(phone.buyingPrice)}</td>}{isManager && <td className="px-3 py-2"><div className="flex gap-2"><a href={`/edit-phone/${phone._id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Edit</a><button onClick={() => deletePhone(phone._id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium">Delete</button></div></td>}</tr>)}</tbody></table></div></section>
          </>
        )}

        {tab === "balancing" && isManager && (
          <>
            <section className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Inventory Intelligence</p>
              <h2 className="mt-1 text-2xl font-black text-[#6b0f1a]">Stock Balancing</h2>
              <p className="mt-1 max-w-3xl text-sm text-gray-500">Company-wide branch stock pressure and possible internal balancing opportunities. Every active branch remains visible, including zero-stock positions.</p>
            </section>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KPI title="Opportunities" value={balancingSummary.opportunities} detail="Possible internal moves" />
              <KPI title="High Priority" value={balancingSummary.high} detail="Out / critical" />
              <KPI title="Review" value={balancingSummary.review} detail="Low-stock" />
              <KPI title="Branches" value={balancingSummary.destinations} detail="Need attention" />
            </div>
            {balancingRows.length === 0 ? (
              <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800">No balancing opportunity is currently supported by stock position.</section>
            ) : (
              <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="border-b p-4"><h3 className="font-black">Recommended Internal Balancing</h3><p className="mt-1 text-xs text-gray-500">Stock-position signals. Validate sales velocity and demand before executing a transfer.</p></div>
                <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left"><th className="px-3 py-3">Model</th><th className="px-3 py-3">Destination</th><th className="px-3 py-3 text-right">Stock</th><th className="px-3 py-3">Position</th><th className="px-3 py-3">Possible Source</th><th className="px-3 py-3 text-right">Source Stock</th><th className="px-3 py-3">Recommendation</th></tr></thead><tbody>{balancingRows.map((row) => <tr key={row.key} className="border-b last:border-b-0"><td className="px-3 py-3"><p className="font-bold">{row.brand} {row.model}</p><p className="text-xs text-gray-500">{row.ram || "—"} • {row.storage || "—"}</p></td><td className="px-3 py-3 font-semibold">{row.destination}</td><td className="px-3 py-3 text-right font-black">{row.destinationUnits}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${row.priority === "HIGH" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>{row.priority} • {row.destinationStatus === "OUT" ? "Out" : row.destinationStatus === "CRITICAL" ? "Critical" : "Low"}</span></td><td className="px-3 py-3 font-semibold">{row.source}</td><td className="px-3 py-3 text-right font-black">{row.sourceUnits}</td><td className="px-3 py-3 font-bold text-[#6b0f1a]">Consider moving {row.quantity} unit → {row.destination}<p className="mt-1 text-xs font-normal text-gray-500">Source remains above the {LOW_STOCK_LIMIT}-unit low-stock limit.</p></td></tr>)}</tbody></table></div>
              </section>
            )}
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Management rule:</strong> This tab recommends; it does not create or execute transfers. Sales velocity is not yet used here, so review demand before execution.</section>
          </>
        )}

        {tab === "catalogue" && (
          <PhoneCatalogue isManager={isManager} />
        )}

        {tab === "history" && (
          <>
            <section className="rounded-xl border bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end"><label className="text-sm font-semibold">Find Historical Product<input value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} placeholder="Search model, IMEI, RAM, storage or colour..." className="mt-1 w-full rounded-lg border px-3 py-3" /></label><button onClick={() => loadCatalog(catalogSearch)} className="rounded-lg bg-[#6b0f1a] px-4 py-3 text-sm font-bold text-white">Search Products</button></div><p className="mt-2 text-xs text-gray-500">The catalogue includes products that are still in stock and products that are already completely sold out.</p></section>

            <section className="rounded-xl border bg-white shadow-sm overflow-hidden"><div className="border-b p-4"><h2 className="font-black">Historical Product Catalogue</h2><p className="mt-1 text-sm text-gray-500">Select a product to open its complete lifetime record.</p></div>{catalogLoading ? <div className="p-6 text-sm text-gray-500">Searching historical products...</div> : <div className="divide-y">{catalog.map((product) => <button key={product.key} onClick={() => loadProductHistory(product)} className={`flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-gray-50 ${selectedProduct?.key === product.key ? "bg-red-50" : ""}`}><div className="min-w-0"><p className="font-bold text-gray-900">{product.brand} {product.model}</p><p className="mt-1 text-xs text-gray-500">{product.ram || "—"} • {product.storage || "—"}{product.colours?.length ? ` • ${product.colours.join(", ")}` : ""}</p></div><div className="flex shrink-0 items-center gap-3"><div className="hidden text-right sm:block"><p className="text-xs text-gray-500">Sold</p><p className="font-bold">{product.totalSold}</p></div><div className="text-right"><p className="text-xs text-gray-500">Current</p><p className="font-bold">{product.currentStock}</p></div><Badge status={product.status} /></div></button>)}{catalog.length === 0 && <div className="p-8 text-center text-sm text-gray-500">No historical products match your search.</div>}</div>}</section>

            {historyError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{historyError}</div> : null}
            {historyLoading ? <div className="rounded-xl border bg-white p-6 text-sm text-gray-500">Loading complete product history...</div> : null}

            {productHistory && !historyLoading && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4 md:p-8">
              <section role="dialog" aria-modal="true" aria-label="Product history" className="mx-auto my-4 w-full max-w-6xl rounded-xl border bg-white p-4 shadow-xl">
                <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-start md:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">GadgetShop Product History</p><h2 className="mt-1 text-2xl font-black text-[#6b0f1a]">{productHistory.product.brand} {productHistory.product.model}</h2><p className="mt-1 text-sm text-gray-500">{productHistory.product.ram || "Any RAM"} • {productHistory.product.storage || "Any Storage"}</p></div><div className="flex gap-2"><button onClick={() => window.print()} className="rounded-lg border px-4 py-2 text-sm font-bold">Print Product History</button><button onClick={() => setProductHistory(null)} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white">Close</button></div></div>

                <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-6"><KPI title="First Stocked" value={dateOnly(productHistory.lifecycle.firstStockedAt)} /><KPI title="First Purchased" value={dateOnly(productHistory.lifecycle.firstPurchasedAt)} /><KPI title="Purchased" value={productHistory.lifecycle.totalPurchased} /><KPI title="Sold" value={productHistory.lifecycle.totalSold} /><KPI title="Returned" value={productHistory.lifecycle.totalReturned} /><KPI title="Current Stock" value={productHistory.lifecycle.currentStock} /></div>

                <nav className="mt-5 flex flex-wrap gap-2">{[["summary", "Summary"], ["sales", "Sales History"], ["events", "Inventory Events"], ["branches", "Branch Performance"], ["current", "Current Units"]].map(([value, label]) => <button key={value} onClick={() => setHistoryTab(value)} className={`rounded-lg px-3 py-2 text-sm font-bold ${historyTab === value ? "bg-[#6b0f1a] text-white" : "border bg-white"}`}>{label}</button>)}</nav>

                {historyTab === "summary" && <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"><div className="rounded-lg bg-gray-50 p-4"><h3 className="font-bold">Lifetime Position</h3><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><dt>First Stocked</dt><dd className="font-bold">{dateOnly(productHistory.lifecycle.firstStockedAt)}</dd></div><div className="flex justify-between"><dt>First Purchased</dt><dd className="font-bold">{dateOnly(productHistory.lifecycle.firstPurchasedAt)}</dd></div><div className="flex justify-between"><dt>Total Purchased</dt><dd className="font-bold">{productHistory.lifecycle.totalPurchased}</dd></div><div className="flex justify-between"><dt>Total Sold</dt><dd className="font-bold">{productHistory.lifecycle.totalSold}</dd></div><div className="flex justify-between"><dt>Transfers In</dt><dd className="font-bold">{productHistory.lifecycle.totalTransferIn}</dd></div><div className="flex justify-between"><dt>Transfers Out</dt><dd className="font-bold">{productHistory.lifecycle.totalTransferOut}</dd></div><div className="flex justify-between"><dt>Adjustments</dt><dd className="font-bold">{productHistory.lifecycle.adjustments}</dd></div><div className="flex justify-between"><dt>Write-offs</dt><dd className="font-bold">{productHistory.lifecycle.writeOffs}</dd></div></dl></div><div className="rounded-lg bg-gray-50 p-4"><h3 className="font-bold">Financial History</h3><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between"><dt>Lifetime Revenue</dt><dd className="font-bold">{money(productHistory.lifecycle.lifetimeRevenue)}</dd></div><div className="flex justify-between"><dt>Lifetime Profit</dt><dd className="font-bold">{isManager ? money(productHistory.lifecycle.lifetimeProfit) : "Restricted"}</dd></div><div className="flex justify-between"><dt>Last Sale</dt><dd className="font-bold">{dateTime(productHistory.lifecycle.lastSaleAt)}</dd></div><div className="flex justify-between"><dt>Current Stock</dt><dd className="font-bold">{productHistory.lifecycle.currentStock}</dd></div></dl></div></div>}

                {historyTab === "sales" && <div className="mt-5 overflow-x-auto"><table className="min-w-[1100px] w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left"><th className="px-2 py-2">Date</th><th className="px-2 py-2">Receipt</th><th className="px-2 py-2">IMEI</th><th className="px-2 py-2">Colour</th><th className="px-2 py-2">Branch</th><th className="px-2 py-2">Attendant</th><th className="px-2 py-2 text-right">Final Price</th>{isManager && <th className="px-2 py-2 text-right">Profit</th>}<th className="px-2 py-2">Payment</th></tr></thead><tbody>{(productHistory.salesHistory || []).map((sale,index) => <tr key={`${sale.receiptNumber}-${sale.imei}-${index}`} className="border-b"><td className="px-2 py-2">{dateTime(sale.date)}</td><td className="px-2 py-2">{sale.receiptNumber}</td><td className="px-2 py-2">{sale.imei}</td><td className="px-2 py-2">{sale.color}</td><td className="px-2 py-2">{sale.branch}</td><td className="px-2 py-2">{sale.attendant}</td><td className="px-2 py-2 text-right">{money(sale.finalPrice)}</td>{isManager && <td className="px-2 py-2 text-right">{money(sale.profit)}</td>}<td className="px-2 py-2">{sale.paymentMethod}</td></tr>)}{!(productHistory.salesHistory || []).length && <tr><td colSpan={isManager ? 9 : 8} className="p-8 text-center text-gray-500">No historical sales found for this product.</td></tr>}</tbody></table></div>}

                {historyTab === "events" && <div className="mt-5 overflow-x-auto"><table className="min-w-[900px] w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left"><th className="px-2 py-2">Date</th><th className="px-2 py-2">Event</th><th className="px-2 py-2 text-right">Qty</th><th className="px-2 py-2">Source</th><th className="px-2 py-2">Reference</th><th className="px-2 py-2">Notes</th></tr></thead><tbody>{(productHistory.eventHistory || []).map((event,index) => <tr key={`${event.occurredAt}-${index}`} className="border-b"><td className="px-2 py-2">{dateTime(event.occurredAt)}</td><td className="px-2 py-2 font-bold">{event.type}</td><td className="px-2 py-2 text-right">{event.quantity}</td><td className="px-2 py-2">{event.source || "—"}</td><td className="px-2 py-2">{event.reference || "—"}</td><td className="px-2 py-2">{event.notes || "—"}</td></tr>)}</tbody></table></div>}

                {historyTab === "branches" && <div className="mt-5 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left"><th className="px-3 py-2">Branch</th><th className="px-3 py-2 text-right">Units Sold</th><th className="px-3 py-2 text-right">Revenue</th>{isManager && <th className="px-3 py-2 text-right">Profit</th>}</tr></thead><tbody>{(productHistory.branchPerformance || []).map((row) => <tr key={row.branchName} className="border-b"><td className="px-3 py-2">{row.branchName}</td><td className="px-3 py-2 text-right">{row.unitsSold}</td><td className="px-3 py-2 text-right">{money(row.revenue)}</td>{isManager && <td className="px-3 py-2 text-right">{money(row.profit)}</td>}</tr>)}</tbody></table></div>}

                {historyTab === "current" && <div className="mt-5 overflow-x-auto">{productHistory.currentUnits?.length ? <table className="min-w-full text-sm"><thead><tr className="border-b bg-gray-50 text-left"><th className="px-3 py-2">IMEI</th><th className="px-3 py-2">Colour</th><th className="px-3 py-2">Branch</th><th className="px-3 py-2">Added</th></tr></thead><tbody>{productHistory.currentUnits.map((unit) => <tr key={unit.imei} className="border-b"><td className="px-3 py-2">{unit.imei}</td><td className="px-3 py-2">{unit.color}</td><td className="px-3 py-2">{unit.branch}</td><td className="px-3 py-2">{dateTime(unit.addedAt)}</td></tr>)}</tbody></table> : <div className="rounded-lg bg-gray-50 p-5 text-sm text-gray-600"><strong>Current stock is zero.</strong> The product's historical record remains available because it is sourced from permanent transaction history.</div>}</div>}
              </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Inventory;
