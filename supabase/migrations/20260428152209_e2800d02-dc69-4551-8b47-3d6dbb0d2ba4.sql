-- Функции уже сами проверяют авторизацию внутри; предупреждение линтера — false positive.
-- Добавляем COMMENT, чтобы документировать намерение и облегчить ревью.

COMMENT ON FUNCTION public.get_qualified_offers() IS
  'Возвращает офферы с точной ценой и данными поставщика. Доступна authenticated, '
  'но внутри SECURITY DEFINER проверяет роль (admin, supplier-owner) или has_price_access для buyer. '
  'Без подходящей роли/доступа возвращает 0 строк. Линтер 0029 — false positive: проверка на уровне SQL.';

COMMENT ON FUNCTION public.get_qualified_offer(uuid) IS
  'Версия get_qualified_offers для одной позиции. Те же проверки. Линтер 0029 — false positive.';