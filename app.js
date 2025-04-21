const express = require('express');
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const passportSetup = require('./config/passport-setup');
const passport = require('passport');
require('dotenv').config();
const flash = require("express-flash");
const session = require('express-session');
 
//Init App

const app = express();
app.use(express.json())
app.use(flash());
app.use(cookieParser())
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true // Allows sending cookies
}));

//Db Connection

const dbURI = 'mongodb+srv://XFusional:cc1ss7abcX@blogcluster.dvlp2.mongodb.net/'
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(result => app.listen(3001))
  .then(() => console.log('Server Started'))
  .catch(err => console.log(err));

// Set up session middleware
app.use(session({
  secret: process.env.SESSION_COOKIE_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//Routes
const videoGamesRoutes = require('./routes/videoGameRoutes');
app.use('/videoGames', videoGamesRoutes); 

const userRoutes = require('./routes/userRoutes');
app.use('/user', userRoutes);

const passportRouter = require('./routes/passportRoutes');
app.use('/auth', passportRouter);


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});