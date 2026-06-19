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

    if (!user.password) {
      return res.status(401).render('auth/login', {
        errorMessage: 'This account uses Google Sign-In. Please use "Continue with Google".',
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

exports.googleCallback = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.redirect('/login');
    }

    if (!req.user.role) {
      req.session.pendingUserId = req.user.id;
      return req.session.save(() => {
        res.redirect('/select-role');
      });
    }

    req.session.isLoggedIn = true;
    req.session.user = {
      id: req.user.id,
      email: req.user.email,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      role: req.user.role,
    };

    return req.session.save(() => {
      res.redirect('/');
    });
  } catch (err) {
    return next(err);
  }
};

exports.getSelectRole = (req, res) => {
  if (!req.session.pendingUserId) {
    return res.redirect('/login');
  }

  return res.render('auth/select-role', {
    errorMessage: null,
  });
};

exports.postSelectRole = async (req, res, next) => {
  const { role } = req.body;

  if (!req.session.pendingUserId) {
    return res.redirect('/login');
  }

  if (!role || !['Owner', 'Buyer'].includes(role)) {
    return res.status(422).render('auth/select-role', {
      errorMessage: 'Please select a valid account type.',
    });
  }

  try {
    const user = await User.updateRole(req.session.pendingUserId, role);
    if (!user) {
      return res.redirect('/login');
    }

    delete req.session.pendingUserId;

    req.session.isLoggedIn = true;
    req.session.user = {
      id: user.id,
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