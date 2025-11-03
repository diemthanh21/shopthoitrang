import { Modal, Table, Tooltip, Empty, Spin } from 'antd';

export default function ProductDetailModal({ 
  visible, 
  onCancel, 
  product, 
  productDetails,
  danhMucMap,
  thuongHieuMap 
}) {
  const isLoading = visible && product && productDetails.length === 0;
  return (
    <Modal
      title={`Chi tiết sản phẩm - ${product?.tenSanPham || ''}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1000}
    >
      {product && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="font-medium text-gray-500">Mã sản phẩm</p>
              <p>{product.maSanPham}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">Tên sản phẩm</p>
              <p>{product.tenSanPham}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Danh sách chi tiết sản phẩm</h3>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spin tip="Đang tải chi tiết sản phẩm..." />
              </div>
            ) : productDetails.length === 0 ? (
              <Empty description="Không có dữ liệu chi tiết sản phẩm" />
            ) : (
            <Table
              dataSource={productDetails}
              rowKey="machitietsanpham"
              pagination={false}
              scroll={{ x: true }}
              columns={[
                {
                  title: 'Mã chi tiết',
                  dataIndex: 'machitietsanpham',
                  key: 'machitietsanpham',
                },
                {
                  title: 'Kích thước',
                  dataIndex: 'kichthucsp',
                  key: 'kichthucsp',
                },
                {
                  title: 'Màu sắc',
                  dataIndex: 'mausac',
                  key: 'mausac',
                },
                {
                  title: 'Chất liệu',
                  dataIndex: 'chatlieu',
                  key: 'chatlieu',
                },
                {
                  title: 'Mô tả',
                  dataIndex: 'mota',
                  key: 'mota',
                  width: 250,
                  render: (text) => text ? (
                    <Tooltip title={text}>
                      <div className="truncate max-w-xs">{text}</div>
                    </Tooltip>
                  ) : null,
                },
                {
                  title: 'Giá bán',
                  dataIndex: 'giaban',
                  key: 'giaban',
                  render: (price) => price ? price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) : 'N/A',
                },
                {
                  title: 'Số lượng tồn',
                  dataIndex: 'soluongton',
                  key: 'soluongton',
                  render: (value) => value ?? 'N/A',
                },
              ]}
            />
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}