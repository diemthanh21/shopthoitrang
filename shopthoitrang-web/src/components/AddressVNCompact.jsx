import { useEffect, useMemo, useState } from "react";

/** fetch helper */
async function j(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch ${url} failed: ${r.status}`);
  return r.json();
}

/**
 * value = {
 *   provinceCode, provinceName,
 *   wardCode, wardName,
 *   hamlet // thôn/tổ (string, tùy chọn)
 * }
 * onChange(nextValue)
 */
export default function AddressVNCompact({
  value,
  onChange,
  disabled = false,
  showLabels = true,
}) {
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);     // all wards merged by province
  const [loadingWards, setLoadingWards] = useState(false);

  const provinceCode = value?.provinceCode || "";
  const wardCode = value?.wardCode || "";
  const hamlet = value?.hamlet || "";

  // load all provinces once
  useEffect(() => {
    j("https://provinces.open-api.vn/api/?depth=1")
      .then(setProvinces)
      .catch(console.error);
  }, []);

  const provinceName = useMemo(
    () => provinces.find(p => p.code === Number(provinceCode))?.name || "",
    [provinces, provinceCode]
  );
  const wardName = useMemo(
    () => wards.find(w => w.code === Number(wardCode))?.name || "",
    [wards, wardCode]
  );

  // khi chọn TỈNH: gộp toàn bộ xã của tỉnh (bỏ qua quận/huyện)
  useEffect(() => {
    if (!provinceCode) { setWards([]); return; }
    (async () => {
      setLoadingWards(true);
      try {
        // lấy districts của tỉnh
        const p = await j(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        const districts = p?.districts ?? [];

        // lấy wards cho từng district song song, rồi gộp
        const lists = await Promise.all(
          districts.map(d =>
            j(`https://provinces.open-api.vn/api/d/${d.code}?depth=2`)
              .then(x => x?.wards || [])
              .catch(() => [])
          )
        );
        const merged = lists.flat().map(w => ({ code: w.code, name: w.name }));
        merged.sort((a,b) => a.name.localeCompare(b.name, "vi"));

        setWards(merged);
        // reset xã/thôn khi đổi tỉnh
        onChange?.({
          provinceCode,
          provinceName,
          wardCode: "",
          wardName: "",
          hamlet: "",
        });
      } catch (e) {
        console.error(e);
        setWards([]);
      } finally {
        setLoadingWards(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceCode]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        {showLabels && <label className="block text-sm mb-1">Tỉnh / Thành phố</label>}
        <select
          className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
          value={provinceCode}
          onChange={(e) => {
            const code = e.target.value;
            const name = provinces.find(p => p.code === Number(code))?.name || "";
            onChange?.({
              provinceCode: code,
              provinceName: name,
              wardCode: "",
              wardName: "",
              hamlet: "",
            });
          }}
        >
          <option value="">-- Chọn tỉnh/thành --</option>
          {provinces.map(p => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        {showLabels && <label className="block text-sm mb-1">Xã / Phường / Thị trấn</label>}
        <select
          className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={!provinceCode || loadingWards || disabled}
          value={wardCode}
          onChange={(e) => {
            const code = e.target.value;
            const name = wards.find(w => w.code === Number(code))?.name || "";
            onChange?.({
              provinceCode, provinceName,
              wardCode: code, wardName: name,
              hamlet,
            });
          }}
        >
          <option value="">
            {loadingWards ? "Đang tải xã/phường…" : "-- Chọn xã/phường --"}
          </option>
          {wards.map(w => (
            <option key={w.code} value={w.code}>{w.name}</option>
          ))}
        </select>
      </div>

      <div>
        {showLabels && <label className="block text-sm mb-1">Thôn / Tổ dân phố (tuỳ chọn)</label>}
        <input
          className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="VD: Thôn Trung, Tổ 5…"
          disabled={!wardCode || disabled}
          value={hamlet}
          onChange={(e) => onChange?.({
            provinceCode, provinceName,
            wardCode, wardName,
            hamlet: e.target.value
          })}
        />
      </div>

      <div className="md:col-span-3 text-sm text-gray-500">
        <span className="font-medium">Xem trước:</span>{" "}
        {[hamlet, wardName, provinceName].filter(Boolean).join(", ") || "—"}
      </div>
    </div>
  );
}
