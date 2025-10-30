import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  database: "ministrydesk",
  user: "postgres",
  password: ".Picasso",
  host: "localhost",
  port: 5432,
});

export default pool;