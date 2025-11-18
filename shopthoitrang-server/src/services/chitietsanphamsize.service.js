// src/services/chitietsanphamsize.service.js
const repo = require("../repositories/chitietsanphamSize.repository");
const ChiTietSanPhamSize = require("../models/ChiTietSanPhamSize");

function normalize(r) {
  if (!r) return null;
  return new ChiTietSanPhamSize(r); // constructor đã map sẵn
}

async function getAll(filter) {
  const list = await repo.findAll(filter);
  return list.map(normalize);
}

async function getById(id) {
  const row = await repo.findById(id);
  return normalize(row);
}

function validatePayload(p) {
  const errs = [];
  if (p.machitietsanpham == null) errs.push("machitietsanpham là bắt buộc");
  if (p.makichthuoc == null) errs.push("makichthuoc là bắt buộc");
  if (p.so_luong != null && Number(p.so_luong) < 0)
    errs.push("so_luong không được âm");
  if (errs.length) {
    const e = new Error(errs.join("; "));
    e.status = 400;
    throw e;
  }
}

async function create(payload) {
  validatePayload(payload);
  const row = await repo.create(payload);
  return normalize(row);
}

async function update(id, payload) {
  if (payload.so_luong != null && Number(payload.so_luong) < 0) {
    const e = new Error("so_luong không được âm");
    e.status = 400;
    throw e;
  }
  const row = await repo.update(id, payload);
  return normalize(row);
}

async function remove(id) {
  return await repo.remove(id);
}

async function upsert({ machitietsanpham, makichthuoc, so_luong }) {
  validatePayload({ machitietsanpham, makichthuoc, so_luong });
  const row = await repo.upsertByUnique(machitietsanpham, makichthuoc, so_luong);
  return normalize(row);
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  upsert,
};
