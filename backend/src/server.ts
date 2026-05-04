import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "real_estate",
    port: 3306,
});

app.get("/api/listings", async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
        "SELECT * FROM listings LIMIT ? OFFSET ?",
        [limit, offset]
    );

    const [countRows] = await pool.query(
        "SELECT COUNT(*) as total FROM listings"
    );

    const total = (countRows as any)[0].total;

    res.json({
        data: rows,
        page,
        limit,
        total,
    });
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