import { getTranslations } from "next-intl/server";
import { PageLoader } from "@/components/ui/loader";

export default async function Loading() {
  const t = await getTranslations("Common");
  return <PageLoader text={t("loading")} />;
}
