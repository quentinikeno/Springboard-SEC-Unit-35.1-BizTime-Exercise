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

describe("GET /invoices/:invoice", () => {
	it("Should return all invoices", async () => {
		const res = await request(app).get("/invoices");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoices: [
				{ id: testInvoice.id, comp_code: testInvoice.comp_code },
			],
		});
	});
});

describe("GET /invoices/:id", () => {
	it("Should return one invoice based on the IDs", async () => {
		const res = await request(app).get(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoice: {
				id: String(testInvoice.id),
				amt: 100,
				add_date: expect.any(String),
				paid: false,
				paid_date: null,
				company: testCompany,
			},
		});
	});
	it("Should return 404 status code if ID is not in database", async () => {
		const res = await request(app).get(`/invoices/0`);
		expect(res.statusCode).toBe(404);
	});
});

describe("POST /invoices", () => {
	it("Should create a new invoice", async () => {
		const data = { comp_code: "test", amt: 200 };
		const res = await request(app).post("/invoices").send(data);
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			invoice: {
				id: expect.any(Number),
				comp_code: "test",
				amt: 200,
				paid: false,
				add_date: expect.any(String),
				paid_date: null,
			},
		});
	});
});

describe("PUT /invoices/:id", () => {
	it("Should update a single invoice", async () => {
		const res = await request(app)
			.put(`/invoices/${testInvoice.id}`)
			.send({ amt: 1000 });
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoice: {
				id: testInvoice.id,
				comp_code: "test",
				amt: 1000,
				add_date: expect.any(String),
				paid: false,
				paid_date: null,
			},
		});
	});
	it("Should return a 400 status code if no amt is sent in the request body", async () => {
		const res = await request(app)
			.put(`/invoices/${testInvoice.id}`)
			.send({ blah: 1000 });
		expect(res.statusCode).toBe(400);
	});
	it("Should return a 404 status code if invoice ID is not in database", async () => {
		const res = await request(app).put("/invoices/0").send({ amt: 1000 });
		expect(res.statusCode).toBe(404);
	});
});
