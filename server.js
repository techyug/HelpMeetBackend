var express = require("express")
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken')
var app = express();
require('dotenv').config();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { v4: uuidv4 } = require('uuid')
const MessageStatus  = require("./Constants/Gconstants");

// const messageId = uuidv4();
// console.log("message id",messageId)

let userSocketMap = new Map();
let providerSocketMap = new Map()
const offLineMessages = new Map();
io.on('connection', (socket) => {
    console.log("someone Connected ", socket.id)
    socket.on('im-active', (data, cb) => {
        console.log(data)
        let userData = jwt.verify(data.token, process.env.JWT_SECRET_KEY)
        // console.log(userData)
        if (userData == null) {
            cb("you are not authorized")
        }
        else if (userData.role === "user") {
            let socketIdArr = new Set();
            if (userSocketMap.has(userData.user_phone)) {
                userSocketMap.get(userData.user_phone).socketIdArr.add(socket.id);
            } else {
            
                socketIdArr.add(socket.id)
                userData.socket_id = socket.id;
                userData.socketIdArr = socketIdArr;
                userSocketMap.set(userData.user_phone, userData)
            }
            console.log("user map ",userSocketMap)
            if(offLineMessages.has(userData.user_phone)){
                console.log("receiver is offline ",userData.user_phone)
                let myMessages = offLineMessages.get(userData.user_phone)
                console.log("my offline message ",myMessages)
                myMessages.forEach((item)=>{
                    io.to(socket.id).emit("new-message",item)
                    console.log("messages received to me ",socket.id,item)
                })
                offLineMessages.delete(userData.user_phone);
                
            }
           
        } else if (userData.role === "Service Provider") {
            // userData.socket_id = socket.id;
            // providerSocketMap.set(userData.ServiceProviderPhone, userData)
            let socketIdArr = new Set();
            if (providerSocketMap.has(userData.ServiceProviderPhone)) {
                providerSocketMap.get(userData.ServiceProviderPhone)?.socketIdArr.add(socket.id);
            } else {
                
                socketIdArr.add(socket.id)
                userData.socket_id = socket.id;
                userData.socketIdArr = socketIdArr;
                providerSocketMap.set(userData.ServiceProviderPhone, userData)
            }
            console.log("provider map ",providerSocketMap)
            if(offLineMessages.has(userData.ServiceProviderPhone)){
                console.log("receiver is offline ",userData.ServiceProviderPhone)
                let myMessages = offLineMessages.get(userData.ServiceProviderPhone)
                console.log("my offline message ",myMessages)
                
                myMessages.forEach((item)=>{
                    io.to(socket.id).emit("new-message",item)
                    console.log("messages received to me ",socket.id,item)
                })
                
                offLineMessages.delete(userData.ServiceProviderPhone);
            }
           
        }
        cb('ok')

    })
  

    socket.on('new-message', (chatData, cb) => {
        chatData.messageId = uuidv4()
        let isToPhoneOnline = false;
        if (userSocketMap.has(chatData.toPhone)) {
            
            let socketarr = Array.from(userSocketMap.get(chatData.toPhone).socketIdArr);
            console.log("sending to user ",socketarr)
            if(socketarr.length){
                isToPhoneOnline = true
            }
            //let toSoket = userSocketMap.get(chatData.toPhone).socket_id;
            socket.to(socketarr).emit("new-message", chatData)
            
        }
        if (providerSocketMap.has(chatData.toPhone)) {
           
           // let toSoket = providerSocketMap.get(chatData.toPhone).socket_id;
            let socketarr = Array.from(providerSocketMap.get(chatData.toPhone).socketIdArr);
            if(socketarr.length){
                isToPhoneOnline = true
            }
            console.log("sending to Provider",socketarr)
            socket.to(socketarr).emit("new-message", chatData)
            
        }
        if(!isToPhoneOnline){
            if(offLineMessages.has(chatData.toPhone)){
                offLineMessages.get(chatData.toPhone).push(chatData)
                cb({status:"Message send pending",messageId:chatData.messageId,statusCode:MessageStatus.sentAndMessegeDeliveryPending})
            }else{
                offLineMessages.set(chatData.toPhone,[chatData])
                cb({status:"Message send pending",messageId:chatData.messageId,statusCode:MessageStatus.sentAndMessegeDeliveryPending})
            }
            console.log("offline messages : ",offLineMessages)
        }
        // io.to(userSocketMap.get(chatData.toPhone).socket_id).emit(chatData)
        // io.to(providerSocketMap.get(chatData.toPhone).socket_id).emit(chatData)
        console.log(chatData)
        cb({
            status: "sent",
            messageId:chatData.messageId,
            statusCode:MessageStatus.sentAndMessgeDelivered
        })
        // let receiverData = userOnlineList.filter((item)=>item.userData.userPhone==chatData.sent_to)
        // receiverData.map((item)=>{
        //   io.to(item.socketId).emit('new-message',chatData)
        // })
        
    })
    socket.on('disconnect', (reason) => {
        console.log("someone disconnected ", reason)
        console.log(socket.id);
        // if (userSocketMap.has(userData.user_phone)) {
        //     let newSocketArr = userSocketMap.get(userData.user_phone).socketIdArr.filter(i=>i!==socket.id)
        //     userSocketMap.get(userData.user_phone).socketIdArr = newSocketArr;
        //     // userSocketMap.delete(userData.user_phone)
        // }

      
        userSocketMap.forEach((item) => {
            console.log("1-----------------------");
            
            let n = item.socketIdArr.delete(socket.id)
            if(n){
                console.log(item.user_name," is disconnected due to ",reason)
            }
            // item.socketIdArr = newArr;
        })
        providerSocketMap.forEach((item) => {
            console.log("-----------------------");
           let s =  new Set();
           
            let n = item.socketIdArr.delete(socket.id)
            if(n){
                console.log(item.ServiceProvideName," is disconnected due to ",reason)
            }
            // item.socketIdArr = newArr;
        })
        
        console.log(userSocketMap)
    })
})

