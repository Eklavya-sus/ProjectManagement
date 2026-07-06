import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import individual module typeDefs (now as strings from .graphql files)
import { projectActivityTypeDefs } from '../modules/projectActivity/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load base schema from .graphql file
const baseTypeDefs = readFileSync(join(__dirname, 'base.graphql'), 'utf-8');

// Combine all type definitions into a single array
export const typeDefs = [
  baseTypeDefs,
  projectActivityTypeDefs,
];