
-- VENDORS
CREATE TABLE public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read vendors" ON public.vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write vendors" ON public.vendors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update vendors" ON public.vendors FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete vendors" ON public.vendors FOR DELETE TO authenticated USING (true);

-- PARTIES
CREATE TABLE public.parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parties TO authenticated;
GRANT ALL ON public.parties TO service_role;
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read parties" ON public.parties FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write parties" ON public.parties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update parties" ON public.parties FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete parties" ON public.parties FOR DELETE TO authenticated USING (true);

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (party_id, po_number)
);
CREATE INDEX orders_party_idx ON public.orders(party_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update orders" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete orders" ON public.orders FOR DELETE TO authenticated USING (true);

-- DOCUMENTS
CREATE TYPE public.doc_kind AS ENUM ('bill', 'challan');

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.doc_kind NOT NULL,
  vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  doc_number text,
  doc_date date NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (vendor_id IS NOT NULL AND order_id IS NULL) OR
    (vendor_id IS NULL AND order_id IS NOT NULL)
  )
);
CREATE INDEX documents_vendor_idx ON public.documents(vendor_id);
CREATE INDEX documents_order_idx ON public.documents(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update documents" ON public.documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth delete documents" ON public.documents FOR DELETE TO authenticated USING (true);

-- Storage policies for the 'documents' bucket (bucket created via tool)
CREATE POLICY "auth read documents bucket" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "auth write documents bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "auth delete documents bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- Seed examples
INSERT INTO public.vendors (name) VALUES
  ('Shubham International'), ('Keshav Fab'), ('Mahavir Textiles');
INSERT INTO public.parties (name) VALUES
  ('Wilco International'), ('Aarav Dyeing'), ('Shree Process');
