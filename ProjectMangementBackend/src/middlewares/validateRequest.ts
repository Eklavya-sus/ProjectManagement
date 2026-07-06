import { ObjectSchema } from "joi";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";

export const validateRequest = (
  schema: ObjectSchema | { body?: ObjectSchema; params?: ObjectSchema; query?: ObjectSchema }
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if ("validate" in schema) {
        // old style → single schema = validate body
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) throw createError(400, error.details.map(d => d.message).join(", "));
      } else {
        // new style → object with body/query/params
        for (const key of ["body", "params", "query"] as const) {
          if (schema[key]) {
            const { error } = schema[key]!.validate(req[key], { abortEarly: false });
            if (error) throw createError(400, error.details.map(d => d.message).join(", "));
          }
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};
