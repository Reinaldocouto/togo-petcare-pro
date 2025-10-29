import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Análises e exportações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relatórios Gerenciais</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
