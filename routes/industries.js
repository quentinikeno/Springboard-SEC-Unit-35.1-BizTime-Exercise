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

module.exports = router;
