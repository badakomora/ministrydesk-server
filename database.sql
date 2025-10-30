CREATE TABLE users (
  id SERIAL PRIMARY KEY,         -- internal auto id
  idnumber BIGINT UNIQUE,        -- or VARCHAR if numbers may start with zero
  fullname VARCHAR(100) NOT NULL,
  phonenumber VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  role SMALLINT,
  church VARCHAR(100),
  status SMALLINT DEFAULT 1,
  datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
