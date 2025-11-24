const { createClient } = require('@supabase/supabase-js');
const DonHang = require('../models/donhang.model');

const supabase = require('../../config/db');
const TABLE = 'donhang';

const DonHangRepository = {
  async getAll(filters = {}) {
    console.log('🔍 DonHang Repository - Filters:', JSON.stringify(filters, null, 2));
    
    let query = supabase
      .from(TABLE)
      .select('*');
    
    // Filter by employee (nhân viên)
    if (filters.manhanvien) {
      console.log('✓ Filtering by employee:', filters.manhanvien);
      query = query.eq('manhanvien', filters.manhanvien);
    }
    
    // Filter by date range
    if (filters.from) {
      console.log('✓ Filtering from date:', filters.from);
      query = query.gte('ngaydathang', filters.from);
    }
    if (filters.to) {
      console.log('✓ Filtering to date:', filters.to);
      query = query.lte('ngaydathang', filters.to);
    }
    
    // Filter by customer
    if (filters.makhachhang) {
      query = query.eq('makhachhang', filters.makhachhang);
    }
    
    // Filter by status
    if (filters.trangthai || filters.trangthaidonhang) {
      query = query.eq('trangthaidonhang', filters.trangthai || filters.trangthaidonhang);
    }
    
    // Build full query để log
    const queryDescription = [
      filters.manhanvien ? `manhanvien=${filters.manhanvien}` : null,
      filters.from ? `from=${filters.from}` : null,
      filters.to ? `to=${filters.to}` : null,
    ].filter(Boolean).join(', ');
    console.log('🔎 Query summary:', queryDescription);
    
    const { data, error } = await query.order('madonhang', { ascending: false });
    
    if (error) {
      console.log('❌ DonHang repository - Query error:', error);
      throw error;
    }
    
    console.log(`✅ DonHang repository - Returned ${data.length} orders`);
    if (data.length > 0) {
      console.log('📦 First 3 records:', data.slice(0, 3).map(r => ({ 
        madonhang: r.madonhang, 
        manhanvien: r.manhanvien, 
        ngaydathang: r.ngaydathang,
        trangthaidonhang: r.trangthaidonhang
      })));
      
      // Log để kiểm tra xem có đơn hàng nào khớp với filter không
      if (filters.manhanvien) {
        const matchingEmployeeOrders = data.filter(r => r.manhanvien === filters.manhanvien);
        console.log(`📊 Orders matching employee ${filters.manhanvien}:`, matchingEmployeeOrders.length);
      }
      
      if (filters.from || filters.to) {
        const fromDate = filters.from ? new Date(filters.from) : null;
        const toDate = filters.to ? new Date(filters.to) : null;
        const matchingDateOrders = data.filter(r => {
          const orderDate = new Date(r.ngaydathang);
          const matchFrom = !fromDate || orderDate >= fromDate;
          const matchTo = !toDate || orderDate <= toDate;
          return matchFrom && matchTo;
        });
        console.log(`📊 Orders matching date range:`, matchingDateOrders.length);
      }
    }
    
    return data.map(r => new DonHang(r));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('madonhang', id)
      .maybeSingle();
    if (error) throw error;
    return data ? new DonHang(data) : null;
  },

  async getByCustomer(makhachhang) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('makhachhang', makhachhang)
      .order('ngaydathang', { ascending: false });
    if (error) throw error;
    return data.map(r => new DonHang(r));
  },

  async create(payload) {
    const { data, error } = await supabase.from(TABLE).insert([payload]).select('*').single();
    if (error) throw error;
    return new DonHang(data);
  },

  async update(id, fields) {
    // Audit: if trangthaidonhang is changing, record who changed it
    try {
      if (fields && Object.prototype.hasOwnProperty.call(fields, 'trangthaidonhang')) {
        const auditRepo = require('./donhang_trangthai_audit.repository');
        // Get current order to read old status
        const { data: current, error: getErr } = await supabase
          .from(TABLE)
          .select('trangthaidonhang')
          .eq('madonhang', id)
          .maybeSingle();
        if (getErr) {
          console.warn('Warning: cannot read current donhang for audit', getErr.message || getErr);
        } else {
          const oldStatus = current ? current.trangthaidonhang : null;
          const newStatus = fields.trangthaidonhang;
          if ((oldStatus || '') !== (newStatus || '')) {
            const auditEntry = {
              madonhang: id,
              old_trangthai: oldStatus,
              new_trangthai: newStatus,
              actor_type: fields._actorType || 'SYSTEM',
              actor_id: fields._actorId || null,
              actor_name: fields._actorName || null,
              note: fields._actorNote || null
            };
            try {
              await auditRepo.create(auditEntry);
            } catch (e) {
              console.warn('Failed to write donhang_trangthai_audit:', e.message || e);
            }
          }
        }
        // remove internal audit keys before persisting
        delete fields._actorType; delete fields._actorId; delete fields._actorName; delete fields._actorNote;
      }
    } catch (e) {
      console.warn('Audit pre-update failed:', e.message || e);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update(fields)
      .eq('madonhang', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new DonHang(data) : null;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .delete()
      .eq('madonhang', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data ? new DonHang(data) : null;
  },
};

module.exports = DonHangRepository;