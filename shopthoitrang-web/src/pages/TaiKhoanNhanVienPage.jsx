// src/pages/TaiKhoanNhanVienPage.jsx
import { useEffect, useMemo, useState } from "react";
import { UserRound, Plus, Edit3, Search } from "lucide-react";
import { Modal, Form, Input, Select, message } from "antd";

import taikhoannhanvienService from "../services/taikhoannhanvienService";
import nhanvienService from "../services/nhanvienService";
import { useAuth } from "../contexts/AuthContext";

const { Option } = Select;

export default function TaiKhoanNhanVienPage() {
  const { user } = useAuth();

  // chỉ ADMIN mới được thêm / sửa tài khoản
  // nếu muốn ADMIN + MANAGER thì sửa thành:
  // const canEdit = ["ADMIN", "MANAGER"].includes(user?.maQuyen);
  const canEdit = user?.maQuyen === "ADMIN";

  const [accounts, setAccounts] = useState([]);
  const [nhanViens, setNhanViens] = useState([]);
  const [nhanVienMap, setNhanVienMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal thêm / sửa
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null); // null = thêm, khác null = sửa
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // ================= LOAD DATA =================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErr("");
    try {
      const [accRes, nvRes] = await Promise.all([
        taikhoannhanvienService.getAll(),
        nhanvienService.getAll(),
      ]);

      setAccounts(accRes || []);

      const nvList = Array.isArray(nvRes) ? nvRes : nvRes?.data ?? [];
      setNhanViens(nvList);

      const map = {};
      nvList.forEach((nv) => {
        const id = nv.maNhanVien ?? nv.manhanvien;
        const name = nv.hoTen ?? nv.hoten;
        if (id != null) map[id] = name;
      });
      setNhanVienMap(map);
    } catch (e) {
      console.error("Lỗi load tài khoản nhân viên:", e);
      setErr("Không tải được danh sách tài khoản nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  // ================= NHÂN VIÊN CHƯA CÓ TÀI KHOẢN =================
  const nhanViensChuaCoTK = useMemo(() => {
    if (!nhanViens.length) return [];
    const usedIds = new Set(
      (accounts || []).map((a) => a.maNhanVien ?? a.manhanvien)
    );
    return nhanViens.filter(
      (nv) => !usedIds.has(nv.maNhanVien ?? nv.manhanvien)
    );
  }, [nhanViens, accounts]);

  // ================= MỞ / ĐÓNG MODAL =================
  const openAddModal = () => {
    if (!canEdit) {
      message.warning("Bạn không có quyền thêm tài khoản nhân viên.");
      return;
    }
    if (nhanViensChuaCoTK.length === 0) {
      message.warning("Tất cả nhân viên đã có tài khoản, không thể thêm mới.");
      return;
    }
    setEditingAccount(null);
    form.resetFields();
    form.setFieldsValue({
      dangHoatDong: true,
    });
    setModalVisible(true);
  };

  const openEditModal = (tk) => {
    if (!canEdit) {
      message.warning("Bạn không có quyền sửa tài khoản nhân viên.");
      return;
    }

    const maNV = tk.maNhanVien ?? tk.manhanvien;
    const tenDangNhap = tk.tenDangNhap ?? tk.tendangnhap ?? "";
    const dangHoatDong = (tk.dangHoatDong ?? tk.danghoatdong) !== false;

    setEditingAccount(tk);
    form.resetFields();
    form.setFieldsValue({
      maNhanVien: maNV,
      tenDangNhap,
      matKhau: "", // để trống -> giữ nguyên
      dangHoatDong,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingAccount(null);
    form.resetFields();
  };

  // ================= SUBMIT THÊM / SỬA =================
  const handleSubmit = async (values) => {
    if (!canEdit) {
      message.error("Bạn không có quyền lưu tài khoản nhân viên.");
      return;
    }

    try {
      setSaving(true);

      const maNV = Number(values.maNhanVien);
      const payload = {
        maNhanVien: maNV,
        tenDangNhap: values.tenDangNhap?.trim(),
        dangHoatDong: values.dangHoatDong,
      };

      // chỉ gửi mật khẩu nếu người dùng nhập (khi sửa có thể bỏ trống)
      if (values.matKhau && values.matKhau.trim() !== "") {
        payload.matKhau = values.matKhau;
      }

      if (editingAccount) {
        // CẬP NHẬT
        const id = editingAccount.maNhanVien ?? editingAccount.manhanvien;
        await taikhoannhanvienService.update(id, payload);
        message.success("Cập nhật tài khoản nhân viên thành công!");
      } else {
        // THÊM MỚI
        await taikhoannhanvienService.create(payload);
        message.success("Thêm tài khoản nhân viên thành công!");
      }

      closeModal();
      await loadData();
    } catch (error) {
      console.error("Lỗi khi lưu tài khoản:", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Không thể lưu tài khoản.";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ================= SEARCH =================
  const term = searchTerm.trim().toLowerCase();
  const filteredAccounts = (accounts || []).filter((tk) => {
    if (!term) return true;
    const maNV = tk.maNhanVien ?? tk.manhanvien ?? "";
    const tenNV = nhanVienMap[maNV] ?? "";
    const tenDangNhap = tk.tenDangNhap ?? tk.tendangnhap ?? "";
    const statusText =
      (tk.dangHoatDong ?? tk.danghoatdong) === false
        ? "ngừng hoạt động"
        : "đang hoạt động";

    const haystacks = [String(maNV), tenNV, tenDangNhap, statusText].map((x) =>
      x.toString().toLowerCase()
    );

    return haystacks.some((x) => x.includes(term));
  });

  // ================= UI =================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-700">Đang tải dữ liệu…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserRound className="text-blue-600" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tài khoản nhân viên
            </h1>
            <p className="text-gray-600">
              Quản lý tài khoản đăng nhập của nhân viên
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={nhanViensChuaCoTK.length === 0}
          >
            <Plus size={18} />
            Thêm tài khoản
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {err}
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm theo mã NV, tên NV, tên đăng nhập, trạng thái..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {term
              ? "Không tìm thấy tài khoản phù hợp."
              : "Chưa có tài khoản nào."}
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã NV
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên nhân viên
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên đăng nhập
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                {canEdit && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((tk) => {
                const maNV = tk.maNhanVien ?? tk.manhanvien;
                const tenNV =
                  nhanVienMap[maNV] ?? (maNV != null ? `NV #${maNV}` : "");
                const tenDangNhap = tk.tenDangNhap ?? tk.tendangnhap ?? "";
                const dangHoatDong =
                  (tk.dangHoatDong ?? tk.danghoatdong) !== false;

                return (
                  <tr key={`${maNV}-${tenDangNhap}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{maNV}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{tenNV}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {tenDangNhap}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          dangHoatDong
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {dangHoatDong ? "Đang hoạt động" : "Ngừng hoạt động"}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right text-sm">
                        <button
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                          onClick={() => openEditModal(tk)}
                        >
                          <Edit3 size={16} />
                          Sửa
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL THÊM / SỬA TÀI KHOẢN */}
      {modalVisible && canEdit && (
        <Modal
          title={
            editingAccount ? "Cập nhật tài khoản" : "Thêm tài khoản nhân viên"
          }
          open={modalVisible}
          onCancel={closeModal}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ dangHoatDong: true }}
          >
            <Form.Item
              name="maNhanVien"
              label="Nhân viên"
              rules={[{ required: true, message: "Vui lòng chọn nhân viên!" }]}
            >
              <Select
                placeholder="Chọn nhân viên"
                disabled={!!editingAccount} // khi sửa thì không cho đổi nhân viên
              >
                {editingAccount
                  ? // lúc sửa: chỉ hiển thị nhân viên hiện tại (cho đẹp)
                    (() => {
                      const maNV =
                        editingAccount.maNhanVien ??
                        editingAccount.manhanvien;
                      const tenNV =
                        nhanVienMap[maNV] ??
                        (maNV != null ? `NV #${maNV}` : "");
                      return (
                        <Option key={maNV} value={maNV}>
                          {maNV} - {tenNV}
                        </Option>
                      );
                    })()
                  : // lúc thêm: hiển thị nhân viên chưa có tài khoản
                    nhanViensChuaCoTK.map((nv) => (
                      <Option key={nv.maNhanVien} value={nv.maNhanVien}>
                        {nv.maNhanVien} - {nv.hoTen}
                      </Option>
                    ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="tenDangNhap"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                { min: 3, message: "Tên đăng nhập phải có ít nhất 3 ký tự!" },
              ]}
            >
              <Input placeholder="Nhập tên đăng nhập" />
            </Form.Item>

            <Form.Item
              name="matKhau"
              label={
                editingAccount
                  ? "Mật khẩu (để trống nếu không đổi)"
                  : "Mật khẩu"
              }
              rules={
                editingAccount
                  ? [] // sửa: không bắt buộc
                  : [
                      {
                        required: true,
                        message: "Vui lòng nhập mật khẩu!",
                      },
                      {
                        min: 6,
                        message: "Mật khẩu phải có ít nhất 6 ký tự!",
                      },
                    ]
              }
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>

            <Form.Item name="dangHoatDong" label="Trạng thái">
              <Select>
                <Option value={true}>Đang hoạt động</Option>
                <Option value={false}>Ngừng hoạt động</Option>
              </Select>
            </Form.Item>

            <Form.Item className="mb-0">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Đang lưu..."
                    : editingAccount
                    ? "Cập nhật"
                    : "Thêm mới"}
                </button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
}