const mongoose = require("mongoose");
const Campground = require("../models/campground");
const cities = require("./cities");
const { descriptors, places } = require("./seedHelpers");
mongoose
  .connect("mongodb://127.0.0.1:27017/Yelpcamp")
  .then(() => {
    console.log("Connected....");
  })
  .catch((e) => {
    console.log(e);
    console.log("connection Failed");
  });

const sample = (array) => array[Math.floor(Math.random() * array.length)];

const seedDb = async () => {
  await Campground.deleteMany({});
  for (let i = 0; i < 100; i++) {
    const random = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 2000) + 10;
    const camp = new Campground({
      location: `${cities[random].city} ${cities[random].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      image: "https://source.unsplash.com/random/?camping",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elitis dictum. Vivamus vitae mi nec dui loum quam, non faucibus neque pulvinar non. Integer ultricies pulvinar lectus et condimentum. ",
      price: price,
    });
    await camp.save();
  }
};

seedDb().then(() => {
  mongoose.connection.close();
});
