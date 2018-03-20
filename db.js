

const NodeCouchDb = require('node-couchdb');

const couch = new NodeCouchDb();

//Database names
const u_db = "user-info"; 
const u_cookie = "cookie";


/**
*Class name: User
*Attributes: username,password,email
*Methods:
            generateid(): Creates a unique id for the document before registration (Called within register function)
            register(): Registers the user with given details
            authenticate(): Authenticate user with given credentials
*
*/


/**
 * @class User
 * Class representing a user
 */
module.exports = class User{
    /**
     * Constructor to create a user object
     * @param {string} username Username of the user
     * @param {string} password Password
     * @param {string} email Email
     */
    constructor(username, password, email) {
        this.username = username;
        this.password = password;
        this.email = email;
    }

    /**
     * Creates a unique id for user to be stored in database when registered
     */
    generateid () {
        var ids;
        couch.uniqid().then(ids => ids[0]);
        this.id = ids;
    }

    /**
     * Function to register a user with given credentials
     * @returns {Promise} res A promise object which returns "User Registered" if adding user to database was successful and an error message if user with given credentials already exists
     */

    register() {
        const res = new Promise((resolve, reject) => {
            var status = "User registered";
            var err;
            check_user_exist(this.email, this.username).then(({ op, user }) => {
                if (op == 1)
                    err = "User with email already exists";
                else if (op == 2)
                    err = "User with username already exists";
            }, err => {
                couch.insert("user-info", {
                    _id: this.generateid(),
                    username: this.username,
                    password: this.password,
                    email: this.email
                }).then(({ data, header, status }) => {
                    console.log(data);
                    console.log(header);
                    console.log(status);
                }, err => {
                    console.log("Error" + err);
                });

            });

            if (!err)
                resolve(status);
            else
                reject(err);
        });

        return res;
    }

    /**
     * Function to authenticate user with given credentials
     * @returns {Promise} res Returns a promise object which gives the username of the user if authenticated and a suitable error message if the user is not registered or if the passwords do
     */
    authenticate(){
        const res = new Promise((resolve, reject) => {
            var status = "User Authenticated";
            var err;
            check_user_exist(this.email, this.username).then(({ op, user }) => {
                if(user.password!=this.password)
                    err="Incorrect Password";
                else
                    status=user.username;
            }, err => {
                err="Username/email does not exist";
            });

            if (!err)
                resolve(status);
            else
                reject(err);
        });

        return res;
    }

}

/**
 * Function to check if a user with given username or email already exists in the database
 * @param {String} email 
 * @param {String} username 
 * @returns {Promise} res A promise object which returns a JSON object consisting of an option message and the user object if the user exists and an error message if user does not exist
 */
function check_user_exist (email, username) {
    const res = new Promise((resolve, reject) => {
        var status;
        var err = "User does not exist";
        const view_url = "/_design/get-user-email/_view/useremail";
        const option = { key: email };
        couch.get(u_db, view_url, option).then(({ data, header, status }) => {
            if (data.rows.length > 0)
                status = { op: 1, data: new User(email, data.rows[0].username, data.rows[0].password) };
            else {
                couch.get(u_db, "/_design/get-user-username/_view/user-username", { key: username }).then(({ data, header, status }) => {
                    if (data.rows.length > 0)
                        status = { op: 2, data: new user(data.rows[0].email, username, data.rows[0].password) };
                }, err => {
                    console.log("Error: " + err);
                });
            }

        }, err => {
            console.log("Error: " + err);
        });

        if (!status)
            reject(err);
        else
            resolve(status);
    });

    return res;
}



