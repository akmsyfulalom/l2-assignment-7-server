const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs');


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: ['https://dev--l2-assignment-7.netlify.app'], credentials: true }));
app.use(express.json());

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

// Set up multer storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// MongoDB Connection URL
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Connect to MongoDB
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db('assignment-7-l2');
        const collection = db.collection('users');
        const suppliesCollection = db.collection('supplies');
        const volunteerCollection = db.collection('volunteer');
        const communityCollection = db.collection("community");
        const suppliersCollection = db.collection("suppliers");
        const commentCollection = db.collection("comment");

        // User Registration
        app.post('/api/v1/register', async (req, res) => {
            const { name, email, password } = req.body;
            console.log("🚀 ~ app.post ~ name, email, password:", name, email, password)

            // Check if email already exists
            const existingUser = await collection.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists'
                });
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user into the database
            await collection.insertOne({ name, email, password: hashedPassword });

            res.status(201).json({
                success: true,
                message: 'User registered successfully'
            });
        });

        // User Login
        app.post('/api/v1/login', async (req, res) => {
            const { email, password } = req.body;

            // Find user by email
            const user = await collection.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Compare hashed password
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Generate JWT token
            const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.EXPIRES_IN });

            res.json({
                success: true,
                message: 'Login successful',
                token
            });
        });


        // ==============================================================
        // WRITE YOUR CODE HERE
        // ==============================================================


        // start supply api
        app.post("/api/v1/create-supply", async (req, res) => {
            const { image, title, category, amount, description } = req.body;
            const result = await suppliesCollection.insertOne({
                image, title, category, amount, description
            });
            res.json({
                success: true,
                message: "Successfully supply create",
                result
            });
        });


        app.get("/api/v1/supplies", async (req, res) => {
            try {
                const { limit } = req.query;
                let result;

                if (limit) {
                    result = await suppliesCollection.find({}).limit(parseInt(limit)).toArray();
                } else {
                    result = await suppliesCollection.find({}).toArray();
                }

                res.json({
                    success: true,
                    message: "Successfully retrieve supplies!",
                    data: result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to retrieve supplies",
                    error: error.message
                });
            }
        });


        app.get("/api/v1/supply/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const data = await suppliesCollection.findOne(new ObjectId(id));

                if (!data) {
                    return res.status(404).json({
                        success: false,
                        message: "Supply not found",
                    });
                }

                res.json({
                    success: true,
                    message: "Successfully retrieved supply",
                    data,
                });
            } catch (error) {
                console.error("Error retrieving supply:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                    error: error.message,
                });
            }
        });


        app.delete("/api/v1/supply/:id", async (req, res) => {
            try {
                const { id } = req.params; // Extract ID from request parameters
                if (!id) {
                    throw new Error("Invalid supply ID");
                }
                const data = await suppliesCollection.deleteOne({
                    _id: new ObjectId(id),
                });
                if (!data) {
                    return res.status(404).json({
                        success: false,
                        message: "Supply not found",
                    });
                }
                res.json({
                    success: true,
                    message: "Successfully deleted supply!",
                    data,
                });
            } catch (error) {
                console.error("Error deleting supply:", error);
                res.status(500).json({
                    success: false,
                    message: "Failed to delete supply",
                    error: error.message,
                });
            }
        });


        app.put("/api/v1/supply/:id", async (req, res) => {
            const { id } = req.params;
            const { image, title, category, amount, description } = req.body;

            try {

                const existingSupply = await suppliesCollection.findOne({ _id: new ObjectId(id) });
                if (!existingSupply) {
                    return res.status(404).json({ success: false, message: "Supply not found" });
                }


                await suppliesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { image, title, category, amount, description } }
                );

                res.json({
                    success: true,
                    message: "Successfully updated supply",
                });
            } catch (error) {
                console.error("Error updating supply:", error);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        });

        // end supply api



        // start volunteer api

        app.post("/api/v1/volunteer", async (req, res) => {
            const { image, name, email, mobile, location, passion } = req.body;
            const result = await volunteerCollection.insertOne({
                image, name, email, mobile, location, passion
            });
            res.json({
                success: true,
                message: "Create volunteer Successfully  ",
                result
            });
        });


        app.get("/api/v1/volunteer", async (req, res) => {
            try {
                const { limit } = req.query;
                let result;

                if (limit) {
                    result = await volunteerCollection.find({}).limit(parseInt(limit)).toArray();
                } else {
                    result = await volunteerCollection.find({}).toArray();
                }

                res.json({
                    success: true,
                    message: "Successfully retrieve volunteer!",
                    data: result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to retrieve volunteer",
                    error: error.message
                });
            }
        });


        // end volunteer api

        // start community api
        app.post("/api/v1/community", async (req, res) => {
            const { image, title, description } = req.body;
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const result = await communityCollection.insertOne({
                image, title, description, createdAt: formattedDate
            });
            res.json({
                success: true,
                message: "Create community Successfully  ",
                result
            });
        });


        app.get("/api/v1/community", async (req, res) => {
            try {
                const { limit } = req.query;
                let result;

                if (limit) {
                    result = await communityCollection.find({}).limit(parseInt(limit)).toArray();
                } else {
                    result = await communityCollection.find({}).toArray();
                }

                res.json({
                    success: true,
                    message: "Successfully retrieve community!",
                    data: result
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Failed to retrieve community",
                    error: error.message
                });
            }
        });

        app.get("/api/v1/community/:id", async (req, res) => {
            try {
                const { id } = req.params;
                const data = await communityCollection.findOne(new ObjectId(id));

                if (!data) {
                    return res.status(404).json({
                        success: false,
                        message: "community post are not found",
                    });
                }

                res.json({
                    success: true,
                    message: "Successfully retrieved community",
                    data,
                });
            } catch (error) {
                console.error("Error retrieving community:", error);
                res.status(500).json({
                    success: false,
                    message: "Internal server error",
                    error: error.message,
                });
            }
        });
        // end community api

        app.get("/api/v1/user", async (req, res) => {
            const data = await collection.find({}).toArray();
            res.json({
                success: true,
                message: "successfully retrieve user!",
                data,
            });
        });
        app.get("/api/v1/user/:email", async (req, res) => {
            const { email } = req.params;
            const data = await collection.findOne({ email });
            res.json({
                success: true,
                message: "successfully retrieve user!",
                data,
            });
        });


        app.post("/api/v1/comment", async (req, res) => {
            const { name, email, comment, id } = req.body;
            const currentDate = new Date();
            const formattedDate = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        
            const result = await commentCollection.insertOne({
                name,
                email,
                comment,
                time: formattedDate,
                id 
            });
            res.json({
                success: true,
                message: "Comment Posted Successfully!",
                result,
            });
        });
        
        app.get("/api/v1/comment", async (req, res) => {
            try {
                const { id } = req.query;
                const query = id ? { id } : {};
        
                const data = await commentCollection.find(query).toArray();
        
                res.json({
                    success: true,
                    message: "Successfully retrieve comments!",
                    data,
                });
            } catch (error) {
                console.error("Error retrieving comments:", error);
                res.status(500).json({
                    success: false,
                    message: "An error occurred while retrieving comments",
                    error: error.message,
                });
            }
        });
        

        app.post('/api/v1/upload', upload.single('image'), async (req, res) => {
            try {
                // Check if file exists
                if (!req.file) {
                    return res.status(400).json({ success: false, message: 'No file uploaded' });
                }

                const base64String = req.file.buffer.toString('base64');


                const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64String}`, { resource_type: "auto", folder: 'weblearn' });


                res.status(200).json({
                    success: true,
                    message: "Image uploaded successfully",
                    url: result.secure_url
                });
            } catch (err) {
                console.error("Error uploading image:", err);
                res.status(500).json({
                    success: false,
                    message: "Error uploading image",
                    error: err.message
                });
            }
        });

        // Start the server
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } finally {
    }
}

run().catch(console.dir);

// Test route
app.get('/', (req, res) => {
    const serverStatus = {
        message: 'Server is running smoothly',
        timestamp: new Date()
    };
    res.json(serverStatus);
});

