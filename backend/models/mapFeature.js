const mongoose = require("mongoose");

const mapFeatureSchema = new mongoose.Schema({
  type: String, 
  location: {
    type: {
      type: String,
      enum: ["Point"]
    },
    coordinates: [Number]
  }

});

mapFeatureSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("MapFeature", mapFeatureSchema);