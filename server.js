var express = require("express")
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken')
var app = express();

app.use(express.json());
app.use(bodyParser.json())

const mysql = require("mysql2")
const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'finalyearapp',
    port: '3306',
    pool: 1
});
try {
    con.connect();
} catch (error) {
    console.warn(error)
}

app.use((req, res, next) => {
    
    console.log(req.ip,req.path, 'Time:', Date.now())
    console.log(req.body)
    next()
  })

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
app.get('/services/:id', (req, res) => {
    console.log("req::::", req.params)
    con.query('select ServiceProviderId,ServiceProvideName,ServiceCategoryId from service where service_id=?', [req.params.id], (err, result) => {
        if (err) res.send("error in query" + err)
        else res.send(result[0]);
    })

})
app.get('/service-providers', (req, res) => {
    con.query('select * from SERVICE_PROVIDER', [req.params.id], (err, result) => {
        if (err) res.send("error in query" + err)
        else res.send(result);
    })

})
app.get('/service-providers/:serviceId', (req, res) => {
    
    con.query(`select * from  service_provider left join service_provider_and_service on service_provider.ServiceProviderId=service_provider_and_service.ServiceProviderIdinMap natural join service where service_id=${con.escape(req.params.serviceId)}`, (err, result) => {
        if (err) res.send("error in query" + err)
        else res.send(result);
    })

})
app.get('/service-provider/:serviceProviderId', (req, res) => {
    con.query('select * from SERVICE_PROVIDER where ServiceProviderId=?', [req.params.serviceProviderId], (err, result) => {
        if (err) res.send("error in query" + err)
        else res.send(result[0]);
    })

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
app.post('/service-provider', (req, res) => {
    // return res.send(req.body);
    con.query(`insert into SERVICE_PROVIDER (ServiceProviderImage,ServiceProvideName,ServiceProviderPhone,ServiceProviderEmail,ServiceProviderPassword)
    values(?,?,?,?,?);`, [req.body.ServiceProviderImage, req.body.ServiceProvideName, req.body.ServiceProviderPhone, req.body.ServiceProviderEmail, req.body.ServiceProviderPassword],
        (err, result) => {
            if (err) {
                res.send(err.message)
            }
            else {
                res.send(result)
            }
        })
})
app.post('/service-provider/add-service', (req, res) => {
    res.send("add service to service provider profile");
})
app.post("/login", (req, res) => {
    // return res.send(req.body);
    let query = `select * from  
    service_provider left join service_provider_and_service
    on service_provider.ServiceProviderId=service_provider_and_service.ServiceProviderIdinMap
    left join service on service.service_id= service_provider_and_service.service_id
    where ServiceProviderPhone=${con.escape(req.body.user_phone)} 
    and ServiceProviderPassword=${con.escape(req.body.user_pass)} `;
    
    con.query(query, 
     (err, result) => {
        if (err)
            {console.log("error ", err)
            res.send("error");
        }
        else if (result[0] != undefined) {
            result[0].role = "Service Provider";
            result[0].msg = "Login Success"
            let token = jwt.sign(result[0], "Provider", { expiresIn: '1h' })
            result[0].token = token;
            res.send(result[0]);

        }
        else {
            con.query(`select * from user where user_phone=${con.escape(req.body.user_phone)} and user_pass=${con.escape(req.body.user_pass)}`, (err, result) => {
                if (err) {
                    console.log(err)
                    res.end("Error : " + err);
                }
                else {
                    if (result[0]) {
                        result[0].role = "user";
                        result[0].msg = "Login Success";
                        let token = jwt.sign(result[0], "User", { expiresIn: '1h' })
                        result[0].token = token;
                        res.send(result[0])
                    }
                    else {
                        res.json({ msg: "Wrong password" })

                    }
                }
            })

        }


    })


})
app.get('/search-service/:searchtearm', (req, res) => {
    con.query(`select * from service where service_title  like '%${req.params.searchtearm}%'`,
        (err, result) => {
            if (err) {
                console.log("error : ", err);
            } else {
                res.send(result);
            }
        }
    )

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



app.get('/', (req, res) => {
    res.send("Hello world");
})
app.get('/:id', (req, res) => {

    res.send(req.params.id);
})
app.get('/hello', (req, res) => {
    res.send("sdkefl");
})

app.listen(3000, '192.168.162.79', console.log("server running"));
