import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function Vacinas() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vacinas</h1>
        <p className="text-muted-foreground">Controle vacinal</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Vacinas</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
