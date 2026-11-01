import { ImageUp } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Field, PageLoader, SelectField, Spinner, SubmitButton, TextAreaField } from "../../components/ui";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api, ApiError } from "../../lib/api";
import type { OwnerScreen, ScreenMeta } from "../../lib/types";

const blank = {
  name: "", placement: "", address: "", city: "", state: "", area: "", category: "", screen_type: "",
  size_inches: "", resolution: "Full HD", daily_footfall: "", operating_hours: "10 AM - 10 PM", price_per_month: "",
  ad_slots: "6", description: "", image_url: "", tags: "", is_active: true,
};
type FormState = typeof blank;

export default function ScreenForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(blank);
  const [meta, setMeta] = useState<ScreenMeta | null>(null);
  const [loaded, setLoaded] = useState(!id);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get<ScreenMeta>("/api/screens/meta").then(setMeta).catch(() => null);
    if (id)
      api.get<OwnerScreen>(`/api/owner/screens/${id}`)
        .then((s) => {
          setForm({
            ...blank, ...s, area: s.area ?? "", description: s.description ?? "", image_url: s.image_url ?? "",
            size_inches: String(s.size_inches), daily_footfall: String(s.daily_footfall), price_per_month: String(s.price_per_month),
            ad_slots: String(s.ad_slots), tags: s.tags.join(", "),
          });
          setLoaded(true);
        })
        .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load screen"));
  }, [id]);

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const onFile = async (file?: File) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setErrors({ ...errors, image_url: "Use a JPG, PNG or WEBP image" });
    setUploading(true);
    try {
      const r = await api.upload(file);
      setForm((f) => ({ ...f, image_url: r.url }));
      setErrors((e) => ({ ...e, image_url: "" }));
    } catch (e) {
      setErrors((x) => ({ ...x, image_url: e instanceof ApiError ? e.message : "Upload failed" }));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const errs: Record<string, string> = {};
    (["name", "placement", "address", "city", "state", "resolution", "operating_hours"] as const).forEach((k) => {
      if (String(form[k]).trim().length < 2) errs[k] = "Required";
    });
    if (!form.category) errs.category = "Choose a category";
    if (!form.screen_type) errs.screen_type = "Choose a screen type";
    const size = Number(form.size_inches), price = Number(form.price_per_month), foot = Number(form.daily_footfall), slots = Number(form.ad_slots);
    if (!(size >= 10 && size <= 1000)) errs.size_inches = "10–1000 inches";
    if (!(price >= 500)) errs.price_per_month = "Minimum ₹500";
    if (!(foot >= 0) || form.daily_footfall === "") errs.daily_footfall = "Enter estimated daily footfall";
    if (!(slots >= 1 && slots <= 60)) errs.ad_slots = "1–60";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    const body = {
      ...form,
      area: form.area.trim() || null,
      description: form.description.trim() || null,
      image_url: form.image_url || null,
      size_inches: size, price_per_month: price, daily_footfall: foot, ad_slots: slots,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8),
    };
    try {
      if (id) await api.put(`/api/owner/screens/${id}`, body);
      else await api.post("/api/owner/screens", body);
      navigate("/owner/screens");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setError(err.message);
      }
      setLoading(false);
    }
  };

  if (!loaded) return error ? <Alert tone="error">{error}</Alert> : <PageLoader />;

  return (
    <>
      <PageHeader title={id ? "Edit Screen" : "Add Screen"} subtitle={id ? "Update your screen details." : "New screens are reviewed by our team before going live."} />
      <form onSubmit={submit} noValidate className="card space-y-6 p-6">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Screen / venue name" value={form.name} onChange={set("name")} error={errors.name} />
          <Field label="Placement" placeholder="e.g. Ground floor atrium" value={form.placement} onChange={set("placement")} error={errors.placement} />
          <Field label="Address" value={form.address} onChange={set("address")} error={errors.address} className="md:col-span-2" />
          <Field label="Area / locality (optional)" value={form.area} onChange={set("area")} />
          <Field label="City" value={form.city} onChange={set("city")} error={errors.city} />
          <Field label="State" value={form.state} onChange={set("state")} error={errors.state} />
          <SelectField label="Category" value={form.category} onChange={set("category")} error={errors.category}>
            <option value="">Select category</option>
            {meta?.all_categories.map((c) => <option key={c}>{c}</option>)}
          </SelectField>
          <SelectField label="Screen type" value={form.screen_type} onChange={set("screen_type")} error={errors.screen_type}>
            <option value="">Select screen type</option>
            {meta?.all_screen_types.map((c) => <option key={c}>{c}</option>)}
          </SelectField>
          <Field label="Screen size (inches)" type="number" min={10} value={form.size_inches} onChange={set("size_inches")} error={errors.size_inches} />
          <Field label="Resolution" value={form.resolution} onChange={set("resolution")} error={errors.resolution} />
          <Field label="Estimated daily footfall" type="number" min={0} value={form.daily_footfall} onChange={set("daily_footfall")} error={errors.daily_footfall} />
          <Field label="Operating hours" value={form.operating_hours} onChange={set("operating_hours")} error={errors.operating_hours} />
          <Field label="Price per month (₹)" type="number" min={500} step={100} value={form.price_per_month} onChange={set("price_per_month")} error={errors.price_per_month} />
          <Field label="Ad slots (concurrent advertisers)" type="number" min={1} max={60} value={form.ad_slots} onChange={set("ad_slots")} error={errors.ad_slots} />
          <Field label="Tags (comma separated)" placeholder="Mall, Premium Location" value={form.tags} onChange={set("tags")} className="md:col-span-2" />
          <TextAreaField label="Description (optional)" value={form.description} onChange={set("description")} maxLength={2000} className="md:col-span-2" />
        </div>
        <div>
          <p className="label">Screen photo</p>
          <div className="flex flex-wrap items-center gap-4">
            {form.image_url && <img src={form.image_url} alt="Screen preview" className="h-24 w-36 rounded-lg object-cover" />}
            <label className="btn-outline cursor-pointer">
              {uploading ? <Spinner className="h-4 w-4" /> : <ImageUp className="h-4 w-4" />} {form.image_url ? "Replace photo" : "Upload photo"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} disabled={uploading} />
            </label>
          </div>
          {errors.image_url && <p className="mt-1 text-xs text-rose-600">{errors.image_url}</p>}
        </div>
        {id && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            Screen is active and accepting bookings
          </label>
        )}
        <div className="flex gap-3">
          <SubmitButton loading={loading} disabled={uploading}>{id ? "Save Changes" : "Submit for Review"}</SubmitButton>
          <button type="button" className="btn-outline" onClick={() => navigate("/owner/screens")}>Cancel</button>
        </div>
      </form>
    </>
  );
}
