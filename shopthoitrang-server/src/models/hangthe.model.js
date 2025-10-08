class HangThe {
  constructor({
    mahangthe,
    tenhang,
    dieukien_nam,
    dieukien_tichluy,
    giamgia,
    voucher_sinhnhat,
    uudai
  }) {
    this.mahangthe = mahangthe;
    this.tenhang = tenhang;
    this.dieukien_nam = dieukien_nam;
    this.dieukien_tichluy = dieukien_tichluy;
    this.giamgia = giamgia;
    this.voucher_sinhnhat = voucher_sinhnhat;
    this.uudai = uudai;
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = HangThe;
