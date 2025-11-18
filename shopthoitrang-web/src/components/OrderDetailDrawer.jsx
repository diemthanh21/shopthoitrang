import { useEffect, useMemo, useState } from "react";
import { Drawer, Descriptions, Avatar, Table, Tag, Divider, Space, Skeleton } from "antd";
import { UserOutlined } from "@ant-design/icons";
import donhangService from "../services/donhangService";

const fmtCurrency = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(v || 0));
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "");

export default function OrderDetailDrawer({ open, onClose, orderId }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (!open || !orderId) return;
      try {
        setLoading(true);
        setErr("");
        const res = await donhangService.getById(orderId);
        if (!ignore) setData(res);
      } catch (e) {
        if (!ignore) setErr("Không thể tải chi tiết đơn hàng");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [open, orderId]);

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      key: "productName",
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar shape="square" size={40} src={r.imageUrl} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{r.productName || `CTSP #${r.maChiTietSanPham}`}</div>
            {r?.variant && (
              <div className="text-xs text-gray-500">Màu: {r.variant.color || ""} • Size: {r.variant.size || ""}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "donGia",
      key: "donGia",
      align: "right",
      render: (v) => fmtCurrency(v),
    },
    {
      title: "Số lượng",
      dataIndex: "soLuong",
      key: "soLuong",
      align: "center",
    },
    {
      title: "Thành tiền",
      dataIndex: "thanhTien",
      key: "thanhTien",
      align: "right",
      render: (_, r) => fmtCurrency(r.thanhTien),
    },
  ];

  const itemsData = useMemo(() => {
    return (data?.items || []).map((it, idx) => ({
      key: it.maChiTietDonHang || idx,
      maChiTietSanPham: it.maChiTietSanPham,
      productName: it.productName,
      variant: it.variant,
      imageUrl: it.imageUrl,
      donGia: it.donGia,
      soLuong: it.soLuong,
      thanhTien: it.thanhTien,
    }));
  }, [data]);

  const sumItems = useMemo(() => {
    return itemsData.reduce((s, x) => s + Number(x.thanhTien || 0), 0);
  }, [itemsData]);

  return (
    <Drawer open={open} onClose={onClose} width={720} title={`Chi tiết đơn hàng ${orderId ? `#${orderId}` : ""}`}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : err ? (
        <div className="text-red-600">{err}</div>
      ) : (
        <div className="space-y-16">
          <section>
            <Descriptions bordered column={2} size="small" title="Thông tin đơn hàng">
              <Descriptions.Item label="Mã đơn">{data?.maDonHang}</Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">{fmtDate(data?.ngayDatHang)}</Descriptions.Item>
              <Descriptions.Item label="PT thanh toán">{data?.phuongThucThanhToan || ""}</Descriptions.Item>
              <Descriptions.Item label="TT thanh toán">
                {data?.trangThaiThanhToan ? (
                  <Tag color={String(data.trangThaiThanhToan).toLowerCase().includes("đã") ? "green" : "orange"}>
                    {data.trangThaiThanhToan}
                  </Tag>
                ) : (
                  ""
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái đơn">
                {data?.trangThaiDonHang ? (
                  <Tag color={String(data.trangThaiDonHang).toLowerCase().includes("hủy") ? "red" : String(data.trangThaiDonHang).toLowerCase().includes("giao") ? "blue" : "default"}>
                    {data.trangThaiDonHang}
                  </Tag>
                ) : (
                  ""
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Thành tiền">{fmtCurrency(data?.thanhTien)}</Descriptions.Item>
            </Descriptions>
          </section>

          <section>
            <Descriptions bordered column={2} size="small" title="Khách hàng & địa chỉ">
              <Descriptions.Item label="Mã KH">{data?.maKhachHang || data?.khachHang?.makhachhang || ""}</Descriptions.Item>
              <Descriptions.Item label="Họ tên">{data?.khachHang?.hoten || ""}</Descriptions.Item>
              <Descriptions.Item label="Email">{data?.khachHang?.email || ""}</Descriptions.Item>
              <Descriptions.Item label="SĐT">{data?.khachHang?.sodienthoai || data?.diaChi?.sodienthoai || ""}</Descriptions.Item>
              <Descriptions.Item label="Người nhận">{data?.diaChi?.ten || data?.khachHang?.hoten || ""}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {data?.diaChi
                  ? `${data.diaChi.diachicuthe || ""}${data.diaChi.diachicuthe ? ", " : ""}${data.diaChi.phuong || ""}${data.diaChi.phuong ? ", " : ""}${data.diaChi.tinh || ""}`
                  : ""}
              </Descriptions.Item>
            </Descriptions>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Sản phẩm</h3>
              <div className="text-sm text-gray-500">Tổng tạm tính: <span className="font-semibold">{fmtCurrency(sumItems)}</span></div>
            </div>
            <Divider className="my-3" />
            <Table
              columns={columns}
              dataSource={itemsData}
              pagination={false}
              size="small"
              rowKey="key"
            />
            <div className="flex justify-end mt-3 text-sm">
              <Space size="large">
                <div>Thành tiền: <span className="font-semibold">{fmtCurrency(data?.thanhTien || sumItems)}</span></div>
              </Space>
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );
}
