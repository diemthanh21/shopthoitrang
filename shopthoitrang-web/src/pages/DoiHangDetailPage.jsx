import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import exService from '../services/doihangService';

const Section = ({ title, children }) => (
  <div className="mb-5">
    <h2 className="text-sm font-semibold mb-2 text-gray-700 uppercase tracking-wide">{title}</h2>
    <div className="bg-white border rounded p-3 text-sm">{children}</div>
  </div>
);

export default function DoiHangDetailPage(){
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [logs, setLogs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true); setError('');
      const data = await exService.getById(id);
      setItem(data);
      setLogs(await exService.getLogs(id));
      setPreview(await exService.diffPreview(id));
    } catch (e) { setError(e?.response?.data?.message||e.message); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ load(); },[id]);

  if (loading) return <div className="p-4">Đang tải...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!item) return <div className="p-4">Không tìm thấy phiếu.</div>;

  const moneyFmt = v => (v==null?'-': Intl.NumberFormat('vi-VN').format(v)+'đ');
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Đơn đổi hàng {item.maDoiHang}</h1>
        <button onClick={load} className="px-3 py-1.5 text-sm bg-gray-100 rounded hover:bg-gray-200">Làm mới</button>
      </div>
      <Section title="Thông tin chung">
        <div className="grid grid-cols-2 gap-2">
          <div>Mã đơn gốc: {item.maDonHang}</div>
          <div>Khách: {item.maKhachHang}</div>
          <div>Sản phẩm đổi: {item.maChiTietSanPhamCu}</div>
          <div>Sản phẩm mới: {item.maChiTietSanPhamMoi}</div>
          <div>Số lượng: {item.soLuong}</div>
          <div>Ngày yêu cầu: {item.ngayYeuCau}</div>
          <div>Trạng thái: <span className="font-semibold">{item.trangThai}</span></div>
          <div>Lý do: {item.lyDo || '-'}</div>
        </div>
      </Section>
      <Section title="Duyệt & Gửi hàng cũ">
        <div className="grid grid-cols-2 gap-2">
          <div>Ngày duyệt: {item.ngayduyet || '-'}</div>
          <div>Địa chỉ gửi: {item.diachiguihang || '-'}</div>
          <div>Hướng dẫn đóng gói: {item.huongdan_donggoi || '-'}</div>
          <div>Ghi chú: {item.ghiChu || item.ghichu || '-'}</div>
        </div>
      </Section>
      <Section title="Kiểm tra hàng cũ">
        <div className="grid grid-cols-2 gap-2">
          <div>Ngày nhận hàng cũ: {item.ngaynhanhangcu || '-'}</div>
          <div>Ngày kiểm tra: {item.ngaykiemtra || '-'}</div>
          <div>Trạng thái kiểm tra: {item.trangthaikiemtra || '-'}</div>
        </div>
      </Section>
      <Section title="Chênh lệch giá">
        <div className="grid grid-cols-2 gap-2">
          <div>Giá cũ dòng đơn: {moneyFmt(item.giacu)}</div>
          <div>Giá mới biến thể: {moneyFmt(item.giamoi)}</div>
          <div>Chênh lệch đã ghi: {moneyFmt(item.chenhlech)}</div>
          <div>Chênh lệch preview: {moneyFmt(preview?.chenhlech)}</div>
          <div>Trạng thái tiền: {item.trangThaiTien || item.trangthaitien || '-'}</div>
          <div>Phương thức xử lý: {item.phuongThucXuLyChenhLech || item.phuongthuc_xuly_chenhlech || '-'}</div>
          <div>Voucher code: {item.voucher_code || '-'}</div>
          <div>Voucher amount: {moneyFmt(item.voucher_amount)}</div>
        </div>
      </Section>
      <Section title="Đơn hàng mới">
        <div className="grid grid-cols-2 gap-2">
          <div>Mã đơn mới: {item.maDonHangMoi || item.madonhangmoi || '-'}</div>
          <div>Ngày tạo đơn mới: {item.ngaytaodonmoi || '-'}</div>
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
