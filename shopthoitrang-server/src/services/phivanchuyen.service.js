const repo = require('../repositories/phivanchuyen.repository');

const CACHE_TTL_MS = 60 * 1000;

class PhiVanChuyenService {
  constructor() {
    this._cachedConfig = null;
    this._cacheExpiresAt = 0;
  }

  _normalizeProvince(value) {
    if (!value) return '';
    return value
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s'-]+/g, ' ')
      .trim()
      .toUpperCase();
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

  async _loadConfig(force = false) {
    const now = Date.now();
    if (!force && this._cachedConfig && this._cacheExpiresAt > now) {
      return this._cachedConfig;
    }

    const config = await repo.getConfig();
    this._cachedConfig = config;
    this._cacheExpiresAt = now + CACHE_TTL_MS;
    return config;
  }

  async getConfig(options = {}) {
    return this._loadConfig(options.force);
  }

  async updateConfig(payload = {}) {
    const fields = {
      tinh_kho: payload.tinh_kho ?? payload.tinhKho ?? null,
      phi_trong_tinh: payload.phi_trong_tinh ?? payload.phiTrongTinh ?? null,
      phi_ngoai_tinh: payload.phi_ngoai_tinh ?? payload.phiNgoaiTinh ?? null,
      dang_ap_dung: payload.dang_ap_dung ?? payload.dangApDung ?? null,
    };

    const sanitized = {};
    if (fields.tinh_kho !== null) {
      const trimmed = (fields.tinh_kho || '').trim();
      if (!trimmed) {
        const err = new Error('Tinh kho khong duoc de trong');
        err.status = 400;
        throw err;
      }
      sanitized.tinh_kho = trimmed;
    }
    if (fields.phi_trong_tinh !== null) {
      sanitized.phi_trong_tinh = Math.max(0, Number(fields.phi_trong_tinh) || 0);
    }
    if (fields.phi_ngoai_tinh !== null) {
      sanitized.phi_ngoai_tinh = Math.max(0, Number(fields.phi_ngoai_tinh) || 0);
    }
    if (fields.dang_ap_dung !== null) {
      sanitized.dang_ap_dung = this._coerceBoolean(fields.dang_ap_dung);
    }

    if (Object.keys(sanitized).length === 0) {
      return this.getConfig();
    }

    const result = await repo.upsertConfig(sanitized);
    this._cachedConfig = result;
    this._cacheExpiresAt = Date.now() + CACHE_TTL_MS;
    return result;
  }

  _calculateFeeFromConfig(config, province) {
    if (!config || !config.dang_ap_dung) return 0;
    const normalizedProvince = this._normalizeProvince(province);
    const normalizedWarehouse = this._normalizeProvince(config.tinh_kho);
    if (!normalizedWarehouse) {
      return Number(config.phi_ngoai_tinh) || 0;
    }

    if (normalizedProvince && normalizedProvince === normalizedWarehouse) {
      return Number(config.phi_trong_tinh) || 0;
    }

    if (!normalizedProvince) {
      return Number(config.phi_ngoai_tinh) || 0;
    }

    return Number(config.phi_ngoai_tinh) || 0;
  }

  async calculateFeeForProvince(province) {
    const config = await this._loadConfig();
    return this._calculateFeeFromConfig(config, province);
  }

  async resolveShippingFee({ province, fallbackFee } = {}) {
    try {
      return await this.calculateFeeForProvince(province);
    } catch (err) {
      console.error('[PhiVanChuyenService.resolveShippingFee] Error:', err);
      if (fallbackFee !== undefined && fallbackFee !== null) {
        const parsed = Number(fallbackFee);
        if (!Number.isNaN(parsed) && parsed >= 0) {
          return parsed;
        }
      }
      return 0;
    }
  }
}

module.exports = new PhiVanChuyenService();
