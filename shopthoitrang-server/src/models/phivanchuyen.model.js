class PhiVanChuyen {
  constructor({
    id = 1,
    tinh_kho = '',
    phi_trong_tinh = 0,
    phi_ngoai_tinh = 0,
    dang_ap_dung = true,
    updated_at = null,
  } = {}) {
    this.id = id || 1;
    this.tinh_kho = (tinh_kho || '').trim();
    this.phi_trong_tinh = Number(phi_trong_tinh) || 0;
    this.phi_ngoai_tinh = Number(phi_ngoai_tinh) || 0;
    this.dang_ap_dung = this._coerceBoolean(dang_ap_dung);
    this.updated_at = updated_at || new Date().toISOString();
  }

  _coerceBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['false', '0', 'off', 'no', 'inactive'].includes(normalized)) {
        return false;
      }
      if (['true', '1', 'yes', 'on', 'active'].includes(normalized)) {
        return true;
      }
    }
    return Boolean(value);
  }

  toJSON() {
    return {
      id: this.id,
      tinh_kho: this.tinh_kho,
      phi_trong_tinh: Number(this.phi_trong_tinh) || 0,
      phi_ngoai_tinh: Number(this.phi_ngoai_tinh) || 0,
      dang_ap_dung: !!this.dang_ap_dung,
      updated_at: this.updated_at,
    };
  }
}

module.exports = PhiVanChuyen;
