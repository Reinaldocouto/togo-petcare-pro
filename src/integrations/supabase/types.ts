export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          client_id: string
          clinic_id: string
          created_at: string
          fim: string
          id: string
          inicio: string
          location_id: string
          notas: string | null
          pet_id: string
          profissional_id: string | null
          service_type_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          clinic_id: string
          created_at?: string
          fim: string
          id?: string
          inicio: string
          location_id: string
          notas?: string | null
          pet_id: string
          profissional_id?: string | null
          service_type_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          clinic_id?: string
          created_at?: string
          fim?: string
          id?: string
          inicio?: string
          location_id?: string
          notas?: string | null
          pet_id?: string
          profissional_id?: string | null
          service_type_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          clinic_id: string
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: Json | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          clinic_id: string
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: Json | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: Json | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          cnpj: string | null
          created_at: string
          endereco: Json | null
          fiscal_config: Json | null
          id: string
          ie: string | null
          im: string | null
          municipio_ibge: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          endereco?: Json | null
          fiscal_config?: Json | null
          id?: string
          ie?: string | null
          im?: string | null
          municipio_ibge?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          endereco?: Json | null
          fiscal_config?: Json | null
          id?: string
          ie?: string | null
          im?: string | null
          municipio_ibge?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          clinic_id: string
          created_at: string
          endereco: Json | null
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["location_type"]
        }
        Insert: {
          clinic_id: string
          created_at?: string
          endereco?: Json | null
          id?: string
          nome: string
          tipo?: Database["public"]["Enums"]["location_type"]
        }
        Update: {
          clinic_id?: string
          created_at?: string
          endereco?: Json | null
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["location_type"]
        }
        Relationships: [
          {
            foreignKeyName: "locations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          anexos: Json | null
          appointment_id: string | null
          clinic_id: string
          created_at: string
          id: string
          pet_id: string
          soap: Json
          tipo_atendimento: string
          veterinario_id: string
        }
        Insert: {
          anexos?: Json | null
          appointment_id?: string | null
          clinic_id: string
          created_at?: string
          id?: string
          pet_id: string
          soap?: Json
          tipo_atendimento: string
          veterinario_id: string
        }
        Update: {
          anexos?: Json | null
          appointment_id?: string | null
          clinic_id?: string
          created_at?: string
          id?: string
          pet_id?: string
          soap?: Json
          tipo_atendimento?: string
          veterinario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          metodo: Database["public"]["Enums"]["payment_method"]
          nsu: string | null
          sale_id: string | null
          status: string | null
          valor: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          metodo: Database["public"]["Enums"]["payment_method"]
          nsu?: string | null
          sale_id?: string | null
          status?: string | null
          valor: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          metodo?: Database["public"]["Enums"]["payment_method"]
          nsu?: string | null
          sale_id?: string | null
          status?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          alergias: string | null
          castrado: boolean | null
          client_id: string
          clinic_id: string
          cor: string | null
          created_at: string
          especie: string
          foto_url: string | null
          id: string
          microchip: string | null
          nascimento: string | null
          nome: string
          raca: string | null
          sexo: string | null
          updated_at: string
        }
        Insert: {
          alergias?: string | null
          castrado?: boolean | null
          client_id: string
          clinic_id: string
          cor?: string | null
          created_at?: string
          especie: string
          foto_url?: string | null
          id?: string
          microchip?: string | null
          nascimento?: string | null
          nome: string
          raca?: string | null
          sexo?: string | null
          updated_at?: string
        }
        Update: {
          alergias?: string | null
          castrado?: boolean | null
          client_id?: string
          clinic_id?: string
          cor?: string | null
          created_at?: string
          especie?: string
          foto_url?: string | null
          id?: string
          microchip?: string | null
          nascimento?: string | null
          nome?: string
          raca?: string | null
          sexo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pets_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ativo: boolean | null
          categoria: string | null
          clinic_id: string
          created_at: string
          custo: number | null
          estoque_atual: number | null
          estoque_minimo: number | null
          id: string
          ncm: string | null
          nome: string
          preco_venda: number
          sku: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean | null
          categoria?: string | null
          clinic_id: string
          created_at?: string
          custo?: number | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          ncm?: string | null
          nome: string
          preco_venda?: number
          sku: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string | null
          clinic_id?: string
          created_at?: string
          custo?: number | null
          estoque_atual?: number | null
          estoque_minimo?: number | null
          id?: string
          ncm?: string | null
          nome?: string
          preco_venda?: number
          sku?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          clinic_id: string
          created_at: string
          descricao: string
          id: string
          preco_unitario: number
          product_id: string | null
          quantidade: number
          sale_id: string
          service_type_id: string | null
          tipo: string
          total: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          descricao: string
          id?: string
          preco_unitario: number
          product_id?: string | null
          quantidade?: number
          sale_id: string
          service_type_id?: string | null
          tipo: string
          total: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          descricao?: string
          id?: string
          preco_unitario?: number
          product_id?: string | null
          quantidade?: number
          sale_id?: string
          service_type_id?: string | null
          tipo?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          clinic_id: string
          created_at: string
          created_by: string | null
          desconto: number | null
          id: string
          location_id: string
          status: Database["public"]["Enums"]["sale_status"]
          total_bruto: number
          total_liquido: number
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          desconto?: number | null
          id?: string
          location_id: string
          status?: Database["public"]["Enums"]["sale_status"]
          total_bruto?: number
          total_liquido?: number
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          desconto?: number | null
          id?: string
          location_id?: string
          status?: Database["public"]["Enums"]["sale_status"]
          total_bruto?: number
          total_liquido?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          ativo: boolean | null
          categoria: Database["public"]["Enums"]["service_category"]
          clinic_id: string
          created_at: string
          duracao_minutos: number
          id: string
          nome: string
          preco_base: number
        }
        Insert: {
          ativo?: boolean | null
          categoria: Database["public"]["Enums"]["service_category"]
          clinic_id: string
          created_at?: string
          duracao_minutos?: number
          id?: string
          nome: string
          preco_base?: number
        }
        Update: {
          ativo?: boolean | null
          categoria?: Database["public"]["Enums"]["service_category"]
          clinic_id?: string
          created_at?: string
          duracao_minutos?: number
          id?: string
          nome?: string
          preco_base?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_types_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccination_records: {
        Row: {
          aplicador_id: string | null
          clinic_id: string
          created_at: string
          data_aplicacao: string
          dose: number
          id: string
          lote: string | null
          pet_id: string
          proxima_data: string | null
          vaccine_id: string
        }
        Insert: {
          aplicador_id?: string | null
          clinic_id: string
          created_at?: string
          data_aplicacao: string
          dose: number
          id?: string
          lote?: string | null
          pet_id: string
          proxima_data?: string | null
          vaccine_id: string
        }
        Update: {
          aplicador_id?: string | null
          clinic_id?: string
          created_at?: string
          data_aplicacao?: string
          dose?: number
          id?: string
          lote?: string | null
          pet_id?: string
          proxima_data?: string | null
          vaccine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_records_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccination_records_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccines: {
        Row: {
          clinic_id: string
          created_at: string
          doses: number
          fabricante: string | null
          id: string
          intervalo_dias: number | null
          nome: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          doses?: number
          fabricante?: string | null
          id?: string
          intervalo_dias?: number | null
          nome: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          doses?: number
          fabricante?: string | null
          id?: string
          intervalo_dias?: number | null
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccines_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_clinic_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _clinic_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      seed_mock_data: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "veterinario" | "recepcao" | "groomer" | "financeiro"
      appointment_status:
        | "agendado"
        | "em_andamento"
        | "concluido"
        | "faltou"
        | "cancelado"
      location_type: "matriz" | "filial"
      payment_method: "pix" | "credito" | "debito" | "dinheiro"
      sale_status: "aberta" | "fechada" | "cancelada"
      service_category:
        | "consulta"
        | "cirurgia"
        | "exame"
        | "banho"
        | "tosa"
        | "hospedagem"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "veterinario", "recepcao", "groomer", "financeiro"],
      appointment_status: [
        "agendado",
        "em_andamento",
        "concluido",
        "faltou",
        "cancelado",
      ],
      location_type: ["matriz", "filial"],
      payment_method: ["pix", "credito", "debito", "dinheiro"],
      sale_status: ["aberta", "fechada", "cancelada"],
      service_category: [
        "consulta",
        "cirurgia",
        "exame",
        "banho",
        "tosa",
        "hospedagem",
      ],
    },
  },
} as const
