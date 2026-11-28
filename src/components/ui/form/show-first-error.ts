/**
 * After a refused submit, bring what refused it into view.
 *
 * For forms that keep their errors in plain state (react-hook-form forms have
 * `ErrorSummary` and `setFocus`). Focuses the first field marked
 * `aria-invalid`, which scrolls it into view; with none, scrolls the first
 * alert (an `AlertBanner` with the form's own message) into view. Without it a
 * submit button below the fold — a long page, a scrolled dialog, a phone with
 * the keyboard up — showed no change at all. Waits two frames, so the errors
 * set in the same handler have rendered.
 */
export function showFirstError(getRoot: () => HTMLElement | null): void {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const root = getRoot();
      if (!root) return;
      const field = root.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (field) {
        field.focus();
        field.scrollIntoView({ block: "center" });
        return;
      }
      root.querySelector<HTMLElement>('[role="alert"]')?.scrollIntoView({ block: "center" });
    }),
  );
}
