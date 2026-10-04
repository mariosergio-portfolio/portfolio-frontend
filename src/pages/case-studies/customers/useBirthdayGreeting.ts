import { useState } from 'react';
import {
  greetingUrl,
  idleState,
  postJson,
  type BirthdayGreetingResponse,
  type RequestState,
} from './api';

/**
 * State and request for one customer's birthday greeting.
 * The button and the result row live in different <tr> elements, so the table row owns this hook.
 */
export function useBirthdayGreeting(customerPk: string) {
  const [state, setState] = useState<RequestState<BirthdayGreetingResponse>>(idleState());
  const [open, setOpen] = useState(false);

  async function run() {
    setOpen(true);
    setState({ ...idleState<BirthdayGreetingResponse>(), loading: true });
    setState(await postJson<BirthdayGreetingResponse>(greetingUrl(customerPk)));
  }

  return {
    state,
    open,
    run,
    close: () => {
      setOpen(false);
    },
  };
}
