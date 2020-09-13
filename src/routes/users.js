const express = require("express");
const router = express.Router();
//  User model
const User = require("../../models/User");
const bcrypt = require("bcryptjs");

//Login Page
router.get("/login", (req, res) => {
  res.render("login");
});

//Register Page
router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/dashboard", (req, res) => {
  console.log(req.user)
  res.render("dashboard");
});

router.post("/login", (request,response)=>{

    const email = request.body.email || '';
    const password = request.body.password || '';
    if (email && password) {
      User.findOne({email: email}, (error, user) => {
        // check if user exist
        if (error) {
          response.status(401).send({
            success: false,
            message: error.message,
          });
        } else {
          if (!user) {
            response.status(401).send({
              success: false,              
            });
          } else {
            // check if password matches
            user.comparePassword(password, (error, isMatch) => {
              if (isMatch && !error) {
                // if user is found and password is right create a token                
                response.redirect("/users/dashboard")
              } else {
                response
                    .status(401)
                    .send({
                      success: false,
                    });
              }
            });
          }
        }
      });
    } else {
      return response
          .status(401)
          .send({
            success: false,
          });
    }
  
})

//Handle user registration
router.post("/register", (req, res) => {
  console.log(req.body);
  const { name, email, password, password2 } = req.body;

  let errors = [];

  // Check required fields
  if (!email || !name || !password || !password2) {
    errors.push({ msg: "Please fill in all fields" });
  }

  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  // Check pass length
  if (password.length < 6) {
    errors.push({ msg: "Password should be at least 6 characters" });
  }

  console.log(errors);

  if (errors.length > 0) {
    res.render("register", {
      errors,
      name,
      password,
      password2
    });
  } else {
    console.log("validated")
    // Validation pass
    User.findOne({ email: email }).then(user => {
      console.log(user)
      if (user) {
        errors.push({ msg: "Email is already registered" });

        res.render("register", {
          errors,
          name,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });

        // HashPassword
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            //Set password to hashed and then save the user
            newUser
              .save()
              .then(() => {
                req.flash("success_msg", "You are now registered");

                //Redirected to the login page
                res.redirect("/users/login");
              })
              .catch(err => {console.log(err)
                res.redirect("/users/login");
              });
          });
        });
      }
    }).catch(err => {
      res.redirect("/users/login");
    });
  }
});

module.exports = router;