app.use(express.json());
app.use(bodyParser.json())

const mysql = require("mysql2");
const process = require("process");


const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'finalyearapp',
    port: '3306',
    pool: 1
});

// const con = mysql.createConnection({
//         host: process.env.FREE_DB_HOST,
//         user: process.env.DB_USER_NAME,
//         password: process.env.DB_PASS,
//         database: process.env.DB_NAME,
//         port: process.env.DB_PORT,
//         pool: 1
//     });
try {
    con.connect();
} catch (error) {
    console.log("db connect error", error)
}

const verifyUser = (req, res, next) => {
    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    // console.log("Body : ", req.body)
    // console.log("token key : ", tokenHeaderKey)
    // console.log("jwt secret : ", jwtSecretKey)

    try {
        let token = req.header(tokenHeaderKey);
        // console.log("token :", token)
        let verified;
        jwt.verify(token, jwtSecretKey, (err, decoded) => {
            if (err) {
                console.log("err", err)
            }
            else {
                console.log("token verified", decoded.iat, decoded.exp, Date.now())
                verified = decoded


            }
        });
        if (verified) {
            req.body.userDatafromToken = verified
            next()

        } else {
            // Access Denied
            return res.status(401).send(error);
        }
    } catch (error) {
        // Access Denied
        return res.status(401).send(error);
    }


}
app.get('/test', verifyUser, (req, res) => {
    res.send(req.body)
})
app.get('/gettoken', (req, res) => {
    const data = req.body;
    let token = jwt.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
    res.send(token)
})





