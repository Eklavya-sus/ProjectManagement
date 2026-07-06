// modules/organizations/validators/getOrgUsersSchema.ts
import Joi from "joi";

export const getOrgUsersSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(), // orgId
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }).and("page", "limit"), // optional pagination: both must exist if any
};