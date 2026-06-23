
-- Enums
CREATE TYPE public.app_role AS ENUM ('owner');
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.order_mode AS ENUM ('pickup', 'dine_in');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see their roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- rooms
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_per_night NUMERIC(10,2) NOT NULL,
  capacity INT NOT NULL DEFAULT 2,
  image_url TEXT,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  total_units INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rooms TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active rooms" ON public.rooms FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners manage rooms" ON public.rooms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER rooms_updated BEFORE UPDATE ON public.rooms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- dishes
CREATE TABLE public.dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'Mains',
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dishes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dishes TO authenticated;
GRANT ALL ON public.dishes TO service_role;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads available dishes" ON public.dishes FOR SELECT USING (is_available = true OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners manage dishes" ON public.dishes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER dishes_updated BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- room_bookings
CREATE TABLE public.room_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  guest_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INT NOT NULL DEFAULT 1,
  notes TEXT NOT NULL DEFAULT '',
  status booking_status NOT NULL DEFAULT 'pending',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.room_bookings TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.room_bookings TO authenticated;
GRANT ALL ON public.room_bookings TO service_role;
ALTER TABLE public.room_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create booking" ON public.room_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners read bookings" ON public.room_bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners update bookings" ON public.room_bookings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners delete bookings" ON public.room_bookings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER room_bookings_updated BEFORE UPDATE ON public.room_bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- table_reservations
CREATE TABLE public.table_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  guest_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  reserved_at TIMESTAMPTZ NOT NULL,
  party_size INT NOT NULL DEFAULT 2,
  notes TEXT NOT NULL DEFAULT '',
  status booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.table_reservations TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.table_reservations TO authenticated;
GRANT ALL ON public.table_reservations TO service_role;
ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create reservation" ON public.table_reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners read reservations" ON public.table_reservations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners update reservations" ON public.table_reservations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners delete reservations" ON public.table_reservations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER table_reservations_updated BEFORE UPDATE ON public.table_reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- pre_orders
CREATE TABLE public.pre_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  guest_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  mode order_mode NOT NULL DEFAULT 'dine_in',
  notes TEXT NOT NULL DEFAULT '',
  status booking_status NOT NULL DEFAULT 'pending',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.pre_orders TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.pre_orders TO authenticated;
GRANT ALL ON public.pre_orders TO service_role;
ALTER TABLE public.pre_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create pre_order" ON public.pre_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners read pre_orders" ON public.pre_orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners update pre_orders" ON public.pre_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners delete pre_orders" ON public.pre_orders FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE TRIGGER pre_orders_updated BEFORE UPDATE ON public.pre_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- pre_order_items
CREATE TABLE public.pre_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_order_id UUID NOT NULL REFERENCES public.pre_orders(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE RESTRICT,
  dish_name TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.pre_order_items TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.pre_order_items TO authenticated;
GRANT ALL ON public.pre_order_items TO service_role;
ALTER TABLE public.pre_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can add item to pre_order" ON public.pre_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners read items" ON public.pre_order_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners modify items" ON public.pre_order_items FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'owner')) WITH CHECK (public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners delete items" ON public.pre_order_items FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'));

-- seed rooms
INSERT INTO public.rooms (name, description, price_per_night, capacity, amenities, total_units, image_url) VALUES
('Heritage Deluxe', 'Spacious room with traditional decor, king bed, and garden view.', 4500, 2, ARRAY['King Bed','AC','Wi-Fi','Breakfast','Hot Water'], 4, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80'),
('Royal Suite', 'Luxurious suite with sitting area, premium bath, and balcony.', 8500, 3, ARRAY['King Bed','Lounge','AC','Wi-Fi','Mini Bar','Balcony'], 2, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80'),
('Family Room', 'Two queen beds, perfect for families up to four guests.', 6000, 4, ARRAY['2 Queen Beds','AC','Wi-Fi','Breakfast'], 3, 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&q=80'),
('Garden Standard', 'Cozy room with garden access and traditional touches.', 3200, 2, ARRAY['Queen Bed','Fan','Wi-Fi','Hot Water'], 6, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80');

-- seed dishes
INSERT INTO public.dishes (name, description, price, category, image_url) VALUES
('Paneer Butter Masala', 'Cottage cheese cubes simmered in a rich tomato-cashew gravy.', 320, 'Mains', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=900&q=80'),
('Dal Makhani', 'Slow-cooked black lentils with cream and butter.', 280, 'Mains', 'https://images.unsplash.com/photo-1626501075284-2906a0e8ba73?w=900&q=80'),
('Chicken Biryani', 'Aromatic basmati rice layered with marinated chicken.', 420, 'Mains', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=900&q=80'),
('Tandoori Chicken (Half)', 'Charcoal-grilled marinated chicken with mint chutney.', 380, 'Starters', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=900&q=80'),
('Veg Pakora', 'Crispy mixed vegetable fritters with tamarind sauce.', 180, 'Starters', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900&q=80'),
('Butter Naan', 'Soft tandoor-baked flatbread brushed with butter.', 60, 'Breads', 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=900&q=80'),
('Garlic Naan', 'Tandoor naan topped with fresh garlic and coriander.', 80, 'Breads', 'https://images.unsplash.com/photo-1670242688029-c39ba1d27e3c?w=900&q=80'),
('Gulab Jamun', 'Warm milk dumplings soaked in cardamom syrup.', 140, 'Desserts', 'https://images.unsplash.com/photo-1601303516534-bfb09b822f01?w=900&q=80'),
('Masala Chai', 'Spiced Indian tea brewed with milk.', 60, 'Beverages', 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=900&q=80'),
('Mango Lassi', 'Chilled yogurt drink blended with ripe mango.', 120, 'Beverages', 'https://images.unsplash.com/photo-1626202373052-9ee8b5ab2a37?w=900&q=80');
