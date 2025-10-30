CREATE TABLE churchcategories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE churches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  categoryid INT NOT NULL,             
  location VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(150),
  datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,         
  idnumber BIGINT UNIQUE,        
  fullname VARCHAR(100) NOT NULL,
  phonenumber VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE,
  role SMALLINT,
  churchid INT NOT NULL,
  status SMALLINT DEFAULT 0,
  subscription SMALLINT DEFAULT 0,
  datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
