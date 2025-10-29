import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function Financeiro() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Controle financeiro</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
