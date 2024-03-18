const express = require('express');
const {body, validationResult} = require("express-validator");
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());

const users = [
  { username: 'alice', password: 'secret_password' },
  { username: 'bob', password: 'password123' },
];

app.post('/login', loginValidation(), (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(400).json({errors : errors.array()});
        console.log('not valid');
    }
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = jwt.sign({username}, {expiresIn : '1h'});
        res.status(200).json({ token});
    } else {
        // Authentication failed
        res.status(401).json({ message: 'Authentication failed' });
    }
    console.log("done");
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

function loginValidation(req,res,next){
    return [
        body('username').trim().isLength({min : 3, max : 20}).escape(),
        body('password').trim().isLength({min : 6}).escape()
    ];
    
}
  