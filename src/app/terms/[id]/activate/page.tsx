import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setActiveTerm } from "@/app/_actions/terms";

type Params = Promise<{ id: string }>;

// After creating a new term this page is hit, activates it, then sends to /courses
export default async function ActivateTermPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: term } = await supabase
    .from("terms")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!term) redirect("/courses");

  await setActiveTerm(id);
  redirect("/courses");
}
