-- Generaliza as colunas de pagamento de profiles pra não ficarem amarradas ao
-- Mercado Pago especificamente — necessário pra expansão internacional, onde
-- outros provedores (Stripe etc.) vão ser adicionados.

alter table profiles rename column mercado_pago_customer_id     to payment_provider_customer_id;
alter table profiles rename column mercado_pago_subscription_id to payment_provider_subscription_id;
alter table profiles rename column mercado_pago_payment_id      to payment_provider_payment_id;

alter table profiles add column if not exists payment_provider text default 'mercado_pago';
update profiles set payment_provider = 'mercado_pago' where payment_provider is null;

create index if not exists idx_profiles_payment_provider on profiles(payment_provider);

-- Colunas mortas de uma migração Stripe/Asaas anterior (nunca usadas em código,
-- pendência já apontada no CHANGELOG antigo e nunca executada).
alter table profiles drop column if exists stripe_customer_id;
alter table profiles drop column if exists stripe_subscription_id;
alter table profiles drop column if exists asaas_customer_id;
alter table profiles drop column if exists asaas_payment_id;
