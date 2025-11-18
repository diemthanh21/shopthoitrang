class DanhGia {
  constructor(data) {
    // Dynamically assign all fields (allows enriched fields like madonhang, customer, product info)
    Object.assign(this, data);
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = DanhGia;
