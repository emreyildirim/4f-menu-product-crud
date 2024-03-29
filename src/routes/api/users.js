const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const apiKey = require('../../config/keys').apiKEY;
const bcrypt = require('bcryptjs');
const salt = 12;
const User = require('../../models/User');

// GET ALL USERS
router.get('/', (req, res) => {
  const promise = User.find({});
  promise.then(users => {
    users.length > 0
      ? res.json({ success: true, data: users })
      : res.json({ success: false, message: 'Hiçbir Kullanıcı Bulunamadı' });
  });
});

// GET USER BY ID
router.get('/:id', (req, res) => {
  const promise = User.findById({ _id: req.params.id });
  promise
    .then(user => {
      res.json({ success: true, data: user });
    })
    .catch(() => {
      res.json({
        success: false,
        message: 'Bu IDye sahip kullanıcı bulunamadı',
      });
    });
});

// DELETE USER DELETE
router.delete('/:id', (req, res) => {
  User.findById(req.params.id)
    .then(user =>
      user
        .remove()
        .then(() => res.json({ success: true, message: 'Başarıyla Silindi' }))
    )
    .catch(() => res.status(404).json({ success: false }));
});

// POST USER REGISTRATION
router.post('/register', (req, res) => {
  const newUser = new User({
    email: req.body.email,
    password: req.body.password,
  });

  bcrypt.hash(newUser.password, salt, (err, hash) => {
    if (err) res.json({ success: false });
    newUser.password = hash;
    newUser
      .save()
      .then(user => res.json({ success: true, data: user }))
      .catch(() => {
        res.json({ success: false, message: 'Kullanıcı zaten kayıtlı' });
      });
  });
});

// POST USER LOGIN
router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email }).then(user => {
    if (!user) {
      res.json({ success: false, message: 'Kullanıcı Bulunamadı' });
    }
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        const payload = { id: user._id, email: user.email };
        jwt.sign(payload, apiKey, { expiresIn: '1h' }, (err, token) => {
          res.json({ success: true, token: 'Bearer ' + token });
        });
      } else {
        res.json({ success: false, message: 'Hatalı Şifre' });
      }
    });
  });
});

// POST USER AUTHENTICATION
router.post('/authentication', verifyToken, (req, res) => {
  jwt.verify(req.token, apiKey, (err, authData) => {
    if (err) {
      res.json(err);
    } else {
      res.json({ success: true, data: authData });
    }
  });
});

// VERIFY TOKEN
// FORMAT : Bearer <token>
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    res.status(403);
  }
}

module.exports = router;
