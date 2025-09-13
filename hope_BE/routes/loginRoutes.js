const express = require('express');
const router = express.Router();

const {
    loginUser,
    logout,
    registerUser,
} = require('../controllers/loginController');

router.post('/login', loginUser);
router.post('/signup', registerUser);
// router.get('/logout', logout);

module.exports = router;
