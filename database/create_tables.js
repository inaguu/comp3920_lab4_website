const database = include('databaseConnection')

async function createTables() {
    let createUserTypeSQL = `
    CREATE TABLE IF NOT EXISTS user_type (
        user_type_id INT PRIMARY KEY AUTO_INCREMENT,
        type VARCHAR(25) NOT NULL      
    );
`;

    let createUserSQL = `
    CREATE TABLE IF NOT EXISTS user (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(45) NOT NULL,
        email VARCHAR(45) NOT NULL,
        password VARCHAR(200) NOT NULL,
        user_type_id INT NOT NULL,
        FOREIGN KEY (user_type_id) REFERENCES user_type(user_type_id)
    );
`;
    let createToDo = `
    CREATE TABLE IF NOT EXISTS todo (
        todo_id INT PRIMARY KEY AUTO_INCREMENT,
        description VARCHAR(255) NOT NULL,
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(user_id)
    );

    
`;
    let insertUserTypeRowsSQL = `
    INSERT INTO user_type (type) VALUES ('user'), ('admin');
`;

    try {
        const resultsuserType = await database.query(createUserTypeSQL);
        const resultsUser = await database.query(createUserSQL);
        const resultsToDo = await database.query(createToDo);
        const resultsInsertUserTypeRows = await database.query(insertUserTypeRowsSQL);


        console.log("Successfully created tables");
        console.log(resultsUser[0]);
        console.log(resultsuserType[0]);
        console.log(resultsToDo[0]);
        console.log(resultsInsertUserTypeRows[0])
        return true;
    } catch (err) {
        console.log("Error creating tables");
        console.log(err);
        return false;
    }
}

module.exports = {createTables};