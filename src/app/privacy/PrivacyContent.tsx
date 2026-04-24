"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";

const SECTIONS: Record<Locale, Array<{ title: string; body: string }>> = {
  en: [
    { title: "1. Information We Collect", body: "We collect information you provide directly: email address, profile data (age range, sex, skin type, risk factors), and skin scan images you upload. We also collect usage data and device information automatically." },
    { title: "2. How We Use Your Information", body: "We use your information to: provide and improve the App; personalise your experience; process and display your skin scan results; send service-related communications; comply with legal obligations." },
    { title: "3. Data Storage and Security", body: "Your data is stored on secure servers provided by Supabase. We implement industry-standard security measures including encryption in transit (TLS) and at rest. However, no method of transmission over the Internet is 100% secure." },
    { title: "4. Data Sharing", body: "We do not sell, trade, or rent your personal information to third parties. We may share data with service providers who assist in operating the App, bound by confidentiality obligations." },
    { title: "5. AI Analysis", body: "Skin scan images are processed by AI algorithms to provide analysis results. Images may be temporarily processed by third-party AI services. We do not use your images to train AI models without your explicit consent." },
    { title: "6. Your Rights (GDPR)", body: "You have the right to: access your personal data; correct inaccurate data; request deletion; export your data; withdraw consent at any time. Contact us at support@skinx.fit to exercise these rights." },
    { title: "7. Data Retention", body: "We retain your data for as long as your account is active. When you delete your account, all personal data and scan images are permanently deleted within 30 days." },
    { title: "8. Cookies", body: "The App uses essential cookies and local storage for authentication and preferences. We do not use tracking or advertising cookies." },
    { title: "9. Children's Privacy", body: "The App is not intended for users under the age of 18. We do not knowingly collect personal information from children." },
    { title: "10. Changes to This Policy", body: "We may update this Privacy Policy from time to time. We will notify you of significant changes by displaying a notice in the App." },
    { title: "11. Contact Us", body: "If you have questions about this Privacy Policy or wish to exercise your data rights, contact us at: support@skinx.fit" },
  ],
  ru: [
    { title: "1. Собираемые данные", body: "Мы собираем данные, которые вы предоставляете напрямую: адрес электронной почты, данные профиля (возрастной диапазон, пол, тип кожи, факторы риска) и загружаемые изображения кожи. Мы также автоматически собираем данные об использовании и информацию об устройстве." },
    { title: "2. Использование данных", body: "Мы используем ваши данные для: предоставления и улучшения Приложения; персонализации опыта; обработки и отображения результатов сканирования кожи; отправки уведомлений; соблюдения правовых обязательств." },
    { title: "3. Хранение и безопасность данных", body: "Ваши данные хранятся на защищённых серверах Supabase. Мы применяем отраслевые стандарты безопасности, включая шифрование при передаче (TLS) и хранении. Тем не менее ни один метод передачи данных через Интернет не является 100% безопасным." },
    { title: "4. Передача данных третьим лицам", body: "Мы не продаём, не обмениваем и не сдаём в аренду вашу личную информацию третьим лицам. Мы можем передавать данные поставщикам услуг, которые помогают в работе Приложения, связанным обязательствами конфиденциальности." },
    { title: "5. Анализ с помощью ИИ", body: "Изображения кожи обрабатываются алгоритмами ИИ для получения результатов анализа. Изображения могут временно обрабатываться сторонними сервисами ИИ. Мы не используем ваши изображения для обучения моделей ИИ без вашего явного согласия." },
    { title: "6. Ваши права (GDPR)", body: "Вы имеете право: получить доступ к своим данным; исправить неточные данные; запросить удаление данных; экспортировать данные; отозвать согласие в любое время. Для реализации прав свяжитесь с нами: support@skinx.fit" },
    { title: "7. Хранение данных", body: "Мы храним ваши данные в течение всего времени существования вашего аккаунта. При удалении аккаунта все личные данные и изображения сканирования безвозвратно удаляются в течение 30 дней." },
    { title: "8. Файлы cookie", body: "Приложение использует необходимые файлы cookie и локальное хранилище для аутентификации и сохранения настроек. Мы не используем отслеживающие или рекламные файлы cookie." },
    { title: "9. Конфиденциальность детей", body: "Приложение не предназначено для пользователей младше 18 лет. Мы сознательно не собираем личную информацию от детей." },
    { title: "10. Изменения политики", body: "Мы можем периодически обновлять настоящую Политику конфиденциальности. О существенных изменениях мы будем уведомлять, отображая уведомление в Приложении." },
    { title: "11. Контакты", body: "По вопросам, связанным с настоящей Политикой конфиденциальности, обращайтесь: support@skinx.fit" },
  ],
  kk: [
    { title: "1. Жинайтын деректер", body: "Біз сіз тікелей беретін деректерді жинаймыз: электрондық пошта мекенжайы, профиль деректері (жас диапазоны, жынысы, тері түрі, тәуекел факторлары) және жүктелетін тері суреттері. Сондай-ақ пайдалану деректері мен құрылғы туралы ақпарат автоматты түрде жиналады." },
    { title: "2. Деректерді пайдалану", body: "Деректеріңізді мыналар үшін пайдаланамыз: Қосымшаны ұсыну және жетілдіру; тәжірибені жекелендіру; тері сканерлеу нәтижелерін өңдеу; хабарламалар жіберу; заңды міндеттемелерді орындау." },
    { title: "3. Деректерді сақтау және қауіпсіздік", body: "Деректеріңіз Supabase қамтамасыз ететін қауіпсіз серверлерде сақталады. Транзиттегі (TLS) және тыныштықтағы шифрлауды қосқанда салалық стандартты қауіпсіздік шаралары қолданылады. Дегенмен Интернет арқылы деректер беру 100% қауіпсіз болмайды." },
    { title: "4. Деректерді үшінші тараптармен бөлісу", body: "Жеке ақпаратыңызды үшінші тараптарға сатпаймыз, айырбастамаймыз немесе жалға бермейміз. Қосымшаны іске асыруға көмектесетін және құпиялылық міндеттемелерімен байланысқан қызмет провайдерлерімен деректерді бөлісуіміз мүмкін." },
    { title: "5. ЖИ талдауы", body: "Тері суреттері талдау нәтижелерін ұсыну үшін ЖИ алгоритмдерімен өңделеді. Суреттер үшінші тарап ЖИ қызметтерімен уақытша өңделуі мүмкін. Суреттеріңізді ашық келісімсіз ЖИ үлгілерін үйрету үшін пайдаланбаймыз." },
    { title: "6. Сіздің құқықтарыңыз (GDPR)", body: "Сізде мынадай құқықтар бар: жеке деректеріңізге қол жеткізу; дәл емес деректерді түзету; деректерді жою сұрау; деректерді экспорттау; кез келген уақытта келісімді кері алу. Осы құқықтарды іске асыру үшін бізге хабарласыңыз: support@skinx.fit" },
    { title: "7. Деректерді сақтау мерзімі", body: "Аккаунтыңыз белсенді болған кезде деректеріңізді сақтаймыз. Аккаунтты жойған кезде барлық жеке деректер мен сканерлеу суреттері 30 күн ішінде біржола жойылады." },
    { title: "8. Куки файлдары", body: "Қосымша аутентификация және параметрлерді сақтау үшін маңызды куки файлдарын және жергілікті хранилищені пайдаланады. Бақылайтын немесе жарнамалық куки файлдарды пайдаланбаймыз." },
    { title: "9. Балалардың құпиялылығы", body: "Қосымша 18 жасқа толмаған пайдаланушыларға арналмаған. Балалардан жеке ақпаратты әдейі жинамаймыз." },
    { title: "10. Саясатты өзгерту", body: "Осы Құпиялылық саясатын мезгіл-мезгіл жаңартуымыз мүмкін. Маңызды өзгерістер туралы Қосымшада хабарлама көрсету арқылы хабарлаймыз." },
    { title: "11. Байланыс", body: "Осы Құпиялылық саясатына қатысты сұрақтар бойынша бізге хабарласыңыз: support@skinx.fit" },
  ],
};

export function PrivacyContent() {
  const { t, locale } = useI18n();
  const sections = SECTIONS[locale];

  return (
    <article className="py-6 space-y-6 text-on-surface">
      <h1 className="text-2xl font-extrabold tracking-tight">{t.privacy.title}</h1>
      <p className="text-on-surface-variant text-sm">{t.privacy.lastUpdated}</p>
      {sections.map((s) => (
        <section key={s.title} className="space-y-2">
          <h2 className="text-base font-bold text-on-surface">{s.title}</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">{s.body}</p>
        </section>
      ))}
    </article>
  );
}
