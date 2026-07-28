function filterCollectionsByQuery(collections, query = '') {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return collections;
  return collections.filter(collection => {
    const haystack = [collection.name, collection.description, ...(collection.problemIds || [])].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
}

function filterCollections(collections, filters = {}) {
  let result = [...collections];
  const problemMap = new Map((filters.problems || []).map(problem => [String(problem.id), problem]));
  const completedIds = new Set((filters.completedProblems || []).map(String));

  if (filters.topic) {
    result = result.filter(collection => {
      const problemIds = collection.problemIds || [];
      return problemIds.some(id => {
        const problem = problemMap.get(String(id));
        return problem?.category?.toLowerCase() === filters.topic.toLowerCase();
      });
    });
  }
  if (filters.solved) {
    result = result.filter(collection =>
      (collection.problemIds || []).some(id => completedIds.has(String(id)))
    );
  }
  if (filters.unsolved) {
    result = result.filter(collection =>
      (collection.problemIds || []).some(id => !completedIds.has(String(id)))
    );
  }
  if (filters.recentlyAdded) {
    result = result.filter(collection => collection.updatedAt);
  }
  return result;
}
export { filterCollectionsByQuery, filterCollections };
