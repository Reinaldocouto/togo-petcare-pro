import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function Produtos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Produtos</h1>
        <p className="text-muted-foreground">Estoque e controle</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestão de Estoque</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
