const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
const User = require("../models/User")
const StoryCount = require("../models/StoryCount")
const bcrypt = require("bcryptjs");
const STORY_LIST = require("../config/stories");



passport.use("login",new Strategy({
  usernameField : 'email',
  passwordField : 'password',
  passReqToCallback: true
},
  function(req, email, password, cb) {
    console.log(email, password)
    User.findOne({email: email}, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      user.comparePassword(password, (error, isMatch) => {
        if (isMatch && !error) {
          // if user is found and password is right create a token                
          return cb(null, user)
        } else {
          cb(new Error("password mismatch"), false)
        }
      });
    });
  }));


  
  passport.use('signup', new Strategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    try {
      const name = req.body.name;
      const user = await User.create({ name, email, password });

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(user.password, salt);
      user.password = hash;
        //Set password to hashed and then save the user
       await user.save()
      

      return done(null, user);
    } catch (error) {
      done(error);
    }
  }));



// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
  cb(null, user.email);
});

passport.deserializeUser(function(email, cb) {
  User.findOne({email}, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});



const app = express();
var http = require('http').Server(app);

var server = require('socket.io')(http);

var counter=0;//Initial counter value 



// server.on('connection', function(socket, ...args)
// {
//   console.log("=-=-===-=-")
//     console.log(socket, args)
//     console.log('a user connected');
//     counter+=1;//increments global view count

//     //on user connected sends the current view count
//     socket.emit('view_count',counter);

// });
server.on('connection', function(socket) {
  socket.on('join', function(room) {
    socket.join(room);
    server.of('/').in(room).clients(function(error,clients){
      var numClients=clients.length;
      server.to(room).emit('socket_count',numClients);
  });
  socket.on('disconnect', () => {
    // socket.rooms === {}
    server.of('/').in(room).clients(function(error,clients){
      var numClients=clients.length;
      server.to(room).emit('socket_count',numClients);
   });
  });
  });

});

//mongodb+srv://lol:lol123@cluster0.gbtib.mongodb.net/myap?retryWrites=true&w=majority



//DB config
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/myap"

// Connect to Mongo

mongoose
  .connect(
    MONGO_URI,
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

//BodyParser - now we can get registration from body
app.use(express.urlencoded({ extended: false }));

// Express Session
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);

// session.
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());


//Global Vars
app.use((req, res, next) => {
  console.log( "request", req.user)
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  next();
});

//Routes
app.use("/", require("./routes/index"));

app.post('/login', passport.authenticate('login' , {
  successRedirect : '/dashboard',
  failuerRedirect : '/login',
  failuerFlash: true
}));


app.post('/signup', passport.authenticate('signup' , {
  successRedirect : '/dashboard',
  failuerRedirect : '/signup',
  failuerFlash: true
}));

//app.use("/users", require("./routes/users"));
app.get("/dashboard", require('connect-ensure-login').ensureLoggedIn(), (req, res)=>{
  console.log("dashboard login")
  console.log(req.user)
  res.render("dashboard", {
    user : req.user
  })
});

app.get("/register", (req, res)=>{
  res.render("register")
});

app.get("/login", (req, res)=>{
  res.render("login")
});


// app.get("/storycount/:id", require('connect-ensure-login').ensureLoggedIn(), async (req, res)=>{
//   console.log(req.params.id);
//   StoryCount.incrementCount(Number(req.params.id),req.user.email, (err, count)=> {
//     console.log(count);
//     res
//     .status(401).send({
//       count
//     })
//   });
// })

app.get('/logout',
  function(req, res){
    req.logout();
    res.redirect('/');
  });


  app.get("/stories", (req, res)=>{
    res.render("stories",{
      stories: STORY_LIST
    })
  })


  app.get("/stories/:id", (req, res)=>{
    const id = req.params.id;
    const numericId = Number(id);
    const story = STORY_LIST.find(story => story.id === numericId);
   try{
    if(req.user){
      StoryCount.incrementCount(Number(req.params.id),req.user.email, (err, count)=> {
        res.render("story",{
          story,
          viewCount : count
        })
      });
    }else{
      console.log("no user")
      StoryCount.findOne({storyId: id}, (err, storyCount) => {
        if(err) throw err
        const count = storyCount && Array.isArray(storyCount.emails )?  storyCount.emails.length : 0;
        res.render("story",{
          story,
          viewCount : count
        })
      })
    }
   }catch(err){
     console.log(err)
     res.render("story", {
       story,
       viewCount : 0
     })
   }
    
  })

  


const PORT = process.env.PORT || 8080

http.listen(PORT, () => {
  console.log(`Listening on Port ${PORT}!!`);
});



module.exports = app;

//Doing with mongo atlas
//node with passport
