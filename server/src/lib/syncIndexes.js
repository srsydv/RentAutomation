import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Property } from "../models/Property.js";
import { Tenant } from "../models/Tenant.js";
import { PaymentHistory } from "../models/PaymentHistory.js";
import { Notification } from "../models/Notification.js";
import { LeaseFile } from "../models/LeaseFile.js";

/** Unique indexes left by other apps on a shared Atlas DB (e.g. web3 property contracts). */
const STALE_INDEXES = {
  properties: ["propertyContractAddress_1"],
  tenants: [],
};

async function dropStaleIndexes() {
  const db = mongoose.connection.db;
  if (!db) return;

  for (const [collectionName, indexNames] of Object.entries(STALE_INDEXES)) {
    const coll = db.collection(collectionName);
    for (const indexName of indexNames) {
      try {
        await coll.dropIndex(indexName);
        console.log(`Dropped stale index ${collectionName}.${indexName}`);
      } catch (err) {
        if (err.code === 27 || err.codeName === "IndexNotFound") continue;
        console.warn(`Could not drop ${collectionName}.${indexName}:`, err.message);
      }
    }
  }
}

/** Drop stale indexes, then align indexes with our Mongoose schemas. */
export async function syncAllIndexes() {
  await dropStaleIndexes();

  const models = [User, Property, Tenant, PaymentHistory, Notification, LeaseFile];
  for (const Model of models) {
    await Model.syncIndexes();
    console.log(`Indexes synced for ${Model.modelName}`);
  }
}