app.use((req, res, next) => {

    console.log(req.ip, req.path, 'Time:', new Date())
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
app.get('/services', verifyUser, (req, res) => {
    con.query("select * from service",
        (err, result, fields) => {
            err ? res.send("Error :" + err) : res.send(result);
        }
    )
})
app.get('/services/:superCatId', verifyUser, (req, res) => {
    con.query(`select * from service where super_cat_id=${con.escape(req.params.superCatId)}`,
        (err, result, fields) => {
            err ? res.send("Error :" + err) : res.send(result);
        }
    )
})
app.post('/add-service-to-provider', verifyUser, (req, res) => {
    //  console.log(req.body)
    //console.log(req.body.selectedService.service_id,req.body.userData.ServiceProviderId,req.body.ServiceLocation,req.body.ReadableServiceLocation.postalCode)
    let serviceAdd = JSON.stringify(req.body.ReadableServiceLocation)
    let query = `insert into service_provider_and_service (ServiceProviderIdinMap,service_id,ServiceLatitude,ServiceLongitude,ServicePincode,ServiceAddress) values(${con.escape(req.body.userData.ServiceProviderId)},${req.body.selectedService.service_id},${req.body.ServiceLocation.coords.latitude},${req.body.ServiceLocation.coords.longitude},${con.escape(req.body.ReadableServiceLocation.postalCode)},${con.escape(serviceAdd)})`;
    console.log(query)
    con.query(query,
        (err, result) => {
            if (err) {
                console.log(err)
                res.send(err.message.toString())
            }
            else
                res.send("Service Added Successfuly...")

        })
    // res.send("fnk")

})
app.get('/services/:id', verifyUser, (req, res) => {
    console.log("req::::", req.params)
    con.query('select ServiceProviderId,ServiceProvideName,ServiceCategoryId from service where service_id=?', [req.params.id], (err, result) => {
        if (err) res.send("error in query" + err)
        else res.send(result[0]);
    })

})
app.get('/services-of-provider/:providerId', verifyUser, (req, res) => {
    let query = `select * from service_provider_and_service left join service_provider on 
    service_provider.ServiceProviderId= service_provider_and_service.ServiceProviderIdinMap 
    natural join service where service_provider_and_service.ServiceProviderIdinMap=${con.escape(req.params.providerId)}`
    con.query(query, (err, result) => {
        if (err) {
            res.send("Error : " + err.message.toString())
        } else {
            res.send(result)
        }
    })
})
app.get('/messages-of-provider/:providerId', verifyUser, (req, res) => {
    let query = `select * from messages_provider_user natural join user natural join service_provider where messages_provider_user.ServiceProviderId=${con.escape(req.params.providerId)} `;
    con.query(query, (err, result) => {
        if (err) {
            res.send(err.message.toString())
        } else {
            res.send(result)
        }
    })
})
app.get('/messages-of-user/:userId', verifyUser, (req, res) => {
    let query = `select * from messages_provider_user natural join user natural join service_provider where user_id=${con.escape(req.params.userIdId)} `;
    con.query(query, (err, result) => {
        if (err) {
            res.send(err.message.toString())
        } else {
            res.send(result)
        }
    })
})

app.get('/service-providers', (req, res) => {
    con.query('select * from service-provider', [req.params.id], (err, result) => {
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
    con.query('select * from service-provider where ServiceProviderId=?', [req.params.serviceProviderId], (err, result) => {
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
    let query = `select 
    ServiceProviderId,
  ServiceProviderImage,
  ServiceProvideName,
  ServiceProviderPhone,
  ServiceProviderEmail,
  ServiceProviderPassword
    from  
    service_provider left join service_provider_and_service
    on service_provider.ServiceProviderId=service_provider_and_service.ServiceProviderIdinMap
    left join service on service.service_id= service_provider_and_service.service_id
    where ServiceProviderPhone=${con.escape(req.body.user_phone)} 
    and ServiceProviderPassword=${con.escape(req.body.user_pass)} `;
    console.log(query)
    con.query(query,
        (err, result) => {
            if (err) {
                console.log("error ", err)
                res.send("error");
            }
            else if (result[0] != undefined) {
                result[0].role = "Service Provider";
                result[0].msg = "Login Success"
                console.log(result[0])
                let token = jwt.sign(result[0], process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
                result[0].token = token;
                res.send(result[0]);

            }
            else {
                let query = `select * from user where user_phone=${con.escape(req.body.user_phone)} and user_pass=${con.escape(req.body.user_pass)}`;
                con.query(query, (err, result) => {
                    if (err) {
                        console.log(err)
                        res.end("Error : " + err);
                    }
                    else {
                        if (result[0]) {
                            result[0].role = "user";
                            result[0].msg = "Login Success";
                            let token = jwt.sign(result[0], process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
                            result[0].token = token;
                            console.log(result[0])
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
app.get('/logout', verifyUser, (req, res) => {
    res.send("Logout Api")
})
app.get('/super', verifyUser, (req, res) => {
    con.query("select * from super_cat", (err, result) => {
        err ? res.send("Error : " + err) : res.send(result);
    })
})

app.get('/super/:id', verifyUser, (req, res) => {
    con.query("select * from super_cat where super_cat_id=?", [req.params.id], (err, result) => {
        err ? res.send("Error : " + err) : res.send(result);
    })
})

app.post('/super', verifyUser, (req, res) => {
    con.query("insert into super_cat(super_cat_title,super_cat_description,icon) values(?,?,?)", [req.body.super_cat_title, req.body.super_cat_description, req.body.icon], (err, result) => {
        err ? res.send("Error :" + err) : res.send(result);
    })
})



app.get('/', (req, res) => {
    console.log(req.headers)
    res.send("Hello world");
})
app.get('/:id', (req, res) => {

    res.send(req.params.id);
})
app.get('/hello', (req, res) => {
    res.send("sdkefl");
})
app.get('/who-am-i', verifyUser, (req, res) => {
    res.send(req.body)
})
server.listen(3000, () => {
    console.log("listening....", server.address())
});

//app.listen(3000, console.log("server running on render"));
 //app.listen(3000, console.log("server running on local machine"));