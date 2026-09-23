'use client';

import { useCallback, useState } from 'react';

/**
 * A version-agnostic stand-in for React 19's `useActionState`, built on
 * plain `useState` (stable in React 18). Works with any Next.js Server
 * Action of the shape `(prevState, formData) => Promise<State>`.
 *
 * Unlike the native hook, the returned `dispatch` is NOT meant to be passed
 * directly to a <form action={...}> prop (that wiring is React 19-specific).
 * Instead, call it from a plain onSubmit handler:
 *
 *   const [state, dispatch, pending] = useActionState(myAction, initial);
 *   <form onSubmit={(e) => { e.preventDefault(); dispatch(new FormData(e.currentTarget)); }}>
 *
 * Critically, this always resolves the pending state and always reports a
 * failure to the caller — if the action throws (a thrown error inside the
 * Server Action, a network failure, anything), that's caught and merged
 * into the returned state as `error`, rather than being swallowed as an
 * unhandled promise rejection that leaves the UI stuck with no feedback.
 * `State` is expected to be a plain object shape (all of this project's
 * ActionState types are), since the error is merged in via spread.
 */
export function useActionState<State>(
  action: (state: State, formData: FormData) => Promise<State>,
  initialState: State
): [State, (formData: FormData) => void, boolean] {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);

  const dispatch = useCallback(
    (formData: FormData) => {
      setIsPending(true);
      action(state, formData)
        .then((result) => {
          setState(result);
        })
        .catch((err: unknown) => {
          // eslint-disable-next-line no-console
          console.error('Action failed:', err);
          const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
          setState((prev) => ({ ...(prev as object), error: message } as State));
        })
        .finally(() => {
          setIsPending(false);
        });
    },
    [action, state]
  );

  return [state, dispatch, isPending];
}