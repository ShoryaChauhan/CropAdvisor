import {
  users,
  states,
  soilTypes,
  crops,
  cropRecommendations,
  weatherData,
  type User,
  type UpsertUser,
  type State,
  type SoilType,
  type Crop,
  type CropRecommendation,
  type WeatherData,
  type InsertState,
  type InsertSoilType,
  type InsertCrop,
  type InsertCropRecommendation,
  type InsertWeatherData,
  type UpdateUserLocation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserLocation(userId: string, location: UpdateUserLocation): Promise<User>;
  
  // States operations
  getAllStates(): Promise<State[]>;
  getStateByCode(code: string): Promise<State | undefined>;
  seedStates(): Promise<void>;
  
  // Soil types operations
  getSoilTypesByState(stateId: string): Promise<SoilType[]>;
  seedSoilTypes(): Promise<void>;
  
  // Crops operations
  getAllCrops(): Promise<Crop[]>;
  getCropsByCompatibility(soilTypeIds: string[]): Promise<Crop[]>;
  seedCrops(): Promise<void>;
  
  // Crop recommendations
  generateCropRecommendations(userId: string, stateId: string, soilTypeId: string): Promise<CropRecommendation[]>;
  getUserCropRecommendations(userId: string): Promise<(CropRecommendation & { crop: Crop; state: State; soilType: SoilType })[]>;
  
  // Weather operations
  getWeatherByState(stateId: string): Promise<WeatherData | undefined>;
  updateWeatherData(stateId: string, data: InsertWeatherData): Promise<WeatherData>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserLocation(userId: string, location: UpdateUserLocation): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        selectedState: location.selectedState,
        selectedSoilType: location.selectedSoilType,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // States operations
  async getAllStates(): Promise<State[]> {
    return await db.select().from(states);
  }

  async getStateByCode(code: string): Promise<State | undefined> {
    const [state] = await db.select().from(states).where(eq(states.code, code));
    return state;
  }

  async seedStates(): Promise<void> {
    const existingStates = await this.getAllStates();
    if (existingStates.length > 0) return;

    const indianStates: InsertState[] = [
      { name: "Punjab", code: "PB" },
      { name: "Haryana", code: "HR" },
      { name: "Uttar Pradesh", code: "UP" },
      { name: "Rajasthan", code: "RJ" },
      { name: "Madhya Pradesh", code: "MP" },
      { name: "Maharashtra", code: "MH" },
      { name: "Gujarat", code: "GJ" },
      { name: "Karnataka", code: "KA" },
      { name: "Tamil Nadu", code: "TN" },
      { name: "Andhra Pradesh", code: "AP" },
      { name: "Telangana", code: "TG" },
      { name: "West Bengal", code: "WB" },
      { name: "Bihar", code: "BR" },
      { name: "Odisha", code: "OR" },
    ];

    await db.insert(states).values(indianStates);
  }

  // Soil types operations
  async getSoilTypesByState(stateId: string): Promise<SoilType[]> {
    return await db.select().from(soilTypes).where(eq(soilTypes.stateId, stateId));
  }

  async seedSoilTypes(): Promise<void> {
    const existingSoilTypes = await db.select().from(soilTypes).limit(1);
    if (existingSoilTypes.length > 0) return;

    const allStates = await this.getAllStates();
    const soilTypeData: InsertSoilType[] = [];

    for (const state of allStates) {
      const soilTypes = this.getSoilTypesForState(state.code);
      soilTypeData.push(...soilTypes.map(soil => ({ ...soil, stateId: state.id })));
    }

    await db.insert(soilTypes).values(soilTypeData);
  }

  private getSoilTypesForState(stateCode: string) {
    const soilMapping: Record<string, any[]> = {
      PB: [
        { name: "Alluvial Soil", description: "Fertile soil rich in potash, phosphoric acid, and lime", phRange: "6.5-7.5", characteristics: "High fertility, good water retention" },
        { name: "Sandy Loam", description: "Well-drained soil with good aeration", phRange: "6.0-7.0", characteristics: "Good drainage, moderate fertility" },
      ],
      HR: [
        { name: "Alluvial Soil", description: "Rich in nutrients, suitable for wheat and rice", phRange: "6.5-7.5", characteristics: "High fertility, good water retention" },
        { name: "Sandy Soil", description: "Light textured soil with good drainage", phRange: "6.0-7.0", characteristics: "Quick drainage, low water retention" },
      ],
      UP: [
        { name: "Alluvial Soil", description: "Most fertile soil in the Gangetic plains", phRange: "6.5-7.5", characteristics: "Very high fertility, excellent for crops" },
        { name: "Black Cotton Soil", description: "Rich in iron, lime, and alumina", phRange: "7.5-8.5", characteristics: "High water retention, suitable for cotton" },
      ],
      RJ: [
        { name: "Desert Soil", description: "Arid soil with low organic content", phRange: "7.0-8.5", characteristics: "Low fertility, requires irrigation" },
        { name: "Alluvial Soil", description: "Found in eastern parts of Rajasthan", phRange: "6.5-7.5", characteristics: "Moderate fertility, good for irrigation farming" },
      ],
      MP: [
        { name: "Black Cotton Soil", description: "Regur soil, rich in iron and alumina", phRange: "7.5-8.5", characteristics: "High water retention, fertile" },
        { name: "Red and Yellow Soil", description: "Formed by weathering of crystalline rocks", phRange: "5.5-6.5", characteristics: "Moderate fertility, good for pulses" },
      ],
    };

    return soilMapping[stateCode] || [
      { name: "Alluvial Soil", description: "General fertile soil", phRange: "6.5-7.5", characteristics: "Good fertility" },
      { name: "Red Soil", description: "Common in many regions", phRange: "5.5-6.5", characteristics: "Moderate fertility" },
    ];
  }

  // Crops operations
  async getAllCrops(): Promise<Crop[]> {
    return await db.select().from(crops);
  }

  async getCropsByCompatibility(soilTypeIds: string[]): Promise<Crop[]> {
    // This would need a more complex query in real implementation
    return await db.select().from(crops);
  }

  async seedCrops(): Promise<void> {
    const existingCrops = await db.select().from(crops).limit(1);
    if (existingCrops.length > 0) return;

    const cropData: InsertCrop[] = [
      {
        name: "Rice",
        season: "Kharif",
        description: "Staple food crop requiring flooded fields",
        expectedYield: "45 quintals/acre",
        growthDuration: 120,
        waterRequirement: "High",
        soilCompatibility: JSON.stringify(["Alluvial Soil", "Clay Soil"]),
        image: "rice.jpg"
      },
      {
        name: "Wheat",
        season: "Rabi",
        description: "Major cereal crop grown in winter season",
        expectedYield: "38 quintals/acre",
        growthDuration: 150,
        waterRequirement: "Moderate",
        soilCompatibility: JSON.stringify(["Alluvial Soil", "Sandy Loam"]),
        image: "wheat.jpg"
      },
      {
        name: "Cotton",
        season: "Kharif",
        description: "Cash crop requiring warm climate",
        expectedYield: "25 quintals/acre",
        growthDuration: 180,
        waterRequirement: "Moderate",
        soilCompatibility: JSON.stringify(["Black Cotton Soil"]),
        image: "cotton.jpg"
      },
      {
        name: "Sugarcane",
        season: "Perennial",
        description: "Long duration cash crop",
        expectedYield: "500 quintals/acre",
        growthDuration: 365,
        waterRequirement: "High",
        soilCompatibility: JSON.stringify(["Alluvial Soil", "Red Soil"]),
        image: "sugarcane.jpg"
      },
    ];

    await db.insert(crops).values(cropData);
  }

  // Crop recommendations
  async generateCropRecommendations(userId: string, stateId: string, soilTypeId: string): Promise<CropRecommendation[]> {
    // Remove existing recommendations for this user
    await db.delete(cropRecommendations).where(eq(cropRecommendations.userId, userId));

    const allCrops = await this.getAllCrops();
    const recommendations: InsertCropRecommendation[] = [];

    for (const crop of allCrops) {
      const compatibleSoils = JSON.parse(crop.soilCompatibility || "[]");
      const soilType = await db.select().from(soilTypes).where(eq(soilTypes.id, soilTypeId)).limit(1);
      
      if (soilType.length > 0) {
        const compatibility = compatibleSoils.includes(soilType[0].name);
        const score = compatibility ? Math.floor(Math.random() * 20) + 80 : Math.floor(Math.random() * 30) + 50;
        
        recommendations.push({
          userId,
          cropId: crop.id,
          stateId,
          soilTypeId,
          compatibilityScore: score,
          recommendations: JSON.stringify({
            irrigation: this.getIrrigationAdvice(crop.name),
            fertilizer: this.getFertilizerAdvice(crop.name),
            pestControl: this.getPestControlAdvice(crop.name),
          }),
        });
      }
    }

    return await db.insert(cropRecommendations).values(recommendations).returning();
  }

  async getUserCropRecommendations(userId: string): Promise<(CropRecommendation & { crop: Crop; state: State; soilType: SoilType })[]> {
    return await db
      .select()
      .from(cropRecommendations)
      .innerJoin(crops, eq(cropRecommendations.cropId, crops.id))
      .innerJoin(states, eq(cropRecommendations.stateId, states.id))
      .innerJoin(soilTypes, eq(cropRecommendations.soilTypeId, soilTypes.id))
      .where(eq(cropRecommendations.userId, userId));
  }

  private getIrrigationAdvice(cropName: string): string {
    const advice: Record<string, string> = {
      Rice: "Maintain 2-3 inches of standing water throughout growing season",
      Wheat: "Apply irrigation at critical stages: crown root initiation, tillering, flowering",
      Cotton: "Deep watering every 7-10 days during flowering and boll formation",
      Sugarcane: "Regular irrigation every 7-15 days depending on soil moisture",
    };
    return advice[cropName] || "Follow standard irrigation practices for your region";
  }

  private getFertilizerAdvice(cropName: string): string {
    const advice: Record<string, string> = {
      Rice: "Apply nitrogen in splits: 50% at transplanting, 25% at tillering, 25% at panicle initiation",
      Wheat: "Apply NPK fertilizers at sowing and top-dress with nitrogen at tillering",
      Cotton: "Heavy potash requirement during boll formation stage",
      Sugarcane: "High nitrogen requirement, apply in multiple splits",
    };
    return advice[cropName] || "Apply balanced NPK fertilizers as per soil test";
  }

  private getPestControlAdvice(cropName: string): string {
    const advice: Record<string, string> = {
      Rice: "Monitor for brown plant hopper, stem borer, and blast disease",
      Wheat: "Watch for aphids, rust diseases, and termites",
      Cotton: "Control bollworm, whitefly, and pink bollworm",
      Sugarcane: "Prevent borer attacks and red rot disease",
    };
    return advice[cropName] || "Regular monitoring for pests and diseases";
  }

  // Weather operations
  async getWeatherByState(stateId: string): Promise<WeatherData | undefined> {
    const [weather] = await db.select().from(weatherData).where(eq(weatherData.stateId, stateId));
    return weather;
  }

  async updateWeatherData(stateId: string, data: InsertWeatherData): Promise<WeatherData> {
    const existing = await this.getWeatherByState(stateId);
    
    if (existing) {
      const [updated] = await db
        .update(weatherData)
        .set({ ...data, lastUpdated: new Date() })
        .where(eq(weatherData.stateId, stateId))
        .returning();
      return updated;
    } else {
      const [inserted] = await db
        .insert(weatherData)
        .values({ ...data, stateId })
        .returning();
      return inserted;
    }
  }
}

export const storage = new DatabaseStorage();
