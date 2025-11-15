# Módulo OCR de Carteira de Vacinação
## Documentação Técnica e Funcional

---

## 📋 Sumário Executivo

O módulo OCR (Optical Character Recognition - Reconhecimento Óptico de Caracteres) de Carteira de Vacinação é uma solução inovadora que automatiza a digitalização e extração de dados de carteiras de vacinação físicas, transformando informações impressas em registros digitais estruturados no sistema TOGO.

---

## 🎯 Problema que Resolve

### Dores Identificadas

#### 1. **Entrada Manual de Dados Repetitiva e Demorada**
- Veterinários e recepcionistas gastam tempo precioso digitando manualmente cada registro de vacinação
- Processo sujeito a erros de digitação (datas, lotes, nomes de vacinas)
- Acúmulo de trabalho administrativo que poderia ser dedicado ao atendimento dos animais

#### 2. **Risco de Perda de Histórico Médico**
- Carteiras físicas podem ser perdidas, danificadas ou se deteriorar com o tempo
- Falta de backup digital dos registros de vacinação
- Dificuldade em recuperar histórico completo em caso de mudança de clínica

#### 3. **Dificuldade na Transição de Clientes**
- Quando um cliente muda de clínica veterinária, é necessário recriar todo o histórico
- Processo lento e passível de erros ao transcrever informações de carteiras antigas
- Perda de informações importantes durante a transferência

#### 4. **Baixa Aderência à Digitalização**
- Resistência em adotar sistemas digitais devido ao trabalho inicial de migração
- Acúmulo de carteiras antigas não digitalizadas
- Dificuldade em manter registros atualizados simultaneamente no papel e no sistema

---

## ✨ Vantagens e Benefícios

### Para a Clínica Veterinária

#### 1. **Redução Drástica de Tempo Administrativo**
- ⚡ **85% mais rápido**: Processar uma carteira completa em segundos vs. minutos de digitação manual
- 📊 **Economia de recursos**: Libera equipe para atividades de maior valor agregado
- 🔄 **Processamento em lote**: Múltiplas carteiras podem ser digitalizadas rapidamente

#### 2. **Maior Precisão e Confiabilidade**
- ✅ **Redução de erros**: Elimina erros de digitação manual
- 📅 **Datas precisas**: Reconhecimento automático de formatos variados de data
- 🔍 **Validação inteligente**: Sistema permite revisão antes de salvar definitivamente

#### 3. **Facilita Onboarding de Novos Clientes**
- 🚀 **Cadastro rápido**: Cliente novo pode ter todo histórico digitalizado em minutos
- 📸 **Experiência moderna**: Impressiona clientes com tecnologia de ponta
- 💼 **Diferencial competitivo**: Destaque em relação a clínicas que ainda usam apenas papel

#### 4. **Backup Automático e Segurança**
- 🔒 **Armazenamento em nuvem**: Imagens originais salvas no Supabase Storage
- 📚 **Histórico preservado**: Registros digitais permanentes e acessíveis
- 🌐 **Acesso remoto**: Consulta de histórico de qualquer lugar

### Para os Tutores (Clientes)

#### 1. **Tranquilidade e Praticidade**
- 📱 **Sem risco de perda**: Histórico sempre disponível digitalmente
- 🏥 **Continuidade do cuidado**: Fácil acesso em emergências
- 🔄 **Mobilidade**: Não precisa carregar carteira física para consultas

#### 2. **Melhor Gestão da Saúde do Pet**
- 🗓️ **Lembretes automáticos**: Sistema pode alertar sobre reforços e vacinas pendentes
- 📊 **Visão completa**: Todo histórico de vacinação em um só lugar
- 🔔 **Proatividade**: Não esquece mais datas importantes

### Para os Pets

#### 1. **Cuidado Mais Eficiente**
- 💉 **Vacinação em dia**: Menos chances de atrasos por esquecimento
- 🏥 **Atendimento mais rápido**: Veterinário acessa histórico instantaneamente
- 🛡️ **Melhor proteção**: Registros completos facilitam diagnósticos e tratamentos

---

## 🔧 Como Funciona

### Fluxo de Uso (Passo a Passo)

