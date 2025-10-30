CREATE TABLE users (
  id SERIAL PRIMARY KEY,         
  idnumber BIGINT UNIQUE,        
  fullname VARCHAR(100) NOT NULL,
  phonenumber VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  role SMALLINT,
  church VARCHAR(100),
  status SMALLINT DEFAULT 0,
  subscription SMALLINT DEFAULT 0;
  datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
