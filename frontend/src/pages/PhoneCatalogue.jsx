import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const ORANGE = "#f97316";
const MAROON = "#6b0f1a";

function money(value) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function imageFor(product) {
  return (
    product?.imageUrl ||
    product?.image ||
    product?.photo ||
    product?.imageURL ||
    product?.thumbnail ||
    ""
  );
}

function availabilityFor(stock) {
  const units = Number(stock || 0);
  if (units === 0) return { label: "Out of Stock", className: "bg-gray-100 text-gray-700" };
  if (units <= 3) return { label: `Low Stock (${units})`, className: "bg-orange-50 text-orange-700" };
  return { label: `In Stock (${units})`, className: "bg-green-50 text-green-700" };
}

function ProductImage({ product, className = "h-48" }) {
  const [failed, setFailed] = useState(false);
  const src = imageFor(product);

  if (!src || failed) {
    return (
      <div className={`${className} flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-center text-xs font-bold uppercase tracking-wider text-gray-400`}>
        {product?.brand || "Phone"}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${product?.brand || ""} ${product?.model || ""}`}
      onError={() => setFailed(true)}
      className={`${className} w-full object-contain`}
    />
  );
}

function PhoneCatalogue({ isManager = false }) {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All Brands");
  const [category, setCategory] = useState("All Categories");
  const [availability, setAvailability] = useState("All");
  const [sort, setSort] = useState("popularity");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const [catalogRes, branchRes] = await Promise.all([
          api.get(`/reports/product-catalog?limit=120`),
          api.get("/branches"),
        ]);

        if (!mounted) return;

        setProducts(catalogRes.data?.products || []);
        setBranches(
          Array.isArray(branchRes.data)
            ? branchRes.data
            : branchRes.data?.branches || []
        );
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError(
            err?.response?.data?.message ||
              "Unable to load the phone catalogue."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const brands = useMemo(
    () => ["All Brands", ...new Set(products.map((p) => p.brand).filter(Boolean).sort())],
    [products]
  );

  const categories = ["All Categories", "Smartphones", "Feature Phones"];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const text = [
        product.brand,
        product.model,
        product.ram,
        product.storage,
        ...(product.colours || []),
      ]
        .join(" ")
        .toLowerCase();

      const stock = Number(product.currentStock || 0);

      return (
        (!query || text.includes(query)) &&
        (brand === "All Brands" || product.brand === brand) &&
        (category === "All Categories" || product.category === category) &&
        (availability === "All" ||
          (availability === "In Stock" && stock > 3) ||
          (availability === "Low Stock" && stock > 0 && stock <= 3) ||
          (availability === "Out of Stock" && stock === 0))
      );
    });

    return result.sort((a, b) => {
      if (sort === "price-low") return Number(a.sellingPrice || 0) - Number(b.sellingPrice || 0);
      if (sort === "price-high") return Number(b.sellingPrice || 0) - Number(a.sellingPrice || 0);
      if (sort === "stock") return Number(b.currentStock || 0) - Number(a.currentStock || 0);
      return Number(b.totalSold || 0) - Number(a.totalSold || 0);
    });
  }, [products, search, brand, category, availability, sort]);

  const branchPosition = useMemo(() => {
    if (!selected) return [];

    return branches.map((branch) => ({
      name: branch.name,
      units: Number(selected.branches?.[branch.name] || 0),
    }));
  }, [selected, branches]);

  function printCatalogue() {
    window.print();
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading Phone Catalogue...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="phone-catalogue min-h-screen bg-[#f8fafc] p-3 md:p-5">
      <style>{`
        @media print {
          .catalogue-screen-only { display:none!important; }
          .catalogue-print { display:block!important; }
          body { background:#fff!important; }
          .catalogue-card { break-inside:avoid; page-break-inside:avoid; }
        }
        .catalogue-print { display:none; }
      `}</style>

      <div className="catalogue-screen-only space-y-4">
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-2 text-xs font-semibold text-white">
            <span>GadgetShop • Phone Catalogue</span>
            <span>Digital Product Reference</span>
          </div>

          <div className="flex flex-col gap-3 border-b px-4 py-4 lg:flex-row lg:items-center">
            <div className="text-xl font-black text-gray-900">GadgetShop</div>

            <div className="flex-1">
              <label className="flex items-center gap-2 rounded-xl border bg-gray-50 px-4 py-2.5">
                <span className="text-gray-400">⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search phones, brands, models, RAM, storage..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>
            </div>

            <button
              onClick={printCatalogue}
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
            >
              Print Catalogue
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
          <aside className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="font-black">Categories</h3>
            <div className="mt-3 space-y-1">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                    category === item ? "bg-orange-50 text-orange-600" : "hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="my-5 border-t" />

            <h3 className="font-black">Brands</h3>
            <div className="mt-3 space-y-1">
              {brands.slice(0, 12).map((item) => (
                <button
                  key={item}
                  onClick={() => setBrand(item)}
                  className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${
                    brand === item ? "bg-orange-50 font-bold text-orange-600" : "hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="my-5 border-t" />

            <h3 className="font-black">Availability</h3>
            <div className="mt-3 space-y-2 text-sm">
              {["All", "In Stock", "Low Stock", "Out of Stock"].map((item) => (
                <label key={item} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={availability === item}
                    onChange={() => setAvailability(item)}
                  />
                  {item}
                </label>
              ))}
            </div>

            {isManager && (
              <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                  Manager
                </p>
                <p className="mt-1 text-xs text-orange-900">
                  Catalogue editing controls appear on the product detail view.
                </p>
              </div>
            )}
          </aside>

          <main>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs text-gray-500">Home › Inventory › Phone Catalogue</p>
                <h1 className="mt-1 text-3xl font-black">Phone Catalogue</h1>
                <p className="text-sm text-gray-500">Showing {filtered.length} products</p>
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold"
              >
                <option value="popularity">By popularity</option>
                <option value="stock">Stock available</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {filtered.map((product) => {
                const stock = Number(product.currentStock || 0);
                const status = availabilityFor(stock);

                return (
                  <button
                    key={product.key}
                    onClick={() => setSelected(product)}
                    className="catalogue-card group rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative">
                      <ProductImage product={product} className="h-44" />
                      <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-bold shadow">
                        ⋮
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Smartphones
                      </p>
                      <h3 className="mt-1 font-black text-gray-900">
                        {product.brand} {product.model}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        {product.ram || "—"} RAM • {product.storage || "—"}
                      </p>
                      <p className="mt-2 text-lg font-black text-blue-700">
                        {money(product.sellingPrice)}
                      </p>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="rounded-2xl border bg-white p-10 text-center text-sm text-gray-500">
                No catalogue products match your filters.
              </div>
            )}
          </main>

          <aside className="space-y-3">
            <section className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-black">Quick View</h3>
                {selected && (
                  <button onClick={() => setSelected(null)} className="text-xs font-bold text-orange-600">
                    Clear
                  </button>
                )}
              </div>

              {!selected ? (
                <div className="mt-4 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                  Select a product card to preview its catalogue information.
                </div>
              ) : (
                <div className="mt-4">
                  <ProductImage product={selected} className="h-44" />
                  <h4 className="mt-3 font-black">
                    {selected.brand} {selected.model}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {selected.ram || "—"} RAM • {selected.storage || "—"}
                  </p>
                  <p className="mt-2 text-lg font-black text-blue-700">
                    {money(selected.sellingPrice)}
                  </p>
                  <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${availabilityFor(selected.currentStock).className}`}>
                    {availabilityFor(selected.currentStock).label}
                  </span>

                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Branch availability
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {branchPosition.map((branch) => (
                        <div key={branch.name} className="flex justify-between text-sm">
                          <span>{branch.name}</span>
                          <strong>{branch.units}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="mt-4 w-full rounded-xl border border-orange-300 bg-orange-50 px-3 py-2.5 text-sm font-bold text-orange-700"
                  >
                    Print Product Sheet
                  </button>

                  {isManager && (
                    <button
                      type="button"
                      className="mt-2 w-full rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-bold text-white"
                      title="Catalogue editor backend is the next integration step."
                    >
                      Edit Catalogue
                    </button>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <h3 className="font-black">Need help choosing?</h3>
              <p className="mt-1 text-sm text-orange-900">
                Connect this catalogue to the future How To education centre for comparisons, setup guides and product tips.
              </p>
              <button className="mt-3 rounded-lg border border-orange-300 bg-white px-3 py-2 text-xs font-bold text-orange-700">
                Explore How To Guides
              </button>
            </section>

            <section className="rounded-2xl border border-orange-300 bg-white p-4">
              <div className="text-2xl">▣</div>
              <h3 className="mt-2 font-black">Print Catalogue</h3>
              <p className="mt-1 text-sm text-gray-500">
                Print the full catalogue or the selected product sheet.
              </p>
              <button
                onClick={printCatalogue}
                className="mt-3 w-full rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-black text-white"
              >
                Print Catalogue
              </button>
            </section>
          </aside>
        </div>
      </div>

      <div className="catalogue-print text-black">
        <div className="border-b-2 border-orange-500 pb-3">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gray-500">GadgetShop</p>
          <h1 className="text-3xl font-black">Phone Catalogue</h1>
          <p className="text-sm text-gray-500">Product reference • Generated {new Date().toLocaleString("en-GB")}</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product.key} className="catalogue-card rounded-xl border p-3">
              <ProductImage product={product} className="h-40" />
              <h2 className="mt-2 font-black">{product.brand} {product.model}</h2>
              <p className="text-xs text-gray-500">{product.ram || "—"} • {product.storage || "—"}</p>
              <p className="mt-1 font-black">{money(product.sellingPrice)}</p>
              <p className="text-xs">Current stock: {Number(product.currentStock || 0)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PhoneCatalogue;
