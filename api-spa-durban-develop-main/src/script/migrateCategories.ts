import mongoose from "mongoose";
import pg from "pg";
import Category from "../apis/v1/category/schema.category";
import pool from "../../database/postgres"
import config from "../../config/config";


const mongoURI = config.mongoose.url; // Replace with your MongoDB URI



export const migrateCategories = async () => {
  try {
    console.log("=================================");
    console.log("CATEGORY MIGRATION STARTED");
    console.log("=================================");

    // =================================
    // MongoDB
    // =================================

    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB connected");

    // =================================
    // PostgreSQL
    // =================================

    await pool.query("SELECT 1");

    console.log("✅ PostgreSQL connected");

    // =================================
    // Get Categories
    // =================================

    const result = await pool.query(`
      SELECT
        id,
        name,
        description,
        terms,
        "isDeleted",
        "createdAt",
        "updatedAt"
      FROM public."Categories"
      ORDER BY "createdAt" ASC
    `);

    const categories = result.rows;

    console.log(
      `✅ PostgreSQL Categories found: ${categories.length}`
    );

    if (!categories.length) {
      console.log("⚠️ No categories found.");
      return;
    }

    // =================================
    // Migration
    // =================================

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const category of categories) {
      try {
        console.log("---------------------------------");

        console.log(
          `Processing: ${category.name} (${category.id})`
        );

        const mongoData = {
          bookingProductType: String(category.id),

          categoryName: category.name || "",

          description: category.description || "",

          termsAndConditions: category.terms || "",

          isDeleted: Boolean(category.isDeleted),

          isActive: !Boolean(category.isDeleted),

          createdAt: category.createdAt
            ? new Date(category.createdAt)
            : new Date(),

          updatedAt: category.updatedAt
            ? new Date(category.updatedAt)
            : new Date(),

          categoryImageUrl: "",

          colorCode: "",
        };

        // =================================
        // Check existing
        // =================================

        const existing = await Category.findOne({
          bookingProductType: String(category.id),
        });

        if (existing) {
          await Category.updateOne(
            {
              bookingProductType: String(category.id),
            },
            {
              $set: mongoData,
            }
          );

          updated++;

          console.log(
            `🔄 Updated: ${category.name}`
          );
        } else {
          await Category.create(mongoData);

          inserted++;

          console.log(
            `✅ Inserted: ${category.name}`
          );
        }
      } catch (error:any) {
        failed++;

        console.error(
          `❌ Failed: ${category.name}`,
          error.message
        );
      }
    }

    // =================================
    // Summary
    // =================================

    console.log("");
    console.log("=================================");
    console.log("CATEGORY MIGRATION COMPLETED");
    console.log("=================================");

    console.log(
      `PostgreSQL Records : ${categories.length}`
    );

    console.log(
      `Inserted            : ${inserted}`
    );

    console.log(
      `Updated             : ${updated}`
    );

    console.log(
      `Failed              : ${failed}`
    );

    console.log("=================================");
  } catch (error) {
    console.error(
      "❌ Migration failed:",
      error
    );
  } finally {
    try {
      await mongoose.connection.close();

      console.log(
        "✅ MongoDB connection closed"
      );
    } catch (e:any) {
      console.error(
        "Mongo close error:",
        e.message
      );
    }

    try {
      await pool.end();

      console.log(
        "✅ PostgreSQL connection closed"
      );
    } catch (e:any) {
      console.error(
        "Postgres close error:",
        e.message
      );
    }
  }
};

// =================================
// RUN MANUALLY
// =================================

