const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
	try {
		const results = await db.query("SELECT * FROM companies");
		return res.json({ companies: results.rows });
	} catch (error) {
		return next(error);
	}
});

router.get("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const results = await db.query(
			"SELECT * FROM companies WHERE code=$1",
			[code]
		);
		if (results.rows.length === 0)
			throw new ExpressError("Can't find a company with that code", 404);
		return res.json({ company: results.rows[0] });
	} catch (error) {
		next(error);
	}
});

module.exports = router;
