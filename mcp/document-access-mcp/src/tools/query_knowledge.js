// query_knowledge.js
// Agent consumption layer — vector similarity search over document_embeddings.
// Called by the chat skill (Build B) and Claude Code tooling.
//
// Build A note: embedding generation via Vertex AI is wired in Build B (ARCH-19).
// This tool is fully implemented and ready — it will return results as soon as
// embeddings exist in document_embeddings. In Build A the table is populated
// via the batch approval translation layer placeholder.
//
// query_embedding is passed by the caller (the skill generates it via Vertex AI).
// This tool does the Division-scoped vector search and returns ranked chunks.

'use strict';

const { supabase }                  = require('../db');
const { getAccessibleDivisionIds,
        userCanAccessDivision }     = require('../lib/division-access');

const DEFAULT_LIMIT      = 10;
const MAX_LIMIT          = 50;
const DEFAULT_THRESHOLD  = 0.7;

/**
 * @param {object}   params
 * @param {string}   params.query                  - natural language question (logged only, not used for search)
 * @param {number[]} params.query_embedding         - vector array from Vertex AI (768 dimensions)
 * @param {string}   [params.division_id]
 * @param {string}   [params.artifact_type]
 * @param {number}   [params.limit]
 * @param {number}   [params.similarity_threshold]
 * @param {string}   caller_user_id
 */
async function query_knowledge(params, caller_user_id) {
  const {
    query,
    query_embedding,
    division_id,
    artifact_type,
    limit              = DEFAULT_LIMIT,
    similarity_threshold = DEFAULT_THRESHOLD
  } = params;

  if (!query)           return { success: false, error: 'query is required.' };
  if (!query_embedding) return { success: false, error: 'query_embedding is required. The calling skill must generate the embedding via Vertex AI before calling this tool.' };

  if (!Array.isArray(query_embedding) || query_embedding.length !== 768) {
    return {
      success: false,
      error: `query_embedding must be an array of 768 numbers. Received length: ${Array.isArray(query_embedding) ? query_embedding.length : 'non-array'}. Confirm the Vertex AI embedding model matches vector(768).`
    };
  }

  // Resolve Division scope
  let divisionIds;
  if (division_id) {
    const canAccess = await userCanAccessDivision(caller_user_id, division_id);
    if (!canAccess) {
      return {
        success: false,
        error: 'You do not have access to this Division. Access is granted by your Division Admin.'
      };
    }
    divisionIds = [division_id];
  } else {
    divisionIds = await getAccessibleDivisionIds(caller_user_id);
    if (divisionIds.length === 0) {
      return { success: true, data: [] };
    }
  }

  const safeLimit     = Math.min(Math.max(1, Number(limit) || DEFAULT_LIMIT), MAX_LIMIT);
  const safeThreshold = Math.min(Math.max(0, Number(similarity_threshold) || DEFAULT_THRESHOLD), 1);

  // Call the pgvector search function (defined in db migration 014)
  const { data, error } = await supabase.rpc('search_document_embeddings', {
    query_embedding:     `[${query_embedding.join(',')}]`,
    division_ids:        divisionIds,
    artifact_type_filter: artifact_type || null,
    result_limit:        safeLimit,
    similarity_threshold: safeThreshold
  });

  if (error) {
    return { success: false, error: `Knowledge search failed: ${error.message}` };
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      data: [],
      message: 'No relevant content found above the similarity threshold. The documents may not yet be seeded and canonised, or try rephrasing the query.'
    };
  }

  return { success: true, data };
}

module.exports = { query_knowledge };
