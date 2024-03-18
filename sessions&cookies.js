const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();
const fs = require('fs');
const { log } = require('console');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use(session({
    secret: 'secret key',
    resave: false,
    saveUninitialized: true,
    //cookie : {secure : true, httpOnly : true, maxAge : 3000}
}));

fs.readFile('users.json', (err, data) => {
    if (err) {
        console.log('error');
    }
    const users = JSON.parse(data);

    app.post('/register', (req, res) => {
        const { username, password } = req.body;
        if (users.some(user => user.username === username)) {
            res.status(400).json({ error: "username already taken" });
        }

        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                res.status(500).json({ error: "internal server problem" });
            } else {
                users.push({ username, password: hash });
                const usersJson = JSON.stringify(users);
                fs.writeFileSync('users.json', usersJson);
                req.session.isLoggedIn = true;
                req.session.username = username;

                res.cookie('sessionId', req.sessionID, { httpOnly: true })

                res.status(200).json({ users: users });
            }

        });
    });

    app.post('/login', async (req, res) => {
        const { username, password } = req.body;
        const user = users.find(user => user.username === username);
        console.log(user);

        if (!user) {
            res.status(400).json({ error: 'invalid usename or password' });
            return;
        }

        try {
            const matched = await bcrypt.compare(password, user.password)
            if (matched) {
                req.session.isLoggedIn = true;
                req.session.username = user.username;
                const sessionId = req.sessionID;
                res.cookie('sessionId', sessionId, { httpOnly: true ,maxAge :86000})
                res.status(200).json({
                    message: 'logged in successefully',
                    sessionsId: sessionId
                });
            } else {
                res.status(400).json('invalid password');
            }

        } catch (error) {
            console.log(error);

        }


    });

    app.post('/protected', (req, res) => {
        if (req.session.isLoggedIn) {
            console.log(req.session);
            res.status(200).json({ message: "authorized" })
        } else {
            res.status(401).json({ message: 'unauthorized' });
        }
    });

    app.post('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                res.status(500).json({ error: 'internal server prob' });
            }
            res.clearCookie('sessionId');
            res.status(200).json({ message: "logged out successfully" });
        });

    });

});



app.listen(port, () => {
    console.log("server running on port 3000");
})





