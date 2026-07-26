export function validateInterviewExperiencePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, error: 'Request body must be an object.' };
  }

  const { company, role, difficulty, rating, title, content, topics } = payload;

  if (
    typeof company !== 'string' || company.trim() === '' ||
    typeof role !== 'string' || role.trim() === '' ||
    !difficulty || !rating ||
    typeof title !== 'string' || title.trim() === '' ||
    typeof content !== 'string' || content.trim() === ''
  ) {
    return {
      isValid: false,
      error: 'Company, role, difficulty, rating, title, and content are required.',
    };
  }

  let normalizedTopics = [];
  if (topics !== undefined && topics !== null) {
    if (!Array.isArray(topics)) {
      return {
        isValid: false,
        error: '`topics` must be an array of strings when provided.',
      };
    }
    for (let i = 0; i < topics.length; i += 1) {
      const entry = topics[i];
      if (typeof entry !== 'string') {
        return {
          isValid: false,
          error: `topics[${i}] must be a string; received ${entry === null ? 'null' : typeof entry}.`,
        };
      }
      const trimmed = entry.trim();
      if (trimmed === '') {
        return {
          isValid: false,
          error: `topics[${i}] must be a non-empty string.`,
        };
      }
      normalizedTopics.push(trimmed);
    }
  }

  return {
    isValid: true,
    normalizedTopics,
  };
}
