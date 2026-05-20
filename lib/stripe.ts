/**
 * Stripe 串接預留位
 *
 * 第一版是「假付款」：app/pay/page.tsx 跑 2.7 秒 loading 後直接進聊天室。
 *
 * 之後要接真實 Stripe Checkout，建議流程：
 *
 *  1. 在 Stripe Dashboard 建立 Product 與 Price（NT$19 / one-time）
 *  2. 在 .env.local 設定：
 *        STRIPE_SECRET_KEY=sk_live_xxx
 *        STRIPE_PRICE_ID=price_xxx
 *        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
 *  3. 新增 app/api/checkout/route.ts，呼叫 Stripe Checkout Session API，
 *     成功的 success_url 指回 /chat
 *  4. 修改 app/page.tsx 的 handleEnter：
 *        const res = await fetch('/api/checkout', { method: 'POST', body: JSON.stringify({ msg: input }) });
 *        const { url } = await res.json();
 *        window.location.href = url;
 *
 *  本檔案目前只匯出常數，方便之後集中改價格。
 */

export const KUA_PRICE_TWD = 19;
export const KUA_CURRENCY = "TWD";
export const KUA_SESSION_SECONDS = 180;
