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
    if (!user) return user;

    // If user has a selected state, get the state name
    if (user.selectedState) {
      const [state] = await db.select().from(states).where(eq(states.id, user.selectedState));
      if (state) {
        // Return user data with readable state name instead of ID
        return {
          ...user,
          selectedState: state.name,
        };
      }
    }

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
      // North India
      { name: "Punjab", code: "PB" },
      { name: "Haryana", code: "HR" },
      { name: "Himachal Pradesh", code: "HP" },
      { name: "Uttarakhand", code: "UT" },
      { name: "Uttar Pradesh", code: "UP" },
      { name: "Delhi", code: "DL" },
      
      // West India
      { name: "Rajasthan", code: "RJ" },
      { name: "Gujarat", code: "GJ" },
      { name: "Maharashtra", code: "MH" },
      { name: "Goa", code: "GA" },
      
      // Central India
      { name: "Madhya Pradesh", code: "MP" },
      { name: "Chhattisgarh", code: "CG" },
      
      // East India
      { name: "West Bengal", code: "WB" },
      { name: "Bihar", code: "BR" },
      { name: "Jharkhand", code: "JH" },
      { name: "Odisha", code: "OR" },
      
      // Northeast India
      { name: "Assam", code: "AS" },
      { name: "Meghalaya", code: "ML" },
      { name: "Manipur", code: "MN" },
      { name: "Tripura", code: "TR" },
      { name: "Nagaland", code: "NL" },
      { name: "Mizoram", code: "MZ" },
      { name: "Arunachal Pradesh", code: "AR" },
      { name: "Sikkim", code: "SK" },
      
      // South India
      { name: "Karnataka", code: "KA" },
      { name: "Tamil Nadu", code: "TN" },
      { name: "Andhra Pradesh", code: "AP" },
      { name: "Telangana", code: "TG" },
      { name: "Kerala", code: "KL" },
      
      // Union Territories
      { name: "Jammu & Kashmir", code: "JK" },
      { name: "Ladakh", code: "LA" },
      { name: "Chandigarh", code: "CH" },
      { name: "Puducherry", code: "PY" },
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
      // North India
      PB: [
        { name: "Alluvial Soil", description: "Fertile soil rich in potash, phosphoric acid, and lime", phRange: "6.5-7.5", characteristics: "High fertility, good water retention" },
        { name: "Sandy Loam", description: "Well-drained soil with good aeration", phRange: "6.0-7.0", characteristics: "Good drainage, moderate fertility" },
        { name: "Clay Loam", description: "Rich in nutrients with good structure", phRange: "6.5-7.0", characteristics: "Excellent for wheat and rice" },
        { name: "Saline Soil", description: "High salt content soil in some areas", phRange: "8.0-8.5", characteristics: "Requires salt management" },
      ],
      HR: [
        { name: "Alluvial Soil", description: "Rich in nutrients, suitable for wheat and rice", phRange: "6.5-7.5", characteristics: "High fertility, good water retention" },
        { name: "Sandy Soil", description: "Light textured soil with good drainage", phRange: "6.0-7.0", characteristics: "Quick drainage, low water retention" },
        { name: "Clay Soil", description: "Heavy soil with high water retention", phRange: "7.0-7.5", characteristics: "Good for paddy cultivation" },
        { name: "Loamy Soil", description: "Balanced mixture of sand, silt, and clay", phRange: "6.5-7.0", characteristics: "Ideal for most crops" },
      ],
      HP: [
        { name: "Mountain Soil", description: "Forest and hill soils with organic matter", phRange: "5.5-6.5", characteristics: "Rich in humus, acidic" },
        { name: "Alluvial Soil", description: "Valley soil suitable for agriculture", phRange: "6.5-7.0", characteristics: "Fertile valley soil" },
        { name: "Brown Hill Soil", description: "Weathered soil on slopes", phRange: "6.0-6.8", characteristics: "Moderate fertility" },
        { name: "Forest Soil", description: "Rich organic soil under forests", phRange: "5.0-6.0", characteristics: "High organic content" },
      ],
      UT: [
        { name: "Mountain Soil", description: "High altitude soil with good drainage", phRange: "5.5-6.5", characteristics: "Cold climate adaptation" },
        { name: "Forest Soil", description: "Rich in organic matter from leaf litter", phRange: "5.0-6.0", characteristics: "High humus content" },
        { name: "Alluvial Soil", description: "River valley soil", phRange: "6.5-7.0", characteristics: "Good for terrace farming" },
        { name: "Brown Soil", description: "Hill slope soil", phRange: "6.0-6.8", characteristics: "Moderate fertility" },
      ],
      UP: [
        { name: "Alluvial Soil", description: "Most fertile soil in the Gangetic plains", phRange: "6.5-7.5", characteristics: "Very high fertility, excellent for crops" },
        { name: "Black Cotton Soil", description: "Rich in iron, lime, and alumina", phRange: "7.5-8.5", characteristics: "High water retention, suitable for cotton" },
        { name: "Sandy Loam", description: "Mixed soil with good drainage", phRange: "6.0-7.0", characteristics: "Versatile for multiple crops" },
        { name: "Clay Soil", description: "Heavy soil in certain regions", phRange: "7.0-7.8", characteristics: "Excellent water retention" },
        { name: "Saline Alkali Soil", description: "Problem soil requiring management", phRange: "8.5-9.5", characteristics: "High pH, needs reclamation" },
      ],
      DL: [
        { name: "Alluvial Soil", description: "Yamuna river basin soil", phRange: "6.5-7.5", characteristics: "Urban agriculture suitable" },
        { name: "Sandy Loam", description: "Well-drained urban soil", phRange: "6.0-7.0", characteristics: "Good for vegetables" },
        { name: "Clay Loam", description: "Fertile soil for intensive farming", phRange: "6.8-7.2", characteristics: "High productivity potential" },
      ],

      // West India
      RJ: [
        { name: "Desert Soil", description: "Arid soil with low organic content", phRange: "7.0-8.5", characteristics: "Low fertility, requires irrigation" },
        { name: "Alluvial Soil", description: "Found in eastern parts of Rajasthan", phRange: "6.5-7.5", characteristics: "Moderate fertility, good for irrigation farming" },
        { name: "Red Soil", description: "Iron-rich soil in southeastern regions", phRange: "5.5-6.5", characteristics: "Suitable for millets and pulses" },
        { name: "Saline Soil", description: "Salt-affected soil in western regions", phRange: "8.0-9.0", characteristics: "Requires salt management" },
        { name: "Sandy Soil", description: "Predominant in Thar desert", phRange: "7.5-8.0", characteristics: "Low water retention" },
      ],
      GJ: [
        { name: "Black Cotton Soil", description: "Regur soil, excellent for cotton", phRange: "7.5-8.5", characteristics: "High water retention, very fertile" },
        { name: "Alluvial Soil", description: "River valley soil", phRange: "6.5-7.5", characteristics: "Good for multiple crops" },
        { name: "Sandy Soil", description: "Coastal and inland sandy areas", phRange: "6.0-7.0", characteristics: "Good drainage, light texture" },
        { name: "Saline Soil", description: "Coastal saline areas", phRange: "8.0-8.5", characteristics: "Salt-affected, needs management" },
        { name: "Red Soil", description: "Hilly regions soil", phRange: "5.5-6.5", characteristics: "Moderate fertility" },
      ],
      MH: [
        { name: "Black Cotton Soil", description: "Most fertile regur soil", phRange: "7.5-8.5", characteristics: "Excellent for cotton, sugarcane" },
        { name: "Red Soil", description: "Deccan plateau soil", phRange: "5.5-6.5", characteristics: "Good for millets, pulses" },
        { name: "Alluvial Soil", description: "River valley soil", phRange: "6.5-7.5", characteristics: "High fertility" },
        { name: "Laterite Soil", description: "Western Ghats soil", phRange: "5.0-6.0", characteristics: "Iron and aluminum rich" },
        { name: "Sandy Loam", description: "Coastal plain soil", phRange: "6.0-7.0", characteristics: "Good for vegetables" },
      ],
      GA: [
        { name: "Laterite Soil", description: "Predominant soil type", phRange: "5.0-6.0", characteristics: "Iron-rich, acidic" },
        { name: "Alluvial Soil", description: "River valley soil", phRange: "6.5-7.0", characteristics: "Fertile for rice cultivation" },
        { name: "Red Soil", description: "Hilly region soil", phRange: "5.5-6.5", characteristics: "Moderate fertility" },
        { name: "Coastal Sandy Soil", description: "Beach and coastal areas", phRange: "6.5-7.5", characteristics: "Good drainage, coconut suitable" },
      ],

      // Central India
      MP: [
        { name: "Black Cotton Soil", description: "Regur soil, rich in iron and alumina", phRange: "7.5-8.5", characteristics: "High water retention, fertile" },
        { name: "Red and Yellow Soil", description: "Formed by weathering of crystalline rocks", phRange: "5.5-6.5", characteristics: "Moderate fertility, good for pulses" },
        { name: "Alluvial Soil", description: "River valley soil", phRange: "6.5-7.5", characteristics: "Very fertile" },
        { name: "Mixed Red and Black Soil", description: "Transitional soil type", phRange: "6.0-7.0", characteristics: "Versatile for crops" },
        { name: "Laterite Soil", description: "Plateau region soil", phRange: "5.0-6.0", characteristics: "Iron-rich, needs fertilizers" },
      ],
      CG: [
        { name: "Red and Yellow Soil", description: "Predominant soil in the state", phRange: "5.5-6.5", characteristics: "Good for rice and pulses" },
        { name: "Alluvial Soil", description: "River plains soil", phRange: "6.5-7.5", characteristics: "High fertility" },
        { name: "Black Soil", description: "Central and southern regions", phRange: "7.0-8.0", characteristics: "Good water retention" },
        { name: "Laterite Soil", description: "Plateau areas", phRange: "5.0-6.0", characteristics: "Iron-rich, acidic" },
        { name: "Forest Soil", description: "Dense forest areas", phRange: "5.5-6.0", characteristics: "Rich in organic matter" },
      ],

      // East India
      WB: [
        { name: "Alluvial Soil", description: "Gangetic plains soil", phRange: "6.5-7.5", characteristics: "Very fertile, excellent for rice" },
        { name: "Red Laterite Soil", description: "Western plateau soil", phRange: "5.0-6.0", characteristics: "Iron-rich, acidic" },
        { name: "Terai Soil", description: "Foothills soil", phRange: "6.0-6.8", characteristics: "Good for tea cultivation" },
        { name: "Coastal Alluvium", description: "Sundarbans region", phRange: "6.8-7.2", characteristics: "Saline influence" },
        { name: "Hill Soil", description: "Darjeeling hills", phRange: "5.5-6.5", characteristics: "Ideal for tea and fruits" },
      ],
      BR: [
        { name: "Alluvial Soil", description: "Gangetic plains fertile soil", phRange: "6.5-7.5", characteristics: "Extremely fertile" },
        { name: "Newer Alluvium", description: "Recent river deposits", phRange: "6.8-7.2", characteristics: "Very high fertility" },
        { name: "Older Alluvium", description: "Elevated areas", phRange: "6.5-7.0", characteristics: "Good fertility" },
        { name: "Terai Soil", description: "Northern foothills", phRange: "6.0-6.8", characteristics: "Forest transition soil" },
      ],
      JH: [
        { name: "Red Soil", description: "Chota Nagpur plateau soil", phRange: "5.5-6.5", characteristics: "Iron-rich, moderate fertility" },
        { name: "Laterite Soil", description: "Plateau region", phRange: "5.0-6.0", characteristics: "Iron and aluminum rich" },
        { name: "Alluvial Soil", description: "River valleys", phRange: "6.5-7.5", characteristics: "Fertile valley soil" },
        { name: "Forest Soil", description: "Dense forest areas", phRange: "5.5-6.0", characteristics: "Rich organic content" },
        { name: "Sandy Loam", description: "Undulating areas", phRange: "6.0-6.8", characteristics: "Moderate drainage" },
      ],
      OR: [
        { name: "Red Soil", description: "Predominant soil type", phRange: "5.5-6.5", characteristics: "Iron-rich, good for millets" },
        { name: "Alluvial Soil", description: "Coastal and river plains", phRange: "6.5-7.5", characteristics: "Very fertile" },
        { name: "Laterite Soil", description: "Eastern Ghats region", phRange: "5.0-6.0", characteristics: "Iron-rich, acidic" },
        { name: "Black Soil", description: "Western regions", phRange: "7.0-8.0", characteristics: "Good water retention" },
        { name: "Coastal Sandy Soil", description: "Coastal areas", phRange: "6.8-7.5", characteristics: "Good for coconut" },
      ],

      // Northeast India
      AS: [
        { name: "Alluvial Soil", description: "Brahmaputra valley soil", phRange: "6.0-7.0", characteristics: "Very fertile for rice" },
        { name: "Hill Soil", description: "Assam hills", phRange: "5.5-6.5", characteristics: "Good for tea cultivation" },
        { name: "Red Loamy Soil", description: "Upper Assam", phRange: "5.8-6.8", characteristics: "Moderate fertility" },
        { name: "Laterite Soil", description: "Plateau areas", phRange: "5.0-6.0", characteristics: "Iron-rich" },
        { name: "Terai Soil", description: "Foothills region", phRange: "6.0-6.8", characteristics: "Forest soil" },
      ],
      ML: [
        { name: "Red Soil", description: "Khasi and Jaintia hills", phRange: "5.5-6.5", characteristics: "Acidic, needs lime" },
        { name: "Laterite Soil", description: "Plateau regions", phRange: "5.0-6.0", characteristics: "Iron-rich, low fertility" },
        { name: "Forest Soil", description: "Dense forest areas", phRange: "5.0-5.8", characteristics: "High organic matter" },
        { name: "Alluvial Soil", description: "Valley areas", phRange: "6.0-6.8", characteristics: "Moderate fertility" },
      ],
      MN: [
        { name: "Red Soil", description: "Hill soil", phRange: "5.5-6.5", characteristics: "Moderate fertility" },
        { name: "Alluvial Soil", description: "Valley soil", phRange: "6.0-7.0", characteristics: "Good for rice" },
        { name: "Forest Soil", description: "Forest areas", phRange: "5.0-6.0", characteristics: "Rich organic content" },
        { name: "Hill Slope Soil", description: "Steep slopes", phRange: "5.5-6.8", characteristics: "Erosion prone" },
      ],
      TR: [
        { name: "Red and Yellow Soil", description: "Hill and valley soil", phRange: "5.5-6.5", characteristics: "Moderate fertility" },
        { name: "Alluvial Soil", description: "River valleys", phRange: "6.0-7.0", characteristics: "Good for agriculture" },
        { name: "Forest Soil", description: "Forest covered areas", phRange: "5.0-6.0", characteristics: "High humus" },
        { name: "Laterite Soil", description: "Plateau areas", phRange: "5.0-5.8", characteristics: "Iron-rich" },
      ],
      NL: [
        { name: "Forest Soil", description: "Dense forest soil", phRange: "5.0-6.0", characteristics: "Very rich in organic matter" },
        { name: "Red Soil", description: "Hill slopes", phRange: "5.5-6.5", characteristics: "Acidic nature" },
        { name: "Alluvial Soil", description: "Valley areas", phRange: "6.0-6.8", characteristics: "Moderate fertility" },
        { name: "Mountain Soil", description: "High altitude areas", phRange: "5.0-5.8", characteristics: "Cold climate soil" },
      ],
      MZ: [
        { name: "Red Soil", description: "Hill and slope soil", phRange: "5.5-6.5", characteristics: "Moderate to low fertility" },
        { name: "Forest Soil", description: "Forest areas", phRange: "5.0-6.0", characteristics: "Rich in organic matter" },
        { name: "Alluvial Soil", description: "River valleys", phRange: "6.0-6.8", characteristics: "Good for rice" },
        { name: "Mountain Soil", description: "High hills", phRange: "5.0-5.8", characteristics: "Steep slope soil" },
      ],
      AR: [
        { name: "Mountain Soil", description: "High altitude soil", phRange: "5.0-6.0", characteristics: "Cold climate adaptation" },
        { name: "Forest Soil", description: "Dense forest cover", phRange: "5.0-5.8", characteristics: "Very rich humus" },
        { name: "Red Soil", description: "Hill slopes", phRange: "5.5-6.5", characteristics: "Moderate fertility" },
        { name: "Alluvial Soil", description: "Valley floors", phRange: "6.0-6.8", characteristics: "Limited agriculture" },
      ],
      SK: [
        { name: "Mountain Soil", description: "High altitude Himalayan soil", phRange: "5.0-6.0", characteristics: "Cold climate, organic rich" },
        { name: "Forest Soil", description: "Dense forest areas", phRange: "5.0-5.8", characteristics: "High organic content" },
        { name: "Alpine Soil", description: "High altitude meadows", phRange: "5.5-6.5", characteristics: "Short growing season" },
        { name: "Alluvial Soil", description: "Teesta valley", phRange: "6.0-6.8", characteristics: "Terrace farming suitable" },
      ],

      // South India
      KA: [
        { name: "Red Soil", description: "Predominant soil of Karnataka", phRange: "5.5-6.5", characteristics: "Iron-rich, good for millets" },
        { name: "Black Soil", description: "Northern Karnataka", phRange: "7.5-8.5", characteristics: "Excellent for cotton" },
        { name: "Laterite Soil", description: "Western Ghats region", phRange: "5.0-6.0", characteristics: "Iron and aluminum rich" },
        { name: "Alluvial Soil", description: "River valleys", phRange: "6.5-7.5", characteristics: "Very fertile" },
        { name: "Coastal Sandy Soil", description: "Coastal Karnataka", phRange: "6.5-7.5", characteristics: "Good for coconut" },
        { name: "Forest Soil", description: "Western Ghats forests", phRange: "5.0-6.0", characteristics: "Rich organic matter" },
      ],
      TN: [
        { name: "Red Soil", description: "Most common soil type", phRange: "5.5-6.5", characteristics: "Good for millets, groundnut" },
        { name: "Black Soil", description: "Southern and western regions", phRange: "7.5-8.5", characteristics: "Excellent for cotton" },
        { name: "Alluvial Soil", description: "River deltas and valleys", phRange: "6.5-7.5", characteristics: "Very fertile for rice" },
        { name: "Laterite Soil", description: "Western Ghats", phRange: "5.0-6.0", characteristics: "Iron-rich, acidic" },
        { name: "Coastal Sandy Soil", description: "Coastal plains", phRange: "6.8-7.5", characteristics: "Good for coconut, cashew" },
        { name: "Saline Soil", description: "Coastal saline areas", phRange: "8.0-8.5", characteristics: "Salt-affected" },
      ],
      AP: [
        { name: "Red Soil", description: "Predominant in most regions", phRange: "5.5-6.5", characteristics: "Iron-rich, moderate fertility" },
        { name: "Black Soil", description: "Western and central regions", phRange: "7.5-8.5", characteristics: "Excellent for cotton" },
        { name: "Alluvial Soil", description: "River deltas", phRange: "6.5-7.5", characteristics: "Very fertile for rice" },
        { name: "Laterite Soil", description: "Eastern Ghats", phRange: "5.0-6.0", characteristics: "Iron-rich" },
        { name: "Coastal Sandy Soil", description: "Coastal areas", phRange: "6.8-7.5", characteristics: "Good for coconut" },
      ],
      TG: [
        { name: "Red Soil", description: "Major soil type", phRange: "5.5-6.5", characteristics: "Iron-rich, good for cotton" },
        { name: "Black Soil", description: "Central and western regions", phRange: "7.5-8.5", characteristics: "Excellent water retention" },
        { name: "Alluvial Soil", description: "River valleys", phRange: "6.5-7.5", characteristics: "High fertility" },
        { name: "Mixed Red and Black Soil", description: "Transitional areas", phRange: "6.0-7.0", characteristics: "Moderate fertility" },
      ],
      KL: [
        { name: "Laterite Soil", description: "Predominant soil type", phRange: "5.0-6.0", characteristics: "Iron-rich, acidic, good for coconut" },
        { name: "Alluvial Soil", description: "River valleys and deltas", phRange: "6.0-7.0", characteristics: "Very fertile for rice" },
        { name: "Red Soil", description: "Eastern regions", phRange: "5.5-6.5", characteristics: "Moderate fertility" },
        { name: "Coastal Sandy Soil", description: "Coastal belt", phRange: "6.5-7.5", characteristics: "Excellent for coconut" },
        { name: "Forest Soil", description: "Western Ghats", phRange: "5.0-6.0", characteristics: "Rich in organic matter" },
        { name: "Hill Soil", description: "High ranges", phRange: "5.5-6.5", characteristics: "Good for spices, tea" },
      ],

      // Union Territories
      JK: [
        { name: "Mountain Soil", description: "High altitude Himalayan soil", phRange: "5.5-6.5", characteristics: "Cold climate, organic matter rich" },
        { name: "Alluvial Soil", description: "Kashmir valley", phRange: "6.5-7.5", characteristics: "Very fertile for rice, saffron" },
        { name: "Forest Soil", description: "Forest covered areas", phRange: "5.0-6.0", characteristics: "Rich humus content" },
        { name: "Alpine Soil", description: "High altitude meadows", phRange: "5.5-6.8", characteristics: "Short growing season" },
        { name: "Glacial Soil", description: "Glacial deposits", phRange: "6.0-6.8", characteristics: "Rocky, mineral rich" },
      ],
      LA: [
        { name: "Cold Desert Soil", description: "High altitude desert soil", phRange: "7.0-8.0", characteristics: "Arid, low organic matter" },
        { name: "Mountain Soil", description: "Rocky mountain soil", phRange: "6.0-7.0", characteristics: "Limited agriculture potential" },
        { name: "Glacial Soil", description: "Glacial valley soil", phRange: "6.5-7.5", characteristics: "Mineral rich" },
        { name: "Alpine Soil", description: "High altitude soil", phRange: "6.0-6.8", characteristics: "Extreme climate adaptation" },
      ],
      CH: [
        { name: "Alluvial Soil", description: "Indo-Gangetic plain soil", phRange: "6.5-7.5", characteristics: "High fertility" },
        { name: "Sandy Loam", description: "Well-drained soil", phRange: "6.0-7.0", characteristics: "Good for vegetables" },
        { name: "Clay Loam", description: "Heavy soil with nutrients", phRange: "6.8-7.2", characteristics: "Good water retention" },
      ],
      PY: [
        { name: "Red Soil", description: "Terra rossa soil", phRange: "5.5-6.5", characteristics: "Iron-rich, moderate fertility" },
        { name: "Alluvial Soil", description: "River and coastal plains", phRange: "6.5-7.5", characteristics: "Very fertile" },
        { name: "Coastal Sandy Soil", description: "Beach and coastal areas", phRange: "6.8-7.5", characteristics: "Good for coconut" },
        { name: "Black Soil", description: "Interior regions", phRange: "7.0-8.0", characteristics: "Good water retention" },
      ],
    };

    return soilMapping[stateCode] || [
      { name: "Alluvial Soil", description: "General fertile soil", phRange: "6.5-7.5", characteristics: "Good fertility" },
      { name: "Red Soil", description: "Common in many regions", phRange: "5.5-6.5", characteristics: "Moderate fertility" },
      { name: "Black Soil", description: "Clay-rich soil", phRange: "7.0-8.0", characteristics: "High water retention" },
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
    const results = await db
      .select()
      .from(cropRecommendations)
      .innerJoin(crops, eq(cropRecommendations.cropId, crops.id))
      .innerJoin(states, eq(cropRecommendations.stateId, states.id))
      .innerJoin(soilTypes, eq(cropRecommendations.soilTypeId, soilTypes.id))
      .where(eq(cropRecommendations.userId, userId));

    // Transform the nested structure to the expected flat structure
    return results.map((result: any) => ({
      id: result.crop_recommendations.id,
      userId: result.crop_recommendations.userId,
      cropId: result.crop_recommendations.cropId,
      stateId: result.crop_recommendations.stateId,
      soilTypeId: result.crop_recommendations.soilTypeId,
      compatibilityScore: result.crop_recommendations.compatibilityScore,
      recommendations: result.crop_recommendations.recommendations,
      createdAt: result.crop_recommendations.createdAt,
      crop: result.crops,
      state: result.states,
      soilType: result.soil_types,
    }));
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
