// ==========================================
// TYPES GÉNÉRÉS POUR SUPABASE
// ==========================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          phone: string | null
          avatar_url: string | null
          subscription_plan: string
          subscription_status: string
          paystack_customer_id: string | null
          paystack_subscription_id: string | null
          reminders_limit: number
          reminders_sent_this_month: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          subscription_plan?: string
          subscription_status?: string
          paystack_customer_id?: string | null
          paystack_subscription_id?: string | null
          reminders_limit?: number
          reminders_sent_this_month?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          subscription_plan?: string
          subscription_status?: string
          paystack_customer_id?: string | null
          paystack_subscription_id?: string | null
          reminders_limit?: number
          reminders_sent_this_month?: number
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          whatsapp: string | null
          company: string | null
          address: string | null
          notes: string | null
          is_active: boolean
          total_debt: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          company?: string | null
          address?: string | null
          notes?: string | null
          is_active?: boolean
          total_debt?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          company?: string | null
          address?: string | null
          notes?: string | null
          is_active?: boolean
          total_debt?: number
          created_at?: string
          updated_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          client_id: string
          user_id: string
          reference: string | null
          description: string
          amount: number
          currency: string
          due_date: string
          status: string
          amount_paid: number
          paid_at: string | null
          payment_method: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          user_id: string
          reference?: string | null
          description: string
          amount: number
          currency?: string
          due_date: string
          status?: string
          amount_paid?: number
          paid_at?: string | null
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          user_id?: string
          reference?: string | null
          description?: string
          amount?: number
          currency?: string
          due_date?: string
          status?: string
          amount_paid?: number
          paid_at?: string | null
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reminders: {
        Row: {
          id: string
          debt_id: string
          client_id: string
          user_id: string
          type: string
          status: string
          subject: string | null
          message: string
          error_message: string | null
          sent_at: string | null
          delivered_at: string | null
          opened_at: string | null
          external_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          debt_id: string
          client_id: string
          user_id: string
          type: string
          status?: string
          subject?: string | null
          message: string
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          opened_at?: string | null
          external_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          debt_id?: string
          client_id?: string
          user_id?: string
          type?: string
          status?: string
          subject?: string | null
          message?: string
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          opened_at?: string | null
          external_id?: string | null
          created_at?: string
        }
      }
      reminder_templates: {
        Row: {
          id: string
          user_id: string | null
          name: string
          type: string
          subject: string | null
          content: string
          variables: Json
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          type: string
          subject?: string | null
          content: string
          variables?: Json
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          type?: string
          subject?: string | null
          content?: string
          variables?: Json
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          paystack_id: string | null
          plan: string
          status: string
          amount: number | null
          currency: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          paystack_id?: string | null
          plan: string
          status: string
          amount?: number | null
          currency?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          paystack_id?: string | null
          plan?: string
          status?: string
          amount?: number | null
          currency?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_stats: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Types dérivés
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Debt = Database['public']['Tables']['debts']['Row']
export type Reminder = Database['public']['Tables']['reminders']['Row']
export type ReminderTemplate = Database['public']['Tables']['reminder_templates']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']

// Types pour les inserts
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type DebtInsert = Database['public']['Tables']['debts']['Insert']
export type ReminderInsert = Database['public']['Tables']['reminders']['Insert']

// Enums personnalisés
export type DebtStatus = 'pending' | 'overdue' | 'partially_paid' | 'paid' | 'cancelled'
export type ReminderType = 'email' | 'whatsapp' | 'both'
export type ReminderStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'opened'
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'cancelled'

// Types pour le dashboard
export interface DashboardStats {
  total_clients: number
  total_debts: number
  paid_debts: number
  overdue_count: number
  reminders_sent: number
  pending_reminders: number
}

// Type pour les clients avec leurs dettes
export interface ClientWithDebts extends Client {
  debts: Debt[]
}

// Type pour les dettes avec le client
export interface DebtWithClient extends Debt {
  client: Client
}

// Type pour les relances avec les relations
export interface ReminderWithDetails extends Reminder {
  client: Client
  debt: Debt
}
