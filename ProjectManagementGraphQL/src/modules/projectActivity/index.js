// modules/projectActivity/index.js

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load GraphQL schema from .graphql file
export const projectActivityTypeDefs = readFileSync(join(__dirname, 'projectActivity.graphql'), 'utf-8');
export { projectActivityResolvers } from './projectActivity.resolvers.js';