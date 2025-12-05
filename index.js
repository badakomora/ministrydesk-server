import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import user  from "./Routes/users.js"; 
import church  from "./Routes/churches.js"; 
import item from "./Routes/items.js";
import comment from "./Routes/comments.js";
import message from "./Routes/messages.js";
import transaction from "./Routes/transactions.js";
import path from "path";
dotenv.config();

const app = express();
const port = process.env.PORT;




const allowedClients = [
  'http://localhost:3000',
];

// Enhanced CORS configuration
app.use(cors({ 
  origin: function (origin, callback) {
    if (allowedClients.includes(origin) || !origin) { 
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));


// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/user', user);
app.use('/church', church);
app.use('/item', item);
app.use('/comment', comment);
app.use('/message', message);
app.use('/transaction', transaction);

app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));
// Basic route for testing
app.get('/', (req, res) => {
  res.send('Ministry Desk API is running');
});

// CORS error handler
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS not allowed from this origin',
      requestOrigin: req.headers.origin
    });
  }
  next(err);
});


// Start server
app.listen(port, () => { 
  console.log("Server listening on port", port);
});
