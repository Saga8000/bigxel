import { useParams } from "react-router-dom";
import { Alert } from "../../components/ui";

const titles: Record<string, string> = {
  terms: "Terms & Conditions",
  privacy: "Privacy Policy",
  refund: "Refund Policy",
};

export default function Legal() {
  const { doc = "" } = useParams();
  const title = titles[doc] ?? "Legal";
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-3xl font-bold">{title}</h1>
      <Alert tone="warning" className="mt-6">
        This page is a placeholder. The final {title.toLowerCase()} must be written and reviewed by your legal advisor before launch.
      </Alert>
      {doc === "refund" && (
        <p className="mt-6 text-slate-700">
          How the platform currently behaves: if a screen owner declines a booking, or an advertiser cancels a campaign before its start date,
          the booking amount is credited back to the advertiser&apos;s BigXel wallet automatically.
        </p>
      )}
    </div>
  );
}
