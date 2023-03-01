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
    port: '3306',
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
app.get('/services/:id',(req,res)=>{
    console.log("req::::",req.params)
    con.query('select ServiceProviderId,ServiceProvideName,ServiceCategoryId from service where service_id=?',[req.params.id],(err,result)=>{
        if (err) res.send("error in query" + err)
        else res.send(result[0]);
    })
   
})
app.get('/service-providers',(req,res)=>{
    con.query('select * from SERVICE_PROVIDER',[req.params.id],(err,result)=>{
        if (err) res.send("error in query" + err)
        else res.send(result);
    })

})
app.get('/service-providers/:serviceId',(req,res)=>{
    console.log("new req")
    con.query('select * from SERVICE_PROVIDER where ServiceCategoryId=?',[req.params.serviceId],(err,result)=>{
        if (err) res.send("error in query" + err)
        else res.send(result);
    })

})
app.get('/service-provider/:serviceProviderId',(req,res)=>{
    con.query('select * from SERVICE_PROVIDER where ServiceProviderId=?',[req.params.serviceProviderId],(err,result)=>{
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
    values(?,?,?,?,?);`, [req.body.ServiceProviderImage, req.body.ServiceProvideName, req.body.ServiceProviderPhone, req.body.ServiceProviderEmail,req.body.ServiceProviderPassword],
        (err, result) => {
            if (err) {
                res.send(err.message)
            }
            else {
                res.send(result)
            }
        })
})
app.post('/service-provider/add-service',(req,res)=>{
    res.send("add service to service provider profile");
})
app.post("/login", (req, res) => {
    // return res.send(req.body);

    con.query(`select * from service_provider where ServiceProviderPhone=? and ServiceProviderPassword=? `, [req.body.user_phone,req.body.user_pass],(err,result)=>{
        if(err)
        (err)=>console.log("error ",err)
        else if(result[0]!=undefined){
            result[0].role = "Service Provider";
            result[0].msg="Login Success"
            console.log(result[0])
            res.send(result[0]);
        }
        else{
            con.query("select * from user where user_phone=? and user_pass=?", [req.body.user_phone, req.body.user_pass], (err, result) => {
                if (err) {
                    res.end("Error : " + err);
                }
                else {
                    if (result[0]) {
                        result[0].role="user";
                        result[0].msg="Login Success";
                        res.send(result[0])
                    }
                    else {
                        res.json({msg:"Wrong password"})
                        
                    }
                }
            })

        }
        

    })
   
    
})
app.get('/search-service/:searchtearm',(req,res)=>{
    con.query(`select * from service where service_title  like '%${req.params.searchtearm}%'`,
    (err, result) => {
        if(err){
            console.log("error : ",err);
        }else{
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

app.listen(3000, '192.168.153.180', console.log("server running"));
