const express = require("express");
const expressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
	try {
		const results = await db.query("SELECT * FROM companies");
		return res.json({ users: results.rows });
	} catch (error) {
		return next(error);
	}
});
