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
  const [provinces, setProvinces] = useState([]); // [{ id, name }]
  const [provinceData, setProvinceData] = useState({}); // name -> [wardName]
  const [wards, setWards] = useState([]);     // wards of selected province: [{code,name}]
  const [loadingWards, setLoadingWards] = useState(false);

  const provinceCode = value?.provinceCode || "";
  const wardCode = value?.wardCode || "";
  const hamlet = value?.hamlet || "";

  // load provinces + wards dataset (VietnamLabs API, đã cập nhật sau sáp nhập)
  useEffect(() => {
    (async () => {
      try {
        const res = await j("https://vietnamlabs.com/api/vietnamprovince");
        const list = res?.data || [];
        setProvinces(list.map((p) => ({ id: String(p.id), name: p.province })));
        const map = {};
        for (const p of list) {
          map[p.province] = (p.wards || []).map((w) => w.name);
        }
        setProvinceData(map);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const provinceName = useMemo(() => {
    if (value?.provinceName) return value.provinceName;
    const found = provinces.find((p) => String(p.id) === String(provinceCode));
    return found?.name || "";
  }, [provinces, provinceCode, value?.provinceName]);
  const wardName = useMemo(
    () => wards.find(w => String(w.code) === String(wardCode))?.name || "",
    [wards, wardCode]
  );

  // khi chọn TỈNH: lấy danh sách xã/phường theo dữ liệu đã tải
  useEffect(() => {
    if (!provinceCode && !provinceName) { setWards([]); return; }
    setLoadingWards(true);
    try {
      const pName = provinceName || (provinces.find((p) => String(p.id) === String(provinceCode))?.name || "");
      const matched = provinces.find((p) => p.name === pName);
      const names = provinceData[pName] || [];
      const merged = names.map((n) => ({ code: n, name: n }));
      merged.sort((a, b) => a.name.localeCompare(b.name, "vi"));
      setWards(merged);
      // Nếu form đã có wardName (trường hợp edit), tự chọn tương ứng
      const existingWardName = (value?.wardName || "").trim();
      const matchedWard = existingWardName
        ? merged.find((w) => w.name.toLowerCase() === existingWardName.toLowerCase())
        : null;

      onChange?.({
        provinceCode: provinceCode || matched?.id || pName, // ưu tiên id, fallback name
        provinceName: pName,
        wardCode: matchedWard ? matchedWard.code : "",
        wardName: matchedWard ? matchedWard.name : "",
        hamlet: matchedWard ? hamlet : "",
      });
    } catch (e) {
      console.error(e);
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceCode, provinceName, provinces, provinceData]);

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
            const name = provinces.find(p => String(p.id) === String(code))?.name || "";
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
            <option key={p.id} value={p.id}>{p.name}</option>
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
            const name = wards.find(w => String(w.code) === String(code))?.name || "";
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
        {[hamlet, wardName, provinceName].filter(Boolean).join(", ") || ""}
      </div>
    </div>
  );
}