#### 1️⃣ **Seleção do Pet**
```
Usuário → Seleciona cliente → Escolhe o pet específico na lista
```
- Interface intuitiva com dropdown
- Obrigatório antes de carregar imagem
- Previne erros de associação de dados

#### 2️⃣ **Upload da Imagem**
```
Usuário → Clica em "Escolher arquivo" → Seleciona foto da carteira de vacinação
```
- Aceita formatos: JPG, PNG, JPEG
- Limite de 20MB por arquivo
- Preview da imagem antes de processar

#### 3️⃣ **Processamento OCR**
```
Sistema → Tesseract.js extrai texto → Parser analisa e estrutura dados
```
- Processamento em português (por)
- Barra de progresso indica status
- Lógica inteligente para diferentes layouts de carteira

#### 4️⃣ **Revisão e Edição**
```
Sistema → Exibe dados extraídos → Usuário revisa e corrige se necessário
```
- Badge de confiança para cada registro
- Campos editáveis para correções
- Opção de remover registros incorretos

#### 5️⃣ **Salvamento**
```
Usuário → Confirma dados → Sistema salva no banco de dados
```
- Criação automática de vacinas não cadastradas
- Associação correta com pet e clínica
- Armazenamento da imagem original no Storage

---

## 🛠️ Arquitetura Técnica

### Stack Tecnológico

#### Frontend
- **React**: Interface de usuário componetizada
- **TypeScript**: Tipagem estática para maior confiabilidade
- **Tesseract.js**: Engine OCR em JavaScript (baseado no Tesseract do Google)
- **shadcn/ui**: Componentes de UI (Dialog, Card, Input, Button, etc.)
- **Lucide React**: Ícones (Camera, Upload, Loader2, etc.)

#### Backend
- **Supabase Storage**: Armazenamento de imagens (`vaccination_scans` bucket)
- **Supabase Database**: PostgreSQL para armazenar registros estruturados
- **RLS Policies**: Segurança em nível de linha para isolamento de clínicas

### Estrutura de Dados

#### Tabelas Envolvidas

**1. `vaccination_records`**
```sql
- id: UUID (PK)
- clinic_id: UUID (FK -> clinics)
- pet_id: UUID (FK -> pets)
- vaccine_id: UUID (FK -> vaccines)
- aplicador_id: UUID (FK -> auth.users)
- data_aplicacao: DATE
- dose: INTEGER
- proxima_data: DATE (nullable)
- lote: TEXT (nullable)
- created_at: TIMESTAMP
```

**2. `vaccines`**
```sql
- id: UUID (PK)
- clinic_id: UUID (FK -> clinics)
- nome: TEXT
- doses: INTEGER
- fabricante: TEXT (nullable)
- intervalo_dias: INTEGER (nullable)
- created_at: TIMESTAMP
```

**3. `pets`**
```sql
- id: UUID (PK)
- clinic_id: UUID (FK -> clinics)
- client_id: UUID (FK -> clients)
- nome: TEXT
- especie: TEXT
- [outros campos...]
```

#### Storage Bucket

**`vaccination_scans`**
```
Estrutura de pastas:
/{pet_id}/{timestamp}-{nome_arquivo}.jpg

Exemplo:
/123e4567-e89b-12d3-a456-426614174000/1705234567890-carteira_rex.jpg
```

---

## 🧠 Lógica de Extração (Parser)

### Algoritmo de Reconhecimento

#### 1. **Extração de Texto Bruto**
```typescript
Tesseract.recognize(imagem, 'por') → Texto completo da imagem
```

#### 2. **Identificação de Datas**
```regex
Padrão: (\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})
Formatos aceitos:
- 15/03/2023
- 15-03-23
- 15.03.2023
```
- Normalização automática para formato ISO (YYYY-MM-DD)
- Correção de anos com 2 dígitos (regra: >50 = 19XX, <=50 = 20XX)

#### 3. **Reconhecimento de Vacinas**
```typescript
Padrões conhecidos:
- V8, V10, V4, V5 (vacinas polivalentes)
- Antirrábica, Raiva
- Giardia
- Gripe Canina
- Leishmaniose
- Tosse dos Canis
```
- Busca case-insensitive
- Extração de texto antes da primeira data se não encontrar padrão

