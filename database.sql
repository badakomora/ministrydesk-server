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
  nationalrole SMALLINT,
  executiverole SMALLINT,
  districtrole SMALLINT,
  assemblyrole SMALLINT,
  churchid INT NOT NULL,
  status SMALLINT DEFAULT 0,
  subscription SMALLINT DEFAULT 0,
  otp VARCHAR(6),                     -- 🔹 stores temporary 6-digit OTP
  otpexpiry TIMESTAMP,               -- 🔹 stores OTP expiration time
  datecreated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  churchid INTEGER NOT NULL,
  userid INTEGER NOT NULL,
  category VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  datePosted DATE NOT NULL,
  description TEXT,

  documentFile VARCHAR(500),
  documentFileName TEXT,
  audioFile VARCHAR(500),

  offerTithes INTEGER DEFAULT 0,
  offerDonations INTEGER DEFAULT 0,
  requestSpecialPrayers INTEGER DEFAULT 0,
  contributeOffering INTEGER DEFAULT 0,

  verses TEXT[] DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  verses TEXT[] DEFAULT '{}'
);

CREATE TABLE carouselfiles (
  id SERIAL PRIMARY KEY,
  itemid INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  filepath VARCHAR(500) NOT NULL
);

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,       -- unique ID for each transaction
    userid INT NOT NULL,         -- ID of the user making the transaction
    phone VARCHAR(15) NOT NULL,  -- phone number associated with the transaction
    amount NUMERIC(12, 2) NOT NULL,  -- transaction amount
    activity VARCHAR(50) NOT NULL,   -- type of transaction (e.g., deposit, subscription)
    itemid INT
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()  -- transaction time
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  itemid INT NOT NULL,
  userid INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  churchid INT,
  status INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prayerrequests(
  id SERIAL PRIMARY KEY,
  userid INT,
  description TEXT NOT NULL,
  churchid INT,
  status INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);