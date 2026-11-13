/**
 * A load's state as one value instead of independent loading/error/data
 * flags, which can contradict each other (not loading, no error, no data
 * still has to mean something).
 */
type AsyncStatus = "loading" | "error" | "empty" | "success";

/** An `AsyncStatus` from a hook's existing loading, error and data. */
const getAsyncStatus = <T,>(
  loading: boolean,
  error: string | null | undefined,
  data: T,
  isEmpty: (data: T) => boolean
): AsyncStatus => {
  if (loading) return "loading";
  if (error) return "error";
  if (isEmpty(data)) return "empty";
  return "success";
};

export { getAsyncStatus };
export type { AsyncStatus };
