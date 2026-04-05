const express = require('express');
const { validationResult } = require('express-validator');

const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getLogin = (req,res,next) => {
    if (req.session && req.session.isLoggedIn) {
        return res.redirect('/');
    }
    res.render('auth/login');

}
exports.postLogin = async (req, res, next ) => {
    const {email , password} = req.body;
    try{
        const user = await User.findOne({email : email});
        if(!user){
            return res.render('auth/signup');
        }
        const Match = await bcrypt.compare(password, user.password);
        if(!Match){
            console.log("Incorrect Password");
            return res.render('auth/login');
        }
        req.session.isLoggedIn = true;
        req.session.user = {
            id: user._id.toString(),
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            role: user.role
        };
        req.session.save(() => {
            res.redirect('/');
        })
       
    }
    catch(err) {
        console.log(err);
    }
    
}
    

exports.postLogout = (req,res,next) =>{
    req.session.destroy((err) => {
        if(err) {
            console.log(err);
            return next(err);
        }
        res.redirect('/');
    });   
}
exports.getSignUp = (req, res, next ) => {
    res.render('auth/SignUp');
}
exports.postSignUp = (req,res,next) =>{
    const errors = validationResult(req);
    console.log(errors);
    console.log(req.body);
    if(!errors.isEmpty()){
        return res.status(422).render('auth/SignUp', {
            errorMessages: errors.array(),
            
            oldInput: {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                email: req.body.email,
                role: req.body.role
            }
        });
    }else{
      bcrypt.hash(req.body.password, 12).then(hashedPassword => {
      const user = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: hashedPassword,
        role: req.body.role
      })
       return user.save()
      .then(() => {
        console.log("User registered successfully");
        res.redirect('/login');
      })
      .catch(err => {
        console.log("error in registering user", err);
      });
    });
}
   
}



