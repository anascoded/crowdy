const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;
const JWT_SECRET = "test-secret-key-change-in-production";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage (for testing only)
const users = new Map();
const favorites = new Map();
const places = new Map();

// Seed some test places
const seedPlaces = () => {
  const testPlaces = [
    {
      id: '1',
      name: 'Central Park',
      address: '123 Central Park West, NYC',
      category: 'Park',
      location: { lat: 40.7829, lng: -73.9654 },
      rating: 4.8,
      photoUrl: 'https://images.unsplash.com/photo-1490377795166-051aafd8fe32?w=400&h=300&fit=crop',
    },
    {
      id: '2',
      name: 'Times Square',
      address: '42nd Street & Broadway, NYC',
      category: 'Landmark',
      location: { lat: 40.758, lng: -73.9855 },
      rating: 4.2,
      photoUrl: 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=400&h=300&fit=crop',
    },
    {
      id: '3',
      name: 'The Metropolitan Museum of Art',
      address: '1000 5th Ave, NYC',
      category: 'Museum',
      location: { lat: 40.7813, lng: -73.9740 },
      rating: 4.7,
      photoUrl: 'https://images.unsplash.com/photo-1564510967152-7a77dc56f46d?w=400&h=300&fit=crop',
    },
    {
      id: '4',
      name: 'Brooklyn Bridge',
      address: 'Brooklyn Bridge, NYC',
      category: 'Bridge',
      location: { lat: 40.7061, lng: -73.9969 },
      rating: 4.6,
      photoUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
    },
    {
      id: '5',
      name: 'Statue of Liberty',
      address: 'Liberty Island, NYC',
      category: 'Monument',
      location: { lat: 40.6892, lng: -74.0445 },
      rating: 4.7,
      photoUrl: 'https://images.unsplash.com/photo-1554531173-27281b64d17a?w=400&h=300&fit=crop',
    },
  ];

  testPlaces.forEach((place) => {
    places.set(place.id, place);
  });
};

seedPlaces();

// Generate mock crowd data
const generateCrowdData = (placeId) => {
  const basePercentage = Math.floor(Math.random() * 100);
  const hours = Array.from({ length: 24 }, (_, i) => {
    const variation = Math.sin(i / 24) * 30 + Math.random() * 20;
    const percentage = Math.max(0, Math.min(100, basePercentage + variation));
    return {
      hour: i,
      percentage: Math.round(percentage),
      level:
        percentage < 25
          ? "low"
          : percentage < 50
            ? "moderate"
            : percentage < 75
              ? "busy"
              : "very_busy",
    };
  });

  return {
    hours,
    percentage: basePercentage,
    level: generateLevel(basePercentage),
  };
};

const generateLevel = (percentage) => {
  if (percentage < 25) return "low";
  if (percentage < 50) return "moderate";
  if (percentage < 75) return "busy";
  return "very_busy";
};

// ── AUTH ENDPOINTS ──────────────────────────────────────────────────────────

app.post("/api/auth/sign-up", (req, res) => {
  const { email, password, displayName } = req.body;

  if (users.has(email)) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const user = {
    id: `user-${Date.now()}`,
    email,
    displayName: displayName || email.split("@")[0],
    createdAt: new Date().toISOString(),
    avatarUrl: null,
  };

  users.set(email, { ...user, password }); // Store password (don't do this in production!)
  favorites.set(user.id, []);

  const accessToken = jwt.sign({ userId: user.id, email }, JWT_SECRET, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign({ userId: user.id, email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

app.post("/api/auth/sign-in", (req, res) => {
  const { email, password } = req.body;
  const userRecord = users.get(email);

  if (!userRecord || userRecord.password !== password) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const { password: _, ...user } = userRecord;

  const accessToken = jwt.sign({ userId: user.id, email }, JWT_SECRET, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign({ userId: user.id, email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const accessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    res.json({
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});

app.post("/api/auth/sign-out", (req, res) => {
  res.json({ message: "Signed out" });
});

app.get("/api/auth/me", verifyToken, (req, res) => {
  const userRecord = Array.from(users.values()).find(
    (u) => u.id === req.userId,
  );

  if (!userRecord) {
    return res.status(404).json({ message: "User not found" });
  }

  const { password: _, ...user } = userRecord;
  res.json({ data: user });
});

// ── PLACES ENDPOINTS ────────────────────────────────────────────────────────

app.get("/api/places/search", (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json({ data: [] });
  }

  const results = Array.from(places.values()).filter(
    (place) =>
      place.name.toLowerCase().includes(String(q).toLowerCase()) ||
      place.category.toLowerCase().includes(String(q).toLowerCase()),
  );

  res.json({ data: results });
});

app.get("/api/places/nearby", (req, res) => {
  const { lat, lng } = req.query;

  // Return all places (in production, filter by distance)
  res.json({ data: Array.from(places.values()) });
});

app.get("/api/places/:placeId", (req, res) => {
  const place = places.get(req.params.placeId);

  if (!place) {
    return res.status(404).json({ message: "Place not found" });
  }

  res.json({ data: place });
});

// ── CROWD ENDPOINTS ────────────────────────────────────────────────────────

app.get("/api/crowd/:placeId/live", (req, res) => {
  const { placeId } = req.params;

  if (!places.has(placeId)) {
    return res.status(404).json({ message: "Place not found" });
  }

  const crowdData = generateCrowdData(placeId);

  res.json({
    data: {
      placeId,
      percentage: crowdData.percentage,
      level: crowdData.level,
      updatedAt: new Date().toISOString(),
    },
  });
});

app.get("/api/crowd/:placeId/history", (req, res) => {
  const { placeId } = req.params;

  if (!places.has(placeId)) {
    return res.status(404).json({ message: "Place not found" });
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const crowdData = generateCrowdData(placeId);

    return {
      day: date.getDay(),
      date: date.toISOString().split("T")[0],
      hours: crowdData.hours,
    };
  });

  res.json({
    data: {
      placeId,
      days,
    },
  });
});

// ── FAVORITES ENDPOINTS ────────────────────────────────────────────────────

app.get("/api/favorites", verifyToken, (req, res) => {
  const userFavorites = favorites.get(req.userId) || [];

  const data = userFavorites.map((placeId) => ({
    id: `fav-${req.userId}-${placeId}`,
    userId: req.userId,
    place: places.get(placeId),
    addedAt: new Date().toISOString(),
  }));

  res.json({ data });
});

app.post("/api/favorites", verifyToken, (req, res) => {
  const { placeId } = req.body;

  if (!places.has(placeId)) {
    return res.status(404).json({ message: "Place not found" });
  }

  let userFavorites = favorites.get(req.userId) || [];

  if (!userFavorites.includes(placeId)) {
    userFavorites.push(placeId);
    favorites.set(req.userId, userFavorites);
  }

  res.json({
    data: {
      id: `fav-${req.userId}-${placeId}`,
      userId: req.userId,
      place: places.get(placeId),
      addedAt: new Date().toISOString(),
    },
  });
});

app.delete("/api/favorites/:placeId", verifyToken, (req, res) => {
  const { placeId } = req.params;
  let userFavorites = favorites.get(req.userId) || [];

  userFavorites = userFavorites.filter((id) => id !== placeId);
  favorites.set(req.userId, userFavorites);

  res.json({ message: "Favorite removed" });
});

// ── MIDDLEWARE ──────────────────────────────────────────────────────────────

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ── START SERVER ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Mock backend running on http://localhost:${PORT}`);
  console.log("Test credentials: email@test.com / password123");
});