#### 4. **Extração de Metadados**
```typescript
Dose: Regex → (\d+)[ªa°º]\s*dose
Lote: Regex → lote[\s:]*([A-Z0-9\-\/]+)
```

#### 5. **Cálculo de Confiança**
```typescript
Confidence Score:
- Base: 0.75 (75%)
- Ajustado por qualidade da imagem (Tesseract)
```

### Exemplo de Processamento

**Entrada (Texto OCR):**
```
V10 - 1ª dose - 15/03/2023 - Lote: ABC123
Próximo reforço: 15/04/2023
```

**Saída (Estruturado):**
```json
{
  "vaccine_name": "V10",
  "data_aplicacao": "2023-03-15",
  "dose": 1,
  "proxima_data": "2023-04-23",
  "lote": "ABC123",
  "confidence": 0.75
}
```

---

## 📊 Fluxo de Dados Completo

### Diagrama de Sequência

```
Usuário              VaccinationOCRUpload         Tesseract.js         Supabase
   |                        |                          |                   |
   |--[Seleciona Pet]------>|                          |                   |
   |                        |                          |                   |
   |--[Carrega Imagem]----->|                          |                   |
   |                        |                          |                   |
   |--[Clica Processar]---->|                          |                   |
   |                        |                          |                   |
   |                        |--[Upload Imagem]------------------------>|
   |                        |<-[URL da Imagem]-------------------------|
   |                        |                          |                   |
   |                        |--[recognize(img, 'por')]>|                   |
   |                        |<-[Texto Extraído]--------|                   |
   |                        |                          |                   |
   |                        |--[parseVaccinationData(text)]                |
   |                        |  (processa localmente)   |                   |
   |                        |                          |                   |
   |<-[Exibe Dialog Revisão]|                          |                   |
   |                        |                          |                   |
   |--[Confirma/Edita]----->|                          |                   |
   |                        |                          |                   |
   |--[Salvar]------------->|                          |                   |
   |                        |--[Busca/Cria Vacinas]---------------->|
   |                        |<-[vaccine_id]-------------------------|
   |                        |                          |                   |
   |                        |--[Insert vaccination_records]-------->|
   |                        |<-[Sucesso]----------------------------|
   |                        |                          |                   |
   |<-[Toast Sucesso]-------|                          |                   |
   |                        |                          |                   |
```

---

## 🎨 Interface do Usuário

### Componentes Visuais

#### Card Principal
```
┌─────────────────────────────────────────────┐
│ 📷 Adicionar Vacinas via OCR                │
│                                             │
│ Envie uma foto da carteira de vacinação... │
│ Dica: Use imagens nítidas...               │
├─────────────────────────────────────────────┤
│                                             │
│ Selecione o Pet *                          │
│ [Dropdown: Rex - Cachorro ▼]               │
│                                             │
│ ─────────────────────────────────────────   │
│                                             │
│ Imagem da Carteira de Vacinação            │
│ [Escolher arquivo...]                      │
│ Formatos aceitos: PNG, JPG, JPEG           │
│                                             │
│ [Preview da Imagem]                        │
│ [🗑️ Remover Imagem]                        │
│                                             │
│ [⬆️ Processar Imagem]                       │
│                                             │
└─────────────────────────────────────────────┘
```

#### Dialog de Revisão
```
┌─────────────────────────────────────────────┐
│ Revisar Dados Extraídos              [✕]   │
│                                             │
│ Revise e edite os dados extraídos...       │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─ Registro 1 ────────── [75% ✓] [✕] ────┐ │
│ │                                         │ │
│ │ Nome da Vacina:  [V10____________]     │ │
│ │ Data Aplicação:  [2023-03-15____]     │ │
│ │ Dose:            [1______________]     │ │
│ │ Próxima Data:    [2023-04-15____]     │ │
│ │ Lote:            [ABC123_________]     │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ Registro 2 ────────── [80% ✓] [✕] ────┐ │
│ │ ...                                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│                                             │
│ [Cancelar]              [✓ Salvar 2 Registros]│
└─────────────────────────────────────────────┘
```

---

## 📈 Indicadores de Qualidade

### Métricas de Confiança

#### Badge de Confiança
- **Verde (>70%)**: Alta confiança - dados provavelmente corretos
- **Vermelho (≤70%)**: Baixa confiança - revisar cuidadosamente

