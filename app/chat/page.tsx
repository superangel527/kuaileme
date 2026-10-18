import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ChatClient from "./ChatClient";
import { ACCESS_COOKIE, verifyAccessPass } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const paymentMode = process.env.NEXT_PUBLIC_PAYMENT_MODE || "fake";
  const allowDev =
    process.env.NODE_ENV !== "production" && paymentMode !== "payuni";
  const token = (await cookies()).get(ACCESS_COOKIE)?.value || "";

  if (!allowDev && !verifyAccessPass(token)) {
    redirect("/pay");
  }

  return <ChatClient />;
}
