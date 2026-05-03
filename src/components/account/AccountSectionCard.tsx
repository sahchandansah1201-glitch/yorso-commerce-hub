import { type ReactNode } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  editable?: boolean;
  testId?: string;
}

export const AccountSectionCard = ({ title, description, children, editable = true, testId }: Props) => {
  const { t } = useLanguage();
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {editable ? (
          <Button size="sm" variant="outline" disabled aria-disabled className="text-xs">
            {t.account_editPlaceholder}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="text-sm text-foreground">{children}</CardContent>
    </Card>
  );
};

export default AccountSectionCard;
