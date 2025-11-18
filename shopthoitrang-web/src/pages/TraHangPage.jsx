import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import trService from '../services/trahangService';

// Map status to tailwind color + friendly label
const statusColor = (s='') => {
  const k = s.toUpperCase().replace(/\s+/g,'_');
  if (k.includes('CHỜ_DUYỆT')) return 'amber';
  if (k.includes('ĐÃ_DUYỆT')) return 'blue';
  if (k.includes('NHẬN_HÀNG')) return 'indigo';
  if (k.includes('ĐỦ_ĐIỀU_KIỆN')) return 'green';
  if (k.includes('KHÔNG_HỢP_LỆ')||k.includes('TỪ_CHỐI')) return 'red';
  if (k.includes('ĐÃ_HOÀN_TIEN')||k.includes('ĐÃ_HOÀN_TIỀN')) return 'emerald';
  return 'gray';
};

const statusMap = {
  'CHỜ DUYỆT': 'Chờ duyệt',
  'ĐÃ_DUYỆT_CHỜ_GỬI_HÀNG': 'Đã duyệt chờ gửi hàng',
  'ĐÃ_NHẬN_HÀNG_CHỜ_KIỂM_TRA': 'Đã nhận hàng chờ kiểm tra',
  'ĐỦ_ĐIỀU_KIỆN_HOÀN_TIỀN': 'Đủ điều kiện hoàn tiền',
  'KHÔNG_HỢP_LỆ': 'Không hợp lệ',
  'ĐÃ_HOÀN_TIỀN': 'Đã hoàn tiền',
  'TỪ_CHỐI': 'Từ chối',
};
const toCode = (labelOrCode) => {
  // allow passing human label; convert to code keys in statusMap
  const entries = Object.entries(statusMap);
  const found = entries.find(([code,label]) => label === labelOrCode);
  return found ? found[0] : labelOrCode;
};
const toLabel = (code) => statusMap[code] || code;

