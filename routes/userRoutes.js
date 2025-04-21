const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/signup', userController.userSignup);
router.post('/login', userController.userLogin);
router.get('/all', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.get('/search/:nickname', userController.searchUsers);
router.get('/verify/:id', userController.verifyPassword);
router.put('/likes/:id', userController.updateLikes);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;