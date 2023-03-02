require('./utils');

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

const database = include('databaseConnection');
const db_utils = include('database/db_utils');
const db_users = include('database/users');
const success = db_utils.printMySQLVersion();

const app = express();

const expireTime = 60 * 60 * 1000;

//Users and Passwords (in memory 'database')
var users = []; 

app.set("view engine", "ejs");

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

app.get('/createTables', async (req,res) => {

    const create_tables = include('database/create_tables');

    var success = create_tables.createTables();
    if (success) {
        res.render("successMessage", {message: "Created tables."} );
    }
    else {
        res.render("errorMessage", {error: "Failed to create tables."} );
    }
});

app.get('/', (req,res) => {
    res.render("home");
});

app.get('/signup', (req,res) => {
    var missingField = req.query.invalid;

    if (missingField) {
        res.render("signup", {missingField: 1});
    } else {
        res.render("signup");
    }        
});

app.get('/login', (req,res) => {
    res.render("login");
});

app.post('/submitUser', async (req,res) => {
    var username = req.body.name;
    var password = req.body.password;
    var email = req.body.email;

    if (!username) {
        res.redirect('/signup?invalid=1');
        return;
    } else if (!email) {
        res.redirect('/signup?invalid=1');
        return;
    } else if (!password) {
        res.redirect('/signup?invalid=1');
        return;
    }

    var hashedPassword = bcrypt.hashSync(password, saltRounds);

    var success = await db_users.createUser({ user: username, email: email, hashedPassword: hashedPassword });

    if (success) {
        res.redirect('/login');
    }
    else {
        res.render("errorMessage", {error: "Failed to create user."} );
    }

    // users.push({ name: name, email: email, password: hashedPassword });
    // console.log(users);
    // res.redirect('/loggedin');
});

app.post('/loggingin', async (req,res) => {
    var email = req.body.email;
    var password = req.body.password;

    var results = await db_users.getUser({ email: email, hashedPassword: password });

    if (results) {
        if (results.length == 1) { //there should only be 1 user in the db that matches
            if (bcrypt.compareSync(password, results[0].password)) {
                req.session.authenticated = true;
                req.session.user_id = results[0].user_id;
                req.session.username = results[0].username;
                req.session.email = email;
                req.session.user_type = results[0].type; 
                req.session.cookie.maxAge = expireTime;

                if (req.session.user_type == "admin") {
                    res.redirect('/loggedin/admin');
                    return;
                }

                res.redirect('/loggedIn');
                return;
            }
            else {
                console.log("invalid password");
            }
        }
        else {
            console.log('invalid number of users matched: '+results.length+" (expected 1).");
            res.redirect('/login');
            return;            
        }
    }

    console.log('user not found');
    //user and password combination not found
    res.redirect("/login");
});

function isValidSession(req) {
	if (req.session.authenticated) {
		return true;
	}
	return false;
}

function sessionValidation(req, res, next) {
	if (!isValidSession(req)) {
		req.session.destroy();
		res.redirect('/login');
		return;
	}
	else {
		next();
	}
}

function isAdmin(req) {
    if (req.session.user_type == 'admin') {
        return true;
    }
    return false;
}

function adminAuthorization(req, res, next) {
	if (!isAdmin(req)) {
        res.render("/");
        return;
	}
	else {
		next();
	}
}

app.use('/loggedin', sessionValidation);
app.use('/loggedin/admin', adminAuthorization);

app.get('/loggedin', (req,res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    }

    var username = req.session.username;

    res.render("loggedin", {username: username});
});

app.get('/loggedin/admin', async (req, res) => {
    var results = await db_users.getUsers();
    var username = req.session.username;
    
    res.render("admin", {users:results, username: username});
});

app.get('/loggedin/admin/user/:user_id', async (req, res) => {
    var results = await db_users.getTodo({user_id: req.params.user_id});
    var username = req.session.username;
    var user_username = await db_users.getUserFromID({user_id: req.params.user_id})

    res.render("todoadmin", {todo: results, username: username, user_username: user_username[0].username});
});

app.get('/loggedin/todo', async (req, res) => {
    var username = req.session.username;
    var user_id = req.session.user_id

    var results = await db_users.getTodo({user_id: user_id})

    res.render("todo", {username: username, todo: results})
});

app.post('/addList', async (req, res) => {
    var add = req.body.desc;
    var user_id = req.session.user_id

    var success = await db_users.addTodo({ description:add, user_id: user_id });

    if (success) {
        res.redirect('/loggedin/todo');
    } else {
        res.render("errorMessage", {error: "Failed to add to list."} );
    }   

});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/')
});

app.get('/loggedin/members', (req,res) => {

    var img = Math.floor(Math.random() * 3);
    var name = req.session.username

    // if (img == 0) {
    //     res.send("<h1>Hello, "+name+" <br></br> <img src='/reverse-nozumi.gif' style='width:250px;'> <br></br> <form action='/logout' method='get'> <button>Log Out</button> </form>");
    // }
    // else if (img == 1) {
    //     res.send("<h1>Hello, "+name+" <br></br> <img src='/stonks-up-stongs.gif' style='width:250px;'> <br></br> <form action='/logout' method='get'> <button>Log Out</button> </form>");
    // }
    // else if (img == 2) {
    //     res.send("<h1>Hello, "+name+" <br></br> <img src='/bye-bye-bye.gif' style='width:250px;'> <br></br> <form action='/logout' method='get'> <button>Log Out</button> </form>");
    // } else {
    //     res.send("no");
    // }

    res.render("members", {username: name, img: img})
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
	res.render("404");
})

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 