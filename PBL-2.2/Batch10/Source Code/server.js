const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = "founder_secret_key"; 

app.use(express.json());
app.use(cors());

const users = [{ username: "admin", password: "123" }];

// --- SECURITY CHANGE 1: ADD "OWNER" FIELD TO DATA ---
// We add an 'owner' property to track who created the lead
let leads = [
    { id: 1, name: "Elon Musk", company: "SpaceX", status: "Negotiating", owner: "admin" },
    { id: 2, name: "Jeff Bezos", company: "Amazon", status: "New", owner: "admin" }
];

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; // This contains { username: "..." } from the token
        next();
    });
}

// --- ROUTES ---

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({message: "Missing details"});
    users.push({ username, password });
    res.json({ message: "User created! Please login." });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        // We put the username INSIDE the token so we know who they are later
        const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({message: "Invalid Credentials"});
    }
});

// --- SECURITY CHANGE 2: FILTER DATA BY OWNER ---
app.get('/api/leads', authenticateToken, (req, res) => {
    // Only return leads where lead.owner matches the logged-in user
    const myLeads = leads.filter(lead => lead.owner === req.user.username);
    res.json(myLeads);
});

// --- SECURITY CHANGE 3: STAMP DATA WITH OWNER ---
app.post('/api/leads', authenticateToken, (req, res) => {
    console.log("Adding lead for user:", req.user.username);
    const newLead = { 
        id: Date.now(), 
        ...req.body, 
        status: "New",
        owner: req.user.username // <--- STAMP THE OWNER HERE
    };
    leads.push(newLead);
    res.json({ lead: newLead });
});

app.delete('/api/leads/:id', authenticateToken, (req, res) => {
    // Ensure user can only delete their OWN leads
    const idToDelete = parseInt(req.params.id);
    const lead = leads.find(l => l.id === idToDelete);

    if (lead && lead.owner === req.user.username) {
        leads = leads.filter(l => l.id !== idToDelete);
        res.json({ message: "Deleted" });
    } else {
        res.status(403).json({ message: "Not authorized to delete this lead" });
    }
});

app.listen(PORT, () => console.log(`Server running. Security Level: HIGH`));