const express = require('express')
const session = require('express-session')
const path = require('path');
const app = express()
const port = 3001

const dotenv = require("dotenv");
const multer = require("multer");
const mime = require("mime-types");
const {v4:uuid} = require("uuid");

const storage = multer.diskStorage({ // (2)
    destination: (req, file, cb) => { // (3)
      cb(null, "images");
    },
    filename: (req, file, cb) => { // (4)
      cb(null, `${uuid()}.${mime.extension(file.mimetype)}`); // (5)
    },
  });
  
  const upload = multer({ // (6)
      storage,
      fileFilter: (req, file, cb) => {
          if (["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) 
              cb(null, true);
          else 
              cb(new Error("해당 파일의 형식을 지원하지 않습니다."), false);
          }
      ,
      limits: {
          fileSize: 1024 * 1024 * 5
      }
  });
  
  app.post("/api/upload", upload.single("file"), (req, res) => { // (7)
    res.status(200).json(req.file);
  });
  
  app.use("/images", express.static(path.join(__dirname, "/images"))); // (8)

const db = require('./lib/db');
const sessionOption = require('./lib/sessionOption');
const bodyParser = require("body-parser");

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var MySQLStore = require('express-mysql-session')(session);
var sessionStore = new MySQLStore(sessionOption);
app.use(session({  
	key: 'session_cookie_name',
    secret: '~',
	store: sessionStore,
	resave: false,
	saveUninitialized: false
}))

app.get('/', (req, res) => {    
    req.sendFile(path.join(__dirname, '/build/index.html'));
})

app.get('/authcheck', (req, res) => {      
    const sendData = { isLogin: "" };
    if (req.session.is_logined) {
        sendData.isLogin = "True"
    } else {
        sendData.isLogin = "False"
    }
    res.send(sendData);
})

app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        res.redirect('/');
    });
});

app.post('/login', (req, res) => {
    const username = req.body.userId;
    const password = req.body.userPassword;
    const sendData = { isLogin: '' };
  
    if (username && password) {
      db.query(
        `SELECT * FROM userTable WHERE username = '${username}' AND password = '${password}'`,
        function (error, results, fields) {
          if (error) throw error;
          if (results.length > 0) {
            req.session.is_logined = true;
            req.session.nickname = username;
            req.session.save(function () {
              sendData.isLogin = 'True';
              res.send(sendData);
            });
            db.query(
              `INSERT INTO logTable (created, username, action, command, actiondetail) VALUES (NOW(), '${req.session.nickname}', 'login' , '-', 'React 로그인 테스트')`,
              function (error, result) {}
            );
          } else {
            sendData.isLogin = '로그인 정보가 일치하지 않습니다.';
            res.send(sendData);
          }
        }
      );
    } else {
      sendData.isLogin = '아이디와 비밀번호를 입력하세요!';
      res.send(sendData);
    }
  });

app.post("/signin", (req, res) => {  // 데이터 받아서 결과 전송
    const username = req.body.userId;
    const password = req.body.userPassword;
    const password2 = req.body.userPassword2;
    
    const sendData = { isSuccess: '' };

    if (username && password && password2) {
        db.query(
          `SELECT * FROM userTable WHERE username = '${username}'`,
          function (error, results, fields) {
            if (error) throw error;
            if (results.length <= 0 && password === password2) {
              db.query(
                `INSERT INTO userTable (username, password) VALUES('${username}','${password}')`,
                function (error, data) {
                  if (error) throw error;
                  req.session.save(function () {
                    sendData.isSuccess = 'True';
                    res.send(sendData);
                  });
                }
              );
            } else if (password != password2) {                     // 비밀번호가 올바르게 입력되지 않은 경우                  
                sendData.isSuccess = "입력된 비밀번호가 서로 다릅니다."
                res.send(sendData);
            }
            else {                                                  // DB에 같은 이름의 회원아이디가 있는 경우            
                sendData.isSuccess = "이미 존재하는 아이디 입니다!"
                res.send(sendData);  
            }            
        });        
    } else {
        sendData.isSuccess = "아이디와 비밀번호를 입력하세요!"
        res.send(sendData);  
    }
    
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})