import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "spa-durban-db.c3a0acgmg15s.af-south-1.rds.amazonaws.com",
  database: "postmate_new",
  password: "SpaDurban4824!!",
  port: 5432,
   ssl: {
    rejectUnauthorized: false, // agar self-signed certificate hai
  },
});

export default pool;
