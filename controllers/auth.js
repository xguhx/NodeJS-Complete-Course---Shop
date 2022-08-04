const User = require("../models/user");
const bcrypt = require("bcryptjs");
const sgMail = require("@sendgrid/mail");
const crypto = require("crypto");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");

  message.length > 0 ? (message = message[0]) : (message = null);
  res.render("auth/login", {
    pageTitle: "Login",
    errorMessage: message,
    path: "/login",
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "invalid email or password");
        return res.redirect("/login");
      }

      const auth = bcrypt.compareSync(password, user.password);
      if (auth) {
        req.session.isLoggedIn = true;
        req.session.user = user;
        return req.session.save((err) => {
          console.log(err);
          res.redirect("/");
        });
      }
      req.flash("error", "invalid email or password");
      res.redirect("/login");
    })

    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/");
    console.log(err);
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        req.flash("error", "Email already registered");
        return res.redirect("/login");
      }
      const hash = bcrypt.hashSync(password, 12);
      const newUser = new User({
        email: email,
        password: hash,
        cart: { items: [] },
      });
      return newUser.save().then((result) => {
        const msg = {
          to: email,
          from: "gustavotavaresdev@gmail.com",
          subject: "Sending with SendGrid is Fun",
          text: "Thank you for Registering",
          html: "<strong>Thank you for Registering</strong>",
        };

        sgMail
          .send(msg)
          .then(() => {
            console.log("Email sent");
          })
          .catch((error) => {
            console.error(error);
          });
        res.redirect("/login");
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  message.length > 0 ? (message = message[0]) : (message = null);
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");

  message.length > 0 ? (message = message[0]) : (message = null);

  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found.");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpirationDate = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        const msg = {
          to: req.body.email,
          from: "gustavotavaresdev@gmail.com",
          subject: "Sending with SendGrid is Fun",
          text: "Password Reset",
          html: `
          <p> You requested a Password Reset </p>
          <p> Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset your . </p>

          `,
        };

        sgMail
          .send(msg)
          .then(() => {
            console.log("Email sent");
          })
          .catch((error) => {
            console.error(error);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  let message = req.flash("error");

  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpirationDate: { $gt: Date.now() },
  })
    .then((user) => {
      console.log(user);
      message.length > 0 ? (message = message[0]) : (message = null);
      res.render("auth/newPassword", {
        path: "/newPassword",
        pageTitle: "Reset Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;

  console.log(passwordToken);
  console.log(userId);
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpirationDate: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      console.log(user);
      const hashedPassword = bcrypt.hashSync(newPassword, 12);
      user.password = hashedPassword;
      user.resetToken = undefined;
      user.resetTokenExpirationDate = undefined;
      return user.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      console.log(err);
    });
};
