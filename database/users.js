const database = include('databaseConnection');

async function createUser(postData) {
	let createUserSQL = `
		INSERT INTO user
		(username, email, password, user_type_id)
		VALUES
		(:user, :email, :passwordHash, 1);
	`;

	let params = {
		user: postData.user,
		email: postData.email,
		passwordHash: postData.hashedPassword
	}
	
	try {
		const results = await database.query(createUserSQL, params);

        console.log("Successfully created user");
		console.log(results[0]);
		return true;
	}
	catch(err) {
		console.log("Error inserting user");
        console.log(err);
		return false;
	}
}

async function getUsers(postData) {
	let getUsersSQL = `
		SELECT username, password, user_id
		FROM user;
	`;
	
	try {
		const results = await database.query(getUsersSQL);

        console.log("Successfully retrieved users");
		console.log(results[0]);
		return results[0];
	}
	catch(err) {
		console.log("Error getting users");
        console.log(err);
		return false;
	}
}

async function getUser(postData) {
	let getUserSQL = `
		SELECT user_id, username, email, password, type
		FROM user
		JOIN user_type USING (user_type_id)
		WHERE email = :email;
	`;

	let params = {
		email: postData.email
	}
	
	try {
		const results = await database.query(getUserSQL, params);

        console.log("Successfully found user");
		console.log(results[0]);
		return results[0];
	}
	catch(err) {
		console.log("Error trying to find user");
        console.log(err);
		return false;
	}
}

async function getUserFromID(postData) {
	let getUserFromIDSQL = `
		SELECT user_id, username
		FROM user
		WHERE user_id = :user_id;
	`;

	let params = {
		user_id: postData.user_id
	}
	
	try {
		const results = await database.query(getUserFromIDSQL, params);

        console.log("Successfully found user");
		console.log(results[0]);
		return results[0];
	}
	catch(err) {
		console.log("Error trying to find user");
        console.log(err);
		return false;
	}
}

async function addTodo(postData) {
	let createTodoSQL = `
		INSERT INTO todo
		(description, user_id)
		VALUES
		(:desc, :user_id);
	`;

	let params = {
		desc: postData.description,
		user_id: postData.user_id
	}
	
	try {
		const results = await database.query(createTodoSQL, params);

        console.log("Successfully inserted todo");
		console.log(results[0]);
		return true;
	}
	catch(err) {
		console.log("Error inserting todo");
        console.log(err);
		return false;
	}
}

async function getTodo(postData) {
	let getTodoSQL = `
		SELECT description, username
		FROM todo
		JOIN user USING (user_id)
		WHERE user_id = :user_id;
	`;

	let params = {
		user_id: postData.user_id
	}
	
	try {
		const results = await database.query(getTodoSQL, params);

        console.log("Successfully found user");
		console.log(results[0]);
		return results[0];
	}
	catch(err) {
		console.log("Error trying to find user");
        console.log(err);
		return false;
	}
}

module.exports = {createUser, getUsers, getUser, addTodo, getTodo, getUserFromID};