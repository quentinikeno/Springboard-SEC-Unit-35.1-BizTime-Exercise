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
		"INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('test', 100, false, null) RETURNING *"
	);
	await db.query(
		"INSERT INTO industries VALUES ('tech', 'Technology'), ('e-commerce', 'E-commerce')"
	);
	await db.query(
		"INSERT INTO companies_industries (comp_code, industry_code) VALUES ('test', 'tech'), ('test', 'e-commerce')"
	);
	testCompany = company.rows[0];
	testInvoice = invoice.rows[0];
});

afterEach(async () => {
	await db.query("DELETE FROM companies");
	await db.query("DELETE FROM invoices");
	await db.query("DELETE FROM companies_industries");
	await db.query("DELETE FROM industries");
});

afterAll(async () => {
	await db.end();
});

describe("GET /industries", () => {
	test("Should GET a list of all industries with company codes for that industry", async () => {
		const res = await request(app).get("/industries");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			industries: {
				Technology: ["test"],
				"E-commerce": ["test"],
			},
		});
	});
});

describe("POST new industry to /industries", () => {
	test("Should add a new industry to database", async () => {
		const data = { code: "fin", industry: "finance" };
		const res = await request(app).post("/industries").send(data);
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({ industry: data });
	});
	test("Should throw error if code or industry are not provided in request.", async () => {
		const data = { code: "fin" };
		const res = await request(app).post("/industries").send(data);
		expect(res.statusCode).toBe(400);
		const data2 = { industry: "finance" };
		const res2 = await request(app).post("/industries").send(data2);
		expect(res2.statusCode).toBe(400);
	});
});
