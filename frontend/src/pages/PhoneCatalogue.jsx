import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";

function money(value) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function resolveImageUrl(value) {
  const source = String(value || "").trim();

  if (!source) return "";

  if (/^(https?:|blob:|data:)/i.test(source)) {
    return source;
  }

  const apiOrigin = String(
    import.meta.env.VITE_API_URL || ""
  ).replace(/\/+$/, "");

  if (source.startsWith("/") && apiOrigin) {
    return `${apiOrigin}${source}`;
  }

  return source;
}

function imageFor(product) {
  return resolveImageUrl(
    product?.catalogue?.imageUrl ||
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
  if (units === 0)
    return {
      label: "Out of Stock",
      className: "bg-gray-100 text-gray-700",
    };
  if (units <= 3)
    return {
      label: `Low Stock (${units})`,
      className: "bg-orange-50 text-orange-700",
    };
  return {
    label: `In Stock (${units})`,
    className: "bg-green-50 text-green-700",
  };
}

function protectedImagePath(value) {
  const source = String(value || "").trim();
  if (!source) return "";

  try {
    const url = new URL(source, window.location.origin);
    if (url.pathname.includes("/api/catalogue/images/")) {
      // api.js already has "/api" in its baseURL.
      // Strip that prefix so Axios does not request /api/api/...
      const apiIndex = url.pathname.indexOf("/api/catalogue/images/");
      return `${url.pathname.slice(apiIndex + 4)}${url.search}`;
    }
  } catch {
    // Fall through to direct-image handling.
  }

  return "";
}

function AuthenticatedImage({
  src,
  alt = "",
  className = "",
  fallback = null,
}) {
  const [resolvedSrc, setResolvedSrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    setFailed(false);
    setResolvedSrc("");

    if (!src) return () => {};

    const path = protectedImagePath(src);

    if (!path) {
      setResolvedSrc(src);
      return () => {};
    }

    api
      .get(path, { responseType: "blob" })
      .then((response) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(response.data);
        setResolvedSrc(objectUrl);
      })
      .catch((error) => {
        console.error("Catalogue image load error:", error);
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!src || failed || !resolvedSrc) {
    return fallback;
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

function ProductImage({ product, className = "h-48" }) {
  const src = imageFor(product);

  return (
    <AuthenticatedImage
      src={src}
      alt={`${product?.brand || ""} ${product?.model || ""}`}
      className={`${className} w-full rounded-xl object-contain`}
      fallback={
        <div
          className={`${className} flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-center text-xs font-bold uppercase tracking-wider text-gray-400`}
        >
          {product?.brand || "Phone"}
        </div>
      }
    />
  );
}

async function printFullCatalogue(products) {
  const printWindowRef = window.open("", "_blank", "width=1200,height=900");
  if (!printWindowRef) {
    window.alert("Please allow pop-ups to print the catalogue.");
    return;
  }

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");

  try {
    const printable = await Promise.all(
      products.map(async (product) => {
        let imageSrc = imageFor(product);
        const protectedPath = protectedImagePath(imageSrc);

        if (protectedPath) {
          try {
            const response = await api.get(protectedPath, {
              responseType: "blob",
            });
            imageSrc = URL.createObjectURL(response.data);
          } catch (error) {
            console.error("Catalogue print image load error:", error);
            imageSrc = "";
          }
        }

        return { product, imageSrc };
      })
    );

    const cards = printable
      .map(({ product, imageSrc }) => {
        const title =
          product.catalogue?.title ||
          `${product.brand || ""} ${product.model || ""}`.trim();
        const highlights = Array.isArray(product.catalogue?.highlights)
          ? product.catalogue.highlights.filter(Boolean)
          : [];

        return `
          <article class="product-card">
            <div class="image-box">
              ${imageSrc
                ? `<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(title)}" />`
                : `<div class="image-fallback">${escapeHtml(product.brand || "Phone")}</div>`}
            </div>
            <div class="category">${escapeHtml(product.catalogue?.category || "Smartphones")}</div>
            <h2>${escapeHtml(title)}</h2>
            <p class="specs">${escapeHtml(product.ram || "—")} RAM • ${escapeHtml(product.storage || "—")}</p>
            <p class="price">${escapeHtml(money(product.sellingPrice))}</p>
            ${product.catalogue?.description
              ? `<p class="description">${escapeHtml(product.catalogue.description)}</p>`
              : ""}
            ${highlights.length
              ? `<ul>${highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
              : ""}
          </article>`;
      })
      .join("");

    printWindowRef.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>GadgetShop Phone Catalogue</title>
<style>
@page { size: A4; margin: 10mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; }
.header { text-align: center; border-bottom: 2px solid #6b0f1a; padding-bottom: 10px; margin-bottom: 14px; }
.brand { color: #6b0f1a; font-size: 21px; font-weight: 900; letter-spacing: .08em; }
.title { margin-top: 3px; font-size: 18px; font-weight: 900; }
.meta { margin-top: 4px; color: #6b7280; font-size: 9px; }
.catalogue { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.product-card { border: 1px solid #e5e7eb; border-radius: 9px; padding: 9px; break-inside: avoid; page-break-inside: avoid; }
.image-box { height: 145px; display: flex; align-items: center; justify-content: center; background: #f8fafc; border-radius: 7px; overflow: hidden; }
.image-box img { width: 100%; height: 100%; object-fit: contain; }
.image-fallback { color: #9ca3af; font-size: 10px; font-weight: 800; text-transform: uppercase; }
.category { margin-top: 7px; color: #9ca3af; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
h2 { margin: 3px 0; font-size: 13px; line-height: 1.2; }
.specs { margin: 0; color: #6b7280; font-size: 9px; font-weight: 700; }
.price { margin: 6px 0 0; color: #1d4ed8; font-size: 12px; font-weight: 900; }
.description { margin: 5px 0 0; color: #4b5563; font-size: 8.5px; line-height: 1.35; }
ul { margin: 5px 0 0; padding-left: 14px; color: #374151; font-size: 8.5px; line-height: 1.35; }
.empty { grid-column: 1 / -1; padding: 40px; text-align: center; color: #6b7280; }
</style>
</head>
<body>
<header class="header">
  <div class="brand">GADGETSHOP</div>
  <div class="title">Phone Product Catalogue</div>
  <div class="meta">Generated ${escapeHtml(new Date().toLocaleString("en-GB"))} • ${products.length} product(s)</div>
</header>
<main class="catalogue">${cards || '<div class="empty">No products match the current catalogue filters.</div>'}</main>
<script>window.addEventListener("load", function(){ window.focus(); window.print(); });</script>
</body>
</html>`);
    printWindowRef.document.close();
  } catch (error) {
    console.error("Catalogue print error:", error);
    printWindowRef.close();
    window.alert("Unable to prepare the full catalogue for printing.");
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState("");
  const fileInputRef = useRef(null);

  const [editorForm, setEditorForm] = useState({
    description: "",
    highlights: "",
    category: "Smartphones",
    visible: true,
    featured: false,
    displayOrder: 0,
  });

  async function loadCatalogue({ showLoading = true } = {}) {
    try {
      if (showLoading) setLoading(true);
      setError("");

      const query = isManager
        ? "/catalogue?limit=120&includeHidden=true"
        : "/catalogue?limit=120";

      const [catalogRes, branchRes] = await Promise.all([
        api.get(query),
        api.get("/branches"),
      ]);

      const nextProducts = catalogRes.data?.products || [];
      setProducts(nextProducts);
      setBranches(
        Array.isArray(branchRes.data)
          ? branchRes.data
          : branchRes.data?.branches || []
      );
      return nextProducts;
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Unable to load the phone catalogue."
      );
      return null;
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadCatalogue();
  }, [isManager]);

  const brands = useMemo(
    () => [
      "All Brands",
      ...new Set(
        products.map((p) => p.brand).filter(Boolean).sort()
      ),
    ],
    [products]
  );

  const categories = useMemo(
    () => [
      "All Categories",
      ...new Set(
        products
          .map((p) => p.catalogue?.category || "Smartphones")
          .filter(Boolean)
          .sort()
      ),
    ],
    [products]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products
      .filter((product) => {
        const text = [
          product.brand,
          product.model,
          product.ram,
          product.storage,
          ...(product.colours || []),
          product.catalogue?.description,
          ...(product.catalogue?.highlights || []),
        ]
          .join(" ")
          .toLowerCase();

        const stock = Number(product.currentStock || 0);
        const productCategory =
          product.catalogue?.category || "Smartphones";

        return (
          (!query || text.includes(query)) &&
          (brand === "All Brands" || product.brand === brand) &&
          (category === "All Categories" ||
            productCategory === category) &&
          (availability === "All" ||
            (availability === "In Stock" && stock > 3) ||
            (availability === "Low Stock" && stock > 0 && stock <= 3) ||
            (availability === "Out of Stock" && stock === 0))
        );
      })
      .sort((a, b) => {
        if (sort === "price-low")
          return (
            Number(a.sellingPrice || 0) -
            Number(b.sellingPrice || 0)
          );
        if (sort === "price-high")
          return (
            Number(b.sellingPrice || 0) -
            Number(a.sellingPrice || 0)
          );
        if (sort === "stock")
          return (
            Number(b.currentStock || 0) -
            Number(a.currentStock || 0)
          );
        return (
          Number(b.totalSold || 0) -
          Number(a.totalSold || 0)
        );
      });
  }, [products, search, brand, category, availability, sort]);

  const branchPosition = useMemo(() => {
    if (!selected) return [];

    const availabilityRows = Array.isArray(
      selected.branchAvailability
    )
      ? selected.branchAvailability
      : [];

    return branches.map((branch) => {
      const match = availabilityRows.find(
        (item) =>
          String(item.branchId) === String(branch._id) ||
          item.branchName === branch.name
      );

      return {
        name: branch.name,
        units: Number(match?.units || 0),
      };
    });
  }, [selected, branches]);

  function openCatalogueEditor(product) {
    if (!isManager || !product) return;

    const metadata = product.catalogue || {};
    const sourceImage = metadata.imageUrl || "";

    setEditorError("");
    setImageError("");
    setPendingImageUrl(sourceImage);
    setImagePreview(sourceImage);
    setEditorForm({
      description: metadata.description || "",
      highlights: Array.isArray(metadata.highlights)
        ? metadata.highlights.join("\n")
        : "",
      category: metadata.category || "Smartphones",
      visible: metadata.visible !== false,
      featured: metadata.featured === true,
      displayOrder: Number(metadata.displayOrder || 0),
    });
    setEditorOpen(true);
  }

  function closeCatalogueEditor() {
    if (editorSaving || imageUploading) return;
    setEditorOpen(false);
    setEditorError("");
    setImageError("");
    setImagePreview("");
    setPendingImageUrl("");
  }

  function chooseImage() {
    fileInputRef.current?.click();
  }

  async function handleImageSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const allowed = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (!allowed.has(file.type)) {
      setImageError("Only JPG, PNG and WEBP images are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be 5 MB or smaller.");
      return;
    }

    setImageError("");
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setImageUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post(
        "/catalogue/images",
        formData
      );

      if (!response.data?.success || !response.data?.imageUrl) {
        throw new Error(
          response.data?.message ||
            "Unable to upload the image."
        );
      }

      setPendingImageUrl(response.data.imageUrl);
      setImagePreview(
        resolveImageUrl(response.data.imageUrl)
      );
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      console.error(err);
      URL.revokeObjectURL(localUrl);
      setImagePreview("");
      setImageError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to upload the image."
      );
    } finally {
      setImageUploading(false);
    }
  }

  function removeImage() {
    setImageError("");
    setPendingImageUrl("");
    setImagePreview("");
  }

  async function saveCatalogue() {
    if (!selected || !isManager) return;

    try {
      setEditorSaving(true);
      setEditorError("");

      const payload = {
        imageUrl: pendingImageUrl,
        description: editorForm.description.trim(),
        highlights: editorForm.highlights
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        category:
          editorForm.category.trim() || "Smartphones",
        visible: editorForm.visible,
        featured: editorForm.featured,
        displayOrder:
          Number(editorForm.displayOrder) || 0,
      };

      const catalogueId = selected.catalogue?.id;

      const response = catalogueId
        ? await api.put(`/catalogue/${catalogueId}`, payload)
        : await api.post("/catalogue", {
            brand: selected.brand,
            model: selected.model,
            ram: selected.ram,
            storage: selected.storage,
            ...payload,
          });

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Unable to save catalogue information."
        );
      }

      const nextProducts = await loadCatalogue({
        showLoading: false,
      });

      const updatedProduct = nextProducts?.find(
        (product) => product.key === selected.key
      );

      if (updatedProduct) setSelected(updatedProduct);

      setEditorOpen(false);
    } catch (err) {
      console.error(err);
      setEditorError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save catalogue information."
      );
    } finally {
      setEditorSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Loading Phone Catalogue...
      </div>
    );
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
      <div className="catalogue-screen-only">
        <div className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                GadgetShop
              </p>
              <h1 className="text-3xl font-black">Phone Catalogue</h1>
              <p className="text-sm text-gray-500">
                Inventory-backed product catalogue
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phones..."
                className="rounded-xl border bg-white px-3 py-2 text-sm"
              />
              <button
                onClick={() => printFullCatalogue(filtered)}
                className="rounded-xl bg-[#6b0f1a] px-3 py-2 text-sm font-bold text-white"
              >
                Print Full Catalogue
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_320px]">
          <aside className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="font-black">Categories</h3>
            <div className="mt-3 space-y-1">
              {categories.map((item) => (
                <button
                  key={item}
                  onClick={() => setCategory(item)}
                  className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${
                    category === item
                      ? "bg-orange-50 font-bold text-orange-600"
                      : "hover:bg-gray-50"
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
                    brand === item
                      ? "bg-orange-50 font-bold text-orange-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="my-5 border-t" />

            <h3 className="font-black">Availability</h3>
            <div className="mt-3 space-y-2 text-sm">
              {["All", "In Stock", "Low Stock", "Out of Stock"].map(
                (item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      checked={availability === item}
                      onChange={() => setAvailability(item)}
                    />
                    {item}
                  </label>
                )
              )}
            </div>

            {isManager && (
              <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                  Manager
                </p>
                <p className="mt-1 text-xs text-orange-900">
                  Catalogue presentation can be edited from
                  Quick View.
                </p>
              </div>
            )}
          </aside>

          <main>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs text-gray-500">
                  Home › Inventory › Phone Catalogue
                </p>
                <h2 className="mt-1 text-3xl font-black">
                  Phone Catalogue
                </h2>
                <p className="text-sm text-gray-500">
                  Showing {filtered.length} products
                </p>
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
                const status = availabilityFor(
                  product.currentStock
                );

                return (
                  <button
                    key={product.key}
                    onClick={() => setSelected(product)}
                    className="catalogue-card group rounded-2xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="relative">
                      <ProductImage
                        product={product}
                        className="h-44"
                      />
                      <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-bold shadow">
                        ⋮
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {product.catalogue?.category ||
                          "Smartphones"}
                      </p>
                      <h3 className="mt-1 font-black text-gray-900">
                        {product.brand} {product.model}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        {product.ram || "—"} RAM •{" "}
                        {product.storage || "—"}
                      </p>
                      <p className="mt-2 text-lg font-black text-blue-700">
                        {money(product.sellingPrice)}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${status.className}`}
                      >
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
                  <button
                    onClick={() => setSelected(null)}
                    className="text-xs font-bold text-orange-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              {!selected ? (
                <div className="mt-4 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                  Select a product card to preview its catalogue
                  information.
                </div>
              ) : (
                <div className="mt-4">
                  <ProductImage
                    product={selected}
                    className="h-44"
                  />

                  <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {selected.catalogue?.category ||
                      "Smartphones"}
                  </p>

                  <h4 className="font-black">
                    {selected.brand} {selected.model}
                  </h4>

                  <p className="text-xs text-gray-500">
                    {selected.ram || "—"} RAM •{" "}
                    {selected.storage || "—"}
                  </p>

                  <p className="mt-2 text-lg font-black text-blue-700">
                    {money(selected.sellingPrice)}
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${
                      availabilityFor(selected.currentStock)
                        .className
                    }`}
                  >
                    {
                      availabilityFor(selected.currentStock)
                        .label
                    }
                  </span>

                  {selected.catalogue?.description && (
                    <p className="mt-4 text-sm leading-6 text-gray-600">
                      {selected.catalogue.description}
                    </p>
                  )}

                  {Array.isArray(
                    selected.catalogue?.highlights
                  ) &&
                    selected.catalogue.highlights.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                          Highlights
                        </p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                          {selected.catalogue.highlights.map(
                            (item) => (
                              <li key={item}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Branch availability
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {branchPosition.map((branch) => (
                        <div
                          key={branch.name}
                          className="flex justify-between text-sm"
                        >
                          <span>{branch.name}</span>
                          <strong>{branch.units}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isManager && (
                    <button
                      type="button"
                      onClick={() =>
                        openCatalogueEditor(selected)
                      }
                      className="mt-2 w-full rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-bold text-white"
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
                Connect this catalogue to the future How To
                education centre for comparisons, setup guides
                and product tips.
              </p>
            </section>
          </aside>
        </div>
      </div>

      {editorOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
                  Manager
                </p>
                <h3 className="text-xl font-black">
                  Edit Catalogue
                </h3>
              </div>
              <button
                onClick={closeCatalogueEditor}
                disabled={editorSaving || imageUploading}
                className="rounded-lg px-3 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Inventory-controlled product
                </p>
                <p className="mt-1 text-lg font-black text-gray-900">
                  {selected.brand} {selected.model}
                </p>
                <p className="text-sm text-gray-600">
                  {selected.ram || "—"} RAM •{" "}
                  {selected.storage || "—"}
                </p>
                <p className="mt-2 text-xs text-blue-700">
                  Product identity comes from Inventory and
                  cannot be edited here.
                </p>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700">
                  Product image
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleImageSelected}
                  className="hidden"
                />

                <div className="mt-2 rounded-xl border bg-gray-50 p-3">
                  {imagePreview ? (
                    <div className="rounded-xl bg-white p-3">
                      <AuthenticatedImage
                        src={imagePreview}
                        alt="Selected product preview"
                        className="mx-auto h-64 w-full object-contain"
                        fallback={
                          <div className="flex h-64 items-center justify-center text-sm text-gray-400">
                            Loading product image...
                          </div>
                        }
                      />
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center rounded-xl bg-white text-sm text-gray-400">
                      No product image selected
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={chooseImage}
                      disabled={
                        imageUploading || editorSaving
                      }
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {imageUploading
                        ? "Uploading..."
                        : "Choose Image"}
                    </button>

                    {imagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={
                          imageUploading || editorSaving
                        }
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 disabled:opacity-50"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    JPG, PNG or WEBP. Maximum 5 MB.
                  </p>

                  {imageError && (
                    <p className="mt-2 text-sm font-semibold text-red-600">
                      {imageError}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editorForm.description}
                  onChange={(e) =>
                    setEditorForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="Describe the product for catalogue customers."
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700">
                  Highlights
                </label>
                <textarea
                  rows={5}
                  value={editorForm.highlights}
                  onChange={(e) =>
                    setEditorForm((current) => ({
                      ...current,
                      highlights: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder={"One highlight per line"}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700">
                  Category
                </label>
                <input
                  value={editorForm.category}
                  onChange={(e) =>
                    setEditorForm((current) => ({
                      ...current,
                      category: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={editorForm.visible}
                    onChange={(e) =>
                      setEditorForm((current) => ({
                        ...current,
                        visible: e.target.checked,
                      }))
                    }
                  />
                  Visible to users
                </label>

                <label className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={editorForm.featured}
                    onChange={(e) =>
                      setEditorForm((current) => ({
                        ...current,
                        featured: e.target.checked,
                      }))
                    }
                  />
                  Featured product
                </label>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-700">
                  Display order
                </label>
                <input
                  type="number"
                  value={editorForm.displayOrder}
                  onChange={(e) =>
                    setEditorForm((current) => ({
                      ...current,
                      displayOrder: e.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>

              {editorError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {editorError}
                </div>
              )}

              <div className="flex gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={closeCatalogueEditor}
                  disabled={editorSaving || imageUploading}
                  className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCatalogue}
                  disabled={editorSaving || imageUploading}
                  className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {editorSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhoneCatalogue;
