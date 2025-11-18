import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import trService from '../services/trahangService';

const Section = ({ title, children }) => (
  <div className="mb-5">
    <h2 className="text-sm font-semibold mb-2 text-gray-700 uppercase tracking-wide">{title}</h2>
    <div className="bg-white border rounded p-3 text-sm">{children}</div>
  </div>
);

export default function TraHangDetailPage(){
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [logs, setLogs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try{
      setLoading(true); setError('');
      const data = await trService.getById(id);
      setItem(data);
      setLogs(await trService.getLogs(id));
      setPreview(await trService.refundPreview(id));
    }catch(e){ setError(e?.response?.data?.message||e.message); }
    finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); },[id]);

  if (loading) return <div className="p-4">Đang tải...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!item) return <div className="p-4">Không tìm thấy phiếu.</div>;

  const moneyFmt = v => (v==null?'-': Intl.NumberFormat('vi-VN').format(v)+'đ');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Phiếu Trả hàng #{item.maTraHang}</h1>
        <button onClick={load} className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200">Làm mới</button>
      </div>
      <Section title="Thông tin chung">
        <div className="grid grid-cols-2 gap-2">
          <div>Mã đơn: #{item.maDonHang}</div>
          <div>Khách: #{item.maKhachHang}</div>
          <div>Biến thể: #{item.maChiTietSanPham}</div>
          <div>Số lượng: {item.soLuong}</div>
          <div>Ngày yêu cầu: {item.ngayYeuCau}</div>
          <div>Trạng thái: <span className="font-semibold">{item.trangThai}</span></div>
          <div>Lý do: {item.lyDo || '-'}</div>
          <div>Hình ảnh: {item.hinhAnhLoi ? <a href={item.hinhAnhLoi} target="_blank" rel="noreferrer" className="text-blue-600">Xem</a> : '-'}</div>
        </div>
      </Section>
      <Section title="Duyệt & Gửi hàng">
        <div className="grid grid-cols-2 gap-2">
          <div>Ngày duyệt: {item.ngayduyet || '-'}</div>
          <div>Địa chỉ gửi: {item.diachiguihang || '-'}</div>
          <div>Hướng dẫn đóng gói: {item.huongdan_donggoi || '-'}</div>
          <div>Lý do từ chối: {item.ly_do_tu_choi || '-'}</div>
        </div>
      </Section>
      <Section title="Kiểm tra hàng">
        <div className="grid grid-cols-2 gap-2">
          <div>Ngày nhận hàng: {item.ngaynhanhang || '-'}</div>
          <div>Ngày kiểm tra: {item.ngaykiemtra || '-'}</div>
          <div>Trạng thái kiểm tra: {item.trangthaikiemtra || '-'}</div>
          <div>Lý do không hợp lệ: {item.ly_do_khong_hop_le || '-'}</div>
        </div>
      </Section>
      <Section title="Hoàn tiền">
        <div className="grid grid-cols-2 gap-2">
          <div>Số tiền dự kiến: {moneyFmt(preview?.preview_sotien_hoan)}</div>
          <div>Số tiền đã ghi: {moneyFmt(item.sotien_hoan)}</div>
          <div>Phương thức hoàn: {item.phuongThucHoan || item.phuongthuc_hoan || '-'}</div>
          <div>Ngày hoàn tiền: {item.ngayhoantien || '-'}</div>
        </div>
      </Section>
      <Section title="Timeline">
        {logs.length===0? <div>Chưa có log.</div>:
          <ol className="space-y-2 list-decimal ml-5">
            {logs.map(l => (
              <li key={l.id}>
                <div className="flex flex-col">
                  <span><strong>{l.action}</strong> [{l.from_status || '∅'} → {l.to_status || '∅'}] - {l.created_at}</span>
                  {l.note && <span className="text-gray-600">{l.note}</span>}
                </div>
              </li>
            ))}
          </ol>
        }
      </Section>
    </div>
  );
}
