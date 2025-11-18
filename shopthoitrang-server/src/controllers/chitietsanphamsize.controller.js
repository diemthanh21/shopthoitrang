// src/controllers/chitietsanphamsize.controller.js
const service = require("../services/chitietsanphamsize.service");

async function list(req, res, next) {
  try {
    const { productDetailId, sizeId } = req.query;
    const data = await service.getAll({ productDetailId, sizeId });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function get(req, res, next) {
  try {
    const data = await service.getById(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const data = await service.create(req.body);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const data = await service.update(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const ok = await service.remove(req.params.id);
    if (!ok) return res.status(404).json({ message: "Not found" });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
}

async function upsert(req, res, next) {
  try {
    const data = await service.upsert(req.body);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  upsert,
};
