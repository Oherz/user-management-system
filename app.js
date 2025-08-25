const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // For JSON parsing in API routes

// User Schema with Address and Date of Birth
const userSchema = new mongoose.Schema({
    userUniqueId: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true,
        unique: true
    },
    userAge: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    address: {
        street: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true,
            default: 'Jordan'
        }
    }
}, {
    timestamps: true
});

// User Model
const User = mongoose.model('User', userSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected successfully');
        
        // Insert sample data if no users exist
        User.countDocuments()
            .then(count => {
                if (count === 0) {
                    const sampleUsers = [
                        { 
                            userUniqueId: "1", 
                            userName: "Aditya Gupta", 
                            userEmail: "aditya@gmail.com", 
                            userAge: "22",
                            dateOfBirth: new Date('2002-05-15'),
                            address: {
                                street: "123 Main Street",
                                city: "Amman",
                                state: "Amman Governorate",
                                zipCode: "11121",
                                country: "Jordan"
                            }
                        },
                        { 
                            userUniqueId: "2", 
                            userName: "Vanshita Jaiswal", 
                            userEmail: "vanshita@gmail.com", 
                            userAge: "21",
                            dateOfBirth: new Date('2003-08-22'),
                            address: {
                                street: "456 Oak Avenue",
                                city: "Zarqa",
                                state: "Zarqa Governorate",
                                zipCode: "13110",
                                country: "Jordan"
                            }
                        },
                        { 
                            userUniqueId: "3", 
                            userName: "Sachin Yadav", 
                            userEmail: "sachin@gmail.com", 
                            userAge: "22",
                            dateOfBirth: new Date('2002-12-10'),
                            address: {
                                street: "789 Pine Road",
                                city: "Irbid",
                                state: "Irbid Governorate",
                                zipCode: "21110",
                                country: "Jordan"
                            }
                        }
                    ];
                    
                    User.insertMany(sampleUsers)
                        .then(() => console.log('Sample users with address and DOB added to database'))
                        .catch(err => console.log('Error adding sample users:', err));
                }
            });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// ===========================================
// API ROUTES FOR POSTMAN TESTING
// ===========================================

// GET ALL USERS - API
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET SINGLE USER BY ID - API
app.get('/api/users/:userUniqueId', async (req, res) => {
    try {
        const user = await User.findOne({ userUniqueId: req.params.userUniqueId });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// CREATE NEW USER - API
app.post('/api/users', async (req, res) => {
    try {
        const newUser = new User({
            userUniqueId: req.body.userUniqueId,
            userName: req.body.userName,
            userEmail: req.body.userEmail,
            userAge: req.body.userAge,
            dateOfBirth: new Date(req.body.dateOfBirth),
            address: {
                street: req.body.address.street,
                city: req.body.address.city,
                state: req.body.address.state,
                zipCode: req.body.address.zipCode,
                country: req.body.address.country || 'Jordan'
            }
        });

        const savedUser = await newUser.save();
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: savedUser
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'User with this ID or email already exists'
            });
        }
        
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// UPDATE USER - API
app.put('/api/users/:userUniqueId', async (req, res) => {
    try {
        const updateData = {
            userName: req.body.userName,
            userEmail: req.body.userEmail,
            userAge: req.body.userAge
        };

        // Add dateOfBirth if provided
        if (req.body.dateOfBirth) {
            updateData.dateOfBirth = new Date(req.body.dateOfBirth);
        }

        // Add address if provided
        if (req.body.address) {
            updateData.address = {
                street: req.body.address.street,
                city: req.body.address.city,
                state: req.body.address.state,
                zipCode: req.body.address.zipCode,
                country: req.body.address.country || 'Jordan'
            };
        }

        const updatedUser = await User.findOneAndUpdate(
            { userUniqueId: req.params.userUniqueId },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE USER - API
app.delete('/api/users/:userUniqueId', async (req, res) => {
    try {
        const deletedUser = await User.findOneAndDelete({ userUniqueId: req.params.userUniqueId });
        
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: deletedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===========================================
// WEB ROUTES FOR BROWSER INTERFACE
// ===========================================

// Home Route - Display Users
app.get("/", async (req, res) => {
    try {
        const users = await User.find({});
        res.render("home", { data: users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.render("home", { data: [] });
    }
});

// Add User Route
app.post("/", async (req, res) => {
    try {
        const newUser = new User({
            userUniqueId: req.body.userUniqueId,
            userName: req.body.userName,
            userEmail: req.body.userEmail,
            userAge: req.body.userAge,
            dateOfBirth: new Date(req.body.dateOfBirth),
            address: {
                street: req.body.street,
                city: req.body.city,
                state: req.body.state,
                zipCode: req.body.zipCode,
                country: req.body.country || 'Jordan'
            }
        });

        await newUser.save();
        
        const users = await User.find({});
        res.render("home", { data: users });
    } catch (error) {
        console.error('Error adding user:', error);
        
        // If duplicate key error, handle it gracefully
        if (error.code === 11000) {
            console.log('User with this ID or email already exists');
        }
        
        const users = await User.find({});
        res.render("home", { data: users });
    }
});

// Delete User Route
app.post('/delete', async (req, res) => {
    try {
        const requestedUserUniqueId = req.body.userUniqueId;
        await User.deleteOne({ userUniqueId: requestedUserUniqueId });
        
        const users = await User.find({});
        res.render("home", { data: users });
    } catch (error) {
        console.error('Error deleting user:', error);
        
        const users = await User.find({});
        res.render("home", { data: users });
    }
});

// Update User Route
app.post('/update', async (req, res) => {
    try {
        const updateData = {
            userName: req.body.userName,
            userEmail: req.body.userEmail,
            userAge: req.body.userAge
        };

        // Add dateOfBirth if provided
        if (req.body.dateOfBirth) {
            updateData.dateOfBirth = new Date(req.body.dateOfBirth);
        }

        // Add address fields if provided
        if (req.body.street || req.body.city || req.body.state || req.body.zipCode || req.body.country) {
            updateData.address = {
                street: req.body.street,
                city: req.body.city,
                state: req.body.state,
                zipCode: req.body.zipCode,
                country: req.body.country || 'Jordan'
            };
        }

        await User.updateOne(
            { userUniqueId: req.body.userUniqueId },
            updateData
        );
        
        const users = await User.find({});
        res.render("home", { data: users });
    } catch (error) {
        console.error('Error updating user:', error);
        
        const users = await User.find({});
        res.render("home", { data: users });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('API endpoints available at:');
    console.log('- GET    /api/users');
    console.log('- GET    /api/users/:id');
    console.log('- POST   /api/users');
    console.log('- PUT    /api/users/:id');
    console.log('- DELETE /api/users/:id');
});