const Badge = ({ children, color='gray' }) => (
  <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium tracking-wide bg-${color}-100 text-${color}-800 border border-${color}-200 rounded-md shadow-sm`}>{children}</span>
);

export default function TraHangPage(){
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({ trangthai: '', madonhang: '', makhachhang: '' });
  const load = async () => {
    try{ setLoading(true); setError('');
      const params = {};
      if (filters.trangthai) params.trangthai = filters.trangthai;
      if (filters.madonhang) params.madonhang = filters.madonhang;
      if (filters.makhachhang) params.makhachhang = filters.makhachhang;
      const data = await trService.getAll(params);
      setList(data);
    }catch(e){ setError(e?.message||'Lỗi tải dữ liệu'); }
    finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); },[filters.trangthai, filters.madonhang, filters.makhachhang]);

  const run = async (fn) => { try{ await fn(); await load(); } catch(e){ window.alert(e?.response?.data?.message||e.message||'Lỗi'); } };

  const [dialog,setDialog] = useState(null); // {type:'accept'|'reject', id}
  const openDialog = (type,id) => setDialog({type,id});
  const closeDialog = ()=> setDialog(null);

  const submitDialog = async (e) => {
    e.preventDefault();
    if(!dialog) return;
    const formData = new FormData(e.target);
    if(dialog.type==='accept'){
      await run(()=>trService.accept(dialog.id, formData.get('diachi')));
    } else if(dialog.type==='reject'){
      await run(()=>trService.reject(dialog.id, formData.get('lydo')));
    }
    closeDialog();
  };

  const actionsFor = (x) => {
    const id = x.maTraHang || x.id;
    const btn = (label, onClick, color='gray') => (
      <button className={`px-2 py-1 text-xs rounded-md border ml-2 bg-${color}-50 border-${color}-200 text-${color}-700 hover:bg-${color}-100 focus:outline-none focus:ring-2 focus:ring-${color}-300`} onClick={onClick}>{label}</button>
    );
    switch((x.trangThai||'').toUpperCase()){
      case 'CHỜ DUYỆT':
      case 'CHỜ_DUYỆT':
        return <>
          {btn('Duyệt', ()=>openDialog('accept',id),'blue')}
          {btn('Từ chối', ()=>openDialog('reject',id),'red')}
        </>;
      case 'ĐÃ_DUYỆT_CHỜ_GỬI_HÀNG':
        return btn('Đã nhận hàng', ()=>run(()=>trService.markReceived(id)),'amber');
      case 'ĐÃ_NHẬN_HÀNG_CHỜ_KIỂM_TRA':
        return <>
          {btn('Hợp lệ', ()=>run(()=>trService.markValid(id)),'green')}
          {btn('Không hợp lệ', ()=>run(()=>trService.markInvalid(id, 'Rách/đã sử dụng')),'red')}
        </>;
      case 'ĐỦ_ĐIỀU_KIỆN_HOÀN_TIỀN':
        return <>
          {btn('Tính tiền', ()=>run(()=>trService.calcRefund(id)),'blue')}
          {btn('Hoàn tiền', ()=>run(()=>trService.refund(id,'GATEWAY')),'green')}
        </>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Trả hàng / Hoàn tiền</h1>
        <button onClick={load} className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200">Làm mới</button>
      </div>
      {loading? <div>Đang tải...</div>:
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2 text-left">Mã</th>
              <th className="px-3 py-2 text-left">Đơn</th>
              <th className="px-3 py-2 text-left">Khách</th>
              <th className="px-3 py-2 text-left">SL</th>
              <th className="px-3 py-2 text-left">Trạng thái</th>
              <th className="px-3 py-2 text-left">Thao tác</th>
            </tr></thead>
            <thead>
              <tr className="bg-white border-b">
                <th className="px-3 py-2">
                  <input className="border rounded px-2 py-1 text-sm w-24" placeholder=""
                    value={filters.madonhang}
                    onChange={e=>setFilters(v=>({...v, madonhang: e.target.value}))}/>
                </th>
                <th className="px-3 py-2">
                  <input className="border rounded px-2 py-1 text-sm w-24" placeholder="Mã đơn hàng "
                    value={filters.madonhang}
                    onChange={e=>setFilters(v=>({...v, madonhang: e.target.value}))}/>
                </th>
                <th className="px-3 py-2">
                  <input className="border rounded px-2 py-1 text-sm w-24" placeholder="KH "
                    value={filters.makhachhang}
                    onChange={e=>setFilters(v=>({...v, makhachhang: e.target.value}))}/>
                </th>
                <th></th>
                <th className="px-3 py-2">
                  <select className="border rounded px-2 py-1 text-sm" value={filters.trangthai}
                    onChange={e=>setFilters(v=>({...v, trangthai: e.target.value}))}>
                    <option value="">Tất cả</option>
                    {Object.entries(statusMap).map(([code,label])=> (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(x=> (
                <tr key={x.maTraHang||x.id} className="border-t">
                  <td className="px-3 py-2"><Link to={`/trahang/${x.maTraHang||x.id}`} className="text-blue-600">#{x.maTraHang||x.id}</Link></td>
                  <td className="px-3 py-2">#{x.maDonHang}</td>
                  <td className="px-3 py-2">#{x.maKhachHang}</td>
                  <td className="px-3 py-2">{x.soLuong}</td>
                  <td className="px-3 py-2"><Badge color={statusColor(x.trangThai)}>{toLabel(x.trangThai)}</Badge></td>
                  <td className="px-3 py-2">{actionsFor(x)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
      {dialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form onSubmit={submitDialog} className="bg-white w-full max-w-sm rounded-lg shadow-lg p-5 space-y-4">
            <h2 className="text-lg font-semibold">
              {dialog.type==='accept' ? 'Duyệt yêu cầu trả hàng' : 'Từ chối yêu cầu trả hàng'} #{dialog.id}
            </h2>
            {dialog.type==='accept' && (
              <>
                <label className="block text-sm font-medium mb-1">Địa chỉ gửi hàng</label>
                <input name="diachi" required defaultValue="Kho A - 123 Địa chỉ" className="w-full border rounded px-3 py-2 text-sm" />
                <p className="text-xs text-gray-500">Khách sẽ gửi hàng về địa chỉ này.</p>
              </>
            )}
            {dialog.type==='reject' && (
              <>
                <label className="block text-sm font-medium mb-1">Lý do từ chối</label>
                <textarea name="lydo" required placeholder="Nhập lý do" className="w-full border rounded px-3 py-2 text-sm" />
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeDialog} className="px-3 py-1.5 text-sm rounded border bg-gray-100">Huỷ</button>
              <button type="submit" className={`px-3 py-1.5 text-sm rounded text-white ${dialog.type==='accept'?'bg-blue-600 hover:bg-blue-700':'bg-red-600 hover:bg-red-700'}`}>{dialog.type==='accept'?'Duyệt':'Từ chối'}</button>
            </div>
          </form>
        </div>)}
    </div>
  );
}
