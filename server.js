var express = require("express")
var bodyParser = require('body-parser');
var app = express();
app.use(express.json());
//To parse json data
const mysql = require("mysql2")
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'finalyearapp',
    port: '3307',
    pool: 1
});
try {
    con.connect();
} catch (error) {
    console.warn(error)
}


app.get('/users', (req, res) => {
    con.query("select * from user", (err, result) => {
        if (err) res.send("Error in query" + err)
        else res.json(result)
    })
})
app.get('/users/:id', (req, res) => {
    con.query("select * from user where user_id=?", [req.params.id],
        (err, result) => {
            if (err) res.send("error in query" + err)
            else res.send(result[0]);
        }
    )
})
app.get('/user/:phone', (req, res) => {

    con.query("select * from user where user_phone=?", [req.params.phone],
        (err, result) => {
            if (err) res.send("error in query" + err)
            else res.send(result[0]);
        }
    )
})
app.get('/services', (req, res) => {
    con.query("select * from service",
        (err, result, fields) => {
            err ? res.send("Error :" + err) : res.send(result);
        }
    )
})
app.get('/services-providers/:service_id', (req, res) => {
    con.query("select * from service_provider where service_id=?", [req.params.service_id],
        (err, result) => {
            err ? res.send("err" + err) : res.send(result);

        })
})
app.post('/users', (req, res) => {
    // return res.send(req.body);
    con.query("insert into user(user_name,user_phone,user_email,user_pass) values(?,?,?,?)", [req.body.user_name, req.body.user_phone, req.body.user_email, req.body.user_pass],
        (err, result) => {
            if (err) {

                res.send(err.message)
            }
            else {

                res.send(result)

            }
        })

})
app.post("/login", (req, res) => {
    // return res.send(req.body);
    con.query("select user_id, user_phone ,user_pass from user where user_phone=?", [req.body.user_phone], (err, result) => {
        if (err) {
            res.end("Error : " + err);
        }
        else {
            // return res.send(result[0]);

            if (result[0] && req.body.user_pass === result[0].user_pass) {
                res.end("Login Success")
            }
            else {
                res.end("Wrong password")
            }
        }
    })
})
app.get('/super', (req, res) => {
    con.query("select * from super_cat", (err, result) => {
        err ? res.send("Error : " + err) : res.send(result);
    })
})

app.get('/super/:id', (req, res) => {
    con.query("select * from super_cat where super_cat_id=?", [req.params.id], (err, result) => {
        err ? res.send("Error : " + err) : res.send(result);
    })
})

app.post('/super', (req, res) => {
    con.query("insert into super_cat(super_cat_title,super_cat_description,icon) values(?,?,?)", [req.body.super_cat_title, req.body.super_cat_description, req.body.icon], (err, result) => {
        err ? res.send("Error :" + err) : res.send(result);
    })
})


app.use(bodyParser.json())
app.get('/', (req, res) => {
    res.send("Hello world");
})
app.get('/:id', (req, res) => {

    res.send(req.params.id);
})
app.get('/hello', (req, res) => {
    res.send("sdkefl");
})

app.listen(3000, '192.168.1.6', console.log("server running"));
