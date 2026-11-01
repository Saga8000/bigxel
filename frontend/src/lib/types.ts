export type Role = "advertiser" | "screen_owner" | "admin";

export interface User {
  id: number;
  email: string;
  phone: string | null;
  full_name: string;
  company_name: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface Screen {
  id: number;
  name: string;
  placement: string;
  address: string;
  city: string;
  state: string;
  area: string | null;
  category: string;
  screen_type: string;
  size_inches: number;
  resolution: string;
  daily_footfall: number;
  operating_hours: string;
  price_per_month: number;
  ad_slots: number;
  description: string | null;
  image_url: string | null;
  tags: string[];
  is_demo: boolean;
  created_at: string;
}

export interface ScreenDetail extends Screen {
  owner_display_name: string;
  booked_ranges: { start_date: string; end_date: string }[];
}

export type ScreenStatus = "pending" | "approved" | "rejected";

export interface OwnerScreen extends Screen {
  status: ScreenStatus;
  review_note: string | null;
  is_active: boolean;
}

export interface AdminScreen extends OwnerScreen {
  owner_id: number;
  owner_name: string;
  owner_email: string;
}

export interface ScreenMeta {
  cities: string[];
  categories: string[];
  screen_types: string[];
  all_categories: string[];
  all_screen_types: string[];
}

export interface Page<T> {
  items: T[];
  total: number;
}

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface Booking {
  id: number;
  campaign_id: number;
  screen_id: number;
  start_date: string;
  end_date: string;
  amount: number;
  owner_share: number;
  status: BookingStatus;
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
  screen: { id: number; name: string; city: string; image_url: string | null };
}

export interface OwnerBooking extends Booking {
  campaign: { id: number; name: string; creative_url: string; creative_type: string };
  advertiser_name: string;
}

export interface AdminBooking extends OwnerBooking {
  owner_name: string;
}

export interface Campaign {
  id: number;
  name: string;
  objective: string | null;
  creative_url: string;
  creative_type: "image" | "video";
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
  created_at: string;
  bookings: Booking[];
}

export interface AdminCampaign extends Campaign {
  advertiser_id: number;
  advertiser_name: string;
}

export interface Transaction {
  id: number;
  type: "topup" | "booking_charge" | "refund" | "earning" | "earning_reversal";
  amount: number;
  description: string;
  booking_id: number | null;
  is_simulated: boolean;
  created_at: string;
}

export interface AdminTransaction extends Transaction {
  user_id: number;
  user_name: string;
  user_role: Role;
}

export interface Wallet {
  balance: number;
  payments_mode: "simulated" | "razorpay" | "disabled";
  max_topup_amount: number;
  transactions: Transaction[];
}

export interface ContactMessage {
  id: number;
  kind: string;
  full_name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
  details: Record<string, string>;
  is_resolved: boolean;
  created_at: string;
}

export interface PaymentOrder {
  order_id: string;
  key_id: string;
  amount: number;
  amount_paise: number;
  currency: string;
  prefill_name: string;
  prefill_email: string;
  prefill_contact: string | null;
}
