-- ==========================================
-- RELANCEPRO AFRICA - SCHEMA SUPABASE
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLE: profiles (Utilisateurs)
-- ==========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  company_name VARCHAR(255),
  phone VARCHAR(50),
  avatar_url TEXT,
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  paystack_customer_id VARCHAR(255),
  paystack_subscription_id VARCHAR(255),
  reminders_limit INTEGER DEFAULT 10,
  reminders_sent_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_subscription ON profiles(subscription_status);

-- ==========================================
-- TABLE: clients (Débiteurs)
-- ==========================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  company VARCHAR(255),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  total_debt DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_contact CHECK (email IS NOT NULL OR phone IS NOT NULL OR whatsapp IS NOT NULL)
);

CREATE INDEX idx_clients_user ON clients(user_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_active ON clients(is_active);

-- ==========================================
-- TABLE: debts (Créances/Impayés)
-- ==========================================
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reference VARCHAR(100),
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XOF',
  due_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, overdue, partially_paid, paid, cancelled
  amount_paid DECIMAL(15,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_debts_client ON debts(client_id);
CREATE INDEX idx_debts_user ON debts(user_id);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debts_due_date ON debts(due_date);

-- ==========================================
-- TABLE: reminders (Historique des relances)
-- ==========================================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  -- 'email', 'whatsapp', 'both'
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, sent, delivered, failed, opened
  subject VARCHAR(255),
  message TEXT NOT NULL,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  external_id VARCHAR(255),
  -- ID externe (Resend/Whapi)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_debt ON reminders(debt_id);
CREATE INDEX idx_reminders_client ON reminders(client_id);
CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_type ON reminders(type);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_created ON reminders(created_at);

-- ==========================================
-- TABLE: reminder_templates (Templates de relance)
-- ==========================================
CREATE TABLE reminder_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  -- 'email', 'whatsapp'
  subject VARCHAR(255),
  -- pour emails
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  -- liste des variables disponibles
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_user ON reminder_templates(user_id);
CREATE INDEX idx_templates_type ON reminder_templates(type);

-- ==========================================
-- TABLE: subscriptions (Historique des abonnements)
-- ==========================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  paystack_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2),
  currency VARCHAR(10) DEFAULT 'XOF',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ==========================================
-- TABLE: activity_logs (Journal d'activité)
-- ==========================================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_created ON activity_logs(created_at);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies pour clients
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour debts
CREATE POLICY "Users can view own debts"
  ON debts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own debts"
  ON debts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own debts"
  ON debts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debts"
  ON debts FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour reminders
CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies pour reminder_templates
CREATE POLICY "Users can view own templates"
  ON reminder_templates FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create own templates"
  ON reminder_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON reminder_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON reminder_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Policies pour subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Policies pour activity_logs
CREATE POLICY "Users can view own logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER debts_updated_at
  BEFORE UPDATE ON debts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON reminder_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger pour créer un profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger pour mettre à jour total_debt d'un client
CREATE OR REPLACE FUNCTION update_client_total_debt()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE clients
  SET total_debt = (
    SELECT COALESCE(SUM(amount - amount_paid), 0)
    FROM debts
    WHERE client_id = NEW.client_id
    AND status IN ('pending', 'overdue', 'partially_paid')
  )
  WHERE id = NEW.client_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER debts_total_update
  AFTER INSERT OR UPDATE OR DELETE ON debts
  FOR EACH ROW EXECUTE FUNCTION update_client_total_debt();

-- ==========================================
-- FONCTIONS UTILES
-- ==========================================

-- Fonction pour obtenir les statistiques du dashboard
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_clients', (SELECT COUNT(*) FROM clients WHERE user_id = p_user_id AND is_active = true),
    'total_debts', (SELECT COALESCE(SUM(amount), 0) FROM debts WHERE user_id = p_user_id AND status IN ('pending', 'overdue', 'partially_paid')),
    'paid_debts', (SELECT COALESCE(SUM(amount_paid), 0) FROM debts WHERE user_id = p_user_id),
    'overdue_count', (SELECT COUNT(*) FROM debts WHERE user_id = p_user_id AND status = 'overdue'),
    'reminders_sent', (SELECT COUNT(*) FROM reminders WHERE user_id = p_user_id AND status = 'sent'),
    'pending_reminders', (SELECT COUNT(*) FROM reminders WHERE user_id = p_user_id AND status = 'pending')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- DONNÉES INITIALES
-- ==========================================

-- Templates par défaut
INSERT INTO reminder_templates (name, type, subject, content, variables, is_default, user_id) VALUES
('Relance Email - Standard', 'email', 'Rappel de paiement - {company_name}', '<p>Bonjour {client_name},</p><p>Nous vous rappelons que la facture <strong>{reference}</strong> d''un montant de <strong>{amount} {currency}</strong> arrive à échéance le {due_date}.</p><p>Merci de régulariser votre situation dans les meilleurs délais.</p><p>Cordialement,<br>{user_name}</p>', '["client_name", "company_name", "reference", "amount", "currency", "due_date", "user_name"]', true, NULL),
('Relance WhatsApp - Standard', 'whatsapp', NULL, 'Bonjour {client_name}, rappel: facture {reference} de {amount} {currency} en attente. Échéance: {due_date}. Merci de régulariser. - {company_name}', '["client_name", "reference", "amount", "currency", "due_date", "company_name"]', true, NULL);
