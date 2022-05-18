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
		let companyResults = results.rows[0];

		const invoiceResults = await db.query(
			"SELECT id FROM invoices WHERE comp_code=$1",
			[code]
		);
		const invoiceIDs = invoiceResults.rows.map((invoice) => invoice.id);
		companyResults.invoices = invoiceIDs;

		return res.json({ company: companyResults });
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
			"UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *",
			[name, description, code]
		);
		if (results.rows.length === 0)
			throw new ExpressError("Can't find a company with that code", 404);
		return res.json({ company: results.rows[0] });
	} catch (error) {
		next(error);
	}
});

router.delete("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const results = await db.query(
			"DELETE FROM companies WHERE code=$1 RETURNING *",
			[code]
		);
		if (results.rows.length === 0)
			throw new ExpressError("Can't find a company with that code", 404);
		return res.json({ message: "Deleted." });
	} catch (error) {
		next(error);
	}
});

module.exports = router;
