import { type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  /** Reserved for future inline edit. Kept for backward compatibility. */
  editable?: boolean;
  testId?: string;
}

export const AccountSectionCard = ({ title, description, children, testId }: Props) => {
  return (
    <Card data-testid={testId}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="text-sm text-foreground">{children}</CardContent>
    </Card>
  );
};

export default AccountSectionCard;
