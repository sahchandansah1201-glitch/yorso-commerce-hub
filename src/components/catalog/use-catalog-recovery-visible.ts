import { useAccessLevel } from "@/lib/access-level";

/**
 * Возвращает `true`, если recovery-блоки каталога должны быть видимы
 * текущему посетителю. Используйте этот хук в любом компоненте,
 * который показывает CTA «зарегистрируйтесь / войдите, чтобы получить
 * больше от каталога».
 */
export const useCatalogRecoveryVisible = (): boolean => {
  const { level, isSignedIn } = useAccessLevel();
  if (isSignedIn) return false;
  return level === "anonymous_locked";
};
