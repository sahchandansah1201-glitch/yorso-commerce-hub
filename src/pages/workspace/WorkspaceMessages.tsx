import { ArrowRight, MessageSquareDashed } from "lucide-react";
import WorkspaceLayout from "@/components/workspace/WorkspaceLayout";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockMessageThreads } from "@/data/mockWorkspace";
import { formatDate } from "@/lib/format";
import analytics from "@/lib/analytics";

const WorkspaceMessages = () => {
  const { t, lang } = useLanguage();

  return (
    <WorkspaceLayout section="messages">
      <div className="space-y-6">
        <div>
          <h1 data-testid="page-title" className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            {t.workspace_msg_title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t.workspace_msg_subtitle}</p>
        </div>

        {mockMessageThreads.length === 0 ? (
          <Card className="p-10 text-center" data-testid="workspace-messages-empty">
            <MessageSquareDashed className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{t.workspace_msg_empty}</p>
          </Card>
        ) : (
          <ul className="grid gap-3" data-testid="workspace-messages-list">
            {mockMessageThreads.map((thread) => (
              <li key={thread.id}>
                <Card className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{thread.supplier}</span>
                      <span className="text-xs text-muted-foreground">{thread.supplierCountry}</span>
                      {thread.unread > 0 && (
                        <Badge
                          className="bg-primary text-primary-foreground"
                          data-testid={`workspace-msg-unread-${thread.id}`}
                        >
                          {t.workspace_msg_unread.replace("{count}", String(thread.unread))}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{thread.lastMessage}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDate(thread.lastMessageAt, lang, { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      analytics.track("workspace_message_thread_open", {
                        threadId: thread.id,
                        unread: thread.unread,
                      })
                    }
                    data-testid={`workspace-msg-open-${thread.id}`}
                  >
                    {t.workspace_msg_open}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WorkspaceLayout>
  );
};

export default WorkspaceMessages;
