const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

exports.getLogin = (req, res) => {
  if (req.session && req.session.isLoggedIn) {
    return res.redirect('/');
  }

  return res.render('auth/login', {
    errorMessage: null,
    oldInput: { email: '' },
  });
};

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(401).render('auth/login', {
        errorMessage: 'Invalid email or password.',
        oldInput: { email },
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).render('auth/login', {
        errorMessage: 'Invalid email or password.',
        oldInput: { email },
      });
    }

    req.session.isLoggedIn = true;
    req.session.user = {
      id: user._id.toString(),
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      role: user.role,
    };

    return req.session.save(() => {
      res.redirect('/');
    });
  } catch (err) {
    return next(err);
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    return res.redirect('/');
  });
};

exports.getSignUp = (req, res) => {
  res.render('auth/SignUp', {
    errorMessages: [],
    oldInput: {
      firstname: '',
      lastname: '',
      email: '',
      role: '',
    },
  });
};

exports.postSignUp = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/SignUp', {
      errorMessages: errors.array(),
      oldInput: {
        firstname: req.body.firstname || '',
        lastname: req.body.lastname || '',
        email: req.body.email || '',
        role: req.body.role || '',
      },
    });
  }

  try {
    const existing = await User.findOne({ email: req.body.email.trim().toLowerCase() });
    if (existing) {
      return res.status(422).render('auth/SignUp', {
        errorMessages: [{ msg: 'Email is already registered.' }],
        oldInput: {
          firstname: req.body.firstname || '',
          lastname: req.body.lastname || '',
          email: req.body.email || '',
          role: req.body.role || '',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email.trim().toLowerCase(),
      password: hashedPassword,
      role: req.body.role,
    });

    await user.save();
    return res.redirect('/login');
  } catch (err) {
    return next(err);
  }
};