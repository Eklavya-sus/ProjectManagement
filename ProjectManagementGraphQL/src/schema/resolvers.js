import _ from "lodash";
const { merge } = _;

// Import individual module resolvers
import { projectActivityResolvers } from '../modules/projectActivity/index.js';

// Merge all resolvers using lodash merge to handle nested objects properly
// This ensures Query, Mutation, and type resolvers are combined correctly
export const resolvers = merge(
  {},
  projectActivityResolvers
);