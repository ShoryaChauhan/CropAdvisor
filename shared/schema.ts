import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  selectedState: varchar("selected_state"),
  selectedSoilType: varchar("selected_soil_type"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const states = pgTable("states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  code: varchar("code").notNull(),
});

export const soilTypes = pgTable("soil_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stateId: varchar("state_id").notNull().references(() => states.id),
  name: varchar("name").notNull(),
  description: text("description"),
  phRange: varchar("ph_range"),
  characteristics: text("characteristics"),
});

export const crops = pgTable("crops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  season: varchar("season").notNull(), // Kharif, Rabi, Zaid
  description: text("description"),
  expectedYield: varchar("expected_yield"),
  growthDuration: integer("growth_duration"), // in days
  waterRequirement: varchar("water_requirement"),
  soilCompatibility: text("soil_compatibility"), // JSON array of compatible soil types
  image: varchar("image"),
});

export const cropRecommendations = pgTable("crop_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  cropId: varchar("crop_id").notNull().references(() => crops.id),
  stateId: varchar("state_id").notNull().references(() => states.id),
  soilTypeId: varchar("soil_type_id").notNull().references(() => soilTypes.id),
  compatibilityScore: integer("compatibility_score"),
  recommendations: text("recommendations"), // JSON
  createdAt: timestamp("created_at").defaultNow(),
});

export const weatherData = pgTable("weather_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stateId: varchar("state_id").notNull().references(() => states.id),
  temperature: decimal("temperature"),
  humidity: integer("humidity"),
  windSpeed: decimal("wind_speed"),
  visibility: decimal("visibility"),
  conditions: varchar("conditions"),
  forecast: text("forecast"), // JSON array of 5-day forecast
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Relations
export const statesRelations = relations(states, ({ many }) => ({
  soilTypes: many(soilTypes),
  weather: many(weatherData),
  recommendations: many(cropRecommendations),
}));

export const soilTypesRelations = relations(soilTypes, ({ one, many }) => ({
  state: one(states, {
    fields: [soilTypes.stateId],
    references: [states.id],
  }),
  recommendations: many(cropRecommendations),
}));

export const cropsRelations = relations(crops, ({ many }) => ({
  recommendations: many(cropRecommendations),
}));

export const cropRecommendationsRelations = relations(cropRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [cropRecommendations.userId],
    references: [users.id],
  }),
  crop: one(crops, {
    fields: [cropRecommendations.cropId],
    references: [crops.id],
  }),
  state: one(states, {
    fields: [cropRecommendations.stateId],
    references: [states.id],
  }),
  soilType: one(soilTypes, {
    fields: [cropRecommendations.soilTypeId],
    references: [soilTypes.id],
  }),
}));

export const weatherDataRelations = relations(weatherData, ({ one }) => ({
  state: one(states, {
    fields: [weatherData.stateId],
    references: [states.id],
  }),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type State = typeof states.$inferSelect;
export type SoilType = typeof soilTypes.$inferSelect;
export type Crop = typeof crops.$inferSelect;
export type CropRecommendation = typeof cropRecommendations.$inferSelect;
export type WeatherData = typeof weatherData.$inferSelect;

// Insert schemas
export const insertStateSchema = createInsertSchema(states).omit({ id: true });
export const insertSoilTypeSchema = createInsertSchema(soilTypes).omit({ id: true });
export const insertCropSchema = createInsertSchema(crops).omit({ id: true });
export const insertCropRecommendationSchema = createInsertSchema(cropRecommendations).omit({ id: true, createdAt: true });
export const insertWeatherDataSchema = createInsertSchema(weatherData).omit({ id: true, lastUpdated: true });

export type InsertState = z.infer<typeof insertStateSchema>;
export type InsertSoilType = z.infer<typeof insertSoilTypeSchema>;
export type InsertCrop = z.infer<typeof insertCropSchema>;
export type InsertCropRecommendation = z.infer<typeof insertCropRecommendationSchema>;
export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;

// User update schema
export const updateUserLocationSchema = z.object({
  selectedState: z.string().min(1, "State is required"),
  selectedSoilType: z.string().min(1, "Soil type is required"),
});

export type UpdateUserLocation = z.infer<typeof updateUserLocationSchema>;
