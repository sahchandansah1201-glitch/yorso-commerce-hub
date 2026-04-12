import { Ship, Package, Thermometer, Clock, FileText, Info } from "lucide-react";

interface Props {
  logistics: {
    incoterm: string;
    incotermExplain: string;
    shipmentOrigin: string;
    port: string;
    packaging: string;
    storage: string;
    moqLogic: string;
    leadTime: string;
    exportDocs: string;
  };
}

export const SupplyLogistics = ({ logistics }: Props) => (
  <section>
    <h2 className="font-heading text-xl font-bold text-foreground mb-4">Supply & Logistics</h2>
    <div className="space-y-4">
      <LogRow icon={Ship} label="Incoterm" value={logistics.incoterm} note={logistics.incotermExplain} />
      <LogRow icon={Info} label="Shipment Origin" value={logistics.shipmentOrigin} />
      <LogRow icon={Info} label="Port" value={logistics.port} />
      <LogRow icon={Package} label="Packaging" value={logistics.packaging} />
      <LogRow icon={Thermometer} label="Storage" value={logistics.storage} />
      <LogRow icon={Package} label="MOQ" value={logistics.moqLogic} />
      <LogRow icon={Clock} label="Lead Time" value={logistics.leadTime} />
      <LogRow icon={FileText} label="Export Documents" value={logistics.exportDocs} />
    </div>
  </section>
);

const LogRow = ({ icon: Icon, label, value, note }: { icon: React.ElementType; label: string; value: string; note?: string }) => (
  <div className="flex gap-3">
    <Icon className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
    <div>
      <p className="text-sm">
        <span className="font-medium text-foreground">{label}:</span>{" "}
        <span className="text-muted-foreground">{value}</span>
      </p>
      {note && <p className="mt-1 text-xs text-muted-foreground/70">{note}</p>}
    </div>
  </div>
);
