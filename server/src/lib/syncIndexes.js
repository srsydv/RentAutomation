import { User } from "../models/User.js";
import { Property } from "../models/Property.js";
import { Tenant } from "../models/Tenant.js";
import { PaymentHistory } from "../models/PaymentHistory.js";
import { Notification } from "../models/Notification.js";
import { LeaseFile } from "../models/LeaseFile.js";

/** Drop stale unique indexes in Atlas that are not defined in our schemas. */
export async function syncAllIndexes() {
  const models = [User, Property, Tenant, PaymentHistory, Notification, LeaseFile];
  for (const Model of models) {
    await Model.syncIndexes();
    console.log(`Indexes synced for ${Model.modelName}`);
  }
}
