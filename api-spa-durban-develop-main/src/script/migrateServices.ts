import mongoose from "mongoose";

import Services from "../apis/v1/service/schema.service";
import Category from "../apis/v1/category/schema.category";

import pool from "../../database/postgres";
import config from "../../config/config";
import Outlet from "../apis/v1/outlet/schema.outlet";

const mongoURI = config.mongoose.url;

// =================================
// SERVICE MIGRATION
// =================================

export const migrateServices = async () => {
  try {
    console.log("=================================");
    console.log("SERVICE MIGRATION STARTED");
    console.log("=================================");

    // =================================
    // MongoDB
    // =================================

    await mongoose.connect(mongoURI);

    console.log("✅ MongoDB connected");



const outlets = await Outlet.find({})
  .select("_id")
  .lean();

const outletIds = outlets.map(
  (outlet:any) => outlet._id as mongoose.Types.ObjectId
);

console.log(
  `✅ MongoDB Outlets found: ${outletIds.length}`
);

console.log(
  "Outlet IDs:",
  outletIds.map((id) => String(id))
);


    // =================================
    // PostgreSQL
    // =================================

    await pool.query("SELECT 1");

    console.log("✅ PostgreSQL connected");

    // =================================
    // Get Treatments
    // =================================

    const result = await pool.query(`
      SELECT
        id,
        name,
        "variantName",
        duration,
        price,
        description,
        "CategoryId",
        "isDeleted",
        "createdAt",
        "updatedAt"
      FROM public."Treatments"
      ORDER BY "createdAt" ASC
    `);

    const treatments = result.rows;

    console.log(
      `✅ PostgreSQL Treatments found: ${treatments.length}`
    );

    if (!treatments.length) {
      console.log("⚠️ No treatments found.");
      return;
    }

    // =================================
    // Counters
    // =================================

    let inserted = 0;
    let updated = 0;
    let failed = 0;
    let categoryNotFound = 0;

    // =================================
    // Migration
    // =================================

    for (const treatment of treatments) {
      try {
        console.log("---------------------------------");

        console.log(
          `Processing: ${treatment.name} (${treatment.id})`
        );

        // =================================
        // CATEGORY MAPPING
        // PostgreSQL CategoryId
        // ->
        // Mongo Category.bookingProductType
        // ->
        // Mongo Category._id
        // =================================

        let categoryIds: mongoose.Types.ObjectId[] = [];

        if (treatment.CategoryId) {
          const category = await Category.findOne({
            bookingProductType: String(
              treatment.CategoryId
            ),
          }).select("_id");

          if (category) {
            categoryIds = [
              category._id as mongoose.Types.ObjectId,
            ];

            console.log(
              `✅ Category mapped: ${treatment.CategoryId} -> ${String(
                category._id
              )}`
            );
          } else {
            categoryNotFound++;

            console.log(
              `⚠️ Category NOT found: ${treatment.CategoryId}`
            );
          }
        }

        // =================================
        // SERVICE NAME
        // =================================

        let serviceName = treatment.name || "";

        if (
          treatment.variantName &&
          String(treatment.variantName).trim()
        ) {
          serviceName =
            `${treatment.name || ""} - ${treatment.variantName}`.trim();
        }

        // =================================
        // MONGO DATA
        // =================================

        const mongoData = {
          bookingTreatmentsId: String(
            treatment.id
          ),

          serviceName,

          serviceImageUrl: "",

          createdAt: treatment.createdAt
            ? new Date(treatment.createdAt)
            : new Date(),

          updatedAt: treatment.updatedAt
            ? new Date(treatment.updatedAt)
            : new Date(),

          isDeleted: Boolean(
            treatment.isDeleted
          ),

          isActive: !Boolean(
            treatment.isDeleted
          ),

          duration: Number(
            treatment.duration || 0
          ),

          sellingPrice: Number(
            treatment.price || 0
          ),

          categoryIds,

          outletIds: outletIds,

          cashback: 0,

          pinned: false,

          products: [],

          serviceCode: "",
        };

        // =================================
        // CHECK EXISTING
        // =================================

        const existing =
          await Services.findOne({
            bookingTreatmentsId:
              String(treatment.id),
          });

        if (existing) {
          await Services.updateOne(
            {
              bookingTreatmentsId:
                String(treatment.id),
            },
            {
              $set: mongoData,
            }
          );

          updated++;

          console.log(
            `🔄 Updated: ${serviceName}`
          );
        } else {
          await Services.create(
            mongoData
          );

          inserted++;

          console.log(
            `✅ Inserted: ${serviceName}`
          );
        }
      } catch (error: any) {
        failed++;

        console.error(
          `❌ Failed: ${treatment.name} (${treatment.id})`,
          error.message
        );
      }
    }

    // =================================
    // SUMMARY
    // =================================

    console.log("");

    console.log("=================================");
    console.log("SERVICE MIGRATION COMPLETED");
    console.log("=================================");

    console.log(
      `PostgreSQL Records : ${treatments.length}`
    );

    console.log(
      `Inserted           : ${inserted}`
    );

    console.log(
      `Updated            : ${updated}`
    );

    console.log(
      `Failed             : ${failed}`
    );

    console.log(
      `Category Not Found : ${categoryNotFound}`
    );

    console.log("=================================");
  } catch (error) {
    console.error(
      "❌ Service migration failed:",
      error
    );
  } finally {
    // =================================
    // IMPORTANT
    // Don't close pool here because
    // application is also using it.
    // =================================

    console.log(
      "ℹ️ Migration finished. Existing PostgreSQL pool kept alive."
    );

    console.log(
      "ℹ️ Existing MongoDB connection kept alive."
    );
  }
};

// =================================
// RUN MANUALLY
// =================================

migrateServices();