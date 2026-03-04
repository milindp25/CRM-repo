/**
 * GraphQL Client for aggregated queries
 * Uses graphql-request for lightweight GraphQL over HTTP
 * Same auth pattern as apiClient (JWT from localStorage)
 */

import { GraphQLClient } from 'graphql-request';
import { getToken } from './token-sync';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
// GraphQL endpoint is at /graphql (not under /v1)
const GRAPHQL_URL = API_BASE_URL.replace(/\/v1\/?$/, '') + '/graphql';

function createClient(): GraphQLClient {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return new GraphQLClient(GRAPHQL_URL, { headers });
}

/**
 * Execute a GraphQL query with current auth token
 */
export async function gqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>,
): Promise<T> {
  const client = createClient();
  return client.request<T>(query, variables);
}
