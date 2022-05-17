// Tell Node that we're in test "mode"
process.env.NODE_ENV = "test";

const { setUncaughtExceptionCaptureCallback } = require("process");
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

beforeEach(async () => {
	const company = await db.query(
		"INSERT INTO companies VALUES ('test', 'Test Company', 'This is a VERY REAL company. Legit.') RETURNING *"
	);
	const invoice = await db.query(
		"INSERT INTO invoices (comp_Code, amt, paid, paid_date) VALUES ('test', 100, false, null) RETURNING *"
	);
	testCompany = company.rows[0];
	testInvoice = invoice.rows[0];
});

afterEach(async () => {
	await db.query("DELETE FROM companies");
	await db.query("DELETE FROM invoices");
});

afterAll(async () => {
	await db.end();
});

describe("GET /companies", () => {
	test("Get a object of companies", async () => {
		const res = await request(app).get("/companies");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ companies: [testCompany] });
	});
});

describe("GET /companies/:code", () => {
	test("Get a object with a single company", async () => {
		const res = await request(app).get(`/companies/${testCompany.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ company: testCompany });
	});
	test("Return 404 status code if a company cannot be found with a code.", async () => {
		const res = await request(app).get(
			`/companies/thiscompanydoesnotexist1234`
		);
		expect(res.statusCode).toBe(404);
	});
});
