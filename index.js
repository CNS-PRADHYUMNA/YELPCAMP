const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const Campground = require("./models/campground");

const ejsMate = require("ejs-mate");

const methodOverride = require("method-override");

const catchAsync = require("./utils/catchAsync");

const expressError = require("./utils/error");

const Review = require("./models/review");

const Joi = require("joi");
const review = require("./models/review");
const campground = require("./models/campground");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const user = require("./models/user");

app.use(
  require("express-session")({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);
const flash = require("connect-flash");
app.use(flash());
app.engine("ejs", ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(user.authenticate()));

passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

const campgroundSchema = Joi.object({
  title: Joi.string().required(),

  price: Joi.number().required().min(0),
  description: Joi.string().required(),
  location: Joi.string().required(),
  image: Joi.string().required(),
});

const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    body: Joi.string().required(),
  }).required(),
});

const validateReview = (req, res, err, next) => {
  const { error } = reviewSchema.validate(req.body);

  console.log(error);
  console.log(req.body);
  if (error) {
    const msg = error.details.map((e) => e.message).join(",");

    throw new expressError(msg, 400);
  } else {
    next();
  }
};

mongoose
  .connect("mongodb://127.0.0.1:27017/Yelpcamp")
  .then(() => {
    console.log("Connected....");
  })
  .catch((e) => {
    console.log(e);
    console.log("connection Failed");
  });

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/home", (req, res) => {
  res.render("yelp.ejs");
});

app.get("/login", (req, res) => {
  res.render("home");
});
app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    res.redirect("/campgrounds");
  }
);
app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "Goodbye!");
    res.redirect("/login");
  });
});
app.get("/register", (req, res) => {
  res.render("campgrounds/register");
});
app.post(
  "/register",
  catchAsync(async (req, res) => {
    try {
      const { email, username, password } = req.body;

      const User = new user({ email, username });
      const registeredUser = await user.register(User, password);
      res.redirect("/campgrounds");
    } catch (error) {
      throw new expressError(error.message, 400);
    }
  })
);

app.get(
  "/campgrounds",
  catchAsync(async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/login");
    }
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index", { campgrounds });
  })
);
app.get("/campgrounds/new", (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be signed in");
    return res.redirect("/login");
  }
  res.render("campgrounds/new");
});

app.get(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate(
      "reviews"
    );

    res.render("campgrounds/show", { campground });
  })
);

app.get(
  "/campgrounds/:id/update",
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render("campgrounds/update", { campground });
  })
);

app.put(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
      const msg = error.details.map((e) => e.message).join(",");

      throw new expressError(msg, 400);
    }
    const { id } = req.params;
    await Campground.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true,
    });

    res.redirect("/campgrounds");
  })
);
app.post(
  "/campgrounds",
  catchAsync(async (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
      const msg = error.details.map((e) => e.message).join(",");

      throw new expressError(msg, 400);
    }
    const campground = new Campground(req.body);
    await campground.save();
    res.redirect("/campgrounds");
  })
);

app.delete(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect("/campgrounds");
  })
);

app.post(
  "/campgrounds/:id/reviews",
  validateReview,
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);

    const review = new Review(req.body.review);

    campground.reviews.push(review);
    await review.save();
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  })
);

app.delete(
  "/campgrounds/:id/reviews/:rid",
  catchAsync(async (req, res) => {
    const { id, rid } = req.params;
    await campground.findByIdAndUpdate(id, { $pull: { reviews: rid } });
    await review.findByIdAndDelete(rid);
    res.redirect(`/campgrounds/${id}`);
  })
);

// app.all("*", (req, res, next) => {
//   next(new expressError(" ", 404));
// });

// app.use((err, req, res, next) => {
//   const { msg, status = 500 } = err;
//   if (status == 404) {
//     res.status(404);
//     res.render("campgrounds/404");
//   }
//   res.status(status);
//   res.render("campgrounds/error", { msg });
// });

app.listen(3000, () => {
  console.log("Listening...");
});
