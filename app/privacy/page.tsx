import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "隱私權政策 | 誇了嗎",
  description: "誇了嗎的隱私權政策、資料蒐集、使用方式、第三方服務說明",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="誇了嗎｜隱私權政策" updated="2026 年 9 月 8 日">
      <p>歡迎使用「誇了嗎」（以下簡稱「本服務」）。</p>
      <p>
        本政策說明我們如何蒐集、使用與保護您的資訊。
        <strong>使用本服務即表示您已閱讀、理解並同意本政策全部內容。</strong>
        若您不同意、請立即停止使用本服務。
      </p>

      <h2>一、適用範圍</h2>
      <p>本政策適用於「誇了嗎」網站與相關服務、包含但不限於：</p>
      <ul>
        <li>AI 聊天互動</li>
        <li>情緒鼓勵與陪伴功能</li>
        <li>使用者互動紀錄</li>
        <li>付款相關功能</li>
        <li>未來延伸之會員、付費或 APP 功能</li>
      </ul>

      <h2>二、我們可能蒐集的資訊</h2>

      <h3>1. 您主動提供的資訊</h3>
      <ul>
        <li>暱稱、聊天內容、文字輸入</li>
        <li>付款資料（透過第三方金流業者處理、本網站不儲存信用卡號）</li>
        <li>回饋意見</li>
      </ul>

      <h3>2. 系統自動蒐集的資訊</h3>
      <ul>
        <li>IP 位址、裝置資訊、瀏覽器類型</li>
        <li>Cookie 與 localStorage</li>
        <li>網站使用紀錄、頁面停留時間</li>
      </ul>

      <h3>3. 第三方服務</h3>
      <p>
        本服務可能使用以下第三方工具、
        <strong>各第三方有其獨立之隱私政策、本網站不負其責任</strong>：
      </p>
      <ul>
        <li>
          <strong>PayUni（統一金流）</strong>：處理付款、本網站不接觸信用卡資訊
        </li>
        <li>
          <strong>Anthropic Claude API</strong>：處理 AI 對話內容、
          您輸入的文字將傳送至 Anthropic 伺服器處理
        </li>
        <li>
          <strong>Netlify</strong>：網站託管服務
        </li>
        <li>Google Analytics、Meta Pixel（流量分析、未來可能加入）</li>
      </ul>

      <h2>三、特別重要的提醒</h2>
      <p>
        <strong>請勿在聊天室輸入以下敏感資訊：</strong>
      </p>
      <ul>
        <li>身分證字號、信用卡號、銀行帳號</li>
        <li>密碼、驗證碼</li>
        <li>真實姓名、地址、電話</li>
        <li>個人病歷、精神科診斷</li>
        <li>任何不希望被第三方知道的隱私資訊</li>
      </ul>
      <p>
        因您主動輸入而衍生之任何外洩、洩漏、第三方使用、本網站不負任何責任。
      </p>

      <h2>四、資料使用目的</h2>
      <ul>
        <li>提供 AI 聊天與互動功能</li>
        <li>改善使用體驗</li>
        <li>優化系統與內容品質</li>
        <li>維護網站安全</li>
        <li>法令遵循</li>
      </ul>

      <h2>五、資料保護與風險</h2>
      <p>
        我們將盡合理技術與管理措施保護您的資料、但
        <strong>網際網路傳輸本質上具有風險、無法保證百分之百安全</strong>。
      </p>
      <p>
        因駭客攻擊、不可抗力、第三方服務故障、或您自身設備 / 帳號安全問題所致之資料外洩、
        本網站於法律允許範圍內不負賠償責任。
      </p>

      <h2>六、資料分享與揭露</h2>
      <p>除以下情形外、我們不會出售、交換或公開您的個人資料：</p>
      <ul>
        <li>法律或主管機關依法要求</li>
        <li>司法調查需要</li>
        <li>為履行服務所必要之第三方（如金流、雲端服務）</li>
        <li>經您事前明確同意</li>
      </ul>

      <h2>七、Cookie 與本地儲存</h2>
      <p>
        本網站使用 Cookie 與 localStorage 保存付款通行狀態、暱稱、當次聊天主題與產生回應所需資料。
        付款通行 Cookie 有效期有限；localStorage 資料會保留於使用者裝置，直到網站程式清除或使用者自行清除瀏覽資料。
        聊天文字會傳送至 Anthropic API 以產生回應，但不會公開顯示給其他使用者。
      </p>

      <h2>八、未成年人使用</h2>
      <p>
        <strong>本服務建議 18 歲（含）以上使用。</strong>
      </p>
      <p>
        若您未滿 18 歲、必須由法定代理人陪同閱讀並同意本政策與服務條款後始得使用。
        使用本服務即視為法定代理人已同意。
      </p>

      <h2>九、政策修改</h2>
      <p>
        本網站保留隨時修改本政策之權利、修改後將公告於網站。
        您應定期查閱、繼續使用即視為同意修改後內容。
      </p>

      <h2>十、聯絡方式</h2>
      <p>
        服務名稱：誇了嗎
        <br />
        個資與客服聯絡 Email：<a href="mailto:support@superangel527.com">support@superangel527.com</a>
      </p>
    </LegalLayout>
  );
}
