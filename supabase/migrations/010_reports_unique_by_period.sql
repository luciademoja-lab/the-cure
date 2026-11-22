-- Un report per persona, tipo di periodo e mese (dopo il deploy del codice che usa la colonna period).
alter table public.monthly_reports drop constraint if exists monthly_reports_user_id_month_key;
alter table public.monthly_reports
  add constraint monthly_reports_user_period_month_key unique (user_id, period, month);

