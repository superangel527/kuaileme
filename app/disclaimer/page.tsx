import type { Metadata } from "next";
import LegalLayout from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "免責聲明 | 誇了嗎",
  description: "誇了嗎免責聲明、緊急情緒專線、AI 使用提醒",
};

export default function DisclaimerPage() {
  return (
    <LegalLayout title="誇了嗎｜免責聲明" updated="2026 年 9 月 8 日">
      <p>
        「誇了嗎」為 <strong>AI 情緒陪伴與娛樂互動體驗服務</strong>。
      </p>
      <p>
        本聲明請您完整閱讀。
        <strong>使用本服務即表示您已閱讀、理解並完全同意本聲明全部內容。</strong>
      </p>

      <h2>一、本服務的性質</h2>
      <p>本服務內容僅供參考、娛樂與情緒體驗、絕對不構成：</p>
      <ul>
        <li>醫療診斷或治療建議</li>
        <li>心理諮商或精神醫療服務</li>
        <li>法律建議</li>
        <li>投資 / 財務建議</li>
        <li>人生重大決策依據</li>
        <li>任何形式的專業諮詢</li>
      </ul>
      <p>
        <strong>AI 生成內容不代表任何專業立場、不保證任何結果。</strong>
      </p>

      <h2>二、若您正處於以下狀態、請立即停止使用本服務</h2>
      <ul>
        <li>嚴重情緒困擾、憂鬱、焦慮、恐慌</li>
        <li>自傷或傷害他人之念頭</li>
        <li>正接受精神 / 心理治療</li>
        <li>處於急性壓力、創傷或危機狀態</li>
        <li>對 AI 互動內容產生過度依賴或負面情緒反應</li>
      </ul>
      <p>
        <strong>請立即尋求專業協助與可信任之親友支持。</strong>
      </p>

      <h2>三、24 小時免費專線（隨時都可以打）</h2>
      <ul>
        <li>
          <strong>衛福部安心專線：</strong>
          <a href="tel:1925">1925</a>（依舊愛我）
        </li>
        <li>
          <strong>生命線：</strong>
          <a href="tel:1995">1995</a>（要救救我）
        </li>
        <li>
          <strong>張老師專線：</strong>
          <a href="tel:1980">1980</a>（依舊幫你）
        </li>
        <li>
          <strong>各地心理諮商所、精神科醫院、家庭醫師</strong>
        </li>
      </ul>
      <p>
        若您身邊有人正陷入危機、請陪伴他、撥打上述專線、
        或前往最近之醫院急診。
      </p>

      <h2>四、AI 互動的限制</h2>
      <p>本服務之聊天訊息全部由 AI 系統自動生成。</p>
      <p>AI 不具備：</p>
      <ul>
        <li>真實情感與意識</li>
        <li>醫療 / 心理專業資格</li>
        <li>對您個人狀況的完整了解</li>
        <li>任何形式的法律 / 醫療能力</li>
      </ul>
      <p>
        AI 內容可能不準確、不完整、不適切、甚至偶有錯誤。
        <strong>使用者必須自行判斷、不得依賴本服務作出任何重要決定。</strong>
      </p>

      <h2>五、責任限制（重要）</h2>
      <p>
        於法律允許之最大範圍內、本網站、其經營者、員工、合作夥伴
        <strong>對使用者因使用本服務所產生之任何後果、不負任何責任</strong>、
        包含但不限於：
      </p>
      <ul>
        <li>因 AI 內容引發之情緒反應、精神損害</li>
        <li>因依賴本服務作出之任何決定及其後果</li>
        <li>對自己、他人或第三方之任何傷害（身體、心理、財產）</li>
        <li>使用本服務後採取或未採取任何行動之後果</li>
      </ul>
      <p>
        本服務不能、也不會取代專業心理諮商、醫療治療、法律或財務建議。
      </p>

      <h2>六、誇了嗎的設計理念</h2>
      <p>
        誇了嗎被設計來「
        <strong>讓你感覺被聽見、被誇獎、被擁抱 3 分鐘</strong>」、
        作為日常生活中一個輕鬆的情緒小體驗。
      </p>
      <p>
        我們希望它能讓你的心情好一點。
        但如果你真的不太好、
        <strong>請一定要找專業的人、找信任的人、不要只靠 AI</strong>。
      </p>
      <p>你值得被真實的人聽見、被真實的人愛。</p>

      <h2>七、聯絡方式</h2>
      <p>
        如對本聲明有任何疑問、請聯繫：
        <br />
        Email：<a href="mailto:support@superangel527.com">support@superangel527.com</a>
      </p>
    </LegalLayout>
  );
}
