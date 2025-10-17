var express = require('express');
var router = express.Router();
const User = require('../models/userModel');
const { validationResult } = require('express-validator');
const { validateEmail, validatePassword } = require('./customValidators');
const bcrypt = require('bcrypt');

// Define isAuthenticated middleware before usage
const isAuthenticated = (allowedDomain) => (req, res, next) => {
  if (req.session && req.session.userEmail) {
    const userEmail = req.session.userEmail;
    console.log('User email:', userEmail);
    if (allowedDomain) {
      if (userEmail.endsWith(allowedDomain)) {
        return next();
      } else {
        return res.status(403).send('unauthorized');
      }
    } else {
      return next();
    }
  }
  console.log('User email not found in session:', req.session);
  res.redirect('/login');
};

// Root landing page (no messages)
router.get('/', (req, res) => {
  res.render('medical', { errors: [], message: null });
});

// Home page with authentication; pass success and error as null by default
router.get('/home', isAuthenticated(), function(req, res) {
  const email = req.session.userEmail || null;
  res.render('home', { email: email, success: null, error: null });
});

// Create user with validations
router.post('/createUser', [
  validateEmail,
  validatePassword
], function (req, res) {
  const errors = req.validationErrors || [];
  const validationResultErrors = validationResult(req);
  if (!validationResultErrors.isEmpty()) {
    errors.push(...validationResultErrors.array());
  }
  if (errors.length > 0) {
    res.render('home', { errors, email: req.body.email, success: null, error: null });
  } else {
    const { email, password } = req.body;
    const newUser = new User({ email, password });
    newUser.save()
      .then(() => res.render('form-data', { message: "Data saved to db" }))
      .catch(error => console.error(error));
  }
});

// Signup routes
router.get('/signup', (req, res) => {
  res.render('signup', { message: null, error: null });
});
router.post('/signup', (req, res) => {
  const { email, password, confirmPassword } = req.body;
  const user = new User({ email, password });
  const validationError = user.validateSync();

  if (password !== confirmPassword) {
    return res.render('signup', { message: 'Password and Confirm Password do not match', error: null });
  }
  if (validationError) {
    return res.render('signup', { message: null, error: validationError.errors });
  }

  User.findOne({ email })
    .then(existingUser => {
      if (existingUser) {
        return res.render('signup', { message: 'Email already taken', error: null });
      } else {
        return bcrypt.hash(password, 10);
      }
    }).then(hashedPassword => {
      const signupUser = new User({ email, password: hashedPassword });
      return signupUser.save();
    }).then(() => {
      res.redirect('/login');
    }).catch(error => {
      console.error(error);
    });
});

// Login routes
router.get('/login', (req, res) => {
  res.render('login', { errors: [], message: null });
});
router.post('/login', [
  validateEmail,
  validatePassword
], function (req, res) {
  const errors = req.validationErrors || [];
  const validationResultErrors = validationResult(req);
  if (!validationResultErrors.isEmpty()) {
    errors.push(...validationResultErrors.array());
  }
  if (errors.length > 0) {
    res.render('login', { errors, message: null });
  } else {
    const { email, password } = req.body;
    let foundUser;
    User.findOne({ email })
      .then(user => {
        if (!user) {
          return res.render('login', { message: 'Incorrect Email Address.', errors: [] });
        }
        foundUser = user;
        return bcrypt.compare(password, user.password);
      })
      .then(isPasswordValid => {
        if (!isPasswordValid) {
          return res.render('login', { message: 'Incorrect password.', errors: [] });
        }
        req.session.userId = foundUser._id;
        req.session.userEmail = foundUser.email;
        // Render home with email and default success/error as null
        res.render('home', { email: foundUser.email, success: null, error: null });
      })
      .catch(error => {
        console.error(error);
        res.status(500).send('Internal Server Error');
      });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      res.send('Error');
    } else {
      res.redirect('/');
    }
  });
});

module.exports = router;
