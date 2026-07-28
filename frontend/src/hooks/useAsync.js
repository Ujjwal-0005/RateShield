import { useState, useCallback } from 'react';

/**
 * Generic async data fetcher hook.
 * Usage:
 *   const { data, loading, error, execute } = useAsync(policyService.getAll);
 */
export function useAsync(asyncFn, immediate = false, initialArgs = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError]     = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      setData(result.data?.data ?? result.data ?? result);
      return result;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  return { data, loading, error, execute, setData };
}
