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

describe("POST /companies", () => {
	test("Adding a new company", async () => {
		const data = {
			code: "test2",
			name: "Brand New Company",
			description: "This is a new company for testing.",
		};
		const res = await request(app).post("/companies").send(data);
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({ company: data });
	});
	test("If data is missing in request return 400 status code", async () => {
		const data1 = {
			name: "Brand New Company",
			description: "This is a new company for testing.",
		};
		const data2 = {
			code: "test2",
			description: "This is a new company for testing.",
		};
		const data3 = {
			code: "test2",
			name: "Brand New Company",
		};
		const res1 = await request(app).post("/companies").send(data1);
		const res2 = await request(app).post("/companies").send(data2);
		const res3 = await request(app).post("/companies").send(data3);
		expect(res1.statusCode).toBe(400);
		expect(res2.statusCode).toBe(400);
		expect(res3.statusCode).toBe(400);
	});
});

describe("PUT /companies", () => {
	test("Updating a company", async () => {
		const data = {
			name: "Chewie's Peanut Brittle Company",
			description: "This is a company that has been updated.",
		};
		const res = await request(app)
			.put(`/companies/${testCompany.code}`)
			.send(data);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			company: {
				code: testCompany.code,
				name: "Chewie's Peanut Brittle Company",
				description: "This is a company that has been updated.",
			},
		});
	});
	test("If data is missing in request return 400 status code", async () => {
		const data1 = {
			description: "This is a new company for testing.",
		};
		const data2 = {
			name: "Brand New Company",
		};
		const res1 = await request(app)
			.put(`/companies/${testCompany.code}`)
			.send(data1);
		const res2 = await request(app)
			.put(`/companies/${testCompany.code}`)
			.send(data2);
		expect(res1.statusCode).toBe(400);
		expect(res2.statusCode).toBe(400);
	});
	test("If company code is not in database return 404 status code", async () => {
		const data = {
			name: "Chewie's Peanut Brittle Company",
			description: "This is a company that has been updated.",
		};
		const res = await request(app).put("/companies/0").send(data);
		expect(res.statusCode).toBe(404);
	});
});
