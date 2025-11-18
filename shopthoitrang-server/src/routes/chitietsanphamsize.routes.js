// src/routes/chitietsanphamsize.routes.js
const express = require("express");
const ctrl = require("../controllers/chitietsanphamsize.controller");

const router = express.Router();

// GET /chitietsanphamsize?productDetailId=&sizeId=
router.get("/", ctrl.list);

// GET /chitietsanphamsize/:id
router.get("/:id", ctrl.get);

// POST /chitietsanphamsize
router.post("/", ctrl.create);

// PUT /chitietsanphamsize/:id
router.put("/:id", ctrl.update);

// DELETE /chitietsanphamsize/:id
router.delete("/:id", ctrl.remove);

// POST /chitietsanphamsize/upsert
router.post("/upsert/by-unique", ctrl.upsert);

module.exports = router;
