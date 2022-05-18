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

router.post("/", async (req, res, next) => {
	try {
		const { code, name, description } = req.body;
		if (!code || !name || !description)
			throw new ExpressError(
				"Code, name, and description are requuired to create a new company.",
				400
			);
		const results = await db.query(
			"INSERT INTO companies VALUES ($1, $2, $3) RETURNING *",
			[code, name, description]
		);
		return res.status(201).json({ company: results.rows[0] });
	} catch (error) {
		next(error);
	}
});

router.put("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const { name, description } = req.body;
		if (!name || !description)
			throw new ExpressError(
				"Name and description are requuired to update a company.",
				400
			);
		const results = await db.query(
			"UPDATE companies SET name=$1, description=$2 WHERE id=$3 RETURNING *",
			[name, description, code]
		);
		if (results.rows.length === 0)
			throw new ExpressError("Can't find a company with that code", 404);
		return res.json({ company: results.rows[0] });
	} catch (error) {
		next(error);
	}
});

module.exports = router;
