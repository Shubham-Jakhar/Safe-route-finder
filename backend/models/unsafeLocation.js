const mongoose = require("mongoose");

const unsafeLocationSchema = new mongoose.Schema({
  location: {
    type: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  dangerLevel: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Low"
  },
  type:String,
  description: String,
  reportedAt: {
    type: Date,
    default: Date.now
  }

});

unsafeLocationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("UnsafeLocation", unsafeLocationSchema);