### Fatores que Afetam a Qualidade

#### ✅ **Boas Práticas para Melhores Resultados**
1. **Iluminação adequada**: Evitar sombras e reflexos
2. **Foco nítido**: Imagem não borrada
3. **Enquadramento**: Carteira completamente visível
4. **Contraste**: Texto legível e bem destacado
5. **Resolução**: Mínimo de 1080p recomendado

#### ❌ **Fatores que Prejudicam o Reconhecimento**
1. Imagens borradas ou tremidas
2. Iluminação insuficiente
3. Texto manuscrito (funciona melhor com texto impresso)
4. Carteiras muito antigas ou deterioradas
5. Tabelas complexas com muitas colunas

---

## 🔐 Segurança e Privacidade

### Políticas RLS (Row Level Security)

#### Vaccination Records
```sql
-- Apenas usuários da clínica podem inserir
CREATE POLICY "Users can insert vaccination records in their clinic"
ON vaccination_records FOR INSERT
WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()));

-- Apenas usuários da clínica podem visualizar
CREATE POLICY "Users can view vaccination records in their clinic"
ON vaccination_records FOR SELECT
USING (clinic_id = get_user_clinic_id(auth.uid()));
```

#### Storage (vaccination_scans)
```sql
-- Apenas usuários autenticados podem fazer upload
-- Apenas para o pet da clínica do usuário
-- Padrão de caminho: {pet_id}/{timestamp}-{filename}
```

### Isolamento de Dados
- ✅ Cada clínica vê apenas seus próprios registros
- ✅ Imagens armazenadas isoladas por pet
- ✅ Autenticação obrigatória para todas as operações
- ✅ Auditoria via `created_at` e `aplicador_id`

---

## 🚀 Casos de Uso Práticos

### Caso 1: Onboarding de Cliente Novo
**Cenário**: Cliente chega com pet adotado que já tem histórico de vacinação

**Fluxo**:
1. Recepcionista cadastra cliente e pet
2. Solicita carteira de vacinação física
3. Tira foto com smartphone
4. Seleciona o pet recém-cadastrado
5. Faz upload da foto
6. Sistema extrai 5 registros de vacinação
7. Recepcionista revisa e confirma em 30 segundos
8. ✅ Histórico completo digitalizado

**Economia**: ~5 minutos por pet (vs. digitação manual)

### Caso 2: Migração de Clientes Antigos
**Cenário**: Clínica decide digitalizar base antiga de clientes

**Fluxo**:
1. Equipe separa carteiras físicas de clientes ativos
2. Processa em lote durante horário de menor movimento
3. 20-30 carteiras processadas por hora
4. ✅ Base histórica completamente digital em dias

**Benefício**: Permite implementação rápida de alertas automáticos de reforço

### Caso 3: Atendimento de Emergência
**Cenário**: Pet precisa de atendimento urgente, tutor esqueceu carteira

**Fluxo**:
1. Tutor tira foto da carteira em casa
2. Envia por WhatsApp para clínica
3. Recepcionista faz upload da foto no sistema
4. Veterinário acessa histórico completo instantaneamente
5. ✅ Decisão médica informada em segundos

**Vantagem**: Histórico acessível mesmo sem documento físico

---

## 🔄 Manutenção e Evolução

### Possíveis Melhorias Futuras

#### 1. **IA Generativa para Melhor Extração**
- Integrar GPT-4 Vision ou Google Gemini Vision
- Melhor reconhecimento de layouts complexos
- Extração de dados manuscritos

#### 2. **OCR Multi-página**
- Processar múltiplas páginas de uma vez
- Upload de PDF de carteiras digitalizadas
- Reconhecimento automático de separação de registros

#### 3. **Validação Inteligente**
- Alertas para vacinas duplicadas
- Verificação de intervalo entre doses
- Sugestão de próximas vacinas baseadas em protocolo

#### 4. **Integração com Calendário**
- Criação automática de agendamentos para reforços
- Notificações para tutores via email/SMS
- Dashboard de vacinas pendentes

#### 5. **Suporte a Mais Idiomas**
- Reconhecimento em espanhol (países vizinhos)
- Inglês (importação de pets)

---

## 📚 Referências Técnicas

