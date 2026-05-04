import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "root",
    database: process.env.MYSQL_DATABASE || "real_estate",
    port: Number(process.env.MYSQL_PORT || "3306"),
});

const getNumberQueryParam = (value: unknown) => {
    if (typeof value !== "string" || value.trim() === "") {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const getPositiveIntegerQueryParam = (value: unknown, fallback: number) => {
    const parsed = getNumberQueryParam(value);

    if (parsed === undefined || !Number.isInteger(parsed) || parsed < 1) {
        return fallback;
    }

    return parsed;
};

app.get("/api/listings", async (req, res) => {
    try {
        const page = getPositiveIntegerQueryParam(req.query.page, 1);
        const limit = getPositiveIntegerQueryParam(req.query.limit, 20);

        const minPrice = getNumberQueryParam(req.query.minPrice);
        const maxPrice = getNumberQueryParam(req.query.maxPrice);
        const bedrooms = getNumberQueryParam(req.query.bedrooms);
        const minArea = getNumberQueryParam(req.query.minArea);
        const maxArea = getNumberQueryParam(req.query.maxArea);

        const whereClauses: string[] = [];
        const whereValues: number[] = [];

        if (minPrice !== undefined) {
            whereClauses.push("price_total >= ?");
            whereValues.push(minPrice);
        }

        if (maxPrice !== undefined) {
            whereClauses.push("price_total <= ?");
            whereValues.push(maxPrice);
        }

        if (bedrooms !== undefined) {
            whereClauses.push("bedrooms = ?");
            whereValues.push(bedrooms);
        }

        if (minArea !== undefined) {
            whereClauses.push("area_sqft >= ?");
            whereValues.push(minArea);
        }

        if (maxArea !== undefined) {
            whereClauses.push("area_sqft <= ?");
            whereValues.push(maxArea);
        }

        const whereSql = whereClauses.length
            ? `WHERE ${whereClauses.join(" AND ")}`
            : "";
        const offset = (page - 1) * limit;

        const [rows] = await pool.query(
            `SELECT * FROM listings ${whereSql} ORDER BY id LIMIT ? OFFSET ?`,
            [...whereValues, limit, offset]
        );

        const [countRows] = await pool.query(
            `SELECT COUNT(*) as total FROM listings ${whereSql}`,
            whereValues
        );

        const total = (countRows as any)[0].total;

        res.json({
            data: rows,
            page,
            limit,
            total,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/listings/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [rows]: any = await pool.query(
            `SELECT * FROM listings WHERE id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(3001, () => {
    console.log("API running on http://localhost:3001");
});
