import { PageHeader } from "../../layouts/DashboardLayout";
import ScreenBrowser from "../public/ScreenBrowser";

export default function AdvertiserBrowse() {
  return (
    <>
      <PageHeader title="Browse Screens" subtitle="Filter by location, category, and price, then book directly." />
      <ScreenBrowser bookPath={(s) => `/advertiser/campaigns/new?screen=${s.id}`} />
    </>
  );
}
