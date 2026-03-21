const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const client = require("../utils/twilio");
const axios = require("axios");
const polyline = require("@mapbox/polyline");
const { calculateSafetyScore } = require("../service/safetyService");
const UnsafeLocation = require("../models/unsafeLocation");




exports.signUp = async (req, res) => {
    try {
        const { name, phone, aadhaar, password, email } = req.body;
        const existingUser = await User.findOne({ phone, email, aadhaar });
        if (existingUser) {
            return res.status(400).json({ message: "User already registered" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            phone,
            aadhaar,
            password: hashedPassword,
        });
        await user.save();
        res.json({
            message: "User registered successfully",
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.json({
            message: "Login successful",
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id; // userId comes from token
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

exports.addContact = async (req, res) => {
    try {
        const {  name, phone, relation } = req.body;
        const userId = req.userId;
        const user = await User.findById(userId);
        user.emergencyContacts.push({
            name,
            phone,
            relation
        });
        await user.save();
        res.json({
            message: "Emergency contact added",
            contacts: user.emergencyContacts
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        res.json(user.emergencyContacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteContact = async (req, res) => {
    try {
        const { contactId } = req.body;
        const userId = req.userId;
        const user = await User.findById(userId);
        user.emergencyContacts = user.emergencyContacts.filter(
            contact => contact._id.toString() !== contactId
        );
        await user.save();
        res.json({
            message: "Contact deleted"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};


exports.sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({
                to: `+91${phone}`,
                channel: "sms"
            });
        res.json({
            message: "OTP sent successfully"
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const verificationCheck = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({
                to: `+91${phone}`,
                code: otp
            });
        if (verificationCheck.status === "approved") {
            res.json({
                message: "Phone number verified successfully"
            });
        } else {
            res.status(400).json({
                message: "Invalid OTP"
            });
        }
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};


exports.sendSOS = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
        const message = `🚨 EMERGENCY ALERT ${user.name} needs help.
        Location: ${mapLink}`;
        for (let contact of user.emergencyContacts) {
            await client.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE,
                to: `+91${contact.phone}`
            });
        }
        res.json({
            message: "Emergency alert sent to contacts"
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};


exports.addUnsafeLocation = async (req, res) => {
    try {
        const location = new UnsafeLocation(req.body);
        const savedLocation = await location.save();
        res.status(201).json(savedLocation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUnsafeLocations = async (req, res) => {
    try {
        const locations = await UnsafeLocation.find();
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSafestRoute = async (req, res) => {
    try {
        const { startLat, startLng, endLat, endLng } = req.body;
        const response = await axios.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            {
                coordinates: [
                    [startLng, startLat],
                    [endLng, endLat]
                ],
                alternative_routes: {
                    target_count: 3,
                    weight_factor: 1.6
                }
            },
            {
                headers: {
                    Authorization: process.env.ORS_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );
        const routes = response.data.routes;
        let safestRoute = null;
        let highestScore = -Infinity;
        for (const route of routes) {
            const coordinates = polyline.decode(route.geometry);
            const score = await calculateSafetyScore(coordinates);
            if (score > highestScore) {
                highestScore = score;
                safestRoute = route;
            }
        }
        res.json({
            safetyScore: highestScore,
            safestRoute
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};