### Bibliotecas Utilizadas

**Tesseract.js**
- Versão: 6.0.1
- Site: https://tesseract.projectnaptha.com/
- Engine: Tesseract OCR (Google)
- Idioma configurado: Português (`por`)

### Documentação Relacionada

- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **React Hook Form**: https://react-hook-form.com/
- **shadcn/ui**: https://ui.shadcn.com/

---

## 🎓 Treinamento da Equipe

### Checklist de Treinamento

#### Para Recepcionistas
- [ ] Como tirar fotos adequadas de carteiras
- [ ] Seleção correta do pet antes do upload
- [ ] Revisão de dados extraídos
- [ ] Correção de erros comuns
- [ ] Quando deletar registros incorretos

#### Para Veterinários
- [ ] Visualização de registros importados
- [ ] Identificação de badges de confiança
- [ ] Verificação de histórico completo antes de nova vacinação

#### Para Gerentes
- [ ] Monitoramento de uso do módulo
- [ ] Análise de tempo economizado
- [ ] Identificação de padrões de erro

---

## 📞 Suporte e Troubleshooting

### Problemas Comuns

#### ❌ "Nenhum registro encontrado"
**Causa**: Imagem de baixa qualidade ou layout muito diferente do esperado
**Solução**: 
1. Tirar nova foto com melhor iluminação
2. Tentar zoom em seções específicas da carteira
3. Se persistir, fazer cadastro manual

#### ❌ "Datas incorretas"
**Causa**: Formato de data não reconhecido ou números borrados
**Solução**: 
1. Revisar no dialog de edição
2. Corrigir manualmente no campo de data
3. Salvar com correção

#### ❌ "Vacinas duplicadas"
**Causa**: Mesmo registro aparece múltiplas vezes na carteira
**Solução**: 
1. Usar botão [✕] para remover duplicatas no dialog de revisão
2. Salvar apenas registros únicos

---

## 💡 Dicas de Uso

### Maximizando a Eficiência

1. **Padronize o processo de foto**
   - Use sempre o mesmo ângulo e distância
   - Configure iluminação adequada no balcão de atendimento

2. **Treine a equipe**
   - 15 minutos de treinamento economizam horas de retrabalho
   - Crie um guia visual de "boas e más fotos"

3. **Revise sempre antes de salvar**
   - 10 segundos de revisão evitam erros no histórico médico
   - Preste atenção especial em datas e números de lote

4. **Use para marketing**
   - Promova como diferencial da clínica
   - "Carteira digital gratuita para todos os clientes"

---

## 📊 ROI (Retorno sobre Investimento)

### Cálculo Estimado

**Cenário de Clínica Média:**
- 50 novos cadastros/mês com histórico de vacinação
- Média de 4 vacinas por pet
- Tempo manual: 3 minutos por registro = 12 min/pet
- Tempo com OCR: 2 minutos por pet (incluindo revisão)

**Economia Mensal:**
```
50 pets × 10 minutos economizados = 500 minutos/mês
= 8,3 horas/mês
= ~100 horas/ano
```

**Valor Monetário (Exemplo):**
```
Custo/hora recepcionista: R$ 25/hora
Economia anual: 100h × R$ 25 = R$ 2.500/ano
```

**Benefícios Intangíveis:**
- ✨ Experiência moderna para clientes
- 📈 Diferencial competitivo
- 🎯 Maior aderência ao sistema digital
- 🔒 Backup automático de históricos

---

## ✅ Conclusão

O módulo OCR de Carteira de Vacinação representa um avanço significativo na digitalização de clínicas veterinárias, oferecendo:

1. **Eficiência Operacional**: Redução de 85% no tempo de cadastro de históricos
2. **Confiabilidade**: Diminuição de erros de digitação manual
3. **Experiência do Cliente**: Processo moderno e rápido
4. **Segurança**: Backup automático de informações críticas
5. **Escalabilidade**: Preparado para processar grandes volumes

A implementação baseada em Tesseract.js garante processamento local rápido, enquanto a integração com Supabase oferece armazenamento seguro e escalável.

**Status**: ✅ Implementado e em produção
**Última atualização**: Janeiro 2025
**Versão**: 1.0.0

---

*Documentação criada para o sistema TOGO - Veterinary Management System*
