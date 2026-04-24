"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

const SECTIONS: Record<Locale, Array<{ title: string; body: string }>> = {
  en: [
    { title: "1. Acceptance of Terms", body: "By downloading, installing, or using SkinX (\"App\"), you agree to be bound by these Terms of Use. If you do not agree, do not use the App." },
    { title: "2. Medical Disclaimer", body: "SkinX is for informational purposes only and is not a medical device. It does not provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns." },
    { title: "3. User Accounts", body: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 18 years old to use this App." },
    { title: "4. User-Generated Content", body: "You retain ownership of images and data you upload. By uploading content, you grant SkinX a limited licence to process and store it solely for providing the service. We do not sell your data to third parties." },
    { title: "5. Prohibited Uses", body: "You may not: (a) use the App for any unlawful purpose; (b) attempt to reverse-engineer the App; (c) upload malicious content; (d) impersonate any person or entity." },
    { title: "6. Intellectual Property", body: "All content, features, and functionality of the App are owned by SkinX and are protected by intellectual property laws. You may not reproduce or distribute any part of the App without prior written consent." },
    { title: "7. Limitation of Liability", body: "To the maximum extent permitted by law, SkinX shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App." },
    { title: "8. Changes to Terms", body: "We reserve the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the new Terms." },
    { title: "9. Governing Law", body: "These Terms are governed by the laws of the Republic of Kazakhstan." },
    { title: "10. Contact", body: "If you have any questions about these Terms, please contact us at: support@skinx.fit" },
  ],
  ru: [
    { title: "1. Принятие условий", body: "Загружая, устанавливая или используя SkinX («Приложение»), вы соглашаетесь соблюдать настоящие Условия использования. Если вы не согласны, не используйте Приложение." },
    { title: "2. Медицинский отказ от ответственности", body: "SkinX предназначен исключительно для информационных целей и не является медицинским устройством. Приложение не предоставляет медицинских консультаций, диагностики или лечения. Всегда консультируйтесь с квалифицированным врачом по медицинским вопросам." },
    { title: "3. Аккаунты пользователей", body: "Вы несёте ответственность за сохранение конфиденциальности учётных данных и за все действия, совершённые под вашим аккаунтом. Вам должно быть не менее 18 лет для использования Приложения." },
    { title: "4. Пользовательский контент", body: "Вы сохраняете право собственности на загружаемые изображения и данные. Загружая контент, вы предоставляете SkinX ограниченную лицензию на его обработку и хранение исключительно для оказания услуги. Мы не продаём ваши данные третьим лицам." },
    { title: "5. Запрещённые действия", body: "Вам запрещено: (а) использовать Приложение в незаконных целях; (б) пытаться декомпилировать Приложение; (в) загружать вредоносный контент; (г) выдавать себя за другое лицо или организацию." },
    { title: "6. Интеллектуальная собственность", body: "Весь контент, функции и функциональность Приложения принадлежат SkinX и защищены законами об интеллектуальной собственности. Вы не вправе воспроизводить или распространять какую-либо часть Приложения без письменного согласия." },
    { title: "7. Ограничение ответственности", body: "В максимальной степени, допустимой законом, SkinX не несёт ответственности за косвенный, случайный, особый или последующий ущерб, возникший в результате использования Приложения." },
    { title: "8. Изменение условий", body: "Мы оставляем за собой право изменять настоящие Условия в любое время. Продолжение использования Приложения после изменений означает принятие новых Условий." },
    { title: "9. Применимое право", body: "Настоящие Условия регулируются законодательством Республики Казахстан." },
    { title: "10. Контакты", body: "По вопросам, связанным с настоящими Условиями, обращайтесь: support@skinx.fit" },
  ],
  kk: [
    { title: "1. Шарттарды қабылдау", body: "SkinX («Қосымша») жүктеп алу, орнату немесе пайдалану арқылы сіз осы Пайдалану шарттарымен келісесіз. Егер келіспесеңіз, Қосымшаны пайдаланбаңыз." },
    { title: "2. Медициналық жауапкершіліктен бас тарту", body: "SkinX тек ақпараттық мақсатта арналған және медициналық құрал болып табылмайды. Қосымша медициналық кеңес, диагноз немесе ем бермейді. Медициналық мәселелер бойынша әрдайым білікті дәрігермен кеңесіңіз." },
    { title: "3. Пайдаланушы аккаунттары", body: "Сіз аккаунт деректерінің құпиялылығын сақтауға және аккаунт аясында жасалған барлық әрекеттерге жауапты боласыз. Қосымшаны пайдалану үшін сізге кемінде 18 жас болуы керек." },
    { title: "4. Пайдаланушы мазмұны", body: "Жүктелген суреттер мен деректерге меншік құқығыңыз сақталады. Мазмұн жүктей отырып, сіз SkinX-ке тек қызметті ұсыну мақсатында оны өңдеуге және сақтауға шектеулі лицензия бересіз. Біз деректеріңізді үшінші тараптарға сатпаймыз." },
    { title: "5. Тыйым салынған әрекеттер", body: "Сізге мыналар тыйым салынады: (а) Қосымшаны заңсыз мақсаттарда пайдалану; (б) Қосымшаны кері жасақтауға әрекет ету; (в) зиянды мазмұн жүктеу; (г) кез келген тұлғаны немесе ұйымды жалған бейнелеу." },
    { title: "6. Зияткерлік меншік", body: "Қосымшаның барлық мазмұны, мүмкіндіктері мен функционалдығы SkinX-ке тиесілі және зияткерлік меншік заңдарымен қорғалған. Жазбаша рұқсатсыз Қосымшаның кез келген бөлігін көшіруге немесе таратуға болмайды." },
    { title: "7. Жауапкершілікті шектеу", body: "Заңмен рұқсат етілген шамада SkinX Қосымшаны пайдаланудан туындаған жанама, кездейсоқ, арнайы немесе салдарлы зиян үшін жауапты болмайды." },
    { title: "8. Шарттарды өзгерту", body: "Біз осы Шарттарды кез келген уақытта өзгерту құқығын сақтаймыз. Өзгерістерден кейін Қосымшаны пайдалануды жалғастыру жаңа Шарттарды қабылдағаныңызды білдіреді." },
    { title: "9. Қолданылатын құқық", body: "Осы Шарттар Қазақстан Республикасының заңнамасымен реттеледі." },
    { title: "10. Байланыс", body: "Осы Шарттарға қатысты сұрақтар бойынша бізге хабарласыңыз: support@skinx.fit" },
  ],
};

export function TermsContent() {
  const { t, locale } = useI18n();
  const sections = SECTIONS[locale];

  return (
    <article className="prose prose-sm max-w-none py-6 space-y-6 text-on-surface">
      <h1 className="text-2xl font-extrabold tracking-tight">{t.terms.title}</h1>
      <p className="text-on-surface-variant text-sm">{t.terms.lastUpdated}</p>
      {sections.map((s) => (
        <section key={s.title} className="space-y-2">
          <h2 className="text-base font-bold text-on-surface">{s.title}</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">{s.body}</p>
        </section>
      ))}
    </article>
  );
}
