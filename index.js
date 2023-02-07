require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const saltRounds = 12;

const port = process.env.PORT || 3000;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET
const node_session_secret = process.env.NODE_SESSION_SECRET;

const app = express();

const expireTime = 60 * 60 * 1000;

//Users and Passwords (in memory 'database')
var users = []; 

app.use(express.urlencoded({extended: false}));

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@cluster0.mfpqy0z.mongodb.net/?retryWrites=true&w=majority`,
	crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

app.get('/', (req,res) => {
    var html = `
    <form action='/signup' method='get'>
        <button>Sign Up</button>
    </form>
    <form action='login' method='get'>
        <button>Log In</button>
    </form>
    `;
    res.send(html);
});

app.get('/signup', (req,res) => {
    var missingField = req.query.missing;

    var html = `
    <form action='/submitUser' method='post'>
    <input name='name' type='text' placeholder='name' required>
    <input name='email' type='text' placeholder='email' required>
    <input name='password' type='password' placeholder='password' required>
    <button>Submit</button>
    </form>
    `;

    if (missingField) {
        html += "<br> plase make sure all fields are filled in";
    }

    res.send(html);
});

app.get('/login', (req,res) => {
    var html = `
    log in
    <form action='/loggingin' method='post'>
    <input name='email' type='text' placeholder='email'>
    <input name='password' type='password' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    res.send(html);
});

app.post('/submitUser', (req,res) => {
    var name = req.body.name;
    var password = req.body.password;
    var email = req.body.email;

    if (!name) {
        res.redirect('/signup?missing=1');
    } else if (!email) {
        res.redirect('/signup?missing=1');
    } else if (!password) {
        res.redirect('/signup?missing=1');
    }

    var hashedPassword = bcrypt.hashSync(password, saltRounds);

    users.push({ name: name, email: email, password: hashedPassword });

    console.log(users);

    res.redirect('/loggedin');
});

app.post('/loggingin', (req,res) => {
    var email = req.body.email;
    var password = req.body.password;

    var usershtml = "";
    for (i = 0; i < users.length; i++) {
        if (users[i].email == email) {
            if (bcrypt.compareSync(password, users[i].password)) {
                req.session.authenticated = true;
                req.session.username = users[i].name;
                req.session.cookie.maxAge = expireTime;
        
                res.redirect('/loggedIn');
                return;
            }
        }
    }

    //user and password combination not found
    res.redirect("/login");
});

app.get('/loggedin', (req,res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    }

    var html = ''
    var username = req.session.username;

    html = `<h1>Hello, `+username+`</h1>`;

    html +=`<form action='/members' method='get'>
                <button>Go to Members Area</button>
            </form>
            <form action='/logout' method='get'>
                <button>Log Out</button>
            </form>
    `
    
    res.send(html);
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/')
});

app.get('/members', (req,res) => {

    var img = Math.floor(Math.random() * 3);
    
    var name = req.session.username

    if (img == 0) {
        res.send("<h1>Hello, "+name+" <br></br> <img src='/reverse-nozumi.gif' style='width:250px;'> <br></br> <form action='/logout' method='get'> <button>Log Out</button> </form>");
    }
    else if (img == 1) {
        res.send("<h1>Hello, "+name+" <br></br> <img src='/stonks-up-stongs.gif' style='width:250px;'> <br></br> <form action='/logout' method='get'> <button>Log Out</button> </form>");
    }
    else if (img == 2) {
        res.send("<h1>Hello, "+name+" <br></br> <img src='/bye-bye-bye.gif' style='width:250px;'> <br></br> <form action='/logout' method='get'> <button>Log Out</button> </form>");
    } else {
        res.send("no");
    }
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
	res.send("Page not found - 404");
})

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 