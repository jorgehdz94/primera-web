import { router, type Href } from 'expo-router';

/** Regresa a la pantalla anterior; si no hay (p. ej. se abrió desde una notificación), va a `fallback`. */
export function goBack(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
