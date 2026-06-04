import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Property } from "../models/Property.js";
import { Tenant } from "../models/Tenant.js";
import { PaymentHistory } from "../models/PaymentHistory.js";
import { Notification } from "../models/Notification.js";
import { LeaseFile } from "../models/LeaseFile.js";

/** From another app on the same Atlas cluster — blocks 2nd property (only one null allowed). */
export const STALE_PROPERTY_INDEX = "propertyContractAddress_1";

const STALE_INDEXES = {
  properties: [STALE_PROPERTY_INDEX],
  tenants: [],
};

/** E11000 on propertyContractAddress: null — first property worked, second fails. */
export function isPropertyContractIndexError(e) {
  return (
    e?.code === 11000 &&
    (e?.keyPattern?.propertyContractAddress != null ||
      String(e?.message || "").includes("propertyContractAddress"))
  );
}

export async function dropStaleIndexes() {
  const db = mongoose.connection.db;
  if (!db) return false;

  const dbName = db.databaseName;
  let dropped = false;

  for (const [collectionName, indexNames] of Object.entries(STALE_INDEXES)) {
    const coll = db.collection(collectionName);
    for (const indexName of indexNames) {
      try {
        await coll.dropIndex(indexName);
        console.log(`Dropped stale index ${dbName}.${collectionName}.${indexName}`);
        dropped = true;
      } catch (err) {
        if (err.code === 27 || err.codeName === "IndexNotFound") continue;
        console.warn(`Could not drop ${dbName}.${collectionName}.${indexName}:`, err.message);
      }
    }
  }
  return dropped;
}

export async function syncAllIndexes() {
  await dropStaleIndexes();

  const models = [User, Property, Tenant, PaymentHistory, Notification, LeaseFile];
  for (const Model of models) {
    await Model.syncIndexes();
    console.log(`Indexes synced for ${Model.modelName}`);
  }
}
