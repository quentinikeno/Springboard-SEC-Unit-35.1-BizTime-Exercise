const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

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
		const results = await db.query(
			`SELECT c.code, c.name, c.description, ind.industry
			FROM companies AS c
			LEFT JOIN companies_industries AS ci
			ON c.code = ci.comp_code
			LEFT JOIN industries AS ind
			ON ci.industry_code = ind.code
			WHERE c.code=$1`,
			[req.params.code]
		);
		if (results.rows.length === 0)
			throw new ExpressError("Can't find a company with that code", 404);
		const { code, name, description } = results.rows[0];

		let industries = results.rows.map((row) => row.industry);

		const invoiceResults = await db.query(
			"SELECT id FROM invoices WHERE comp_code=$1",
			[req.params.code]
		);
		const invoices = invoiceResults.rows.map((invoice) => invoice.id);

		return res.json({
			company: { code, name, description, invoices, industries },
		});
	} catch (error) {
		next(error);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const { name, description } = req.body;
		if (!name || !description)
			throw new ExpressError(
				"Name and description are requuired to create a new company.",
				400
			);
		const code = slugify(name, { lower: true });
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
