"use client";

import { useActionState, useTransition, type FormEvent } from "react";

export interface FormState {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
}

/**
 * React 19'da <form action={fn}> başarılı/başarısız her gönderimden sonra formu sıfırlar;
 * doğrulama hatasında kullanıcının girdisi kaybolur. Bu hook useActionState'i onSubmit +
 * startTransition ile çağırır, böylece form kontrolsüz bileşenlerde bile değerler korunur.
 */
export function useFormAction(action: (prev: FormState, data: FormData) => Promise<FormState>, initial: FormState = {}) {
  const [state, dispatch, actionPending] = useActionState<FormState, FormData>(action, initial);
  const [transitionPending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };

  return { state, onSubmit, pending: actionPending || transitionPending };
}
