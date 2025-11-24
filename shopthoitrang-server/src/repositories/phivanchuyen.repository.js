const supabase = require('../../config/db');
const PhiVanChuyen = require('../models/phivanchuyen.model');

const TABLE = 'phivanchuyen';
const SINGLETON_ID = 1;

const PhiVanChuyenRepository = {
  async getConfig() {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', SINGLETON_ID)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return new PhiVanChuyen({ id: SINGLETON_ID });
      }

      return new PhiVanChuyen(data);
    } catch (err) {
      console.error('[PhiVanChuyenRepository.getConfig] Error:', err);
      throw err;
    }
  },

  async upsertConfig(payload = {}) {
    const insertPayload = {
      id: SINGLETON_ID,
      ...payload,
    };

    Object.keys(insertPayload).forEach((key) => {
      if (insertPayload[key] === undefined) {
        delete insertPayload[key];
      }
    });

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(insertPayload, { onConflict: 'id' })
      .select('*');

    if (error) {
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return this.getConfig();
    }

    return new PhiVanChuyen(row);
  },
};

module.exports = PhiVanChuyenRepository;
