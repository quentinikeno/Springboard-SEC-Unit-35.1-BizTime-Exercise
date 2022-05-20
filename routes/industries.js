const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
	try {
		const results = await db.query(`
            SELECT i.industry, ci.comp_code
            FROM industries AS i
            LEFT JOIN companies_industries AS ci
            ON ci.industry_code = i.code
            `);
		const industries = results.rows.reduce((groupedIndustries, ind) => {
			const { industry, comp_code } = ind;
			if (groupedIndustries[industry] == null)
				groupedIndustries[industry] = [];
			groupedIndustries[industry].push(comp_code);
			return groupedIndustries;
		}, {});
		return res.json({ industries });
	} catch (error) {
		next(error);
	}
});

router.post("/", async (req, res, next) => {
	try {
		const { code, industry } = req.body;
		if (!code || !industry)
			throw new ExpressError(
				"code and industry must be provided to create a new industry.",
				400
			);
		const results = await db.query(
			"INSERT INTO industries VALUES ($1, $2) RETURNING *",
			[code, industry]
		);
		return res.status(201).json({ industry: results.rows[0] });
	} catch (error) {
		next(error);
	}
});

router.post("/:code/add-company", async (req, res, next) => {
	try {
		const { comp_code } = req.body;
		const { code } = req.params;
		if (!comp_code)
			throw new ExpressError(
				"comp_code must be provided to create a new industry.",
				400
			);
		const results = await db.query(
			"INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2) RETURNING comp_code, industry_code",
			[comp_code, code]
		);
		return res.status(201).json({ company_industry: results.rows[0] });
	} catch (error) {
		if (
			error.message ===
			'duplicate key value violates unique constraint "unqiue_comp_ind"'
		)
			return next(
				new ExpressError(
					"Can't insert company and industry association.  Association already exits.",
					400
				)
			);
		return next(error);
	}
});

module.exports = router;
