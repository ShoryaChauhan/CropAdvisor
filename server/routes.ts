import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { updateUserLocationSchema, insertCropRecommendationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize database with seed data
  app.get('/api/init', async (req, res) => {
    try {
      await storage.seedStates();
      await storage.seedSoilTypes();
      await storage.seedCrops();
      res.json({ message: "Database initialized successfully" });
    } catch (error) {
      console.error("Error initializing database:", error);
      res.status(500).json({ message: "Failed to initialize database" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub.toString();
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // States routes
  app.get('/api/states', async (req, res) => {
    try {
      const states = await storage.getAllStates();
      res.json(states);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ message: "Failed to fetch states" });
    }
  });

  // Soil types routes
  app.get('/api/soil-types/:stateId', async (req, res) => {
    try {
      const { stateId } = req.params;
      const soilTypes = await storage.getSoilTypesByState(stateId);
      res.json(soilTypes);
    } catch (error) {
      console.error("Error fetching soil types:", error);
      res.status(500).json({ message: "Failed to fetch soil types" });
    }
  });

  // Update user location
  app.patch('/api/user/location', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub.toString();
      const locationData = updateUserLocationSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserLocation(userId, locationData);
      
      // Generate new crop recommendations
      await storage.generateCropRecommendations(
        userId,
        locationData.selectedState,
        locationData.selectedSoilType
      );
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input data", errors: error.errors });
      } else {
        console.error("Error updating user location:", error);
        res.status(500).json({ message: "Failed to update location" });
      }
    }
  });

  // Crop recommendations routes
  app.get('/api/crop-recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub.toString();
      const recommendations = await storage.getUserCropRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching crop recommendations:", error);
      res.status(500).json({ message: "Failed to fetch crop recommendations" });
    }
  });

  app.post('/api/crop-recommendations/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub.toString();
      const user = await storage.getUser(userId);
      
      if (!user?.selectedState || !user?.selectedSoilType) {
        return res.status(400).json({ message: "Please select state and soil type first" });
      }
      
      const recommendations = await storage.generateCropRecommendations(
        userId,
        user.selectedState,
        user.selectedSoilType
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating crop recommendations:", error);
      res.status(500).json({ message: "Failed to generate crop recommendations" });
    }
  });

  // Weather routes
  app.get('/api/weather/:stateId', async (req, res) => {
    try {
      const { stateId } = req.params;
      let weather = await storage.getWeatherByState(stateId);
      
      // If no weather data exists or it's older than 1 hour, fetch fresh data
      if (!weather || (weather.lastUpdated && Date.now() - weather.lastUpdated.getTime() > 3600000)) {
        // Simulate weather API call - in production, integrate with OpenWeatherMap
        const freshWeatherData = {
          stateId,
          temperature: (Math.random() * 15 + 20).toFixed(1), // 20-35°C
          humidity: Math.floor(Math.random() * 40 + 40), // 40-80%
          windSpeed: (Math.random() * 10 + 5).toFixed(1), // 5-15 km/h
          visibility: (Math.random() * 5 + 5).toFixed(1), // 5-10 km
          conditions: ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"][Math.floor(Math.random() * 4)],
          forecast: JSON.stringify([
            { day: "Today", temp: "28°", condition: "Sunny", icon: "sun" },
            { day: "Tomorrow", temp: "26°", condition: "Partly Cloudy", icon: "cloud-sun" },
            { day: "Wed", temp: "24°", condition: "Light Rain", icon: "cloud-rain" },
            { day: "Thu", temp: "23°", condition: "Cloudy", icon: "cloud" },
            { day: "Fri", temp: "27°", condition: "Sunny", icon: "sun" },
          ]),
        };
        
        weather = await storage.updateWeatherData(stateId, freshWeatherData);
      }
      
      res.json(weather);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      res.status(500).json({ message: "Failed to fetch weather data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
