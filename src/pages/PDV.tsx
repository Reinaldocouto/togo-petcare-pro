import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function PDV() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">PDV</h1>
        <p className="text-muted-foreground">Ponto de Venda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Caixa</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
