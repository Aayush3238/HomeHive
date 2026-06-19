const express = require('express');
const path = require('path');
const authRouter = express.Router();
const authController = require('../controller/authController');
const {check } = require('express-validator');
const passport = require('../config/passport');

authRouter.get('/login', authController.getLogin);
authRouter.post('/login', authController.postLogin);
authRouter.get('/logout', authController.postLogout);
authRouter.get('/signup', authController.getSignUp);
authRouter.post(
    '/signup',
    [
        check("firstname")
        .notEmpty()
        .withMessage("First name is required")
        .trim()
        .isLength({min:2})
        .matches(/^[A-Za-z]+$/)
        .withMessage("First name must contain only letters and be at least 2 characters long"),

        check("lastname")
        .notEmpty()
        .trim()
        .isLength({min:2})
        .matches(/^[A-Za-z]+$/)
        .withMessage("Last name must contain only letters and be at least 2 characters long"),

        check("email")
        .notEmpty()
        .isEmail()
        .withMessage("Please enter a valid email address")
        .normalizeEmail(),

        check("password")
        .notEmpty()
        .isLength({min:6})
        .withMessage("Password must be at least 6 characters long")
        .matches(/[a-z]/)
        .withMessage("password must contain one lowerCase letter")
        .matches(/[A-Z]/)
        .withMessage("password must contain one upperCase letter")
        .matches(/[0-9]/)
        .withMessage("password must contain one number")
        .matches(/[!@#$%^&*+-~`;:'",<.>/?]/)
        .withMessage("password must contain one special character"),

        check("confirmPassword")
        .notEmpty()
        .custom((value, {req} ) => {
            if(value !== req.body.password){
                throw new Error ("Passwords do not match");
            }
            return true;
        }),

        check("role")
        .notEmpty()
        .withMessage("User type is required")
        .isIn(["Owner", "Buyer"])
        .withMessage("Invalid user type")

    ],
    authController.postSignUp
)

authRouter.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
authRouter.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', failureMessage: true }),
  authController.googleCallback
);
authRouter.get('/select-role', authController.getSelectRole);
authRouter.post('/select-role', authController.postSelectRole);

exports.authRouter= authRouter;