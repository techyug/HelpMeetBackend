var express = require("express")
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken')
var app = express();

const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

io.on('connection',(socket)=>{
    console.log("someone Connected ",socket.id)
   setInterval(() => {
    let t = new Date()
    socket.emit('new-message',{msg:`it is a message to all by server sent at : ${t}`})
   }, 10*60*100);
    socket.on('disconnect',(reason)=>{
        console.log("someone disconnected ",reason
        )
    })
})

app.use(express.json());
app.use(bodyParser.json())

const mysql = require("mysql2");

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'finalyearapp',
    port: '3306',
    pool: 1
});

// const con = mysql.createConnection({
//     host: 'db4free.net',
//     user: 'helpmeetuser',
//     password: '*tAqb7FfzD_YUiR',
//     database: 'db_7080',
//     port: '3306',
//     pool: 1
// });

try {
    con.connect();
} catch (error) {
    console.warn(error)
}



app.use((req, res, next) => {
    
    console.log(req.ip,req.path, 'Time:', Date.now(),req.headers)
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
app.get('/services/:superCatId', (req, res) => {
    con.query(`select * from service where super_cat_id=${con.escape(req.params.superCatId)}`,
        (err, result, fields) => {
            err ? res.send("Error :" + err) : res.send(result);
        }
    )
})
app.post('/add-service-to-provider',(req,res)=>{
    console.log(req.body.selectedService.service_id,req.body.userData.ServiceProviderId,req.body.ServiceLocation,req.body.ReadableServiceLocation.postalCode)
    let serviceAdd=  JSON.stringify(req.body.ReadableServiceLocation)
    let query =`insert into service_provider_and_service (ServiceProviderIdinMap,service_id,ServiceLatitude,ServiceLongitude,ServicePincode,ServiceAddress) values(${con.escape(req.body.userData.ServiceProviderId)},${req.body.selectedService.service_id},${req.body.ServiceLocation.coords.latitude},${req.body.ServiceLocation.coords.longitude},${con.escape(req.body.ReadableServiceLocation.postalCode)},${con.escape(serviceAdd)})`;
    console.log(query)
    con.query(query,
    (err,result)=>{
        err?res.send(err.message.toString()):res.send("Service Added Successfuly...")

    })
    // res.send("fnk")
    
})
app.get('/services/:id', (req, res) => {
    console.log("req::::", req.params)
    con.query('select ServiceProviderId,ServiceProvideName,ServiceCategoryId from service where service_id=?', [req.params.id], (err, result) => {
        if (err) res.send("error in query" + err)
        else res.send(result[0]);
    })

})
app.get('/services-of-provider/:providerId',(req,res)=>{
    let query = `select * from service_provider_and_service left join service_provider on 
    service_provider.ServiceProviderId= service_provider_and_service.ServiceProviderIdinMap 
    natural join service where service_provider_and_service.ServiceProviderIdinMap=${con.escape(req.params.providerId)}`
    con.query(query,(err,result)=>{
        if(err){
            res.send("Error : "+err.message.toString())
        }else
        {
            res.send(result)
        }
    })
})
app.get('/messages-of-provider/:providerId',(req,res)=>{
    let query = `select * from messages_provider_user natural join user natural join service_provider where messages_provider_user.ServiceProviderId=${con.escape(req.params.providerId)} `;
    con.query(query,(err,result)=>{
        if(err){
            res.send(err.message.toString())
        }else{
            res.send(result)
        }
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
    con.query(`insert into user(user_name,user_phone,user_email,user_pass) values(${con.escape(req.body.user_name)},${con.escape(req.body.user_phone)},${con.escape(req.body.user_email)},${con.escape(req.body.user_pass)})`,
        (err, result) => {
            if (err) {
                console.log(err)
                res.send(err.message)
            }
            else {
                res.send(result)
            }
        })
})
app.post('/service-provider', (req, res) => {
    // return res.send(req.body);
    con.query(`insert into service_provider (ServiceProvideName,ServiceProviderPhone,ServiceProviderEmail,ServiceProviderPassword)
    values(${con.escape(req.body.ServiceProvideName)},${con.escape(req.body.ServiceProviderPhone)},${con.escape(req.body.ServiceProviderEmail)},${con.escape(req.body.ServiceProviderPassword)});`,
        (err, result) => {
            if (err) {
                console.log(err)
                res.end(err.message.toString())
            }
            else {
                console.log(result)
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
    console.log(query)
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
            let query= `select * from user where user_phone=${con.escape(req.body.user_phone)} and user_pass=${con.escape(req.body.user_pass)}`;
            console.log(query)
            con.query(query, (err, result) => {
                if (err) {
                    console.log(err)
                    res.end("Error : " + err);
                }
                else {
                    if (result[0]) {
                        result[0].role = "user";
                        result[0].msg = "Login Success";
                        let token = jwt.sign(result[0], "User", { expiresIn: '1d' })
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

server.listen(3000,"192.168.212.79", () => {
    console.log("listening....")
  });

//app.listen(3000, console.log("server running on render"));
 //app.listen(3000, console.log("server running on local machine"));