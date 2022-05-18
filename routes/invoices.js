const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
	try {
		const results = await db.query("SELECT id, comp_code FROM invoices");
		return res.json({ invoices: results.rows });
	} catch (error) {
		next(error);
	}
});

router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query(
			"SELECT i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description FROM invoices AS i INNER JOIN companies AS c ON (i.comp_code = c.code) WHERE id=$1",
			[id]
		);
		if (results.rows.length === 0)
			throw new ExpressError("Can't find an invoice with that ID.", 404);
		const { amt, paid, add_date, paid_date, code, name, description } =
			results.rows[0];
		const invoice = {
			id,
			amt,
			paid,
			add_date,
			paid_date,
			company: { code, name, description },
		};
		return res.json({ invoice: invoice });
	} catch (error) {
		next(error);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const { comp_code, amt } = req.body;
		if (!comp_code || !amt)
			throw new ExpressError(
				"comp_code and amt must be included to create a new invoice.",
				400
			);
		const results = await db.query(
			"INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *",
			[comp_code, amt]
		);
		console.log(results);
		return res.status(201).json({ invoice: results.rows[0] });
	} catch (error) {
		next(error);
	}
});

module.exports = router;
