const express = require('express');
const path = require('path');

const rootDir = require('../utils/pathUtils');

exports.error = (req, res, next) => {
    res.sendFile(path.join(rootDir, 'views', 'Error.html'));
    req.isLoggedIn = false;
}