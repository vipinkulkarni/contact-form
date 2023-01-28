const express = require('express');
const bodyParser = require("body-parser");
const mysql = require("mysql");
const flash = require("connect-flash");
const session = require('express-session');
const methodoverride = require('method-override');
const dotenv = require("dotenv")

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(flash());

app.use(session({
    secret: "whebdkehdiqdkhg",
    saveUninitialized: true,
    resave: true
}));

app.use((req, res, next)=>{
    res.locals.message = req.flash();
    next();
});

app.use(methodoverride('_method'));
dotenv.config();

const pool  = mysql.createPool({
    connectionLimit : 10,
    host            : process.env.SQL_HOST,
    user            : process.env.SQL_USERNAME,
    password        : process.env.SQL_PASSWORD,
    database        : 'sql12593779'
})

app.delete("/:id", (req, res)=>{
    const Sn = req.params.id;
    pool.getConnection((err, connection) => {
        if(err) throw err
        connection.query('DELETE FROM Users WHERE Sn = ?', [Sn], (err, rows) => {
            connection.release() // return the connection to pool
            if (!err) {
                req.flash('success','Contact deleted successfully');
            } else {
                req.flash('error','Unable to delete contact');
            }
            res.redirect("/");
        })
    })
})


app.post("/new",(req, res)=>{
    pool.getConnection((err, connection) => {
        if(err) throw err
        const {firstname, lastname, contact} = req.body;
        const name = firstname + " " + lastname;
        connection.query('INSERT INTO Users SET ?', {name, contact}, (err, rows) => {
            connection.release() // return the connection to pool
            if (!err) {
                req.flash('success','Successfully Added a New Person');
            } else {
                req.flash('error','Duplicate values are not allowed!');
            }
            res.redirect("/");
        })
    })
})

let i=0;

app.get("/sort", (req, res)=>{
    pool.getConnection((err, connection) => {
        if(err) throw err
        const asc = i%2==0;
        connection.query('SELECT * from Users ORDER BY Name '+(asc?'ASC':'DESC'), (err, rows) => {
            i++;
            connection.release() // return the connection to pool
            if (!err) {
                res.render("home", {rows, asc})
            } else {
                req.flash('error','Sorry! Something is wrong');
                res.redirect("/");
            }
        })
    })
})

app.get("/search?:name", (req, res)=>{
    const {name} = req.query;
    pool.getConnection((err, connection) => {
        if(err) throw err
        connection.query('SELECT * FROM Users WHERE Name = ?', [name], (err, rows) => {
            connection.release() // return the connection to pool
            if (!err) {
                if(rows.length==0){
                    rows = [
                        {
                            "Sn": "NA", 
                            "Name": "No contacts found", 
                            "Contact": "NA"
                        }
                    ]
                }
                res.render("home", {rows, asc:null});
            } else {
                req.flash("error", "Sorry! Something went wrong.");
                res.redirect("/");
            }
        })
    })

})


app.get("/", (req, res)=>{
    pool.getConnection((err, connection) => {
        if(err) throw err
        connection.query('SELECT * from Users', (err, rows) => {
            connection.release() // return the connection to pool

            if (!err) {
                res.render("home", {rows, asc:null})
            } else {
                req.flash('error','Sorry! Something is wrong');
                res.redirect("/");
            }
        })
    })
})



app.listen(3000, ()=>{
    console.log("Listening on port 3000");
})